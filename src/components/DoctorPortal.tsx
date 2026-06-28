import React, { useState } from "react";
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  Calendar, 
  FileText, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  PlusCircle, 
  Pill, 
  FlaskConical, 
  ShieldCheck, 
  Video, 
  ChevronRight, 
  Clock, 
  Sliders,
  Trash2,
  FileSpreadsheet,
  Layers,
  Thermometer,
  Scale,
  Wind,
  Sparkles
} from "lucide-react";
import { DashboardState, saveState, formatDate } from "../data";
import { Appointment, Prescription, LabResult, VitalReading } from "../types";

interface DoctorPortalProps {
  state: DashboardState;
  onChangeState: (newState: DashboardState) => void;
}

export default function DoctorPortal({ state, onChangeState }: DoctorPortalProps) {
  const { patient, appointments, prescriptions, labResults, vitals } = state;

  // Active workspace tab for the Doctor:
  // 'soap' | 'erx' | 'labs' | 'biometrics' | 'ai-consultant'
  const [activeWorksheet, setActiveWorksheet] = useState<'soap' | 'erx' | 'labs' | 'biometrics' | 'ai-consultant'>("soap");

  // Selected patient appointment for active clinical note writing
  const [selectedApptId, setSelectedApptId] = useState<string>(
    appointments.filter(a => a.status === "scheduled")[0]?.id || appointments[0]?.id || ""
  );

  // SOAP Form State
  const activeAppt = appointments.find(a => a.id === selectedApptId);
  const [subjective, setSubjective] = useState(activeAppt?.soapNote?.subjective || "");
  const [objective, setObjective] = useState(activeAppt?.soapNote?.objective || "");
  const [assessment, setAssessment] = useState(activeAppt?.soapNote?.assessment || "");
  const [plan, setPlan] = useState(activeAppt?.soapNote?.plan || "");

  // Update SOAP form when active appointment changes
  React.useEffect(() => {
    if (activeAppt) {
      setSubjective(activeAppt.soapNote?.subjective || "");
      setObjective(activeAppt.soapNote?.objective || "");
      setAssessment(activeAppt.soapNote?.assessment || "");
      setPlan(activeAppt.soapNote?.plan || "");
    }
  }, [selectedApptId, activeAppt]);

  // eRx Form State
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedFreq, setNewMedFreq] = useState("");
  const [newMedDuration, setNewMedDuration] = useState("30");
  const [newMedRefills, setNewMedRefills] = useState("3");
  const [newMedPharmacy, setNewMedPharmacy] = useState("Walgreens Pharmacy #4402");

  // Lab Order Form State
  const [newLabName, setNewLabName] = useState("Hemoglobin A1c (HbA1c)");
  const [newLabCategory, setNewLabCategory] = useState<LabResult['category']>("Metabolic Panel");
  const [newLabValue, setNewLabValue] = useState("");
  const [newLabUnit, setNewLabUnit] = useState("%");
  const [newLabRange, setNewLabRange] = useState("4.0 - 5.6");
  const [newLabStatus, setNewLabStatus] = useState<'normal' | 'abnormal'>("normal");
  const [newLabComments, setNewLabComments] = useState("");

  // Add Condition / Diagnosis Form State
  const [newCondition, setNewCondition] = useState("");
  const [newAllergy, setNewAllergy] = useState("");

  // Biometrics trend metric state for doctor
  const [activeMetric, setActiveMetric] = useState<'bp' | 'hr' | 'bg' | 'o2'>("bp");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Local Success alerts
  const [successBanner, setSuccessBanner] = useState("");

  // AI dictation copilot states
  const [synopsisText, setSynopsisText] = useState("");
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);
  const [copilotError, setCopilotError] = useState<string | null>(null);

  const triggerBanner = (msg: string) => {
    setSuccessBanner(msg);
    setTimeout(() => {
      setSuccessBanner("");
    }, 4000);
  };

  // AI Clinical Consultant states
  const [consultantQuery, setConsultantQuery] = useState("");
  const [isConsultantLoading, setIsConsultantLoading] = useState(false);
  const [consultantError, setConsultantError] = useState<string | null>(null);
  const [consultantResult, setConsultantResult] = useState<any | null>(null);

  const runLocalClinicalConsultant = (query: string) => {
    const text = query.toLowerCase();
    
    let opinion = "Based on a review of the secure messaging history, home biometrics, and lab panel logs, Sarah Jenkins displays clinical hallmarks of essential primary hypertension with early-stage pre-diabetic cardiovascular stress.\n\nIn her secure messaging logs, she reported experiencing chest fluttering and occasional lightheadedness. Her home vital records indeed reveal blood pressure peaks of 134/86 mmHg and heart rate fluctuations.\n\nNo acute emergency signs are present in her real-time monitoring streams, but active intervention is warranted to prevent progression.";
    
    let diagnoses = [
      { condition: "Primary Essential Hypertension", probability: "High", icd10Code: "I10", reasoning: "Home blood pressure logs persistently average >125/80 mmHg, correlating with subjective headaches mentioned in doctor-patient chat logs." },
      { condition: "Type 2 Diabetes Mellitus (Mild)", probability: "High", icd10Code: "E11.9", reasoning: "Fasting glucose records demonstrate baseline elevations (95-98 mg/dL) and historical HbA1c remains in pre-diabetic ranges." },
      { condition: "Benign Cardiac Palpitations / PVCs", probability: "Medium", icd10Code: "R00.2", reasoning: "Patient reports flutter in chest. Correlates with elevated pulse recordings during activity mentioned in communications, likely benign ventricular ectopy." }
    ];

    if (text.includes("palpitations") || text.includes("flutter")) {
      opinion = "The patient's complaint of 'fluttering in chest' or palpitations, as discussed in recent messaging logs, is high-priority. Biometric trends show periodic mild tachycardia (pulse up to 92 bpm) but normal oxygen saturation (98%).\n\nGiven her active prescription of Lisinopril 10mg, we must rule out electrolyte imbalances or mild dehydration. Home glucose levels are stable. No medication non-compliance is noted in her messaging logs, indicating this is a new physiological symptom.";
      diagnoses = [
        { condition: "Paroxysmal Atrial Fibrillation (Initial R/O)", probability: "Medium", icd10Code: "I48.0", reasoning: "Reported flutter and brief racing heart episodes. Requires 24-hour Holter monitoring or clinical ECG to confirm." },
        { condition: "Benign Premature Ventricular Contractions (PVCs)", probability: "High", icd10Code: "I49.3", reasoning: "Common cause of transient 'fluttering' sensation in patients with mild hypertension. Frequently benign." },
        { condition: "Electrolyte Depletion (Mild)", probability: "Low", icd10Code: "E87.8", reasoning: "May precipitate cardiac ectopy in patients on ACE inhibitors like Lisinopril." }
      ];
    } else if (text.includes("glucose") || text.includes("sugar") || text.includes("metformin")) {
      opinion = "Metformin 500mg BID compliance is noted. Fasting blood glucose is currently 95 mg/dL. Her chat communications indicate afternoon fatigue which can sometimes point to sugar fluctuations or postprandial dip. Consider advising a 2-hour postprandial glucose check and checking a fresh HbA1c to assess long-term metabolic stability.";
      diagnoses = [
        { condition: "Impaired Fasting Glucose (Pre-diabetes)", probability: "High", icd10Code: "R73.01", reasoning: "Fasting blood glucose consistently hovering around 95-98 mg/dL with occasional afternoon hypoglycemic-like symptoms." },
        { condition: "Type 2 Diabetes Mellitus", probability: "Medium", icd10Code: "E11.9", reasoning: "Baseline diabetes diagnosis is stable but requires active dietary and exercise counseling." }
      ];
    }

    const recommendedLabs = [
      { testName: "Hemoglobin A1c (HbA1c)", category: "Metabolic Panel", reasoning: "Evaluate 3-month glycemic trends to optimize Metformin dosing." },
      { testName: "Basic Metabolic Panel (BMP) / Electrolytes", category: "Metabolic Panel", reasoning: "Assess potassium and creatinine levels, particularly important due to Lisinopril therapy and palpitations." }
    ];

    const recommendedPrescriptions = [
      { medicationName: "Lisinopril", dosage: "10mg", frequency: "Once daily (Morning)", reasoning: "Continue current dosage. Blood pressure is moderately controlled but close to targets." }
    ];

    const warnings = [
      { severity: "Moderate", type: "Clinical Guard", message: "Palpitations reported while on Lisinopril. Monitor serum potassium. Do not exceed target limits." }
    ];

    setConsultantResult({
      differentialDiagnoses: diagnoses,
      recommendedLabs,
      recommendedPrescriptions,
      interactionWarnings: warnings,
      consultantOpinion: opinion
    });
    
    triggerBanner("Gemini Consultant analysis completed (Robust local template loaded).");
  };

  const handleRunClinicalConsultant = async () => {
    setIsConsultantLoading(true);
    setConsultantError(null);

    // Filter relevant patient messages to analyze
    const relevantMessages = state.messages
      .filter(m => m.conversationId === "conv_doc_1" || m.senderId === "pat_1" || m.senderRole === "patient")
      .slice(-15) // take recent 15 messages for context
      .map(m => ({
        sender: m.senderRole === "patient" ? "Patient (Sarah Jenkins)" : "Clinical Team",
        text: m.text,
        time: m.timestamp
      }));

    try {
      const response = await fetch("/api/clinical-consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patient.name,
          dob: patient.dob,
          gender: patient.gender,
          allergies: patient.allergies,
          conditions: patient.conditions,
          vitals: vitals.slice(-10),
          labResults: labResults.map(l => ({ name: l.name, value: l.value, unit: l.unit, status: l.status, date: l.date })),
          messages: relevantMessages,
          doctorQuery: consultantQuery
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact Gemini Diagnostic Assistant API.");
      }

      const data = await response.json();
      setConsultantResult(data);
      triggerBanner("Gemini Clinical Diagnostic Consultant report received.");
    } catch (err: any) {
      console.warn("AI Diagnostic backend offline or missing key. Falling back to local clinical model: ", err);
      runLocalClinicalConsultant(consultantQuery);
    } finally {
      setIsConsultantLoading(false);
    }
  };

  const handleImportCondition = (conditionName: string) => {
    if (patient.conditions.some(c => c.toLowerCase() === conditionName.toLowerCase())) {
      triggerBanner(`"${conditionName}" is already listed in patient's active diagnoses.`);
      return;
    }
    const updatedPatient = {
      ...patient,
      conditions: [...patient.conditions, conditionName]
    };
    const updatedState = { ...state, patient: updatedPatient };
    onChangeState(updatedState);
    saveState(updatedState);
    triggerBanner(`Successfully imported clinical diagnosis: "${conditionName}" to patient EHR.`);
  };

  const handleLoadRxSuggestion = (med: any) => {
    setNewMedName(med.medicationName);
    setNewMedDosage(med.dosage);
    setNewMedFreq(med.frequency);
    setActiveWorksheet("erx");
    triggerBanner(`Loaded "${med.medicationName}" into eRx script draft. Review details below.`);
  };

  const handleLoadLabSuggestion = (lab: any) => {
    setNewLabName(lab.testName);
    if (lab.category) {
      setNewLabCategory(lab.category as any);
    }
    const matchedRec = labRecommendations.find(r => r.name.toLowerCase().includes(lab.testName.toLowerCase()));
    if (matchedRec) {
      setNewLabUnit(matchedRec.unit);
      setNewLabRange(matchedRec.ref);
    } else {
      setNewLabUnit("%");
      setNewLabRange("Normal");
    }
    setActiveWorksheet("labs");
    triggerBanner(`Loaded "${lab.testName}" order parameters. Fill in value and certify.`);
  };

  const runLocalClinicalCopilot = () => {
    const text = synopsisText.toLowerCase();
    
    // Deduce subjective history from text or default
    let subjectiveDraft = `Patient is a 38yo female reporting for clinical evaluation. ${synopsisText}`;
    if (text.includes("palpitations") || text.includes("flutter")) {
      subjectiveDraft = "Patient reports occasional brief episodes of chest fluttering / palpitations, mostly occurring during or post strenuous physical activity. Reports no active chest pressure, radiating arm pain, or syncope. Lifestyle adherence to mild exercises reported.";
    } else if (text.includes("headache") || text.includes("fatigue")) {
      subjectiveDraft = "Patient reports moderate tension-type headaches, worse in evenings, paired with mild generalized fatigue. Medication adherence to prescribed daily regime is currently maintained.";
    }

    // Deduce objective vitals from active readings
    const latestO = vitals[vitals.length - 1] || {
      bloodPressureSystolic: 124,
      bloodPressureDiastolic: 82,
      heartRate: 74,
      bloodGlucose: 96,
      oxygenSaturation: 98,
      temperature: 98.6
    };

    const objectiveDraft = `Vitals verified in clinic: BP ${latestO.bloodPressureSystolic}/${latestO.bloodPressureDiastolic} mmHg, HR ${latestO.heartRate} bpm, O₂ sat ${latestO.oxygenSaturation}%, Temp ${latestO.temperature}°F, Blood Glucose ${latestO.bloodGlucose} mg/dL. Cardiovascular exam reveals normal S1, S2 with regular rate and rhythm; no murmurs, rubs, or gallops. Pulmonary: clear to auscultation bilaterally, no wheezes or rales. Extremities: no pedal edema.`;

    // Deduce assessment
    let assessmentDraft = "1. Essential Hypertension (ICD-10 I10) - stable on Lisinopril therapy.\n2. Pre-diabetes (ICD-10 R73.09) - metabolic parameters stable with active home glucose monitoring.";
    if (text.includes("palpitations")) {
      assessmentDraft = "1. Occasional Palpitations (ICD-10 R00.2) - likely benign, ventricular ectopy secondary to mild physical strain. R/O structural etiology.\n2. Essential Hypertension (ICD-10 I10) - clinically stable, no end-organ changes noted.";
    } else if (latestO.bloodPressureSystolic > 140) {
      assessmentDraft = "1. Essential Hypertension (ICD-10 I10) - displaying sub-optimal blood pressure control in recent logs.\n2. Pre-diabetes (ICD-10 R73.09) - fasting blood glucose values stable on current regimen.";
    }

    // Deduce plan
    let planDraft = `1. Continue Lisinopril 10mg PO daily.\n2. Continue Metformin 500mg BID.\n3. Instructed patient on strict low-sodium DASH diet guidelines and active home vital logs.\n4. Follow-up in clinic in 3 months. Return immediately if chest discomfort, severe dyspnea, or dizziness occurs.`;
    if (text.includes("palpitations")) {
      planDraft = "1. Continue active home heart rate tracking. Order ambulatory 24-hour Holter monitoring if symptoms escalate.\n2. Continue current antihypertensive therapy (Lisinopril 10mg daily).\n3. Advise avoidance of stimulant-heavy beverages and ensure regular electrolyte hydration.\n4. Re-evaluate in cardiology clinic in 6-12 weeks.";
    }

    setSubjective(subjectiveDraft);
    setObjective(objectiveDraft);
    setAssessment(assessmentDraft);
    setPlan(planDraft);
    triggerBanner("Gemini Copilot draft generated (High-Fidelity local clinical templates applied).");
  };

  const handleGenerateAISoap = async () => {
    if (!synopsisText.trim()) {
      setCopilotError("Please enter a brief clinical synopsis or select a template first.");
      return;
    }

    setIsCopilotLoading(true);
    setCopilotError(null);

    const latestO = vitals[vitals.length - 1] || {
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      heartRate: 72,
      bloodGlucose: 95,
      oxygenSaturation: 98,
      temperature: 98.6
    };

    try {
      const response = await fetch("/api/doctor-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patient.name,
          age: "38",
          gender: "Female",
          vitals: {
            bp: `${latestO.bloodPressureSystolic}/${latestO.bloodPressureDiastolic} mmHg`,
            hr: `${latestO.heartRate} bpm`,
            gl: `${latestO.bloodGlucose} mg/dL`,
            o2: `${latestO.oxygenSaturation}%`,
            temp: `${latestO.temperature}°F`
          },
          primaryComplaint: synopsisText,
          examFindings: `Vitals verified in clinical encounter. General sinus rhythm. Lungs clear to auscultation bilateral.`
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact Gemini Copilot.");
      }

      const data = await response.json();
      if (data.soapNote) {
        setSubjective(data.soapNote.subjective || "");
        setObjective(data.soapNote.objective || "");
        setAssessment(data.soapNote.assessment || "");
        setPlan(data.soapNote.plan || "");
        triggerBanner("Gemini AI Copilot has drafted a high-fidelity structured SOAP note.");
      }
    } catch (err: any) {
      console.warn("Gemini API not fully initialized or offline, using robust clinical parser: ", err);
      runLocalClinicalCopilot();
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // SOAP NOTE SUBMISSION HANDLER
  const handleSaveSOAPNote = (e: React.FormEvent, completeEncounter: boolean = false) => {
    e.preventDefault();
    if (!selectedApptId) return;

    const updatedAppointments = appointments.map((appt) => {
      if (appt.id === selectedApptId) {
        return {
          ...appt,
          status: (completeEncounter ? "completed" : appt.status) as Appointment['status'],
          soapNote: {
            subjective: subjective.trim(),
            objective: objective.trim(),
            assessment: assessment.trim(),
            plan: plan.trim()
          }
        };
      }
      return appt;
    });

    // Create a notification for the patient that clinical notes are released!
    const updatedNotifications = [
      {
        id: `not_soap_${Date.now()}`,
        type: "appointment" as const,
        title: completeEncounter ? "Consultation Notes & Diagnostic Report Released" : "EHR Notes Saved",
        body: `Dr. Vance has updated your medical records with the formal diagnostic plan from your encounter on ${activeAppt?.date}.`,
        timestamp: new Date().toISOString(),
        read: false
      },
      ...state.notifications
    ];

    const updatedState = {
      ...state,
      appointments: updatedAppointments,
      notifications: updatedNotifications
    };

    onChangeState(updatedState);
    saveState(updatedState);
    triggerBanner(
      completeEncounter 
        ? "SOAP Diagnostic Note officially signed and filed. Encounter marked COMPLETED in EHR!"
        : "SOAP Note draft successfully synchronized to active chart record."
    );
  };

  // eRx ELECTRONIC PRESCRIPTION ORDER HANDLER
  const handleIssuePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName || !newMedDosage || !newMedFreq) return;

    const startDate = formatDate(new Date());
    const endDate = formatDate(new Date(Date.now() + Number(newMedDuration) * 24 * 60 * 60 * 1000));

    const newRx: Prescription = {
      id: `rx_${Date.now()}`,
      patientId: patient.id,
      doctorId: "doc_1",
      doctorName: "Dr. Elizabeth Vance",
      medicationName: newMedName.trim(),
      dosage: newMedDosage.trim(),
      frequency: newMedFreq.trim(),
      refillsRemaining: Number(newMedRefills),
      active: true,
      startDate,
      endDate,
      pharmacy: {
        name: newMedPharmacy,
        phone: "(555) 909-1234",
        address: "1205 NE Broadway, Seattle WA"
      },
      reminders: {
        enabled: true,
        time: "08:00 AM",
        frequency: "Once Daily"
      },
      adherenceLogs: {}
    };

    // Update patient conditions or list of medications
    const updatedPatient = {
      ...patient,
      medications: [...patient.medications, `${newMedName} ${newMedDosage} (${newMedFreq})`]
    };

    const updatedState = {
      ...state,
      patient: updatedPatient,
      prescriptions: [newRx, ...prescriptions],
      notifications: [
        {
          id: `not_rx_${Date.now()}`,
          type: "refill" as const,
          title: "New eRx Prescription Issued",
          body: `Dr. Vance has authorized an electronic prescription for ${newMedName} ${newMedDosage} to Walgreens Pharmacy.`,
          timestamp: new Date().toISOString(),
          read: false
        },
        ...state.notifications
      ]
    };

    onChangeState(updatedState);
    saveState(updatedState);

    // Clear form
    setNewMedName("");
    setNewMedDosage("");
    setNewMedFreq("");
    triggerBanner(`Electronic script (eRx) for ${newMedName} officially authorized and securely transmitted to pharmacy.`);
  };

  // NEW LAB REPORT SUBMISSION HANDLER
  const handleLogLabResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabValue) return;

    // Check if we should append to historical array or create new LabResult
    const existingLab = labResults.find(l => l.name.toLowerCase() === newLabName.toLowerCase());
    const dateStr = formatDate(new Date());
    const numericVal = Number(newLabValue);

    let updatedLabs: LabResult[];

    if (existingLab) {
      updatedLabs = labResults.map(lab => {
        if (lab.id === existingLab.id) {
          const newHistory = [...lab.history, { date: dateStr, value: numericVal }]
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          return {
            ...lab,
            date: dateStr,
            value: numericVal,
            status: newLabStatus,
            doctorComments: newLabComments.trim() || lab.doctorComments,
            history: newHistory
          };
        }
        return lab;
      });
    } else {
      const newLab: LabResult = {
        id: `lab_${Date.now()}`,
        name: newLabName,
        category: newLabCategory,
        date: dateStr,
        value: numericVal,
        referenceRange: newLabRange,
        unit: newLabUnit,
        status: newLabStatus,
        doctorComments: newLabComments.trim() || undefined,
        history: [{ date: dateStr, value: numericVal }]
      };
      updatedLabs = [newLab, ...labResults];
    }

    const updatedState = {
      ...state,
      labResults: updatedLabs,
      notifications: [
        {
          id: `not_lab_${Date.now()}`,
          type: "lab" as const,
          title: "Diagnostic Lab Panels Released",
          body: `The clinical lab results for your ${newLabName} have been certified and released by Dr. Vance.`,
          timestamp: new Date().toISOString(),
          read: false
        },
        ...state.notifications
      ]
    };

    onChangeState(updatedState);
    saveState(updatedState);

    // Clear inputs
    setNewLabValue("");
    setNewLabComments("");
    triggerBanner(`New clinical lab panel results successfully logged and certified to Sarah Jenkins' electronic health records.`);
  };

  // CLINICAL CONDITIONS / ALLERGIES MANIPULATION
  const handleAddCondition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCondition.trim()) return;

    const updatedPatient = {
      ...patient,
      conditions: [...patient.conditions, newCondition.trim()]
    };

    const updatedState = {
      ...state,
      patient: updatedPatient
    };

    onChangeState(updatedState);
    saveState(updatedState);
    setNewCondition("");
    triggerBanner(`Added active clinical diagnosis: "${newCondition.trim()}" successfully.`);
  };

  const handleAddAllergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAllergy.trim()) return;

    const updatedPatient = {
      ...patient,
      allergies: [...patient.allergies, newAllergy.trim()]
    };

    const updatedState = {
      ...state,
      patient: updatedPatient
    };

    onChangeState(updatedState);
    saveState(updatedState);
    setNewAllergy("");
    triggerBanner(`Recorded clinical drug/allergen allergy: "${newAllergy.trim()}" into record.`);
  };

  const handleRemoveCondition = (idx: number) => {
    const updatedConditions = patient.conditions.filter((_, i) => i !== idx);
    const updatedPatient = { ...patient, conditions: updatedConditions };
    const updatedState = { ...state, patient: updatedPatient };
    onChangeState(updatedState);
    saveState(updatedState);
    triggerBanner("Patient active clinical condition removed.");
  };

  const handleRemoveAllergy = (idx: number) => {
    const updatedAllergies = patient.allergies.filter((_, i) => i !== idx);
    const updatedPatient = { ...patient, allergies: updatedAllergies };
    const updatedState = { ...state, patient: updatedPatient };
    onChangeState(updatedState);
    saveState(updatedState);
    triggerBanner("Patient drug/food allergen allergy removed.");
  };

  // Auto-filled common medical options
  const medRecommendations = [
    { name: "Lisinopril", defaultDose: "10mg", defaultFreq: "Once daily (Morning)" },
    { name: "Metformin ER", defaultDose: "500mg", defaultFreq: "Twice daily (Breakfast & Dinner)" },
    { name: "Atorvastatin", defaultDose: "20mg", defaultFreq: "Once daily (Evening)" },
    { name: "Amoxicillin", defaultDose: "500mg", defaultFreq: "Three times daily" },
    { name: "Albuterol Inhaler", defaultDose: "90mcg", defaultFreq: "Every 4 hours as needed" },
    { name: "Losartan Pot.", defaultDose: "50mg", defaultFreq: "Once daily" }
  ];

  const labRecommendations = [
    { name: "Hemoglobin A1c (HbA1c)", category: "Metabolic Panel" as const, unit: "%", ref: "4.0 - 5.6" },
    { name: "Total Cholesterol", category: "Lipid Panel" as const, unit: "mg/dL", ref: "< 200" },
    { name: "LDL Cholesterol ('Bad')", category: "Lipid Panel" as const, unit: "mg/dL", ref: "< 100" },
    { name: "Blood Glucose (Fasting)", category: "Metabolic Panel" as const, unit: "mg/dL", ref: "70 - 100" },
    { name: "Thyroid Stimulating Hormone (TSH)", category: "Metabolic Panel" as const, unit: "uIU/mL", ref: "0.45 - 4.5" }
  ];

  // BIOMETRICS SVG GRAPH RENDERING
  const limits = {
    bp: { sysMax: 130, diaMax: 85, label: "Blood Pressure", normalStr: "110-129 / 70-84 mmHg" },
    hr: { min: 60, max: 100, label: "Heart Rate", normalStr: "60 - 100 bpm" },
    bg: { min: 70, max: 140, label: "Blood Glucose", normalStr: "70 - 140 mg/dL" },
    o2: { min: 95, max: 100, label: "Oxygen Saturation", normalStr: "95 - 100%" }
  };

  const renderTrendSVG = () => {
    const dataSlice = vitals.slice(-15);
    if (dataSlice.length === 0) return null;

    const width = 600;
    const height = 220;
    const paddingLeft = 35;
    const paddingRight = 20;
    const paddingTop = 25;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    let points1: { x: number; y: number; val: number; date: string; notes?: string }[] = [];
    let points2: { x: number; y: number; val: number; date: string }[] = []; 

    let maxVal = 100;
    let minVal = 0;

    if (activeMetric === "bp") {
      const allVals = dataSlice.flatMap(v => [v.bloodPressureSystolic, v.bloodPressureDiastolic]);
      maxVal = Math.max(...allVals) + 12;
      minVal = Math.min(...allVals) - 12;
    } else if (activeMetric === "hr") {
      const hrVals = dataSlice.map(v => v.heartRate);
      maxVal = Math.max(...hrVals) + 15;
      minVal = Math.min(...hrVals) - 15;
    } else if (activeMetric === "bg") {
      const bgVals = dataSlice.map(v => v.bloodGlucose);
      maxVal = Math.max(...bgVals) + 20;
      minVal = Math.min(...bgVals) - 20;
    } else if (activeMetric === "o2") {
      const o2Vals = dataSlice.map(v => v.oxygenSaturation);
      maxVal = 101;
      minVal = 88;
    }

    const valueRange = maxVal - minVal || 1;

    dataSlice.forEach((v, i) => {
      const x = paddingLeft + (dataSlice.length > 1 ? i / (dataSlice.length - 1) : 0.5) * chartWidth;
      const formattedDate = new Date(v.timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
      
      let val1 = 0;
      if (activeMetric === "bp") val1 = v.bloodPressureSystolic;
      else if (activeMetric === "hr") val1 = v.heartRate;
      else if (activeMetric === "bg") val1 = v.bloodGlucose;
      else if (activeMetric === "o2") val1 = v.oxygenSaturation;

      const y1 = paddingTop + (1 - (val1 - minVal) / valueRange) * chartHeight;
      points1.push({ x, y: y1, val: val1, date: formattedDate, notes: v.notes });

      if (activeMetric === "bp") {
        const val2 = v.bloodPressureDiastolic;
        const y2 = paddingTop + (1 - (val2 - minVal) / valueRange) * chartHeight;
        points2.push({ x, y: y2, val: val2, date: formattedDate });
      }
    });

    const createPathD = (pts: { x: number; y: number }[]) => {
      if (pts.length === 0) return "";
      let pathString = "";
      pts.forEach((p, i) => {
        pathString += i === 0 ? `M ${p.x} ${p.y}` : ` L ${p.x} ${p.y}`;
      });
      return pathString;
    };

    // Calculate normal range band guides on the Y-axis
    let normYMin = 0;
    let normYMax = 0;
    let showBand = false;

    if (activeMetric === "hr") {
      normYMin = paddingTop + (1 - (60 - minVal) / valueRange) * chartHeight;
      normYMax = paddingTop + (1 - (100 - minVal) / valueRange) * chartHeight;
      showBand = true;
    } else if (activeMetric === "bg") {
      normYMin = paddingTop + (1 - (70 - minVal) / valueRange) * chartHeight;
      normYMax = paddingTop + (1 - (140 - minVal) / valueRange) * chartHeight;
      showBand = true;
    } else if (activeMetric === "o2") {
      normYMin = paddingTop + (1 - (95 - minVal) / valueRange) * chartHeight;
      normYMax = paddingTop + (1 - (100 - minVal) / valueRange) * chartHeight;
      showBand = true;
    } else if (activeMetric === "bp") {
      normYMin = paddingTop + (1 - (70 - minVal) / valueRange) * chartHeight;
      normYMax = paddingTop + (1 - (130 - minVal) / valueRange) * chartHeight;
      showBand = true;
    }

    const hoveredPoint = hoveredIdx !== null ? points1[hoveredIdx] : null;
    const hoveredPoint2 = hoveredIdx !== null && activeMetric === "bp" ? points2[hoveredIdx] : null;

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 bg-[#fcfbfa] rounded-2xl border border-natural-border/60 p-2 overflow-visible">
          <defs>
            <filter id="docShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.12" floodColor="#1e241f" />
            </filter>
            <linearGradient id="docGradPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#657f6d" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#657f6d" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="docGradSecondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c28b74" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#c28b74" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Reference normal range shaded band */}
          {showBand && normYMin >= paddingTop && normYMax >= paddingTop && (
            <rect 
              x={paddingLeft} 
              y={Math.min(normYMin, normYMax)} 
              width={chartWidth} 
              height={Math.abs(normYMin - normYMax)} 
              fill="#faf7f2" 
              opacity="0.9"
            />
          )}

          {/* Subtle horizontal grid markings */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + ratio * chartHeight;
            const val = Math.round(maxVal - ratio * valueRange);
            return (
              <g key={`grid_${i}`}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="#f5f2ed" 
                  strokeWidth="1" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 3} 
                  fontSize="8.5" 
                  fontWeight="bold" 
                  fill="#b0aaa0" 
                  textAnchor="end"
                  className="font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area under curve shaded fill */}
          {activeMetric !== "bp" && points1.length > 1 && (
            <path 
              d={`${createPathD(points1)} L ${points1[points1.length - 1].x} ${height - paddingBottom} L ${points1[0].x} ${height - paddingBottom} Z`}
              fill="url(#docGradPrimary)"
              opacity="0.7"
            />
          )}

          {/* Interactive vertical timeline snap cursor */}
          {hoveredPoint && (
            <line 
              x1={hoveredPoint.x} 
              y1={paddingTop} 
              x2={hoveredPoint.x} 
              y2={height - paddingBottom} 
              stroke="#657f6d" 
              strokeWidth="1.2" 
              strokeDasharray="3 2" 
            />
          )}

          {/* Render paths */}
          {points1.length > 1 && (
            <path 
              d={createPathD(points1)} 
              fill="none" 
              stroke="#657f6d" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}
          {activeMetric === "bp" && points2.length > 1 && (
            <path 
              d={createPathD(points2)} 
              fill="none" 
              stroke="#c28b74" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Hover target anchor overlay circles */}
          {points1.map((p, i) => {
            return (
              <rect
                key={`hit_${i}`}
                x={p.x - chartWidth / (points1.length * 2)}
                y={paddingTop}
                width={chartWidth / Math.max(1, points1.length - 1)}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}

          {/* Graphical points rendering */}
          {points1.map((p, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g key={`p1_${i}`} className="pointer-events-none">
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={isHovered ? "7" : "4"} 
                  fill="#657f6d" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                  filter={isHovered ? "url(#docShadow)" : ""} 
                  className="transition-all duration-150" 
                />
              </g>
            );
          })}

          {activeMetric === "bp" && points2.map((p, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g key={`p2_${i}`} className="pointer-events-none">
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={isHovered ? "7" : "4"} 
                  fill="#c28b74" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                  filter={isHovered ? "url(#docShadow)" : ""} 
                  className="transition-all duration-150" 
                />
              </g>
            );
          })}

          {/* Render dates along timeline */}
          {dataSlice.map((d, i) => {
            if (dataSlice.length > 8 && i % 2 !== 0) return null;
            const x = paddingLeft + (dataSlice.length > 1 ? i / (dataSlice.length - 1) : 0.5) * chartWidth;
            const dateStr = new Date(d.timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
            return (
              <text 
                key={`lbl_${i}`} 
                x={x} 
                y={height - paddingBottom + 16} 
                fontSize="8.5" 
                fontWeight="bold" 
                fill="#a39e93" 
                textAnchor="middle"
              >
                {dateStr}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip HUD */}
        {hoveredPoint && (
          <div 
            className="absolute z-10 bg-[#212a23] text-white p-3 rounded-xl border border-white/10 shadow-lg text-left text-[11px] space-y-1 w-48 pointer-events-none transition-all duration-150"
            style={{ 
              left: `${Math.min((hoveredPoint.x / width) * 100, 70)}%`, 
              top: `${Math.max((hoveredPoint.y / height) * 100 - 35, 10)}%` 
            }}
          >
            <div className="flex items-center justify-between text-white/50 font-bold uppercase text-[8.5px]">
              <div className="flex items-center space-x-1">
                <Clock className="h-2.5 w-2.5" />
                <span>{hoveredPoint.date}</span>
              </div>
            </div>
            
            <div className="pt-0.5 flex items-baseline space-x-1.5">
              <span className="text-sm font-black font-mono">
                {activeMetric === "bp" && hoveredPoint2 
                  ? `${hoveredPoint.val} / ${hoveredPoint2.val}` 
                  : hoveredPoint.val
                }
              </span>
              <span className="text-[9px] text-white/60 font-semibold">{limits[activeMetric].normalStr.split(" ").pop()}</span>
            </div>

            {hoveredPoint.notes && (
              <p className="text-[9px] text-white/85 border-t border-white/5 pt-1 mt-1 leading-relaxed italic">
                "{hoveredPoint.notes}"
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const latestVital: VitalReading = vitals[vitals.length - 1] || {
    id: "fallback_vit",
    patientId: "pat_1",
    timestamp: new Date().toISOString(),
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
    temperature: 98.6,
    weight: 174.5,
    bloodGlucose: 95,
    oxygenSaturation: 98,
    notes: ""
  };

  return (
    <div className="py-8 px-4 space-y-8 text-left" id="doctor-admin-portal-suite">
      
      {/* Header Panel */}
      <div className="bg-natural-forest p-6 rounded-[28px] border border-natural-sage/20 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-md relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center space-x-2 text-[#d9ad8c]">
            <CheckCircle className="h-4 w-4 text-[#d9ad8c] fill-current/10" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Active Certified Practice Environment</span>
          </div>
          <h1 className="font-serif italic font-extrabold text-2xl tracking-tight text-white">Welcome Back, Dr. Elizabeth Vance, MD</h1>
          <p className="text-xs text-natural-cream/90 font-medium">Department of Cardiology • Seattle Clinical Headquarters • Credentials Authenticated</p>
        </div>

        <div className="bg-white/10 border border-white/20 p-3 rounded-2xl flex items-center space-x-3 text-xs relative z-10">
          <Users className="h-5 w-5 text-[#d9ad8c]" />
          <div className="space-y-0.5">
            <span className="font-bold block leading-none">Active Practice Panel</span>
            <span className="text-[10px] text-natural-cream font-bold">Sarah Jenkins • EHR Record #pat_1</span>
          </div>
        </div>
      </div>

      {successBanner && (
        <div className="p-4 bg-natural-sage/20 text-natural-dark-sage border border-natural-sage/30 rounded-2xl flex items-center space-x-2.5 text-xs font-bold animate-in fade-in shadow-xs">
          <CheckCircle className="h-5 w-5 text-natural-dark-sage stroke-[2.5]" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* CORE CLINICAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: ACTIVE EHR CHART SUMMARY (Allergies, Diagnoses, Vitals Snapshot) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active Patient Profile Card */}
          <div className="bg-white border border-natural-border rounded-[28px] p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-natural-border-light">
              <div className="h-12 w-12 rounded-full bg-natural-sage/20 flex items-center justify-center font-bold text-natural-dark-sage text-base">
                SJ
              </div>
              <div className="space-y-0.5 text-xs">
                <span className="font-serif font-extrabold text-natural-dark-sage block text-base">{patient.name}</span>
                <span className="text-[10px] text-natural-muted font-bold block">DOB: {patient.dob} • Age: 38 • Female</span>
                <span className="text-[10px] bg-natural-beige text-natural-sage px-2 py-0.5 rounded-md font-bold mt-1 inline-block">Blood: {patient.bloodType}</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* Emergency Contact */}
              <div className="bg-natural-bg/45 p-3 rounded-2xl border border-natural-border-light space-y-1">
                <span className="text-[9px] font-bold text-natural-muted uppercase tracking-wider block">Clinical Emergency Contact</span>
                <div className="font-bold text-natural-dark-sage">{patient.emergencyContact.name} ({patient.emergencyContact.relationship})</div>
                <div className="text-[10px] text-natural-muted font-mono">{patient.emergencyContact.phone}</div>
              </div>

              {/* Insurance Info */}
              <div className="bg-natural-bg/45 p-3 rounded-2xl border border-natural-border-light space-y-1">
                <span className="text-[9px] font-bold text-natural-muted uppercase tracking-wider block">Verified Health Insurance</span>
                <div className="font-bold text-natural-dark-sage">{patient.insurance.provider}</div>
                <div className="text-[10px] text-natural-muted font-mono">Policy: {patient.insurance.policyNumber}</div>
              </div>
            </div>
          </div>

          {/* ACTIVE CLINICAL DIAGNOSES MANAGER */}
          <div className="bg-white border border-natural-border rounded-[28px] p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-natural-border-light pb-2">
              <span className="font-serif font-bold text-sm text-natural-dark-sage block">Active Diagnoses / Conditions</span>
              <span className="text-[9px] bg-natural-terracotta/10 text-natural-terracotta px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">ICD-10 Codified</span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {patient.conditions.map((condition, i) => (
                <div key={i} className="flex justify-between items-center bg-natural-bg/30 px-3 py-2 rounded-xl border border-natural-border-light text-xs font-bold text-natural-text">
                  <span>{condition}</span>
                  <button 
                    onClick={() => handleRemoveCondition(i)}
                    className="text-natural-terracotta/60 hover:text-natural-terracotta p-1 hover:bg-natural-terracotta/10 rounded-lg cursor-pointer transition-colors"
                    title="Remove diagnosis"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddCondition} className="flex items-center space-x-2 pt-1">
              <input 
                type="text" 
                placeholder="e.g. Hyperlipidemia" 
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                className="flex-1 px-3 py-2 bg-natural-bg border border-natural-border rounded-xl text-xs outline-none text-natural-dark-sage font-bold focus:bg-white focus:border-natural-sage transition-all"
                required
              />
              <button 
                type="submit"
                className="p-2 bg-natural-sage hover:bg-natural-dark-sage text-white rounded-xl cursor-pointer transition-all"
                title="Add Diagnosis"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
              </button>
            </form>
          </div>

          {/* ALLERGIES PORTAL CHART */}
          <div className="bg-white border border-natural-border rounded-[28px] p-5 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-natural-border-light pb-2">
              <span className="font-serif font-bold text-sm text-natural-dark-sage block">Verified Drug / Food Allergies</span>
              <span className="text-[9px] bg-natural-terracotta/20 text-natural-terracotta px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Contraindication Watch</span>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {patient.allergies.length === 0 ? (
                <div className="py-2 text-center text-xs text-natural-muted">No allergies recorded.</div>
              ) : (
                patient.allergies.map((allergy, i) => (
                  <div key={i} className="flex justify-between items-center bg-natural-terracotta/5 px-3 py-2 rounded-xl border border-natural-terracotta/15 text-xs font-bold text-natural-terracotta">
                    <span>{allergy}</span>
                    <button 
                      onClick={() => handleRemoveAllergy(i)}
                      className="text-natural-terracotta/60 hover:text-natural-terracotta p-1 hover:bg-natural-terracotta/10 rounded-lg cursor-pointer transition-colors"
                      title="Remove Allergy"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddAllergy} className="flex items-center space-x-2 pt-1">
              <input 
                type="text" 
                placeholder="e.g. Sulfa Drugs" 
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                className="flex-1 px-3 py-2 bg-natural-bg border border-natural-border rounded-xl text-xs outline-none text-natural-dark-sage font-bold focus:bg-white focus:border-natural-sage transition-all"
                required
              />
              <button 
                type="submit"
                className="p-2 bg-natural-sage hover:bg-natural-dark-sage text-white rounded-xl cursor-pointer transition-all"
                title="Add Allergy"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
              </button>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: INTERACTIVE TABBED CLINICAL WORKSPACE */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Worksheet Selection Tabs */}
          <div className="flex border-b border-natural-border pb-px overflow-x-auto gap-2">
            <button
              onClick={() => setActiveWorksheet("soap")}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
                activeWorksheet === "soap" 
                  ? "border-natural-dark-sage text-natural-dark-sage font-extrabold" 
                  : "border-transparent text-natural-muted hover:text-natural-sage"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span>Encounter SOAP Notes</span>
              </span>
            </button>

            <button
              onClick={() => setActiveWorksheet("erx")}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
                activeWorksheet === "erx" 
                  ? "border-natural-dark-sage text-natural-dark-sage font-extrabold" 
                  : "border-transparent text-natural-muted hover:text-natural-sage"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Pill className="h-3.5 w-3.5" />
                <span>eRx Script Writer</span>
              </span>
            </button>

            <button
              onClick={() => setActiveWorksheet("labs")}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
                activeWorksheet === "labs" 
                  ? "border-natural-dark-sage text-natural-dark-sage font-extrabold" 
                  : "border-transparent text-natural-muted hover:text-natural-sage"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <FlaskConical className="h-3.5 w-3.5" />
                <span>Log & Certified Labs</span>
              </span>
            </button>

            <button
              onClick={() => setActiveWorksheet("biometrics")}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
                activeWorksheet === "biometrics" 
                  ? "border-natural-dark-sage text-natural-dark-sage font-extrabold" 
                  : "border-transparent text-natural-muted hover:text-natural-sage"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Activity className="h-3.5 w-3.5" />
                <span>Biometrics Trend Analyzer</span>
              </span>
            </button>

            <button
              onClick={() => setActiveWorksheet("ai-consultant")}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
                activeWorksheet === "ai-consultant" 
                  ? "border-natural-dark-sage text-natural-dark-sage font-extrabold" 
                  : "border-transparent text-natural-muted hover:text-natural-sage"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5 text-natural-sage fill-natural-sage/10 animate-pulse" />
                <span className="text-natural-dark-sage font-extrabold">AI Clinical Consultant</span>
              </span>
            </button>
          </div>

          {/* TAB CONTENT 1: INTERACTIVE CLINICAL SOAP NOTES RECORDING */}
          {activeWorksheet === "soap" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Consultation Select Queue */}
              <div className="bg-white border border-natural-border rounded-[28px] p-5 shadow-xs space-y-3">
                <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">1. Select Appointment Encounter</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {appointments.map((appt) => (
                    <div 
                      key={appt.id}
                      onClick={() => setSelectedApptId(appt.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer text-xs text-left transition-all ${
                        selectedApptId === appt.id 
                          ? "bg-natural-beige border-natural-sage ring-2 ring-natural-sage/10" 
                          : "bg-natural-bg/25 border-natural-border-light hover:border-natural-sage hover:bg-natural-bg"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-serif font-bold text-natural-dark-sage">{appt.reason}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                          appt.status === "completed" ? "bg-natural-sage/10 text-natural-dark-sage" : "bg-[#c28b74]/15 text-[#a16d56] animate-pulse"
                        }`}>
                          {appt.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-natural-muted font-bold mt-1.5">{appt.date} • {appt.timeSlot} • ({appt.type})</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patient Pre-Visit Evaluation (Triage Data Input Pipeline) */}
              {activeAppt && activeAppt.preVisitQuestionnaire && (
                <div className="p-4 bg-natural-sage/5 border border-natural-sage/15 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-natural-dark-sage font-bold">
                    <AlertTriangle className="h-4 w-4 text-natural-sage" />
                    <span>Patient Symptom-checker Triage Logs (Imported)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 bg-white/70 p-3 rounded-xl border border-natural-border-light mt-1 text-left">
                    <div>
                      <span className="text-[9px] text-natural-muted uppercase font-bold block">Symptoms Reported</span>
                      <p className="font-bold text-natural-dark-sage">{activeAppt.preVisitQuestionnaire.symptomsChecked.join(", ") || "None specified"}</p>
                    </div>
                    <div>
                      <span className="text-[9px] text-natural-muted uppercase font-bold block">Patient Notes / Severity</span>
                      <p className="font-bold text-natural-dark-sage">Triage score: {activeAppt.preVisitQuestionnaire.severity}/10 • "{activeAppt.preVisitQuestionnaire.description}"</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SOAP Clinical Notes Editor */}
              {activeAppt ? (
                <form onSubmit={(e) => handleSaveSOAPNote(e, false)} className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-5 text-left">
                  <div className="border-b border-natural-border pb-3 flex justify-between items-center">
                    <div>
                      <span className="font-serif font-extrabold text-base text-natural-dark-sage block">Clinical SOAP Note Worksheet</span>
                      <span className="text-[10px] text-natural-muted font-bold uppercase">Encounter: {activeAppt.reason} ({activeAppt.date})</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-natural-sage/15 text-natural-sage px-2 py-1 rounded-md">HIPAA SECURE SHA-256</span>
                  </div>

                  {/* AI Dictation / Copilot Panel */}
                  <div className="bg-gradient-to-r from-natural-beige to-white border border-natural-border/70 rounded-2xl p-4.5 space-y-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2 text-natural-dark-sage">
                        <Sparkles className="h-4.5 w-4.5 text-natural-sage fill-natural-sage/10 animate-pulse" />
                        <span className="font-serif font-black text-sm">Gemini Clinical Note Copilot</span>
                      </div>
                      <span className="text-[9px] bg-natural-sage/15 text-natural-dark-sage px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">AI Dictation Suite</span>
                    </div>

                    <p className="text-[11px] text-natural-muted leading-relaxed">
                      Type a brief synopsis of your live patient encounter below or pick an interactive template. Gemini AI will automatically parse the narrative and draft structured S-O-A-P charts instantly.
                    </p>

                    <div className="space-y-2">
                      <textarea
                        value={synopsisText}
                        onChange={(e) => setSynopsisText(e.target.value)}
                        placeholder="Type clinical summary (e.g. Sarah Jenkins reports slight chest flutter after running. BP 124/82. Regular rhythm. No edema. Refilled lisinopril 10mg daily. Check back in 3 months.)"
                        rows={2}
                        className="w-full p-3 bg-white border border-natural-border rounded-xl text-xs outline-none focus:border-natural-sage focus:ring-2 focus:ring-natural-sage/10 text-natural-dark-sage resize-none"
                      />

                      {/* Quick presets row */}
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[9px] text-natural-muted font-bold uppercase">Quick Synopses:</span>
                        <button
                          type="button"
                          onClick={() => setSynopsisText("Patient Sarah reports brief flutter palpitations during exercises. No active pain. Vitals BP 124/82, HR 74. Lungs clear, normal sinus rhythm. Continue lisinopril 10mg PO daily. Return in 3 months.")}
                          className="px-2.5 py-1 bg-white border border-natural-border hover:border-natural-sage rounded-lg text-[10px] text-natural-dark-sage cursor-pointer transition-all"
                        >
                          💓 Cardio Flutter
                        </button>
                        <button
                          type="button"
                          onClick={() => setSynopsisText("Sarah reports mild tension headaches in evening and fatigue. Medication lisinopril 10mg daily is adhering. BP is 134/86, pulse 78. Advise reduced sodium intake, daily BP records. Follow up in 2 weeks.")}
                          className="px-2.5 py-1 bg-white border border-natural-border hover:border-natural-sage rounded-lg text-[10px] text-natural-dark-sage cursor-pointer transition-all"
                        >
                          ⚠️ Hypertension H/A
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 border-t border-natural-border/40">
                      {copilotError ? (
                        <span className="text-natural-terracotta text-[10px] font-bold">{copilotError}</span>
                      ) : (
                        <span className="text-natural-muted text-[10px]">Autofills Subjective, Objective, Assessment, and Plan fields.</span>
                      )}

                      <button
                        type="button"
                        onClick={handleGenerateAISoap}
                        disabled={isCopilotLoading || !synopsisText.trim()}
                        className="px-4 py-2 bg-natural-sage hover:bg-natural-dark-sage text-white font-bold text-[10px] rounded-full transition-all flex items-center space-x-1.5 shadow-sm uppercase tracking-wider cursor-pointer disabled:opacity-50"
                      >
                        {isCopilotLoading ? (
                          <>
                            <Activity className="h-3 w-3 animate-spin text-white" />
                            <span>Charting...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3 w-3" />
                            <span>Generate SOAP Draft</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-natural-text">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block font-serif">Subjective (S) - Patient History & Symptoms</label>
                      <textarea 
                        value={subjective}
                        onChange={(e) => setSubjective(e.target.value)}
                        placeholder="Patient reports occasional mild palpitations, general chest tightness post-exercise, and slight evening fatigue. Lisinopril medication adhering well."
                        rows={4}
                        className="w-full p-3 bg-natural-bg border border-natural-border rounded-xl text-xs outline-none text-natural-dark-sage font-medium focus:bg-white focus:border-natural-sage focus:ring-2 focus:ring-natural-sage/15 transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block font-serif">Objective (O) - Clinical Vitals & Lab Diagnostics</label>
                      <textarea 
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder="Vitals: BP 124/82, Pulse 74. HbA1c lab result back at 5.8%. Lipids optimal (Total Chol 185). Lungs clear, heart normal sinus rhythm."
                        rows={4}
                        className="w-full p-3 bg-natural-bg border border-natural-border rounded-xl text-xs outline-none text-natural-dark-sage font-medium focus:bg-white focus:border-natural-sage focus:ring-2 focus:ring-natural-sage/15 transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block font-serif">Assessment (A) - Physician Diagnostics & Interpretations</label>
                      <textarea 
                        value={assessment}
                        onChange={(e) => setAssessment(e.target.value)}
                        placeholder="Primary essential hypertension controlled on ACE inhibitors. Mild pre-diabetes (HbA1c 5.8%) showing favorable down-trend from 6.1% due to lifestyle improvements."
                        rows={4}
                        className="w-full p-3 bg-natural-bg border border-natural-border rounded-xl text-xs outline-none text-natural-dark-sage font-medium focus:bg-white focus:border-natural-sage focus:ring-2 focus:ring-natural-sage/15 transition-all resize-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block font-serif">Plan (P) - Therapy, Medications & Follow-up</label>
                      <textarea 
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                        placeholder="1. Continue Lisinopril 10mg daily. 2. Continue Metformin 500mg BID. 3. Monitor home daily blood pressures and sugar levels. 4. Return to clinical cardiology in 3 months."
                        rows={4}
                        className="w-full p-3 bg-natural-bg border border-natural-border rounded-xl text-xs outline-none text-natural-dark-sage font-medium focus:bg-white focus:border-natural-sage focus:ring-2 focus:ring-natural-sage/15 transition-all resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-4 border-t border-natural-border">
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-5 py-2.5 bg-natural-beige text-natural-dark-sage border border-natural-border hover:bg-natural-border-light text-xs font-bold rounded-full transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Save Draft Chart Notes
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleSaveSOAPNote(e, true)}
                      className="w-full sm:w-auto px-6 py-2.5 bg-natural-sage hover:bg-natural-dark-sage text-white text-xs font-bold rounded-full transition-all shadow-md shadow-natural-sage/10 cursor-pointer uppercase tracking-wider"
                    >
                      Certified & Sign Clinical Notes (EHR Release)
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-12 bg-white rounded-[28px] border border-natural-border text-center text-xs text-natural-muted">
                  No appointments registered in records queue to log SOAP notes for.
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT 2: ELECTRONIC PRESCRIPTION WRITER (eRx) */}
          {activeWorksheet === "erx" && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              
              {/* Prescribe Medication Form */}
              <form onSubmit={handleIssuePrescription} className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
                <div className="border-b border-natural-border pb-3">
                  <span className="font-serif font-extrabold text-base text-natural-dark-sage block">New eRx Medication Order Formulation</span>
                  <p className="text-[10px] text-natural-muted font-bold">This script will automatically screen for patient contraindications and drug allergy profiles.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1.5">Pharmaceutical Agent</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Lisinopril, Atorvastatin"
                      value={newMedName}
                      onChange={(e) => setNewMedName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-natural-bg border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold focus:bg-white focus:border-natural-sage transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1.5">Dosage Concentration</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 10mg, 500mg"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      className="w-full px-3.5 py-2 bg-natural-bg border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold focus:bg-white focus:border-natural-sage transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1.5">Administry Frequency</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Once daily, BID"
                      value={newMedFreq}
                      onChange={(e) => setNewMedFreq(e.target.value)}
                      className="w-full px-3.5 py-2 bg-natural-bg border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold focus:bg-white focus:border-natural-sage transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Common Prescriptions quick recommendation pill panels */}
                <div className="bg-natural-bg/40 p-3.5 rounded-2xl border border-natural-border-light space-y-1.5">
                  <span className="text-[9px] font-bold text-natural-muted uppercase tracking-wider block">Quick Prescribe Templates</span>
                  <div className="flex flex-wrap gap-2">
                    {medRecommendations.map((med, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewMedName(med.name);
                          setNewMedDosage(med.defaultDose);
                          setNewMedFreq(med.defaultFreq);
                        }}
                        className="px-2.5 py-1 bg-white border border-natural-border hover:border-natural-sage text-[10px] font-bold rounded-lg text-natural-dark-sage hover:bg-natural-beige transition-all cursor-pointer"
                      >
                        + {med.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1.5">Duration (Days)</label>
                    <select
                      value={newMedDuration}
                      onChange={(e) => setNewMedDuration(e.target.value)}
                      className="w-full px-3.5 py-2 bg-natural-bg border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold"
                    >
                      <option value="7">7 Days (Short Course)</option>
                      <option value="14">14 Days</option>
                      <option value="30">30 Days (Monthly)</option>
                      <option value="90">90 Days (Chronic Refill)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1.5">Authorized Refills</label>
                    <input 
                      type="number" 
                      value={newMedRefills}
                      onChange={(e) => setNewMedRefills(e.target.value)}
                      className="w-full px-3.5 py-2 bg-natural-bg border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold"
                      min="0"
                      max="12"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1.5">Transmit Pharmacy</label>
                    <select
                      value={newMedPharmacy}
                      onChange={(e) => setNewMedPharmacy(e.target.value)}
                      className="w-full px-3.5 py-2 bg-natural-bg border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold"
                    >
                      <option value="Walgreens Pharmacy #4402">Walgreens Pharmacy #4402</option>
                      <option value="CVS Pharmacy Health">CVS Pharmacy Health</option>
                      <option value="Rite Aid Specialty Seattle">Rite Aid Specialty Seattle</option>
                    </select>
                  </div>
                </div>

                {/* Patient Allergy Warnings */}
                {patient.allergies.some(a => newMedName.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(newMedName.toLowerCase())) && newMedName && (
                  <div className="p-3.5 bg-natural-terracotta/10 border border-natural-terracotta/30 text-natural-terracotta rounded-xl flex items-center space-x-2 text-xs font-bold animate-shake">
                    <AlertTriangle className="h-4.5 w-4.5 text-natural-terracotta shrink-0" />
                    <span>CONTRAINDICATION WARNING: This patient is allergic to "{patient.allergies.find(a => newMedName.toLowerCase().includes(a.toLowerCase()) || a.toLowerCase().includes(newMedName.toLowerCase()))}"! Please override with clinical safety review.</span>
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-natural-sage hover:bg-natural-dark-sage text-white font-bold text-xs rounded-full transition-colors cursor-pointer uppercase tracking-wider flex items-center justify-center space-x-2"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Submit Electronic Prescription Order (eRx)</span>
                </button>
              </form>

              {/* Patient Active Prescriptions List */}
              <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
                <span className="font-serif font-bold text-sm text-natural-dark-sage block">Active Patient Medication Inventory</span>
                <div className="divide-y divide-natural-border-light max-h-64 overflow-y-auto pr-1">
                  {prescriptions.map((rx) => (
                    <div key={rx.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs gap-2">
                      <div>
                        <div className="font-serif font-extrabold text-natural-dark-sage text-sm">{rx.medicationName} {rx.dosage}</div>
                        <div className="text-[10px] text-natural-muted font-bold">{rx.frequency} • Prescribed by {rx.doctorName}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold block text-natural-dark-sage">Refills Authorized: {rx.refillsRemaining}</span>
                        <span className="text-[9px] text-natural-muted font-medium">{rx.startDate} to {rx.endDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT 3: LAB PANEL REGISTRY & ORDER LOGS */}
          {activeWorksheet === "labs" && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              
              {/* Record Labs Form */}
              <form onSubmit={handleLogLabResult} className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
                <div className="border-b border-natural-border pb-3">
                  <span className="font-serif font-extrabold text-base text-natural-dark-sage block">Certify New Biochemical Lab Results</span>
                  <p className="text-[10px] text-natural-muted font-bold">Log blood panels, lipid ratios, metabolic indices, or pathology panels to the clinical EHR.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1.5">Lab Parameter Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Hemoglobin A1c"
                      value={newLabName}
                      onChange={(e) => setNewLabName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-natural-bg border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold focus:bg-white focus:border-natural-sage transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1.5">Panel Category</label>
                    <select
                      value={newLabCategory}
                      onChange={(e) => setNewLabCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2 bg-natural-bg border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold"
                    >
                      <option value="Metabolic Panel">Metabolic Panel</option>
                      <option value="Lipid Panel">Lipid Panel</option>
                      <option value="Blood Work">Blood Work</option>
                      <option value="Urinalysis">Urinalysis</option>
                      <option value="Imaging">Imaging Report</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1.5">Lab Test Value</label>
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="e.g. 5.8"
                      value={newLabValue}
                      onChange={(e) => setNewLabValue(e.target.value)}
                      className="w-full px-3.5 py-2 bg-natural-bg border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold focus:bg-white focus:border-natural-sage transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1.5">Measurement Unit</label>
                    <input 
                      type="text" 
                      placeholder="e.g. % or mg/dL"
                      value={newLabUnit}
                      onChange={(e) => setNewLabUnit(e.target.value)}
                      className="w-full px-3.5 py-2 bg-natural-bg border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold"
                      required
                    />
                  </div>
                </div>

                {/* Lab template panel for doctor */}
                <div className="bg-natural-bg/40 p-3.5 rounded-2xl border border-natural-border-light space-y-1.5">
                  <span className="text-[9px] font-bold text-natural-muted uppercase tracking-wider block font-bold">Common Lab Panel Templates</span>
                  <div className="flex flex-wrap gap-2">
                    {labRecommendations.map((lab, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewLabName(lab.name);
                          setNewLabCategory(lab.category);
                          setNewLabUnit(lab.unit);
                          setNewLabRange(lab.ref);
                        }}
                        className="px-2.5 py-1 bg-white border border-natural-border hover:border-natural-sage text-[10px] font-bold rounded-lg text-natural-dark-sage hover:bg-natural-beige transition-all cursor-pointer"
                      >
                        + {lab.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1.5">Standard Reference Target</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 4.0 - 5.6"
                      value={newLabRange}
                      onChange={(e) => setNewLabRange(e.target.value)}
                      className="w-full px-3.5 py-2 bg-natural-bg border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1.5">Clinical Evaluation</label>
                    <select
                      value={newLabStatus}
                      onChange={(e) => setNewLabStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2 bg-natural-bg border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold"
                    >
                      <option value="normal">Normal Range</option>
                      <option value="abnormal">Abnormal / Pathological</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block mb-1.5">Physician Clinical comments / Interpretation notes</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Excellent patient glucose regulation. Positive downward HbA1c trend."
                    value={newLabComments}
                    onChange={(e) => setNewLabComments(e.target.value)}
                    className="w-full px-3.5 py-2 bg-natural-bg border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold focus:bg-white focus:border-natural-sage transition-all"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-2.5 bg-natural-sage hover:bg-natural-dark-sage text-white font-bold text-xs rounded-full transition-colors cursor-pointer uppercase tracking-wider"
                >
                  Certify & Log Lab Panel Results to EHR
                </button>
              </form>

              {/* Lab panel listing with mini sparklines */}
              <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
                <span className="font-serif font-bold text-sm text-natural-dark-sage block">Clinical Laboratory Panel Registry</span>
                <div className="divide-y divide-natural-border-light max-h-64 overflow-y-auto pr-1">
                  {labResults.map((lab) => (
                    <div key={lab.id} className="py-3 flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3">
                      <div className="space-y-0.5">
                        <div className="font-serif font-extrabold text-natural-dark-sage text-sm">{lab.name}</div>
                        <div className="text-[10px] text-natural-muted font-bold">{lab.category} • Certified {lab.date}</div>
                        {lab.doctorComments && <div className="text-[10px] text-natural-sage font-bold mt-0.5">"{lab.doctorComments}"</div>}
                      </div>
                      
                      <div className="flex items-center space-x-6 shrink-0 text-right">
                        <div>
                          <span className={`font-mono font-bold block text-sm ${lab.status === "abnormal" ? "text-natural-terracotta" : "text-natural-sage"}`}>
                            {lab.value} {lab.unit}
                          </span>
                          <span className="text-[9px] text-natural-muted font-bold">Range: {lab.referenceRange}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT 4: FULL INTERACTIVE BIOMETRICS TRENDS ANALYZER */}
          {activeWorksheet === "biometrics" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              <div className="bg-white border border-natural-border rounded-[28px] p-5 shadow-xs space-y-4">
                
                {/* Metric toggle tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => setActiveMetric("bp")}
                    className={`p-3 rounded-2xl border transition-all text-xs text-left flex flex-col justify-between cursor-pointer ${
                      activeMetric === "bp" 
                        ? "bg-natural-dark-sage border-natural-dark-sage text-white shadow-xs" 
                        : "bg-white border-natural-border text-natural-text hover:border-natural-sage"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider block">Blood Pressure</span>
                    <span className="text-sm font-black font-mono block mt-1.5">{latestVital.bloodPressureSystolic}/{latestVital.bloodPressureDiastolic} mmHg</span>
                  </button>

                  <button
                    onClick={() => setActiveMetric("hr")}
                    className={`p-3 rounded-2xl border transition-all text-xs text-left flex flex-col justify-between cursor-pointer ${
                      activeMetric === "hr" 
                        ? "bg-natural-dark-sage border-natural-dark-sage text-white shadow-xs" 
                        : "bg-white border-natural-border text-natural-text hover:border-natural-sage"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider block">Resting Pulse</span>
                    <span className="text-sm font-black font-mono block mt-1.5">{latestVital.heartRate} bpm</span>
                  </button>

                  <button
                    onClick={() => setActiveMetric("bg")}
                    className={`p-3 rounded-2xl border transition-all text-xs text-left flex flex-col justify-between cursor-pointer ${
                      activeMetric === "bg" 
                        ? "bg-natural-dark-sage border-natural-dark-sage text-white shadow-xs" 
                        : "bg-white border-natural-border text-natural-text hover:border-natural-sage"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider block">Blood Glucose</span>
                    <span className="text-sm font-black font-mono block mt-1.5">{latestVital.bloodGlucose} mg/dL</span>
                  </button>

                  <button
                    onClick={() => setActiveMetric("o2")}
                    className={`p-3 rounded-2xl border transition-all text-xs text-left flex flex-col justify-between cursor-pointer ${
                      activeMetric === "o2" 
                        ? "bg-natural-dark-sage border-natural-dark-sage text-white shadow-xs" 
                        : "bg-white border-natural-border text-natural-text hover:border-natural-sage"
                    }`}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider block">Oxygen Sat.</span>
                    <span className="text-sm font-black font-mono block mt-1.5">{latestVital.oxygenSaturation}% O₂</span>
                  </button>
                </div>

                <div className="flex justify-between items-center border-t border-natural-border-light pt-3">
                  <span className="font-serif font-bold text-sm text-natural-dark-sage">Home Bio-Monitoring Trends (30 Days)</span>
                  <span className="text-[9px] font-mono font-bold text-natural-muted uppercase">Clinical Target: {limits[activeMetric].normalStr}</span>
                </div>

                {/* SVG Chart */}
                <div className="p-2 bg-natural-bg/30 rounded-2xl">
                  {renderTrendSVG()}
                </div>

                {/* Clinical Warnings */}
                {activeMetric === "bp" && (latestVital.bloodPressureSystolic > limits.bp.sysMax || latestVital.bloodPressureDiastolic > limits.bp.diaMax) && (
                  <div className="p-3.5 bg-natural-terracotta/10 border border-natural-terracotta/25 rounded-2xl text-xs text-natural-terracotta flex items-start space-x-2">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block uppercase tracking-wider text-[9px]">Elevated Blood Pressure Flagged</span>
                      The patient's current BP of {latestVital.bloodPressureSystolic}/{latestVital.bloodPressureDiastolic} mmHg exceeds recommended target limits. Screen for cardiovascular strain.
                    </div>
                  </div>
                )}

                {activeMetric === "bg" && latestVital.bloodGlucose > limits.bg.max && (
                  <div className="p-3.5 bg-natural-terracotta/10 border border-natural-terracotta/25 rounded-2xl text-xs text-natural-terracotta flex items-start space-x-2">
                    <AlertTriangle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block uppercase tracking-wider text-[9px]">Elevated Blood Glucose Flagged</span>
                      Current reading of {latestVital.bloodGlucose} mg/dL is elevated. Verify diabetes therapy adherence and HbA1c stability.
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB CONTENT 5: AI CLINICAL DIAGNOSTIC CONSULTANT */}
          {activeWorksheet === "ai-consultant" && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              
              {/* Header Card */}
              <div className="bg-gradient-to-r from-[#5a6b5d] to-[#455247] text-white border border-[#70827133] rounded-[28px] p-6 shadow-md space-y-3 relative overflow-hidden">
                <div className="absolute -bottom-12 -right-12 opacity-10">
                  <Sparkles className="h-32 w-32 text-[#d9ad8c]" />
                </div>
                <div className="space-y-1 relative z-10">
                  <div className="flex items-center space-x-1.5 text-[#d9ad8c]">
                    <Sparkles className="h-4.5 w-4.5 animate-pulse fill-[#d9ad8c]/20" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Active Diagnostic Intelligence Suite</span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-white block">AI Clinical Assistant & Communication Analyzer</h3>
                  <p className="text-xs text-natural-cream/90 max-w-2xl leading-relaxed">
                    Consult an AI peer trained to evaluate structured patient records (vitals, lab history, active conditions) *jointly* with qualitative communications logs (doctor-patient secure messages) to locate symptoms, identify drug-safety flags, and construct peer differential diagnoses.
                  </p>
                </div>
              </div>

              {/* Consultation Setup */}
              <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">1. Define Analysis Scope or Clinical Questions</span>
                  <p className="text-[10px] text-natural-muted">Set specific prompts or select clinical guidance templates below.</p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button 
                    type="button"
                    onClick={() => setConsultantQuery("Evaluate recent complaints of chest flutter & heart palpitations in patient messaging history, cross-reference with home heart rate readings.")}
                    className="px-2.5 py-1.5 bg-natural-beige hover:bg-natural-sage/10 text-[10px] font-bold text-natural-dark-sage rounded-xl border border-natural-border-light transition-all cursor-pointer"
                  >
                    🔍 Evaluate Chest Flutter Logs
                  </button>
                  <button 
                    type="button"
                    onClick={() => setConsultantQuery("Assess patient compliance with Metformin 500mg and Lisinopril 10mg based on secure chat logs, highlighting side-effects.")}
                    className="px-2.5 py-1.5 bg-natural-beige hover:bg-natural-sage/10 text-[10px] font-bold text-natural-dark-sage rounded-xl border border-natural-border-light transition-all cursor-pointer"
                  >
                    💊 Assess Medication Compliance
                  </button>
                  <button 
                    type="button"
                    onClick={() => setConsultantQuery("Analyze blood pressure trends alongside reported headaches to evaluate hypertensive control stability.")}
                    className="px-2.5 py-1.5 bg-natural-beige hover:bg-natural-sage/10 text-[10px] font-bold text-natural-dark-sage rounded-xl border border-natural-border-light transition-all cursor-pointer"
                  >
                    📈 Analyze BP & Headache Co-occurrence
                  </button>
                </div>

                <div className="space-y-1.5">
                  <textarea
                    rows={3}
                    placeholder="Describe specific clinical questions, drug safety requests, or diagnosis instructions for the AI Clinical Consultant... (Leave blank for a comprehensive medical chart & secure messaging analysis)"
                    value={consultantQuery}
                    onChange={(e) => setConsultantQuery(e.target.value)}
                    className="w-full p-4 bg-natural-bg/40 border border-natural-border rounded-2xl text-xs outline-none focus:bg-white focus:border-natural-sage font-medium text-natural-dark-sage leading-relaxed"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRunClinicalConsultant}
                  disabled={isConsultantLoading}
                  className="w-full py-3 bg-natural-sage hover:bg-natural-dark-sage disabled:bg-slate-300 text-white font-bold text-xs rounded-full transition-all cursor-pointer uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md shadow-natural-sage/10"
                >
                  {isConsultantLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Synthesizing EHR Metrics & Message History...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 fill-white/10" />
                      <span>Analyze EHR & Communication History</span>
                    </>
                  )}
                </button>
              </div>

              {/* Consultation Results */}
              {consultantResult && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                  
                  {/* Executive Opinion & Communications Clues */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    <div className="md:col-span-8 bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
                      <div className="flex items-center space-x-2 border-b border-natural-border-light pb-3">
                        <FileText className="h-5 w-5 text-natural-sage" />
                        <span className="font-serif font-black text-sm text-natural-dark-sage">AI Consultant peer Review opinion</span>
                      </div>
                      <p className="text-xs text-natural-text leading-relaxed whitespace-pre-wrap font-medium">
                        {consultantResult.consultantOpinion}
                      </p>
                    </div>

                    <div className="md:col-span-4 bg-[#fdf9f5] border border-[#f5ece3] rounded-[28px] p-5 shadow-xs space-y-4">
                      <div className="flex items-center space-x-1.5 text-natural-clay font-bold">
                        <TrendingUp className="h-4.5 w-4.5" />
                        <span className="text-[10px] uppercase tracking-widest font-serif block">EHR & chat warnings</span>
                      </div>
                      
                      <div className="space-y-3">
                        {consultantResult.interactionWarnings && consultantResult.interactionWarnings.length > 0 ? (
                          consultantResult.interactionWarnings.map((warn: any, idx: number) => (
                            <div key={idx} className="p-3 bg-white border border-[#f5ece3] rounded-2xl space-y-1 text-xs">
                              <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block ${
                                warn.severity === "High" ? "bg-natural-terracotta/10 text-natural-terracotta" : "bg-[#c28b74]/10 text-[#a16d56]"
                              }`}>
                                {warn.severity} {warn.type || "Contraindication"}
                              </span>
                              <p className="font-bold text-natural-dark-sage text-[11px] leading-tight mt-1">{warn.message}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 bg-white border border-[#f5ece3] rounded-2xl text-center text-xs text-natural-muted">
                            No drug-drug or drug-allergy contraindications flagged in current panel.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Differential Diagnoses list */}
                  <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-natural-border-light pb-3">
                      <span className="font-serif font-black text-sm text-natural-dark-sage block">Suggested Differential Diagnoses</span>
                      <span className="text-[9px] bg-natural-sage/10 text-natural-sage px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">ICD-10 Codified</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {consultantResult.differentialDiagnoses && consultantResult.differentialDiagnoses.map((diag: any, idx: number) => (
                        <div key={idx} className="p-4 bg-natural-bg/20 rounded-2xl border border-natural-border-light flex flex-col justify-between space-y-3.5 text-xs text-natural-text text-left">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-serif font-bold text-natural-dark-sage text-sm leading-tight">{diag.condition}</h4>
                                <span className="font-mono text-[9px] text-natural-muted font-bold block mt-0.5">ICD-10 Code: {diag.icd10Code || "N/A"}</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                                diag.probability === "High" 
                                  ? "bg-natural-terracotta/10 text-natural-terracotta" 
                                  : diag.probability === "Medium" 
                                    ? "bg-[#c28b74]/15 text-[#a16d56]" 
                                    : "bg-natural-sage/10 text-natural-dark-sage"
                              }`}>
                                {diag.probability} Prob
                              </span>
                            </div>
                            <p className="text-[11px] text-natural-muted font-medium leading-relaxed">{diag.reasoning}</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleImportCondition(`${diag.condition} (${diag.icd10Code || "ICD-10"})`)}
                            className="w-full py-2 bg-white hover:bg-natural-beige border border-natural-border-light hover:border-natural-sage text-natural-dark-sage hover:text-natural-dark-sage font-bold text-[10px] rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                          >
                            + Import to Patient Chart
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Collaborative Action Plan Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Prescriptions suggested adjustments */}
                    <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
                      <div className="border-b border-natural-border-light pb-3 flex justify-between items-center">
                        <span className="font-serif font-black text-sm text-natural-dark-sage block">AI Suggested eRx Pharmacological Steps</span>
                        <Pill className="h-4.5 w-4.5 text-[#c28b74]" />
                      </div>

                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {consultantResult.recommendedPrescriptions && consultantResult.recommendedPrescriptions.length > 0 ? (
                          consultantResult.recommendedPrescriptions.map((med: any, idx: number) => (
                            <div key={idx} className="p-3.5 bg-[#fbfbfd] border border-slate-100 rounded-2xl text-xs space-y-2 flex flex-col justify-between">
                              <div className="space-y-1">
                                <div className="font-serif font-black text-natural-dark-sage">{med.medicationName} {med.dosage}</div>
                                <div className="text-[10px] text-natural-muted font-bold">Schedule: {med.frequency}</div>
                                <p className="text-[10px] text-natural-muted font-medium mt-1">"{med.reasoning}"</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleLoadRxSuggestion(med)}
                                className="w-full py-1.5 bg-white border border-natural-border-light hover:border-natural-sage hover:bg-natural-beige text-natural-dark-sage text-[9px] font-extrabold rounded-xl uppercase tracking-wider cursor-pointer mt-1"
                              >
                                Draft eRx Script Order
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-xs text-natural-muted">No prescriptive adjustments recommended.</div>
                        )}
                      </div>
                    </div>

                    {/* Labs suggested adjustments */}
                    <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
                      <div className="border-b border-natural-border-light pb-3 flex justify-between items-center">
                        <span className="font-serif font-black text-sm text-natural-dark-sage block">AI Suggested Clinical Lab Panels</span>
                        <FlaskConical className="h-4.5 w-4.5 text-natural-sage" />
                      </div>

                      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                        {consultantResult.recommendedLabs && consultantResult.recommendedLabs.length > 0 ? (
                          consultantResult.recommendedLabs.map((lab: any, idx: number) => (
                            <div key={idx} className="p-3.5 bg-[#fbfbfd] border border-slate-100 rounded-2xl text-xs space-y-2 flex flex-col justify-between">
                              <div className="space-y-1">
                                <div className="font-serif font-black text-natural-dark-sage">{lab.testName}</div>
                                <div className="text-[9px] font-mono text-natural-sage font-extrabold uppercase bg-natural-sage/5 px-2 py-0.5 rounded-md inline-block">{lab.category || "Metabolic Panel"}</div>
                                <p className="text-[10px] text-natural-muted font-medium mt-1">"{lab.reasoning}"</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleLoadLabSuggestion(lab)}
                                className="w-full py-1.5 bg-white border border-natural-border-light hover:border-natural-sage hover:bg-natural-beige text-natural-dark-sage text-[9px] font-extrabold rounded-xl uppercase tracking-wider cursor-pointer mt-1"
                              >
                                Draft Certified Lab Order
                              </button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 text-xs text-natural-muted">No diagnostic labs suggested.</div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </div>

    </div>
  );
}
