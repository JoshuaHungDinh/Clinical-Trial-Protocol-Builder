import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CT_GOV_API = "https://clinicaltrials.gov/api/v2/studies";

// ──────────────────────────────────────────────
// Mapping helpers: ClinicalTrials.gov → our enums
// ──────────────────────────────────────────────

function mapStatus(apiStatus: string) {
  const map: Record<string, string> = {
    RECRUITING: "ACTIVE",
    ACTIVE_NOT_RECRUITING: "ACTIVE",
    ENROLLING_BY_INVITATION: "ACTIVE",
    NOT_YET_RECRUITING: "APPROVED",
    COMPLETED: "COMPLETED",
    TERMINATED: "TERMINATED",
    SUSPENDED: "SUSPENDED",
    WITHDRAWN: "WITHDRAWN",
  };
  return map[apiStatus] || "DRAFT";
}

function mapPhase(phases: string[]) {
  if (!phases || phases.length === 0) return "NOT_APPLICABLE";
  const phase = phases[0];
  const map: Record<string, string> = {
    EARLY_PHASE1: "EARLY_PHASE_1",
    PHASE1: "PHASE_1",
    PHASE2: "PHASE_2",
    PHASE3: "PHASE_3",
    PHASE4: "PHASE_4",
    NA: "NOT_APPLICABLE",
  };
  // Handle combined phases like ["PHASE2", "PHASE3"]
  if (phases.length === 2) {
    const combo = phases.sort().join("_");
    if (combo === "PHASE1_PHASE2") return "PHASE_1_2";
    if (combo === "PHASE2_PHASE3") return "PHASE_2_3";
  }
  return map[phase] || "NOT_APPLICABLE";
}

function mapBlinding(maskingInfo?: { masking?: string }) {
  if (!maskingInfo?.masking) return "OPEN_LABEL";
  const map: Record<string, string> = {
    NONE: "OPEN_LABEL",
    SINGLE: "SINGLE_BLIND",
    DOUBLE: "DOUBLE_BLIND",
    TRIPLE: "TRIPLE_BLIND",
    QUADRUPLE: "QUADRUPLE_BLIND",
  };
  return map[maskingInfo.masking] || "OPEN_LABEL";
}

function mapArmType(apiType: string) {
  const map: Record<string, string> = {
    EXPERIMENTAL: "EXPERIMENTAL",
    ACTIVE_COMPARATOR: "ACTIVE_COMPARATOR",
    PLACEBO_COMPARATOR: "PLACEBO_COMPARATOR",
    SHAM_COMPARATOR: "SHAM_COMPARATOR",
    NO_INTERVENTION: "NO_INTERVENTION",
  };
  return map[apiType] || "EXPERIMENTAL";
}

function mapInterventionType(apiType: string) {
  const map: Record<string, string> = {
    DRUG: "DRUG",
    BIOLOGICAL: "BIOLOGICAL",
    DEVICE: "DEVICE",
    PROCEDURE: "PROCEDURE",
    BEHAVIORAL: "BEHAVIORAL",
    DIETARY_SUPPLEMENT: "DIETARY_SUPPLEMENT",
    RADIATION: "RADIATION",
    GENETIC: "GENETIC",
    COMBINATION_PRODUCT: "COMBINATION",
    OTHER: "OTHER",
  };
  return map[apiType] || "OTHER";
}

function mapControlType(arms: any[]) {
  if (!arms) return undefined;
  const types = arms.map((a: any) => a.type);
  if (types.includes("PLACEBO_COMPARATOR")) return "PLACEBO";
  if (types.includes("ACTIVE_COMPARATOR")) return "ACTIVE";
  if (types.includes("NO_INTERVENTION")) return "NO_INTERVENTION";
  return "UNCONTROLLED";
}

function mapRandomization(allocation?: string) {
  if (!allocation) return "NONE";
  const map: Record<string, string> = {
    RANDOMIZED: "SIMPLE",
    NON_RANDOMIZED: "NONE",
  };
  return map[allocation] || "NONE";
}

// Parse the eligibility criteria text blob into individual criteria
function parseEligibilityCriteria(text: string) {
  const criteria: { type: "INCLUSION" | "EXCLUSION"; description: string; sortOrder: number }[] = [];
  if (!text) return criteria;

  let currentType: "INCLUSION" | "EXCLUSION" = "INCLUSION";
  let inclusionOrder = 0;
  let exclusionOrder = 0;

  const lines = text.split("\n");

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Detect section headers
    if (/inclusion\s*criteria/i.test(line)) {
      currentType = "INCLUSION";
      continue;
    }
    if (/exclusion\s*criteria/i.test(line)) {
      currentType = "EXCLUSION";
      continue;
    }

    // Skip lines that are just section markers
    if (/^(key\s+)?(inclusion|exclusion)/i.test(line)) continue;

    // Strip leading numbering like "1.", "1)", "- ", "* "
    const cleaned = line.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, "").trim();
    if (!cleaned || cleaned.length < 5) continue;

    if (currentType === "INCLUSION") {
      inclusionOrder++;
      criteria.push({ type: "INCLUSION", description: cleaned, sortOrder: inclusionOrder });
    } else {
      exclusionOrder++;
      criteria.push({ type: "EXCLUSION", description: cleaned, sortOrder: exclusionOrder });
    }
  }

  return criteria;
}

