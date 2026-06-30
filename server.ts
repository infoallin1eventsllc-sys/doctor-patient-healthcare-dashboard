import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());

// Helper to initialize GoogleGenAI lazily and safely
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Endpoint: AI Symptom Checker
app.post("/api/analyze-symptom", async (req: express.Request, res: express.Response) => {
  try {
    const { symptoms, duration, severity, additionalNotes } = req.body;

    if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
      res.status(400).json({ error: "Please select at least one symptom." });
      return;
    }

    const ai = getAiClient();
    const prompt = `
      You are an expert AI clinical triaging assistant. A patient has requested an educational assessment of their symptoms.
      
      Patient Reported Symptoms: ${symptoms.join(", ")}
      Duration: ${duration}
      Severity (1-10): ${severity}/10
      Additional Context: ${additionalNotes || "None"}
      
      Please provide a highly structured, objective, and supportive analysis containing:
      1. Potential Educational Categories: List 2-3 potential medical conditions or categories related to these symptoms (explicitly emphasize these are educational possibilities and NOT a formal diagnosis).
      2. Triage Recommendation: Advise whether they should:
         - Seek Emergency Care immediately (SOS)
         - Book a standard doctor appointment (within 24-48 hours)
         - Self-care with monitoring
      3. Questions for Doctor: 3 targeted questions they should ask their physician.
      4. General Home Self-Care Tips: Safe, practical comfort measures while waiting for their doctor.
      
      Provide your response in JSON format matching this exact schema:
      {
        "triageLevel": "EMERGENCY" | "URGENT_APPOINTMENT" | "ROUTINE_APPOINTMENT" | "SELF_CARE",
        "triageExplanation": "string",
        "educationalPossibilities": ["string"],
        "questionsForDoctor": ["string"],
        "homeCareTips": ["string"],
        "disclaimer": "string"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from AI model.");
    }

    const result = JSON.parse(responseText.trim());
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/analyze-symptom:", error);
    res.status(500).json({ 
      error: error.message || "Failed to analyze symptoms.",
      isConfigError: !process.env.GEMINI_API_KEY 
    });
  }
});

// Endpoint: AI Doctor Assistant - Generates clinical notes and care plans
app.post("/api/doctor-assistant", async (req: express.Request, res: express.Response) => {
  try {
    const { patientName, age, gender, vitals, primaryComplaint, examFindings } = req.body;

    const ai = getAiClient();
    const prompt = `
      You are an advanced clinical documentation assistant. Generate professional, structured clinical visit notes (SOAP note format) and a post-visit patient summary based on the following input:

      Patient Name: ${patientName}
      Age/Gender: ${age}yo ${gender}
      Vitals: ${JSON.stringify(vitals)}
      Primary Complaint: ${primaryComplaint}
      Exam Findings: ${examFindings || "Deferred"}

      Generate a detailed, professional assessment in JSON format matching this schema:
      {
        "soapNote": {
          "subjective": "string summary of history and symptoms",
          "objective": "string summary of vitals and physical findings",
          "assessment": "string clinical impression/differential diagnosis",
          "plan": "string detailed diagnostic and therapeutic plan"
        },
        "patientFriendlySummary": "string warm, supportive, easily readable summary of the diagnosis and next steps for the patient.",
        "recommendedPrescriptions": [
          { "medication": "string name", "dosage": "string dosage", "frequency": "string frequency", "reason": "string reason" }
        ],
        "followUpTimeframe": "string (e.g., '1 week', 'As needed')"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from AI model.");
    }

    const result = JSON.parse(responseText.trim());
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/doctor-assistant:", error);
    res.status(500).json({ 
      error: error.message || "Failed to generate clinical documentation.",
      isConfigError: !process.env.GEMINI_API_KEY 
    });
  }
});

// Endpoint: AI Clinical Consultant - Analyzes messaging history, vitals, labs, and records to help the doctor diagnose
app.post("/api/clinical-consultant", async (req: express.Request, res: express.Response) => {
  try {
    const { 
      patientName, 
      dob, 
      gender, 
      allergies, 
      conditions, 
      vitals, 
      labResults, 
      messages, 
      doctorQuery 
    } = req.body;

    const ai = getAiClient();
    const prompt = `
      You are an expert AI clinical diagnostic consultant assisting a physician.
      You will analyze the patient's full EHR, home bio-monitoring vitals, lab panels, and critically, their secure messaging logs to provide an intelligent, accurate diagnostic recommendation, drug safety warning, and next-step actions.

      PATIENT PROFILE:
      - Name: ${patientName}
      - DOB: ${dob}
      - Gender: ${gender}
      - Known Allergies: ${JSON.stringify(allergies)}
      - Current Conditions: ${JSON.stringify(conditions)}

      LATEST BIO-MONITORING VITALS (30 DAYS HISTORY):
      ${JSON.stringify(vitals)}

      CLINICAL LAB RESULTS:
      ${JSON.stringify(labResults)}

      SECURE MESSAGING HISTORY (COMMUNICATION logs between Patient and Clinic):
      ${JSON.stringify(messages)}

      DOCTOR'S CONSULTATION INQUIRY / NOTES:
      ${doctorQuery || "Provide a comprehensive wellness evaluation, drug-adherence scan, and differential diagnostic assessment."}

      INSTRUCTIONS:
      1. Carefully evaluate the Patient-Doctor messaging history. Read between the lines to catch any unreported/partially reported symptoms (e.g. chest flutter, fatigue, headache), treatment compliance clues, side effects, or emotional/social concerns.
      2. Analyze the biometric logs. For instance, are there spikes in blood pressure or blood glucose? Is heart rate showing tachycardia or arrhythmia signs?
      3. Cross-reference the allergies list to ensure absolute drug-safety. Flags any potential contraindications.
      4. Synthesize your clinical thoughts into differential diagnoses (including ICD-10 codes), laboratory test recommendations, eRx prescription suggestions, and drug safety warnings.
      5. Provide a professional, objective peer-to-peer peer review "consultantOpinion" explaining your rationale.

      Generate your diagnostic report in JSON format matching this exact schema:
      {
        "differentialDiagnoses": [
          { "condition": "string", "probability": "High" | "Medium" | "Low", "icd10Code": "string", "reasoning": "string" }
        ],
        "recommendedLabs": [
          { "testName": "string", "category": "Metabolic Panel" | "Lipid Panel" | "Blood Work" | "Urinalysis" | "Imaging", "reasoning": "string" }
        ],
        "recommendedPrescriptions": [
          { "medicationName": "string", "dosage": "string", "frequency": "string", "reasoning": "string" }
        ],
        "interactionWarnings": [
          { "severity": "High" | "Moderate", "type": "Allergy Interaction" | "Drug Interaction" | "Clinical Guard", "message": "string" }
        ],
        "consultantOpinion": "string detailed clinical evaluation and messaging analysis"
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from AI consultant model.");
    }

    const result = JSON.parse(responseText.trim());
    res.json(result);
  } catch (error: any) {
    console.error("Error in /api/clinical-consultant:", error);
    res.status(500).json({ 
      error: error.message || "Failed to generate clinical diagnostic consultation.",
      isConfigError: !process.env.GEMINI_API_KEY 
    });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
