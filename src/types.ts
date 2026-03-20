export interface PatientContext {
  name: string;
  age: number;
  conditions: string[];
  allergies: string[];
  currentMedications: string[];
}

export interface ParsedIntent {
  drug: string;
  dosage: string;
  dosageValue?: number; // in mg
  frequency: string;
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'CRITICAL';

export interface Alert {
  id: string;
  title: string;
  issue: string;
  explanation: string;
  suggestedFix: string;
  riskLevel: RiskLevel;
}

export interface AnalysisResponse {
  parsed_intent: ParsedIntent;
  risk_level: RiskLevel;
  issues_detected: string[];
  alerts: Alert[];
  explanation: string;
  suggested_fix: string;
  confidence_score: number;
}

export interface DrugInfo {
  name: string;
  maxDailyDosageMg: number;
  interactions: {
    drug: string;
    severity: RiskLevel;
    reason: string;
  }[];
  class: string;
}