// ──────────────────────────────────────────────
// Fetch studies from ClinicalTrials.gov API v2
// ──────────────────────────────────────────────

interface FetchOptions {
  query: string;
  count: number;
}

async function fetchStudies({ query, count }: FetchOptions) {
  const url = `${CT_GOV_API}?query.term=${encodeURIComponent(query)}&pageSize=${count}`;
  console.log(`Fetching from ClinicalTrials.gov: ${url}\n`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ClinicalTrials.gov API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.studies || [];
}

// ──────────────────────────────────────────────
// Transform and insert a single study
// ──────────────────────────────────────────────

async function insertStudy(study: any, userId: string) {
  const proto = study.protocolSection;
  const id = proto.identificationModule;
  const status = proto.statusModule;
  const design = proto.designModule;
  const sponsor = proto.sponsorCollaboratorsModule;
  const arms = proto.armsInterventionsModule;
  const outcomes = proto.outcomesModule;
  const eligibility = proto.eligibilityModule;
  const description = proto.descriptionModule;

  const nctId = id.nctId;

  // Skip if already exists
  const existing = await prisma.protocol.findUnique({ where: { protocolNumber: nctId } });
  if (existing) {
    console.log(`  ⏭ ${nctId} already exists, skipping`);
    return;
  }

  // 1. Create the protocol
  const protocol = await prisma.protocol.create({
    data: {
      protocolNumber: nctId,
      shortTitle: id.briefTitle || nctId,
      fullTitle: id.officialTitle || id.briefTitle || nctId,
      version: "1.0",
      status: mapStatus(status?.overallStatus) as any,
      createdById: userId,
      sponsorName: sponsor?.leadSponsor?.name || null,
      sponsorContact: sponsor?.leadSponsor
        ? { name: sponsor.leadSponsor.name, class: sponsor.leadSponsor.class }
        : undefined,
    },
  });

  // 2. Trial Design
  if (design) {
    const designInfo = design.designInfo || {};
    const armGroups = arms?.armGroups || [];

    await prisma.trialDesign.create({
      data: {
        protocolId: protocol.id,
        studyType: (design.studyType === "INTERVENTIONAL" ? "INTERVENTIONAL" : design.studyType === "OBSERVATIONAL" ? "OBSERVATIONAL" : "EXPANDED_ACCESS") as any,
        phase: mapPhase(design.phases || []) as any,
        blindingType: mapBlinding(designInfo.maskingInfo) as any,
        controlType: mapControlType(armGroups) as any,
        randomizationType: mapRandomization(designInfo.allocation) as any,
        numberOfArms: armGroups.length || 1,
        estimatedEnrollment: design.enrollmentInfo?.count || null,
      },
    });
  }

  // 3. Study Arms & Interventions
  if (arms?.armGroups) {
    const armRecords: Record<string, string> = {}; // label → arm id

    for (let i = 0; i < arms.armGroups.length; i++) {
      const ag = arms.armGroups[i];
      const arm = await prisma.studyArm.create({
        data: {
          protocolId: protocol.id,
          name: ag.label,
          type: mapArmType(ag.type || "EXPERIMENTAL") as any,
          description: ag.description || null,
          sortOrder: i + 1,
        },
      });
      armRecords[ag.label] = arm.id;
    }

    if (arms.interventions) {
      for (const iv of arms.interventions) {
        const intervention = await prisma.intervention.create({
          data: {
            protocolId: protocol.id,
            name: iv.name,
            type: mapInterventionType(iv.type || "OTHER") as any,
            description: iv.description || null,
          },
        });

        // Link intervention to its arms
        if (iv.armGroupLabels) {
          for (const label of iv.armGroupLabels) {
            const armId = armRecords[label];
            if (armId) {
              await prisma.armIntervention.create({
                data: { armId, interventionId: intervention.id },
              });
            }
          }
        }
      }
    }
  }

  // 4. Endpoints (outcomes)
  if (outcomes) {
    let sortOrder = 0;

    for (const outcome of outcomes.primaryOutcomes || []) {
      sortOrder++;
      await prisma.endpoint.create({
        data: {
          protocolId: protocol.id,
          type: "PRIMARY",
          sortOrder,
          description: outcome.measure,
          measurementMethod: outcome.description || null,
          timeframe: outcome.timeFrame || null,
        },
      });
    }

    for (const outcome of outcomes.secondaryOutcomes || []) {
      sortOrder++;
      await prisma.endpoint.create({
        data: {
          protocolId: protocol.id,
          type: "SECONDARY",
          sortOrder,
          description: outcome.measure,
          measurementMethod: outcome.description || null,
          timeframe: outcome.timeFrame || null,
        },
      });
    }
  }

  // 5. Eligibility Criteria (parse from text blob)
  if (eligibility?.eligibilityCriteria) {
    const criteria = parseEligibilityCriteria(eligibility.eligibilityCriteria);
    if (criteria.length > 0) {
      await prisma.eligibilityCriterion.createMany({
        data: criteria.map((c) => ({
          protocolId: protocol.id,
          type: c.type as any,
          sortOrder: c.sortOrder,
          description: c.description,
        })),
      });
    }
  }

  // 6. Protocol Sections (narrative content from API)
  const sections: { sectionCode: string; title: string; content: any; sortOrder: number }[] = [];

  if (description?.briefSummary) {
    sections.push({
      sectionCode: "B.2",
      title: "Background Information",
      content: { text: description.briefSummary },
      sortOrder: 1,
    });
  }

  if (description?.detailedDescription) {
    sections.push({
      sectionCode: "B.2_DETAILED",
      title: "Detailed Description",
      content: { text: description.detailedDescription },
      sortOrder: 2,
    });
  }

  // Add conditions as context
  if (proto.conditionsModule?.conditions) {
    sections.push({
      sectionCode: "CONDITIONS",
      title: "Conditions and Diseases",
      content: { conditions: proto.conditionsModule.conditions },
      sortOrder: 3,
    });
  }

  if (sections.length > 0) {
    await prisma.protocolSection.createMany({
      data: sections.map((s) => ({
        protocolId: protocol.id,
        sectionCode: s.sectionCode,
        title: s.title,
        content: s.content,
        sortOrder: s.sortOrder,
        isComplete: true,
      })),
    });
  }

  // Count what we inserted
  const armCount = arms?.armGroups?.length || 0;
  const interventionCount = arms?.interventions?.length || 0;
  const endpointCount = (outcomes?.primaryOutcomes?.length || 0) + (outcomes?.secondaryOutcomes?.length || 0);
  const criteriaCount = eligibility?.eligibilityCriteria
    ? parseEligibilityCriteria(eligibility.eligibilityCriteria).length
    : 0;

  console.log(
    `  ✓ ${nctId}: "${id.briefTitle?.substring(0, 60)}..." ` +
      `(${armCount} arms, ${interventionCount} interventions, ${endpointCount} endpoints, ${criteriaCount} criteria)`
  );
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────

async function main() {
  // Clean existing data (in reverse dependency order)
  await prisma.auditLog.deleteMany();
  await prisma.amendment.deleteMany();
  await prisma.protocolSection.deleteMany();
  await prisma.statisticalPlan.deleteMany();
  await prisma.endpoint.deleteMany();
  await prisma.eligibilityCriterion.deleteMany();
  await prisma.armIntervention.deleteMany();
  await prisma.intervention.deleteMany();
  await prisma.studyArm.deleteMany();
  await prisma.objective.deleteMany();
  await prisma.trialDesign.deleteMany();
  await prisma.protocolTeamMember.deleteMany();
  await prisma.protocol.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing data.\n");

  // Create a system user to own imported protocols
  const systemUser = await prisma.user.create({
    data: {
      email: "import@clinicaltrials.gov",
      firstName: "ClinicalTrials.gov",
      lastName: "Import",
      organization: "National Library of Medicine",
    },
  });

  // Fetch real studies from ClinicalTrials.gov
  // We pull a diverse set across different therapeutic areas
  const queries = [
    { query: "cancer phase 3 randomized", count: 3 },
    { query: "diabetes phase 2 double-blind", count: 3 },
    { query: "alzheimer phase 3", count: 2 },
    { query: "cardiovascular phase 3 placebo", count: 2 },
  ];

  for (const q of queries) {
    console.log(`\n── Searching: "${q.query}" (${q.count} studies) ──`);
    const studies = await fetchStudies(q);

    for (const study of studies.slice(0, q.count)) {
      try {
        await insertStudy(study, systemUser.id);
      } catch (err: any) {
        const nctId = study.protocolSection?.identificationModule?.nctId || "unknown";
        console.error(`  ✗ ${nctId}: ${err.message}`);
      }
    }
  }

  // Summary
  const protocolCount = await prisma.protocol.count();
  const armCount = await prisma.studyArm.count();
  const endpointCount = await prisma.endpoint.count();
  const criteriaCount = await prisma.eligibilityCriterion.count();

  console.log(`\n🎉 Seed complete!`);
  console.log(`   ${protocolCount} protocols imported from ClinicalTrials.gov`);
  console.log(`   ${armCount} study arms`);
  console.log(`   ${endpointCount} endpoints`);
  console.log(`   ${criteriaCount} eligibility criteria`);
  console.log(`\n   Run \`npx prisma studio\` to browse the data in your browser.`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
