import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

  // ──────────────────────────────────────────────
  // 1. Create Users
  // ──────────────────────────────────────────────
  const drSmith = await prisma.user.create({
    data: {
      email: "dr.smith@example.com",
      firstName: "Sarah",
      lastName: "Smith",
      organization: "University Medical Center",
      title: "MD, PhD",
    },
  });

  const drChen = await prisma.user.create({
    data: {
      email: "dr.chen@example.com",
      firstName: "Michael",
      lastName: "Chen",
      organization: "University Medical Center",
      title: "PhD",
    },
  });

  const jRivera = await prisma.user.create({
    data: {
      email: "j.rivera@example.com",
      firstName: "Julia",
      lastName: "Rivera",
      organization: "BioStats Consulting Group",
      title: "MS",
    },
  });

  console.log("✓ Created 3 users");

  // ──────────────────────────────────────────────
  // 2. Create Protocol
  // ──────────────────────────────────────────────
  const protocol = await prisma.protocol.create({
    data: {
      protocolNumber: "GLC-DM2-2026-001",
      shortTitle: "GlucoLess Phase 3 Trial",
      fullTitle:
        "A Randomized, Double-Blind, Placebo-Controlled Phase 3 Study to Evaluate the Efficacy and Safety of GlucoLess (GL-4821) in Adults with Type 2 Diabetes Mellitus Inadequately Controlled on Metformin Monotherapy",
      version: "1.0",
      status: "DRAFT",
      createdById: drSmith.id,
      sponsorName: "Glycon Therapeutics, Inc.",
      sponsorContact: {
        name: "David Park",
        email: "d.park@glycon-therapeutics.com",
        phone: "+1-555-0142",
        address: "350 Innovation Drive, Cambridge, MA 02142",
      },
    },
  });

  console.log("✓ Created protocol:", protocol.protocolNumber);

  // ──────────────────────────────────────────────
  // 3. Assign Team Members
  // ──────────────────────────────────────────────
  await prisma.protocolTeamMember.createMany({
    data: [
      {
        protocolId: protocol.id,
        userId: drSmith.id,
        role: "PRINCIPAL_INVESTIGATOR",
        isPrimary: true,
      },
      {
        protocolId: protocol.id,
        userId: drChen.id,
        role: "SUB_INVESTIGATOR",
        isPrimary: false,
      },
      {
        protocolId: protocol.id,
        userId: jRivera.id,
        role: "STATISTICIAN",
        isPrimary: true,
      },
    ],
  });

  console.log("✓ Assigned 3 team members");

  // ──────────────────────────────────────────────
  // 4. Trial Design (B.4)
  // ──────────────────────────────────────────────
  await prisma.trialDesign.create({
    data: {
      protocolId: protocol.id,
      studyType: "INTERVENTIONAL",
      phase: "PHASE_3",
      blindingType: "DOUBLE_BLIND",
      controlType: "PLACEBO",
      randomizationType: "STRATIFIED",
      allocationRatio: "1:1",
      numberOfArms: 2,
      estimatedEnrollment: 500,
      studyDurationMonths: 18,
      treatmentDurationWeeks: 24,
      followUpDurationWeeks: 4,
      adaptiveDesign: false,
      multicenter: true,
      numberOfSites: 45,
      countries: ["US", "CA", "GB", "DE", "AU"],
    },
  });

  console.log("✓ Created trial design (Phase 3, double-blind, placebo-controlled)");

  // ──────────────────────────────────────────────
  // 5. Objectives (B.3)
  // ──────────────────────────────────────────────
  const primaryObj = await prisma.objective.create({
    data: {
      protocolId: protocol.id,
      type: "PRIMARY",
      sortOrder: 1,
      description:
        "To evaluate the efficacy of GlucoLess 10mg once daily compared to placebo in reducing HbA1c levels from baseline at Week 24 in adults with Type 2 Diabetes Mellitus inadequately controlled on metformin monotherapy.",
    },
  });

  const secondaryObj = await prisma.objective.create({
    data: {
      protocolId: protocol.id,
      type: "SECONDARY",
      sortOrder: 2,
      description:
        "To evaluate the effect of GlucoLess 10mg on fasting plasma glucose (FPG) and body weight from baseline to Week 24.",
    },
  });

  const exploratoryObj = await prisma.objective.create({
    data: {
      protocolId: protocol.id,
      type: "EXPLORATORY",
      sortOrder: 3,
      description:
        "To explore the relationship between baseline characteristics (BMI, diabetes duration, baseline HbA1c) and treatment response to GlucoLess.",
    },
  });

  console.log("✓ Created 3 objectives (primary, secondary, exploratory)");

  // ──────────────────────────────────────────────
  // 6. Study Arms (B.4)
  // ──────────────────────────────────────────────
  const treatmentArm = await prisma.studyArm.create({
    data: {
      protocolId: protocol.id,
      name: "GlucoLess 10mg",
      type: "EXPERIMENTAL",
      description:
        "Participants receive GlucoLess 10mg orally once daily in addition to their existing metformin regimen.",
      sortOrder: 1,
      participantCount: 250,
    },
  });

  const placeboArm = await prisma.studyArm.create({
    data: {
      protocolId: protocol.id,
      name: "Placebo",
      type: "PLACEBO_COMPARATOR",
      description:
        "Participants receive matching placebo orally once daily in addition to their existing metformin regimen.",
      sortOrder: 2,
      participantCount: 250,
    },
  });

  console.log("✓ Created 2 study arms (treatment + placebo)");

  // ──────────────────────────────────────────────
  // 7. Interventions (B.7) & link to arms
  // ──────────────────────────────────────────────
  const drugIntervention = await prisma.intervention.create({
    data: {
      protocolId: protocol.id,
      name: "GlucoLess (GL-4821)",
      type: "DRUG",
      description:
        "GlucoLess is a novel GLP-1/GIP dual receptor agonist formulated as an oral tablet.",
      dose: "10 mg",
      frequency: "Once daily, with breakfast",
      route: "Oral",
      duration: "24 weeks",
      manufacturer: "Glycon Therapeutics, Inc.",
      complianceMonitoring: "Pill count at each study visit; electronic diary for daily dosing confirmation.",
    },
  });

  const placeboIntervention = await prisma.intervention.create({
    data: {
      protocolId: protocol.id,
      name: "Matching Placebo",
      type: "DRUG",
      description:
        "Placebo tablets identical in appearance, taste, and packaging to the active GlucoLess tablets.",
      dose: "N/A",
      frequency: "Once daily, with breakfast",
      route: "Oral",
      duration: "24 weeks",
      manufacturer: "Glycon Therapeutics, Inc.",
      complianceMonitoring: "Pill count at each study visit; electronic diary for daily dosing confirmation.",
    },
  });

  // Link interventions to arms
  await prisma.armIntervention.createMany({
    data: [
      { armId: treatmentArm.id, interventionId: drugIntervention.id },
      { armId: placeboArm.id, interventionId: placeboIntervention.id },
    ],
  });

  console.log("✓ Created 2 interventions and linked to arms");

  // ──────────────────────────────────────────────
  // 8. Eligibility Criteria (B.5)
  // ──────────────────────────────────────────────
  await prisma.eligibilityCriterion.createMany({
    data: [
      // Inclusion criteria
      {
        protocolId: protocol.id,
        type: "INCLUSION",
        sortOrder: 1,
        category: "Demographics",
        description: "Adults aged 18 to 75 years at the time of informed consent.",
      },
      {
        protocolId: protocol.id,
        type: "INCLUSION",
        sortOrder: 2,
        category: "Diagnosis",
        description:
          "Documented diagnosis of Type 2 Diabetes Mellitus for at least 6 months prior to screening.",
      },
      {
        protocolId: protocol.id,
        type: "INCLUSION",
        sortOrder: 3,
        category: "Treatment",
        description:
          "On stable metformin monotherapy (≥1500 mg/day or maximum tolerated dose) for at least 8 weeks prior to screening.",
      },
      {
        protocolId: protocol.id,
        type: "INCLUSION",
        sortOrder: 4,
        category: "Lab Values",
        description: "HbA1c ≥7.5% and ≤10.5% at screening visit.",
      },
      {
        protocolId: protocol.id,
        type: "INCLUSION",
        sortOrder: 5,
        category: "Lab Values",
        description: "BMI ≥25 kg/m² and ≤45 kg/m² at screening visit.",
      },
      // Exclusion criteria
      {
        protocolId: protocol.id,
        type: "EXCLUSION",
        sortOrder: 1,
        category: "Medical History",
        description:
          "History of Type 1 Diabetes Mellitus, diabetic ketoacidosis, or pancreatic injury/surgery.",
      },
      {
        protocolId: protocol.id,
        type: "EXCLUSION",
        sortOrder: 2,
        category: "Medical History",
        description:
          "Estimated glomerular filtration rate (eGFR) <45 mL/min/1.73m² at screening, or history of dialysis or kidney transplant.",
      },
      {
        protocolId: protocol.id,
        type: "EXCLUSION",
        sortOrder: 3,
        category: "Safety",
        description:
          "Pregnant or breastfeeding women, or women of childbearing potential not willing to use adequate contraception throughout the study.",
      },
    ],
  });

  console.log("✓ Created 8 eligibility criteria (5 inclusion, 3 exclusion)");

  // ──────────────────────────────────────────────
  // 9. Endpoints (B.8)
  // ──────────────────────────────────────────────
  await prisma.endpoint.createMany({
    data: [
      {
        protocolId: protocol.id,
        objectiveId: primaryObj.id,
        type: "PRIMARY",
        sortOrder: 1,
        description: "Change from baseline in HbA1c (%) at Week 24.",
        measurementMethod:
          "Central laboratory measurement of HbA1c using HPLC (High-Performance Liquid Chromatography).",
        timeframe: "Baseline to Week 24",
        statisticalTest:
          "Mixed-model repeated measures (MMRM) with treatment, visit, treatment-by-visit interaction, baseline HbA1c, and stratification factors as covariates.",
      },
      {
        protocolId: protocol.id,
        objectiveId: secondaryObj.id,
        type: "SECONDARY",
        sortOrder: 2,
        description: "Change from baseline in fasting plasma glucose (mg/dL) at Week 24.",
        measurementMethod:
          "Central laboratory enzymatic hexokinase method after overnight fast (≥8 hours).",
        timeframe: "Baseline to Week 24",
        statisticalTest: "MMRM analysis similar to primary endpoint.",
      },
      {
        protocolId: protocol.id,
        objectiveId: secondaryObj.id,
        type: "SECONDARY",
        sortOrder: 3,
        description: "Change from baseline in body weight (kg) at Week 24.",
        measurementMethod:
          "Calibrated digital scale, measured in light clothing without shoes, at approximately the same time of day.",
        timeframe: "Baseline to Week 24",
        statisticalTest: "MMRM analysis similar to primary endpoint.",
      },
      {
        protocolId: protocol.id,
        objectiveId: exploratoryObj.id,
        type: "EXPLORATORY",
        sortOrder: 4,
        description:
          "Proportion of participants achieving HbA1c <7.0% at Week 24.",
        measurementMethod: "Derived from central laboratory HbA1c measurements.",
        timeframe: "Week 24",
        statisticalTest: "Logistic regression with treatment group and baseline HbA1c as covariates.",
      },
    ],
  });

  console.log("✓ Created 4 endpoints (1 primary, 2 secondary, 1 exploratory)");

  // ──────────────────────────────────────────────
  // 10. Statistical Plan (B.10)
  // ──────────────────────────────────────────────
  await prisma.statisticalPlan.create({
    data: {
      protocolId: protocol.id,
      sampleSizeTotal: 500,
      sampleSizeJustification:
        "A sample size of 250 participants per group (500 total) provides 90% power to detect a treatment difference of 0.5% in HbA1c change from baseline, assuming a common standard deviation of 1.2%, using a two-sided t-test at the 5% significance level, and allowing for a 15% dropout rate.",
      powerCalculation: {
        power: 0.9,
        alpha: 0.05,
        effectSize: 0.5,
        standardDeviation: 1.2,
        dropoutRate: 0.15,
        testType: "two-sided t-test",
      },
      significanceLevel: 0.05,
      primaryAnalysisMethod:
        "The primary efficacy analysis will use a mixed-model repeated measures (MMRM) approach. The model will include treatment group, visit, treatment-by-visit interaction, baseline HbA1c value, and stratification factors (baseline HbA1c category and geographic region) as covariates. An unstructured covariance matrix will be used.",
      secondaryAnalysisMethods:
        "Secondary endpoints will be analyzed using the same MMRM approach as the primary endpoint. A fixed-sequence testing procedure (Hierarchical Testing) will be used to control the overall Type I error rate at 5%.",
      interimAnalyses: {
        planned: true,
        numberOfAnalyses: 1,
        timing: "After 50% of participants complete Week 24",
        stoppingRules: "O'Brien-Fleming spending function for efficacy; non-binding futility boundary",
        committee: "Independent Data Monitoring Committee (IDMC)",
      },
      missingDataHandling:
        "The primary analysis using MMRM is the primary approach for handling missing data under the missing-at-random (MAR) assumption. Sensitivity analyses will include pattern mixture models and tipping-point analyses.",
      multiplicity:
        "A fixed-sequence (hierarchical) testing strategy will control the family-wise Type I error rate at 5%. Secondary endpoints will be tested in a pre-specified order only if the preceding test is significant.",
      analysisPopulations: ["ITT", "PP", "SAFETY"],
      subgroupAnalyses:
        "Pre-specified subgroup analyses of the primary endpoint will be performed by: age (<65 vs ≥65), sex, race, baseline HbA1c (<8.5% vs ≥8.5%), baseline BMI (<30 vs ≥30), and geographic region.",
      sensitivityAnalyses:
        "Per-protocol analysis; pattern mixture model for missing data; analysis excluding participants with major protocol deviations.",
    },
  });

  console.log("✓ Created statistical plan");

  // ──────────────────────────────────────────────
  // 11. Protocol Sections (narrative content)
  // ──────────────────────────────────────────────
  await prisma.protocolSection.createMany({
    data: [
      {
        protocolId: protocol.id,
        sectionCode: "B.2",
        title: "Background Information",
        sortOrder: 1,
        isComplete: true,
        content: {
          text: "Type 2 Diabetes Mellitus (T2DM) is a chronic metabolic disorder characterized by insulin resistance and progressive beta-cell dysfunction, affecting approximately 462 million people worldwide. Despite the availability of multiple glucose-lowering therapies, many patients fail to achieve adequate glycemic control.\n\nGlucoLess (GL-4821) is a novel orally bioavailable dual GLP-1/GIP receptor agonist. Preclinical studies in diabetic rodent models demonstrated significant reductions in blood glucose, HbA1c, and body weight compared to vehicle control. In Phase 1 studies (GLC-PK-2024-001), GL-4821 was well-tolerated at doses up to 20mg in healthy volunteers with a favorable pharmacokinetic profile supporting once-daily dosing. In Phase 2 (GLC-DM2-2025-001), GL-4821 10mg showed a statistically significant reduction in HbA1c of -0.8% versus placebo at 12 weeks (p<0.001) with a safety profile consistent with the GLP-1 receptor agonist class.",
        },
      },
      {
        protocolId: protocol.id,
        sectionCode: "B.6",
        title: "Discontinuation of Trial Intervention and Participant Withdrawal",
        sortOrder: 2,
        isComplete: false,
        content: {
          text: "Participants may discontinue trial intervention for the following reasons:\n\n1. Participant withdrawal of consent\n2. Adverse event that, in the investigator's judgment, warrants discontinuation\n3. Pregnancy\n4. Loss to follow-up\n5. Investigator decision that continuation would be detrimental to the participant's well-being\n6. Use of prohibited concomitant medication\n7. Protocol deviation that affects participant safety or data integrity\n\nParticipants who discontinue trial intervention early should continue to attend scheduled study visits for safety follow-up whenever possible.",
        },
      },
      {
        protocolId: protocol.id,
        sectionCode: "B.9",
        title: "Assessment of Safety",
        sortOrder: 3,
        isComplete: false,
        content: {
          text: "Safety assessments will include: monitoring of adverse events (AEs) and serious adverse events (SAEs), clinical laboratory tests (hematology, chemistry, urinalysis), vital signs, 12-lead ECG, and physical examination.\n\nAdverse events will be coded using MedDRA (Medical Dictionary for Regulatory Activities) and graded by severity (mild, moderate, severe). Causality assessment (related/not related to study drug) will be performed by the investigator.\n\nSerious adverse events must be reported to the sponsor within 24 hours of the investigator becoming aware of the event. SAEs include: death, life-threatening events, events requiring hospitalization or prolongation of existing hospitalization, persistent or significant disability/incapacity, and congenital anomaly/birth defect.\n\nA Data Safety Monitoring Board (DSMB) will conduct ongoing safety surveillance throughout the trial.",
        },
      },
      {
        protocolId: protocol.id,
        sectionCode: "B.11",
        title: "Quality Management",
        sortOrder: 4,
        isComplete: false,
        content: {
          text: "The sponsor will implement a risk-based quality management approach in accordance with ICH E6(R2) Section 5.0. Critical-to-quality factors include: informed consent process, eligibility verification, study drug administration and compliance, primary endpoint data collection (HbA1c), and adverse event reporting.\n\nCentralized monitoring will include statistical monitoring of data patterns, protocol deviation tracking, and key risk indicator dashboards. On-site monitoring will focus on source data verification for critical data points, investigational product accountability, and informed consent documentation.",
        },
      },
      {
        protocolId: protocol.id,
        sectionCode: "ETHICS",
        title: "Ethics and Regulatory Compliance",
        sortOrder: 5,
        isComplete: false,
        content: {
          text: "This study will be conducted in accordance with the Declaration of Helsinki, ICH E6 Good Clinical Practice guidelines, and all applicable local regulatory requirements. The protocol and informed consent form must be approved by the Institutional Review Board (IRB) or Independent Ethics Committee (IEC) at each participating site before any study-related procedures are performed.\n\nWritten informed consent will be obtained from each participant before any study-specific procedures. Participants will be informed of their right to withdraw from the study at any time without prejudice to their future medical care.",
        },
      },
      {
        protocolId: protocol.id,
        sectionCode: "DATA_MGMT",
        title: "Data Management",
        sortOrder: 6,
        isComplete: false,
        content: {
          text: "Clinical data will be captured using a validated electronic data capture (EDC) system. All data entry, modification, and deletion will be recorded in an audit trail. Data management activities will follow the Data Management Plan (DMP), which will be finalized before the first participant is enrolled.\n\nData queries will be generated for missing, inconsistent, or out-of-range data and resolved by site personnel. The database will be locked after medical review, query resolution, and external data reconciliation are complete.",
        },
      },
    ],
  });

  console.log("✓ Created 6 protocol sections (background, withdrawal, safety, quality, ethics, data management)");

  // ──────────────────────────────────────────────
  // 12. Audit log entry for protocol creation
  // ──────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      protocolId: protocol.id,
      userId: drSmith.id,
      action: "CREATE",
      entityType: "Protocol",
      entityId: protocol.id,
      newValue: JSON.stringify({
        protocolNumber: protocol.protocolNumber,
        shortTitle: protocol.shortTitle,
        status: protocol.status,
      }),
      metadata: { source: "seed" },
    },
  });

  console.log("✓ Created initial audit log entry");

  console.log("\n🎉 Seed complete! Protocol:", protocol.protocolNumber);
  console.log("   Run `npx prisma studio` to browse the data in your browser.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
