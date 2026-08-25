import prisma from "./prisma";

const CT_GOV_API = "https://clinicaltrials.gov/api/v2/studies";

// ──────────────────────────────────────────────
// Enum mappers: ClinicalTrials.gov → our schema
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

function mapControlType(arms: { type?: string }[]) {
  if (!arms) return undefined;
  const types = arms.map((a) => a.type);
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

function parseEligibilityCriteria(text: string) {
  const criteria: {
    type: "INCLUSION" | "EXCLUSION";
    description: string;
    sortOrder: number;
  }[] = [];
  if (!text) return criteria;

  let currentType: "INCLUSION" | "EXCLUSION" = "INCLUSION";
  let inclusionOrder = 0;
  let exclusionOrder = 0;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/inclusion\s*criteria/i.test(line)) {
      currentType = "INCLUSION";
      continue;
    }
    if (/exclusion\s*criteria/i.test(line)) {
      currentType = "EXCLUSION";
      continue;
    }
    if (/^(key\s+)?(inclusion|exclusion)/i.test(line)) continue;

    const cleaned = line
      .replace(/^\d+[\.\)]\s*/, "")
      .replace(/^[-*]\s*/, "")
      .trim();
    if (!cleaned || cleaned.length < 5) continue;

    if (currentType === "INCLUSION") {
      inclusionOrder++;
      criteria.push({
        type: "INCLUSION",
        description: cleaned,
        sortOrder: inclusionOrder,
      });
    } else {
      exclusionOrder++;
      criteria.push({
        type: "EXCLUSION",
        description: cleaned,
        sortOrder: exclusionOrder,
      });
    }
  }

  return criteria;
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function fetchStudyByNctId(nctId: string) {
  const url = `${CT_GOV_API}/${encodeURIComponent(nctId)}`;
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(
      `ClinicalTrials.gov API error: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

export async function importStudy(study: any, userId: string) {
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

  const existing = await prisma.protocol.findUnique({
    where: { protocolNumber: nctId },
  });
  if (existing) {
    throw new Error(`Protocol ${nctId} already exists`);
  }

  // Create protocol
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

  // Trial Design
  if (design) {
    const designInfo = design.designInfo || {};
    const armGroups = arms?.armGroups || [];

    await prisma.trialDesign.create({
      data: {
        protocolId: protocol.id,
        studyType: (design.studyType === "INTERVENTIONAL"
          ? "INTERVENTIONAL"
          : design.studyType === "OBSERVATIONAL"
            ? "OBSERVATIONAL"
            : "EXPANDED_ACCESS") as any,
        phase: mapPhase(design.phases || []) as any,
        blindingType: mapBlinding(designInfo.maskingInfo) as any,
        controlType: mapControlType(armGroups) as any,
        randomizationType: mapRandomization(designInfo.allocation) as any,
        numberOfArms: armGroups.length || 1,
        estimatedEnrollment: design.enrollmentInfo?.count || null,
      },
    });
  }

  // Study Arms & Interventions
  if (arms?.armGroups) {
    const armRecords: Record<string, string> = {};

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

  // Endpoints
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

  // Eligibility Criteria
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

  // Protocol Sections
  const sections: {
    sectionCode: string;
    title: string;
    content: any;
    sortOrder: number;
  }[] = [];

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

  // Return the full protocol with relations
  return prisma.protocol.findUnique({
    where: { id: protocol.id },
    include: {
      trialDesign: true,
      arms: { include: { interventions: { include: { intervention: true } } } },
      endpoints: true,
      eligibilityCriteria: true,
      sections: true,
    },
  });
}
