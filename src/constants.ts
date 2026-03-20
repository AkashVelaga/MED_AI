import { DrugInfo } from './types';

export const DRUG_DATABASE: Record<string, DrugInfo> = {
  'paracetamol': {
    name: 'Paracetamol',
    maxDailyDosageMg: 4000,
    interactions: [],
    class: 'Analgesic'
  },
  'acetaminophen': {
    name: 'Acetaminophen',
    maxDailyDosageMg: 4000,
    interactions: [],
    class: 'Analgesic'
  },
  'aspirin': {
    name: 'Aspirin',
    maxDailyDosageMg: 4000,
    interactions: [
      { drug: 'warfarin', severity: 'CRITICAL', reason: 'Increases bleeding risk significantly' },
      { drug: 'ibuprofen', severity: 'MEDIUM', reason: 'May decrease aspirin effectiveness for heart protection' }
    ],
    class: 'NSAID'
  },
  'warfarin': {
    name: 'Warfarin',
    maxDailyDosageMg: 10,
    interactions: [
      { drug: 'aspirin', severity: 'CRITICAL', reason: 'Severe bleeding risk' },
      { drug: 'ibuprofen', severity: 'CRITICAL', reason: 'Severe bleeding risk' }
    ],
    class: 'Anticoagulant'
  },
  'penicillin': {
    name: 'Penicillin',
    maxDailyDosageMg: 2000,
    interactions: [],
    class: 'Antibiotic'
  },
  'amoxicillin': {
    name: 'Amoxicillin',
    maxDailyDosageMg: 3000,
    interactions: [],
    class: 'Antibiotic'
  },
  'metformin': {
    name: 'Metformin',
    maxDailyDosageMg: 2550,
    interactions: [],
    class: 'Antidiabetic'
  },
  'insulin': {
    name: 'Insulin',
    maxDailyDosageMg: 100, // Units, simplified
    interactions: [],
    class: 'Antidiabetic'
  },
  'ibuprofen': {
    name: 'Ibuprofen',
    maxDailyDosageMg: 3200,
    interactions: [
      { drug: 'warfarin', severity: 'CRITICAL', reason: 'Increases bleeding risk' }
    ],
    class: 'NSAID'
  }
};

export const DEFAULT_PATIENT = {
  name: 'John Doe',
  age: 45,
  conditions: ['Diabetes Type 2', 'Hypertension'],
  allergies: ['Penicillin'],
  currentMedications: ['Metformin', 'Aspirin']
};
