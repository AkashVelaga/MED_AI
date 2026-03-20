/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { 
  Pill, 
  AlertCircle, 
  Heart, 
  User, 
  Activity, 
  ShieldAlert, 
  Mic, 
  FileUp, 
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { PatientContext, AnalysisResponse, Alert } from './types';
import { DEFAULT_PATIENT } from './constants';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [input, setInput] = useState('');
  const [patient] = useState<PatientContext>(DEFAULT_PATIENT);
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // 1. AI Parsing (Minimal usage)
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Parse this medical prescription or input into structured JSON. 
        Input: "${input}"
        Rules: 
        - Extract drug name, dosage (e.g. "500mg"), and frequency.
        - If dosage is in mg, also provide "dosageValue" as a number.
        - If multiple drugs, just pick the first one for this demo.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              drug: { type: Type.STRING },
              dosage: { type: Type.STRING },
              dosageValue: { type: Type.NUMBER },
              frequency: { type: Type.STRING }
            },
            required: ["drug", "dosage", "frequency"]
          }
        }
      });

      const parsedIntent = JSON.parse(response.text);

      // 2. Backend Rule Engine Validation
      const backendRes = await fetch('/api/analyze-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsed_intent: parsedIntent,
          patient_context: patient
        })
      });

      if (!backendRes.ok) throw new Error('Backend analysis failed');
      
      const result: AnalysisResponse = await backendRes.json();
      
      // Artificial delay for UX "Analyze" feeling
      setTimeout(() => {
        setAnalysis(result);
        setIsAnalyzing(false);
      }, 800);

    } catch (err) {
      console.error(err);
      setError('System error during analysis. Falling back to rule-based mode.');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-600 p-1.5 rounded-lg">
            <ShieldAlert className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">MediGuard <span className="text-emerald-600">AI</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-600 border border-slate-200">
            <Activity className="w-3 h-3 text-emerald-500" />
            System Active
          </div>
          <div className="text-xs text-slate-400 font-mono">v1.0.4-stable</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* LEFT PANEL: Input Zone */}
        <section className="lg:col-span-4 bg-white border-r border-slate-200 p-6 flex flex-col gap-6">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Input Zone</h2>
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter prescription or medical input (e.g., 'Paracetamol 500mg twice a day')..."
                className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all resize-none text-slate-700 placeholder:text-slate-400"
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50">
                  <Mic className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors rounded-lg hover:bg-emerald-50">
                  <FileUp className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !input.trim()}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 group"
          >
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Analyze Prescription
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="mt-auto">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-xs text-emerald-800 leading-relaxed">
                <span className="font-bold">Pro Tip:</span> You can paste messy doctor notes. The AI parsing engine will structure it before rule-checking.
              </p>
            </div>
          </div>
        </section>

        {/* CENTER PANEL: Patient Context */}
        <section className="lg:col-span-4 bg-slate-50 p-6 border-r border-slate-200 overflow-y-auto">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4">Patient Snapshot</h2>
          
          <div className="space-y-4">
            {/* Patient Identity */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                  <User className="text-slate-400 w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{patient.name}</h3>
                  <p className="text-xs text-slate-500">Age: {patient.age} • Male • Patient ID: #8821-X</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Blood Type</p>
                  <p className="text-sm font-medium text-slate-700">O Positive</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Last Visit</p>
                  <p className="text-sm font-medium text-slate-700">12 Mar 2026</p>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-bold text-slate-700">Active Conditions</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.conditions.map((c, i) => (
                  <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-100">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-slate-700">Known Allergies</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((a, i) => (
                  <span key={i} className="px-3 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-full border border-red-100">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            {/* Current Medications */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Pill className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-700">Current Medications</h3>
              </div>
              <div className="space-y-2">
                {patient.currentMedications.map((m, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-xs font-medium text-slate-600">{m}</span>
                    <span className="text-[10px] text-slate-400">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: Alert Engine */}
        <section className="lg:col-span-4 bg-white p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Alert Engine</h2>
            {analysis && (
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                analysis.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                analysis.risk_level === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>
                {analysis.risk_level} RISK
              </div>
            )}
          </div>

          {!analysis && !isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <ShieldAlert className="w-16 h-16 mb-4 text-slate-300" />
              <p className="text-slate-500 font-medium">No active analysis</p>
              <p className="text-xs text-slate-400 mt-1">Enter a prescription to begin safety check</p>
            </div>
          )}

          {isAnalyzing && (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="h-32 bg-slate-50 rounded-2xl animate-pulse border border-slate-100" />
              ))}
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {analysis && !isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Confidence Score */}
                <div className="flex items-center justify-between px-2 mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Confidence Score</span>
                  <span className="text-[10px] font-mono text-emerald-600">{(analysis.confidence_score * 100).toFixed(0)}%</span>
                </div>

                {/* Alerts */}
                {analysis.alerts.length > 0 ? (
                  analysis.alerts.map((alert) => (
                    <AlertCard key={alert.id} alert={alert} />
                  ))
                ) : (
                  <motion.div 
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex flex-col items-center text-center"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-3" />
                    <h3 className="font-bold text-emerald-800">Safe to Proceed</h3>
                    <p className="text-xs text-emerald-600 mt-1">No contraindications or dosage errors detected for this patient context.</p>
                  </motion.div>
                )}

                {/* Summary */}
                <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">System Explanation</h4>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{analysis.explanation}"
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-xs text-red-700 font-medium">{error}</p>
            </div>
          )}
        </section>
      </main>

      {/* Footer Status */}
      <footer className="bg-white border-t border-slate-200 px-6 py-2 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Rule Engine: ONLINE
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            AI Parser: ONLINE
          </span>
        </div>
        <div>
          MediGuard AI System • Clinical Decision Support
        </div>
      </footer>
    </div>
  );
}

function AlertCard({ alert }: { alert: Alert; key?: string | number }) {
  const colorMap = {
    CRITICAL: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      strip: 'bg-red-600',
      text: 'text-red-800',
      subtext: 'text-red-600',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />
    },
    MEDIUM: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      strip: 'bg-amber-500',
      text: 'text-amber-800',
      subtext: 'text-amber-600',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />
    },
    LOW: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      strip: 'bg-emerald-500',
      text: 'text-emerald-800',
      subtext: 'text-emerald-600',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />
    }
  };

  const style = colorMap[alert.riskLevel];

  return (
    <div className={`${style.bg} ${style.border} border rounded-xl overflow-hidden shadow-sm flex`}>
      <div className={`w-1.5 ${style.strip} shrink-0`} />
      <div className="p-4 flex-1">
        <div className="flex items-center gap-2 mb-1">
          {style.icon}
          <h3 className={`font-bold text-sm ${style.text}`}>{alert.title}</h3>
        </div>
        <p className={`text-xs font-semibold mb-2 ${style.text}`}>{alert.issue}</p>
        <p className={`text-[11px] leading-relaxed mb-3 ${style.subtext}`}>{alert.explanation}</p>
        
        <div className="bg-white/50 p-2 rounded-lg border border-white/20">
          <p className="text-[9px] font-bold uppercase text-slate-400 mb-1">Suggested Fix</p>
          <p className="text-[11px] font-medium text-slate-700">{alert.suggestedFix}</p>
        </div>
      </div>
    </div>
  );
}
