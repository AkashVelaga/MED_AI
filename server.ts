import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { DRUG_DATABASE } from "./src/constants";
import { ParsedIntent, PatientContext, AnalysisResponse, Alert, RiskLevel } from "./src/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/analyze-risk", (req, res) => {
    const { parsed_intent, patient_context }: { parsed_intent: ParsedIntent; patient_context: PatientContext } = req.body;
    
    const drugName = parsed_intent.drug.toLowerCase();
    const drugInfo = DRUG_DATABASE[drugName];
    
    const alerts: Alert[] = [];
    let overallRisk: RiskLevel = 'LOW';
    const issues: string[] = [];

    // 1. Rule Engine: Allergy Check
    if (patient_context.allergies.some(a => a.toLowerCase() === drugName)) {
      overallRisk = 'CRITICAL';
      issues.push(`Patient is allergic to ${parsed_intent.drug}`);
      alerts.push({
        id: 'allergy-conflict',
        title: 'Severe Allergy Conflict',
        issue: `Patient has a documented allergy to ${parsed_intent.drug}`,
        explanation: `Administering ${parsed_intent.drug} to an allergic patient can cause anaphylaxis.`,
        suggestedFix: 'Discontinue use immediately and find an alternative class of medication.',
        riskLevel: 'CRITICAL'
      });
    }

    // 2. Rule Engine: Drug-Drug Interaction Check
    if (drugInfo) {
      for (const currentMed of patient_context.currentMedications) {
        const interaction = drugInfo.interactions.find(i => i.drug === currentMed.toLowerCase());
        if (interaction) {
          if (interaction.severity === 'CRITICAL') overallRisk = 'CRITICAL';
          else if (interaction.severity === 'MEDIUM' && overallRisk !== 'CRITICAL') overallRisk = 'MEDIUM';
          
          issues.push(`Interaction detected: ${drugInfo.name} + ${currentMed}`);
          alerts.push({
            id: `interaction-${currentMed}`,
            title: interaction.severity === 'CRITICAL' ? 'High Risk Interaction' : 'Moderate Interaction',
            issue: `${drugInfo.name} + ${currentMed} ${interaction.reason.toLowerCase()}`,
            explanation: interaction.reason,
            suggestedFix: interaction.severity === 'CRITICAL' ? 'Avoid combination or adjust dosage under strict supervision.' : 'Monitor patient for side effects.',
            riskLevel: interaction.severity
          });
        }
      }

      // 3. Rule Engine: Dosage Check
      if (parsed_intent.dosageValue && parsed_intent.dosageValue > drugInfo.maxDailyDosageMg) {
        overallRisk = 'CRITICAL';
        issues.push(`Dosage exceeds safe limit for ${drugInfo.name}`);
        alerts.push({
          id: 'dosage-limit',
          title: 'Critical Dosage Alert',
          issue: `Dosage of ${parsed_intent.dosageValue}mg exceeds max daily limit of ${drugInfo.maxDailyDosageMg}mg`,
          explanation: `High doses of ${drugInfo.name} can lead to toxicity or severe adverse effects.`,
          suggestedFix: `Reduce dosage to below ${drugInfo.maxDailyDosageMg}mg per 24-hour period.`,
          riskLevel: 'CRITICAL'
        });
      }
    } else {
        // Drug not in local DB, but maybe AI parsed it.
        // If we don't know the drug, we might flag as MEDIUM if it's a messy input
    }

    const response: AnalysisResponse = {
      parsed_intent,
      risk_level: overallRisk,
      issues_detected: issues,
      alerts,
      explanation: issues.length > 0 ? `Detected ${issues.length} potential safety issues.` : "No immediate safety concerns detected by rule engine.",
      suggested_fix: alerts.length > 0 ? alerts[0].suggestedFix : "Proceed with standard monitoring.",
      confidence_score: drugInfo ? 0.95 : 0.7
    };

    res.json(response);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
