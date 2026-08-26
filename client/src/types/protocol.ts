// Enum types (mirrors Prisma schema)

export type ProtocolStatus =
  | "DRAFT"
  | "IN_REVIEW"
  | "APPROVED"
  | "ACTIVE"
  | "COMPLETED"
  | "TERMINATED"
  | "SUSPENDED"
  | "WITHDRAWN";

export type StudyPhase =
  | "EARLY_PHASE_1"
  | "PHASE_1"
  | "PHASE_1_2"
  | "PHASE_2"
  | "PHASE_2_3"
  | "PHASE_3"
  | "PHASE_3B"
  | "PHASE_4"
  | "NOT_APPLICABLE";

export type StudyType = "INTERVENTIONAL" | "OBSERVATIONAL" | "EXPANDED_ACCESS";

export type BlindingType =
  | "OPEN_LABEL"
  | "SINGLE_BLIND"
  | "DOUBLE_BLIND"
  | "TRIPLE_BLIND"
  | "QUADRUPLE_BLIND";

export type ControlType =
  | "PLACEBO"
  | "ACTIVE"
  | "DOSE_COMPARISON"
  | "NO_INTERVENTION"
  | "HISTORICAL"
  | "UNCONTROLLED";

export type RandomizationType =
  | "SIMPLE"
  | "BLOCK"
  | "STRATIFIED"
  | "ADAPTIVE"
  | "NONE";

export type ArmType =
  | "EXPERIMENTAL"
  | "ACTIVE_COMPARATOR"
  | "PLACEBO_COMPARATOR"
  | "SHAM_COMPARATOR"
  | "NO_INTERVENTION";

export type InterventionType =
  | "DRUG"
  | "BIOLOGICAL"
  | "DEVICE"
  | "PROCEDURE"
  | "BEHAVIORAL"
  | "DIETARY_SUPPLEMENT"
  | "RADIATION"
  | "GENETIC"
  | "COMBINATION"
  | "OTHER";

export type CriterionType = "INCLUSION" | "EXCLUSION";

export type EndpointType = "PRIMARY" | "SECONDARY" | "EXPLORATORY" | "SAFETY";

export type ObjectiveType = "PRIMARY" | "SECONDARY" | "EXPLORATORY";

export type AnalysisPopulation = "ITT" | "MITT" | "PP" | "SAFETY";

// Model interfaces

export interface TrialDesign {
  id: string;
  protocolId: string;
  studyType: StudyType;
  phase: StudyPhase;
  blindingType: BlindingType;
  controlType: ControlType | null;
  randomizationType: RandomizationType;
  allocationRatio: string | null;
  numberOfArms: number;
  estimatedEnrollment: number | null;
  studyDurationMonths: number | null;
  treatmentDurationWeeks: number | null;
  followUpDurationWeeks: number | null;
  adaptiveDesign: boolean;
  adaptiveDesignDetails: string | null;
  multicenter: boolean;
  numberOfSites: number | null;
  countries: string[];
}

export interface Objective {
  id: string;
  protocolId: string;
  type: ObjectiveType;
  sortOrder: number;
  description: string;
  endpoints?: Endpoint[];
}

export interface Intervention {
  id: string;
  protocolId: string;
  name: string;
  type: InterventionType;
  description: string | null;
  dose: string | null;
  frequency: string | null;
  route: string | null;
  duration: string | null;
  manufacturer: string | null;
  complianceMonitoring: string | null;
}

export interface ArmIntervention {
  id: string;
  armId: string;
  interventionId: string;
  intervention: Intervention;
}

export interface StudyArm {
  id: string;
  protocolId: string;
  name: string;
  type: ArmType;
  description: string | null;
  sortOrder: number;
  participantCount: number | null;
  interventions: ArmIntervention[];
}

export interface EligibilityCriterion {
  id: string;
  protocolId: string;
  type: CriterionType;
  sortOrder: number;
  description: string;
  category: string | null;
}

export interface Endpoint {
  id: string;
  protocolId: string;
  objectiveId: string | null;
  type: EndpointType;
  sortOrder: number;
  description: string;
  measurementMethod: string | null;
  timeframe: string | null;
  statisticalTest: string | null;
}

export interface StatisticalPlan {
  id: string;
  protocolId: string;
  sampleSizeTotal: number | null;
  sampleSizeJustification: string | null;
  powerCalculation: Record<string, unknown> | null;
  significanceLevel: number | null;
  primaryAnalysisMethod: string | null;
  secondaryAnalysisMethods: string | null;
  interimAnalyses: Record<string, unknown> | null;
  missingDataHandling: string | null;
  multiplicity: string | null;
  analysisPopulations: AnalysisPopulation[];
  subgroupAnalyses: string | null;
  sensitivityAnalyses: string | null;
}

export interface ProtocolSection {
  id: string;
  protocolId: string;
  sectionCode: string;
  title: string;
  content: Record<string, unknown> | null;
  sortOrder: number;
  isComplete: boolean;
}

export interface ProtocolSummary {
  id: string;
  protocolNumber: string;
  shortTitle: string;
  fullTitle: string;
  version: string;
  status: ProtocolStatus;
  sponsorName: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
  trialDesign: {
    phase: StudyPhase;
    studyType: StudyType;
    blindingType: BlindingType;
  } | null;
  _count: {
    arms: number;
    endpoints: number;
    eligibilityCriteria: number;
    sections: number;
  };
}

export interface Protocol {
  id: string;
  protocolNumber: string;
  shortTitle: string;
  fullTitle: string;
  version: string;
  status: ProtocolStatus;
  sponsorName: string | null;
  sponsorContact: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  trialDesign: TrialDesign | null;
  objectives: Objective[];
  arms: StudyArm[];
  interventions: Intervention[];
  eligibilityCriteria: EligibilityCriterion[];
  endpoints: Endpoint[];
  statisticalPlan: StatisticalPlan | null;
  sections: ProtocolSection[];
}

// Utility: format enum values for display
export function formatEnum(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bPhase\b/i, "Phase");
}
