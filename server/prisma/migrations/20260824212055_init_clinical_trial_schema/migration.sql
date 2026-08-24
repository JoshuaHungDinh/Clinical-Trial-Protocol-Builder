-- CreateEnum
CREATE TYPE "ProtocolStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'ACTIVE', 'COMPLETED', 'TERMINATED', 'SUSPENDED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "StudyPhase" AS ENUM ('EARLY_PHASE_1', 'PHASE_1', 'PHASE_1_2', 'PHASE_2', 'PHASE_2_3', 'PHASE_3', 'PHASE_3B', 'PHASE_4', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "StudyType" AS ENUM ('INTERVENTIONAL', 'OBSERVATIONAL', 'EXPANDED_ACCESS');

-- CreateEnum
CREATE TYPE "BlindingType" AS ENUM ('OPEN_LABEL', 'SINGLE_BLIND', 'DOUBLE_BLIND', 'TRIPLE_BLIND', 'QUADRUPLE_BLIND');

-- CreateEnum
CREATE TYPE "ControlType" AS ENUM ('PLACEBO', 'ACTIVE', 'DOSE_COMPARISON', 'NO_INTERVENTION', 'HISTORICAL', 'UNCONTROLLED');

-- CreateEnum
CREATE TYPE "RandomizationType" AS ENUM ('SIMPLE', 'BLOCK', 'STRATIFIED', 'ADAPTIVE', 'NONE');

-- CreateEnum
CREATE TYPE "ArmType" AS ENUM ('EXPERIMENTAL', 'ACTIVE_COMPARATOR', 'PLACEBO_COMPARATOR', 'SHAM_COMPARATOR', 'NO_INTERVENTION');

-- CreateEnum
CREATE TYPE "InterventionType" AS ENUM ('DRUG', 'BIOLOGICAL', 'DEVICE', 'PROCEDURE', 'BEHAVIORAL', 'DIETARY_SUPPLEMENT', 'RADIATION', 'GENETIC', 'COMBINATION', 'OTHER');

-- CreateEnum
CREATE TYPE "CriterionType" AS ENUM ('INCLUSION', 'EXCLUSION');

-- CreateEnum
CREATE TYPE "EndpointType" AS ENUM ('PRIMARY', 'SECONDARY', 'EXPLORATORY', 'SAFETY');

-- CreateEnum
CREATE TYPE "ObjectiveType" AS ENUM ('PRIMARY', 'SECONDARY', 'EXPLORATORY');

-- CreateEnum
CREATE TYPE "AmendmentStatus" AS ENUM ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('PRINCIPAL_INVESTIGATOR', 'SUB_INVESTIGATOR', 'STATISTICIAN', 'MEDICAL_MONITOR', 'DATA_MANAGER', 'CLINICAL_RESEARCH_COORDINATOR', 'REGULATORY_AFFAIRS', 'MEDICAL_WRITER', 'SPONSOR_REPRESENTATIVE', 'PHARMACOVIGILANCE');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'VERSION_CHANGE');

-- CreateEnum
CREATE TYPE "AdverseEventSeverity" AS ENUM ('MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING', 'FATAL');

