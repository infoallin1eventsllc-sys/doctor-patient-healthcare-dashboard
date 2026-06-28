import React, { useState } from "react";
import { 
  Activity, 
  HelpCircle, 
  AlertTriangle, 
  ArrowRight, 
  Calendar, 
  RefreshCw, 
  Check, 
  Sparkles, 
  AlertCircle,
  PhoneCall
} from "lucide-react";
import { DashboardState, saveState } from "../data";

interface SymptomCheckerProps {
  state: DashboardState;
  onChangeState: (newState: DashboardState) => void;
  onNavigateToBooking: (prefillData: { symptoms: string[]; severity: number; notes: string }) => void;
  onTriggerSOS: () => void;
}

const CATEGORIZED_SYMPTOMS = {
  Cardiovascular: ["Chest Pain / Pressure", "Palpitations / Rapid Pulse", "Shortness of Breath", "Dizziness / Lightheadedness", "Swelling in legs/ankles"],
  Respiratory: ["Dry Cough", "Wet Cough", "Wheezing", "Nasal Congestion", "Sore Throat"],
  Neurological: ["Severe Headache / Migraine", "Numbness / Tingling", "Mild Confusion", "Vision Changes (Double/Blurry)", "Muscle Weakness"],
  Gastrointestinal: ["Nausea / Vomiting", "Abdominal Pain / Cramps", "Diarrhea", "Acid Reflux / Heartburn", "Loss of Appetite"],
  General: ["High Fever", "Chills", "Fatigue / Exhaustion", "Body Aches", "Sudden Sweats"]
};