-- CreateEnum
CREATE TYPE "AnalysisPopulation" AS ENUM ('ITT', 'MITT', 'PP', 'SAFETY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "organization" TEXT,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Protocol" (
    "id" TEXT NOT NULL,
    "protocolNumber" TEXT NOT NULL,
    "shortTitle" TEXT NOT NULL,
    "fullTitle" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '0.1',
    "status" "ProtocolStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "sponsorName" TEXT,
    "sponsorContact" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Protocol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolTeamMember" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProtocolTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrialDesign" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "studyType" "StudyType" NOT NULL DEFAULT 'INTERVENTIONAL',
    "phase" "StudyPhase" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "blindingType" "BlindingType" NOT NULL DEFAULT 'OPEN_LABEL',
    "controlType" "ControlType",
    "randomizationType" "RandomizationType" NOT NULL DEFAULT 'NONE',
    "allocationRatio" TEXT,
    "numberOfArms" INTEGER NOT NULL DEFAULT 1,
    "estimatedEnrollment" INTEGER,
    "studyDurationMonths" INTEGER,
    "treatmentDurationWeeks" INTEGER,
    "followUpDurationWeeks" INTEGER,
    "adaptiveDesign" BOOLEAN NOT NULL DEFAULT false,
    "adaptiveDesignDetails" TEXT,
    "multicenter" BOOLEAN NOT NULL DEFAULT false,
    "numberOfSites" INTEGER,
    "countries" TEXT[],

    CONSTRAINT "TrialDesign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Objective" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "type" "ObjectiveType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,

    CONSTRAINT "Objective_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyArm" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ArmType" NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "participantCount" INTEGER,

    CONSTRAINT "StudyArm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Intervention" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InterventionType" NOT NULL,
    "description" TEXT,
    "dose" TEXT,
    "frequency" TEXT,
    "route" TEXT,
    "duration" TEXT,
    "manufacturer" TEXT,
    "complianceMonitoring" TEXT,

    CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArmIntervention" (
    "id" TEXT NOT NULL,
    "armId" TEXT NOT NULL,
    "interventionId" TEXT NOT NULL,

    CONSTRAINT "ArmIntervention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EligibilityCriterion" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "type" "CriterionType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "category" TEXT,

    CONSTRAINT "EligibilityCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endpoint" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "objectiveId" TEXT,
    "type" "EndpointType" NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "measurementMethod" TEXT,
    "timeframe" TEXT,
    "statisticalTest" TEXT,

    CONSTRAINT "Endpoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatisticalPlan" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "sampleSizeTotal" INTEGER,
    "sampleSizeJustification" TEXT,
    "powerCalculation" JSONB,
    "significanceLevel" DOUBLE PRECISION DEFAULT 0.05,
    "primaryAnalysisMethod" TEXT,
    "secondaryAnalysisMethods" TEXT,
    "interimAnalyses" JSONB,
    "missingDataHandling" TEXT,
    "multiplicity" TEXT,
    "analysisPopulations" "AnalysisPopulation"[],
    "subgroupAnalyses" TEXT,
    "sensitivityAnalyses" TEXT,

    CONSTRAINT "StatisticalPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProtocolSection" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "sectionCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProtocolSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amendment" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "amendmentNumber" INTEGER NOT NULL,
    "previousVersion" TEXT NOT NULL,
    "newVersion" TEXT NOT NULL,
    "status" "AmendmentStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Amendment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Protocol_protocolNumber_key" ON "Protocol"("protocolNumber");

-- CreateIndex
CREATE INDEX "Protocol_status_idx" ON "Protocol"("status");

-- CreateIndex
CREATE INDEX "Protocol_createdById_idx" ON "Protocol"("createdById");

-- CreateIndex
CREATE INDEX "ProtocolTeamMember_userId_idx" ON "ProtocolTeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolTeamMember_protocolId_userId_role_key" ON "ProtocolTeamMember"("protocolId", "userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "TrialDesign_protocolId_key" ON "TrialDesign"("protocolId");

-- CreateIndex
CREATE INDEX "Objective_protocolId_type_idx" ON "Objective"("protocolId", "type");

-- CreateIndex
CREATE INDEX "StudyArm_protocolId_idx" ON "StudyArm"("protocolId");

-- CreateIndex
CREATE INDEX "Intervention_protocolId_idx" ON "Intervention"("protocolId");

-- CreateIndex
CREATE UNIQUE INDEX "ArmIntervention_armId_interventionId_key" ON "ArmIntervention"("armId", "interventionId");

-- CreateIndex
CREATE INDEX "EligibilityCriterion_protocolId_type_idx" ON "EligibilityCriterion"("protocolId", "type");

-- CreateIndex
CREATE INDEX "Endpoint_protocolId_type_idx" ON "Endpoint"("protocolId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "StatisticalPlan_protocolId_key" ON "StatisticalPlan"("protocolId");

-- CreateIndex
CREATE INDEX "ProtocolSection_protocolId_idx" ON "ProtocolSection"("protocolId");

-- CreateIndex
CREATE UNIQUE INDEX "ProtocolSection_protocolId_sectionCode_key" ON "ProtocolSection"("protocolId", "sectionCode");

-- CreateIndex
CREATE INDEX "Amendment_protocolId_idx" ON "Amendment"("protocolId");

-- CreateIndex
CREATE UNIQUE INDEX "Amendment_protocolId_amendmentNumber_key" ON "Amendment"("protocolId", "amendmentNumber");

-- CreateIndex
CREATE INDEX "AuditLog_protocolId_createdAt_idx" ON "AuditLog"("protocolId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_protocolId_entityType_entityId_idx" ON "AuditLog"("protocolId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- AddForeignKey
ALTER TABLE "Protocol" ADD CONSTRAINT "Protocol_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolTeamMember" ADD CONSTRAINT "ProtocolTeamMember_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolTeamMember" ADD CONSTRAINT "ProtocolTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrialDesign" ADD CONSTRAINT "TrialDesign_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyArm" ADD CONSTRAINT "StudyArm_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArmIntervention" ADD CONSTRAINT "ArmIntervention_armId_fkey" FOREIGN KEY ("armId") REFERENCES "StudyArm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArmIntervention" ADD CONSTRAINT "ArmIntervention_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EligibilityCriterion" ADD CONSTRAINT "EligibilityCriterion_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endpoint" ADD CONSTRAINT "Endpoint_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endpoint" ADD CONSTRAINT "Endpoint_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatisticalPlan" ADD CONSTRAINT "StatisticalPlan_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProtocolSection" ADD CONSTRAINT "ProtocolSection_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amendment" ADD CONSTRAINT "Amendment_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "Protocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