export default function SymptomChecker({ 
  state, 
  onChangeState, 
  onNavigateToBooking,
  onTriggerSOS 
}: SymptomCheckerProps) {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [duration, setDuration] = useState("less_than_24h");
  const [severity, setSeverity] = useState(5);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isConfigError, setIsConfigError] = useState(false);

  // Gemini AI Analysis result state
  const [aiResult, setAiResult] = useState<{
    triageLevel: 'EMERGENCY' | 'URGENT_APPOINTMENT' | 'ROUTINE_APPOINTMENT' | 'SELF_CARE';
    triageExplanation: string;
    educationalPossibilities: string[];
    questionsForDoctor: string[];
    homeCareTips: string[];
    disclaimer: string;
  } | null>(null);

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(symptom) 
        ? prev.filter(s => s !== symptom) 
        : [...prev, symptom]
    );
  };

  const clearChecker = () => {
    setSelectedSymptoms([]);
    setDuration("less_than_24h");
    setSeverity(5);
    setAdditionalNotes("");
    setAiResult(null);
    setErrorMsg(null);
    setIsConfigError(false);
  };

  const handleSymptomAnalysis = async () => {
    if (selectedSymptoms.length === 0) {
      setErrorMsg("Please select at least one symptom to analyze.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setIsConfigError(false);

    try {
      const response = await fetch("/api/analyze-symptom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          duration: duration.replace("_", " "),
          severity,
          additionalNotes
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to contact Gemini AI Triage service.");
      }

      const data = await response.json();
      setAiResult(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred during medical triage.");
      
      // If API key is missing, offer a high-fidelity simulated backup triage so the app remains fully functional!
      if (err.message?.includes("GEMINI_API_KEY") || err.message?.includes("not configured") || err.message?.includes("Secrets")) {
        setIsConfigError(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Safe High-Fidelity Backup Simulation for offline / unconfigured API keys
  const loadSimulatedTriage = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      
      // Compute reasonable triage outcome based on severity/symptoms
      const isChestPain = selectedSymptoms.some(s => s.toLowerCase().includes("chest pain") || s.toLowerCase().includes("shortness of breath") || s.toLowerCase().includes("confusion"));
      
      let triageLevel: 'EMERGENCY' | 'URGENT_APPOINTMENT' | 'ROUTINE_APPOINTMENT' | 'SELF_CARE' = 'ROUTINE_APPOINTMENT';
      let triageExplanation = "Based on your symptoms and moderate severity, we recommend scheduling an outpatient appointment within 48 hours for evaluation.";
      
      if (isChestPain || severity >= 8) {
        triageLevel = 'EMERGENCY';
        triageExplanation = "CRITICAL WARNING: Your symptoms (or reported pain level) indicate a high potential for acute cardiac, neurological, or respiratory distress. Please trigger SOS or go to the nearest emergency room immediately.";
      } else if (severity >= 5) {
        triageLevel = 'URGENT_APPOINTMENT';
        triageExplanation = "Your symptoms warrant clinical observation in the near term. We recommend scheduling an urgent care consultation within 24 hours.";
      } else if (severity < 3) {
        triageLevel = 'SELF_CARE';
        triageExplanation = "Your symptoms are consistent with minor, self-limiting discomfort. Rest and standard hydration should suffice, combined with active symptom monitoring.";
      }

      setAiResult({
        triageLevel,
        triageExplanation,
        educationalPossibilities: [
          "Cardiovascular/Respiratory Strain (educational only)",
          "Viral Upper Respiratory Syndrome",
          "Muscle Strain / Generalized Exhaustion"
        ],
        questionsForDoctor: [
          "Are these symptoms connected to my existing hypertension record?",
          "What diagnostic blood work or ECG testing would you recommend?",
          "Should I adjust my daily Lisinopril or Metformin medications while recovering?"
        ],
        homeCareTips: [
          "Ensure complete physical rest. Avoid any strenuous activity or exercise.",
          "Track and log your blood pressure and heart rate three times daily.",
          "Stay consistently hydrated with water and electrolyte-balanced broths."
        ],
        disclaimer: "EDUCATIONAL ONLY: This analysis is simulated as a fallback. It is not professional medical diagnosis or clinical judgment."
      });
    }, 1000);
  };

  const handlePreFillBooking = () => {
    if (!aiResult) return;
    
    // Call the callback to load the Booking component with pre-filled inputs
    onNavigateToBooking({
      symptoms: selectedSymptoms,
      severity,
      notes: `Symptom report (AI Assessment: ${aiResult.triageLevel}). Notes: ${additionalNotes || "None provided"}`
    });
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4" id="symptom-checker-portal">
      
      {/* Portal Header */}
      <div className="bg-gradient-to-r from-natural-beige to-white border border-natural-border rounded-[24px] p-6 mb-8 flex flex-col md:flex-row items-center justify-between text-left">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start space-x-2 text-natural-sage">
            <Sparkles className="h-5 w-5 animate-pulse text-natural-sage fill-natural-sage/10" />
            <span className="text-xs font-bold uppercase tracking-widest">Gemini-Powered Triage</span>
          </div>
          <h1 className="font-serif font-extrabold text-xl text-natural-dark-sage tracking-tight">
            Interactive Symptom Assessment
          </h1>
          <p className="text-xs text-natural-muted max-w-xl leading-relaxed">
            Input active discomfort details. The assistant will parse symptoms, evaluate risk thresholds, and help pre-schedule target physician slots.
          </p>
        </div>
        <button 
          onClick={clearChecker}
          className="mt-4 md:mt-0 px-4 py-2 border border-natural-border text-natural-text hover:text-natural-dark-sage hover:bg-natural-beige transition-colors text-xs font-bold rounded-full uppercase tracking-wider"
        >
          Reset Triage Form
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Selecting Symptoms and Metadata */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-white rounded-[28px] border border-natural-border shadow-xs p-6 space-y-5 text-left">
            <div className="border-b border-natural-border-light pb-3">
              <span className="font-serif text-sm font-bold text-natural-dark-sage block">1. Select Current Symptoms</span>
              <span className="text-[10px] text-natural-muted font-medium mt-0.5">Choose all categories that apply to your current condition:</span>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              {Object.entries(CATEGORIZED_SYMPTOMS).map(([category, symptoms]) => (
                <div key={category} className="space-y-2">
                  <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
                    {category}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {symptoms.map((symptom) => {
                      const active = selectedSymptoms.includes(symptom);
                      return (
                        <button
                          key={symptom}
                          onClick={() => toggleSymptom(symptom)}
                          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all flex items-center space-x-1 border cursor-pointer ${
                            active 
                              ? "bg-natural-sage text-white border-natural-sage shadow-xs" 
                              : "bg-natural-beige hover:bg-natural-border-light text-natural-text border-natural-border-light"
                          }`}
                        >
                          {active && <Check className="h-3 w-3 stroke-[3]" />}
                          <span>{symptom}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[28px] border border-natural-border shadow-xs p-6 space-y-5 text-left">
            <div className="border-b border-natural-border-light pb-3">
              <span className="font-serif text-sm font-bold text-natural-dark-sage block">2. Duration & Pain/Severity Slider</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">
                  How long has this lasted?
                </label>
                <select 
                  value={duration} 
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border bg-white rounded-lg text-xs outline-none text-natural-text"
                >
                  <option value="less_than_24h">Less than 24 Hours</option>
                  <option value="1_to_3_days">1 to 3 Days</option>
                  <option value="4_to_7_days">4 to 7 Days</option>
                  <option value="over_1_week">More than 1 Week</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
                    Severity Rating
                  </label>
                  <span className="text-xs font-bold text-natural-dark-sage">{severity}/10</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={severity} 
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full accent-natural-sage cursor-pointer h-1.5 bg-natural-beige rounded-lg appearance-none"
                />
                <div className="flex justify-between text-[10px] text-natural-muted mt-1">
                  <span>Mild (1)</span>
                  <span>Moderate (5)</span>
                  <span>Severe (10)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">
                Additional Notes / Clinical Context
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Occasional dizziness happens mostly when standing up quickly. I logged BP as 130/84 this morning."
                rows={3}
                className="w-full px-3 py-2 border border-natural-border rounded-lg text-xs outline-none focus:border-natural-sage text-natural-text resize-none"
              />
            </div>

            <button
              onClick={handleSymptomAnalysis}
              disabled={isLoading || selectedSymptoms.length === 0}
              className="w-full py-2.5 bg-natural-sage hover:bg-natural-dark-sage disabled:opacity-50 text-white text-xs font-bold rounded-full transition-colors flex items-center justify-center space-x-1.5 shadow-md shadow-natural-sage/10 uppercase tracking-wider cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>Analyzing symptoms via CarePulse clinical engine...</span>
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  <span>Analyze Symptoms with Gemini AI</span>
                </>
              )}
            </button>

            {errorMsg && (
              <div className="p-4 bg-natural-terracotta/10 text-natural-text border border-natural-terracotta/30 rounded-2xl space-y-3">
                <div className="flex items-start space-x-2 text-xs">
                  <AlertCircle className="h-4.5 w-4.5 text-natural-terracotta shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-natural-terracotta">Triage Connection Error</span>
                    {errorMsg}
                  </div>
                </div>
                {isConfigError && (
                  <button
                    onClick={loadSimulatedTriage}
                    className="mt-1 w-full py-2 bg-natural-terracotta/20 hover:bg-natural-terracotta/30 text-natural-terracotta font-bold text-xs rounded-full transition-colors cursor-pointer"
                  >
                    Run High-Fidelity Local Mock Analysis instead
                  </button>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Right Side: AI Triage Output Analysis */}
        <div className="lg:col-span-5 text-left">
          {aiResult ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-3">
              
              {/* Triage Urgency Level Header Card */}
              <div className={`p-5 rounded-[24px] border text-xs space-y-3 shadow-xs ${
                aiResult.triageLevel === "EMERGENCY" 
                  ? "bg-natural-terracotta/10 border-natural-terracotta/30 text-natural-text" 
                  : aiResult.triageLevel === "URGENT_APPOINTMENT"
                  ? "bg-[#fcf8f2] border-[#f0dfcc] text-natural-text"
                  : aiResult.triageLevel === "ROUTINE_APPOINTMENT"
                  ? "bg-natural-beige border-natural-border text-natural-dark-sage"
                  : "bg-natural-bg border-natural-border text-natural-text"
              }`}>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className={`h-5 w-5 ${
                    aiResult.triageLevel === "EMERGENCY" ? "text-natural-terracotta animate-bounce" : "text-[#d9ad8c]"
                  }`} />
                  <span className="font-serif font-bold text-sm tracking-tight uppercase">
                    Triage Level: {aiResult.triageLevel.replace("_", " ")}
                  </span>
                </div>
                <p className="font-medium text-[11px] leading-relaxed">{aiResult.triageExplanation}</p>

                {aiResult.triageLevel === "EMERGENCY" && (
                  <button 
                    onClick={onTriggerSOS}
                    className="w-full mt-2 py-2.5 bg-natural-terracotta hover:bg-[#b05e4f] text-white font-bold rounded-full transition-all flex items-center justify-center space-x-2 text-xs uppercase tracking-wider cursor-pointer"
                  >
                    <PhoneCall className="h-4 w-4 animate-pulse" />
                    <span>LAUNCH EMERGENCY PORTAL</span>
                  </button>
                )}
              </div>

              {/* Educational Possibilities */}
              <div className="bg-white rounded-[28px] border border-natural-border shadow-xs p-5 space-y-3.5">
                <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
                  Educational Categories
                </span>
                <ul className="space-y-2 text-xs text-natural-text list-disc list-inside">
                  {aiResult.educationalPossibilities.map((pos, idx) => (
                    <li key={idx} className="leading-relaxed">
                      <span className="font-serif font-bold text-natural-dark-sage">{pos}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Questions for Doctor */}
              <div className="bg-white rounded-[28px] border border-natural-border shadow-xs p-5 space-y-3.5">
                <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
                  Suggested Questions for Physician
                </span>
                <ul className="space-y-2 text-xs text-natural-text space-y-2">
                  {aiResult.questionsForDoctor.map((q, idx) => (
                    <li key={idx} className="leading-relaxed bg-natural-beige p-2.5 rounded-xl border border-natural-border-light font-serif italic text-natural-dark-sage">
                      <span>"{q}"</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Self Care tips */}
              <div className="bg-white rounded-[28px] border border-natural-border shadow-xs p-5 space-y-3.5">
                <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
                  Comfort & Monitoring Tips
                </span>
                <ul className="space-y-2 text-xs text-natural-text space-y-1.5 list-none">
                  {aiResult.homeCareTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start space-x-2 leading-relaxed">
                      <Check className="h-3.5 w-3.5 text-natural-sage shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action: Pre-fill Appointment Form */}
              <div className="bg-natural-beige border border-natural-border p-5 rounded-[24px] text-center space-y-2.5">
                <span className="font-serif text-sm font-bold text-natural-dark-sage block">Pre-fill Appointment Booking</span>
                <p className="text-[11px] text-natural-text leading-relaxed">
                  Export these checked symptoms directly into the physician scheduler to auto-validate care routing.
                </p>
                <button
                  onClick={handlePreFillBooking}
                  className="w-full py-2.5 bg-natural-sage hover:bg-natural-dark-sage text-white font-bold text-xs rounded-full transition-colors flex items-center justify-center space-x-1.5 shadow-sm uppercase tracking-wider cursor-pointer"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Book Slot with Symptoms</span>
                </button>
              </div>

              <span className="text-[10px] text-natural-muted italic text-center block max-w-xs mx-auto leading-relaxed">
                {aiResult.disclaimer || "Disclaimer: This educational tool does not replace professional medical consults. Always connect with healthcare practitioners in emergency conditions."}
              </span>

            </div>
          ) : (
            <div className="bg-natural-bg rounded-[28px] border border-dashed border-natural-border p-8 text-center flex flex-col items-center justify-center space-y-3.5 min-h-[400px]">
              <div className="h-12 w-12 rounded-full bg-natural-beige flex items-center justify-center text-natural-muted">
                <HelpCircle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-natural-dark-sage block">Pending Clinical Inputs</span>
                <span className="text-[10px] text-natural-muted block mt-1.5 leading-relaxed max-w-xs mx-auto">
                  Select your symptoms on the left, adjust duration/severity metrics, and click 'Analyze' to trigger clinical evaluation.
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
