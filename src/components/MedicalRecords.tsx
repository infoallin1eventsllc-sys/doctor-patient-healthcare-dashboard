import React, { useState, useEffect } from "react";
import { 
  FileText, 
  TrendingUp, 
  Plus, 
  Download, 
  Calendar, 
  ShieldCheck, 
  Upload, 
  Layers, 
  CheckCircle, 
  AlertCircle,
  FileSpreadsheet,
  Heart,
  Activity,
  Award,
  BookOpen,
  Check,
  AlertTriangle,
  ChevronRight,
  Info,
  BadgeAlert,
  FileUp,
  Cloud,
  LogOut,
  RefreshCw,
  ExternalLink,
  HardDrive
} from "lucide-react";
import { DashboardState, saveState } from "../data";
import { UploadedDocument, VaccineRecord, LabResult } from "../types";
import * as XLSX from "xlsx";
import { generateHealthSummaryPDF } from "../utils/pdfGenerator";
import {
  initAuth,
  googleSignIn,
  logoutWorkspace,
  createGoogleDoc,
  createGoogleSheet,
  listWorkspaceFiles,
  DriveFile
} from "../utils/googleWorkspace";
import { User } from "firebase/auth";

interface MedicalRecordsProps {
  state: DashboardState;
  onChangeState: (newState: DashboardState) => void;
}

export default function MedicalRecords({ state, onChangeState }: MedicalRecordsProps) {
  const { labResults, vaccines, documents, appointments, vitals } = state;

  const appointmentsWithSOAP = appointments.filter(a => a.soapNote);

  // Active EHR Sub-tab for the patient
  // 'labs' | 'soap' | 'careplan' | 'uploads' | 'google_workspace'
  const [activeTab, setActiveTab] = useState<'labs' | 'soap' | 'careplan' | 'uploads' | 'google_workspace'>("labs");

  // Google Workspace States
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isWorkspaceAuthRequired, setIsWorkspaceAuthRequired] = useState(true);
  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(false);
  const [workspaceFiles, setWorkspaceFiles] = useState<DriveFile[]>([]);
  const [selectedApptIdForDoc, setSelectedApptIdForDoc] = useState<string>("");
  const [isExportingDoc, setIsExportingDoc] = useState(false);
  const [isExportingSheet, setIsExportingSheet] = useState(false);

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setIsWorkspaceAuthRequired(false);
        // Load user's recent workspace files
        loadRecentWorkspaceFiles();
      },
      () => {
        setGoogleUser(null);
        setIsWorkspaceAuthRequired(true);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const loadRecentWorkspaceFiles = async () => {
    setIsWorkspaceLoading(true);
    try {
      const files = await listWorkspaceFiles();
      setWorkspaceFiles(files);
    } catch (err) {
      console.error("Failed to load workspace files:", err);
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleWorkspaceLogin = async () => {
    setIsWorkspaceLoading(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setIsWorkspaceAuthRequired(false);
        setSuccessMsg("Successfully authenticated with Google Workspace!");
        setTimeout(() => setSuccessMsg(""), 4000);
        // Fetch files
        const files = await listWorkspaceFiles();
        setWorkspaceFiles(files);
      }
    } catch (err: any) {
      console.error("Workspace Login failed:", err);
      alert(`Google Login Failed: ${err.message || err}`);
    } finally {
      setIsWorkspaceLoading(false);
    }
  };

  const handleWorkspaceLogout = async () => {
    if (window.confirm("Are you sure you want to sign out from Google Workspace?")) {
      await logoutWorkspace();
      setGoogleUser(null);
      setIsWorkspaceAuthRequired(true);
      setWorkspaceFiles([]);
      setSuccessMsg("Signed out from Google Workspace successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  const handleExportSoapNote = async (apptId: string) => {
    if (!apptId) {
      alert("Please select a completed appointment SOAP note to export.");
      return;
    }
    const appt = appointments.find(a => a.id === apptId);
    if (!appt || !appt.soapNote) {
      alert("Please select an appointment with valid SOAP notes.");
      return;
    }

    const title = `CarePulse Clinical SOAP Encounter - ${state.patient.name} (${appt.date})`;
    const content = `CAREPULSE INTEGRATED CLINICAL NETWORK
==================================================
CONFIDENTIAL CLINICAL ENCOUNTER NOTE

Visit Date: ${appt.date} (${appt.timeSlot})
Provider: Dr. ${appt.doctorName} (${appt.doctorSpecialty})
Patient Name: ${state.patient.name}
DOB: ${state.patient.dob}
Gender: ${state.patient.gender}

--------------------------------------------------
SOAP ENCOUNTER DETAIL:
--------------------------------------------------

[S] SUBJECTIVE:
${appt.soapNote.subjective}

[O] OBJECTIVE:
${appt.soapNote.objective}

[A] ASSESSMENT:
${appt.soapNote.assessment}

[P] PLAN & MANAGEMENT:
${appt.soapNote.plan}

--------------------------------------------------
CarePulse Telemedicine Network • Certified Clinical Documentation
`;

    setIsExportingDoc(true);
    try {
      const doc = await createGoogleDoc(title, content);
      setSuccessMsg(`SOAP Note successfully exported to Google Docs!`);
      setTimeout(() => setSuccessMsg(""), 5000);
      loadRecentWorkspaceFiles();
      window.open(doc.alternateLink, "_blank");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to export document: ${err.message || err}`);
    } finally {
      setIsExportingDoc(false);
    }
  };

  const handleExportFullSummaryDoc = async () => {
    const title = `EHR Clinical Health Summary - ${state.patient.name}`;
    
    // Create formatted clinical content
    let content = `CAREPULSE INTEGRATED CLINICAL NETWORK
==================================================
CONFIDENTIAL CLINICAL HEALTH SUMMARY

Generated on: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
EHR Patient ID: ${state.patient.id}
Patient Name: ${state.patient.name}
DOB: ${state.patient.dob}
Gender: ${state.patient.gender}
Blood Type: ${state.patient.bloodType}
Allergies: ${state.patient.allergies.join(", ") || "No known allergies"}
Conditions: ${state.patient.conditions.join(", ") || "No active chronic conditions"}
Medications: ${state.patient.medications.join(", ") || "No current medications"}

--------------------------------------------------
BIOMETRICS & VITAL SIGNS READINGS (LATEST):
--------------------------------------------------
`;

    vitals.slice(-5).forEach(v => {
      content += `• [${v.timestamp}] BP: ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic} mmHg | Pulse: ${v.heartRate} bpm | SpO2: ${v.oxygenSaturation}% | Temp: ${v.temperature}°F | Glucose: ${v.bloodGlucose} mg/dL\n`;
    });

    content += `
--------------------------------------------------
LATEST LABORATORY RESULTS:
--------------------------------------------------
`;
    labResults.forEach(l => {
      content += `• ${l.name} (${l.category}): ${l.value} ${l.unit} [Range: ${l.referenceRange}] - Status: ${l.status.toUpperCase()}\n`;
    });

    content += `
--------------------------------------------------
IMMUNIZATION RECORD LOG:
--------------------------------------------------
`;
    vaccines.forEach(vac => {
      content += `• [${vac.date}] ${vac.name} - Administered by: ${vac.provider}\n`;
    });

    content += `
--------------------------------------------------
CarePulse EHR System • Seattle Clinical Division • HIPAA Compliant
`;

    setIsExportingDoc(true);
    try {
      const doc = await createGoogleDoc(title, content);
      setSuccessMsg(`Patient health summary successfully exported to Google Docs!`);
      setTimeout(() => setSuccessMsg(""), 5000);
      loadRecentWorkspaceFiles();
      window.open(doc.alternateLink, "_blank");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to export summary document: ${err.message || err}`);
    } finally {
      setIsExportingDoc(false);
    }
  };

  const handleExportVitalsSheet = async () => {
    const title = `CarePulse Vitals Logs - ${state.patient.name}`;
    const headers = ["Timestamp", "Heart Rate (bpm)", "Systolic BP (mmHg)", "Diastolic BP (mmHg)", "O2 Saturation (%)", "Temp (°F)", "Glucose (mg/dL)", "Weight (lbs)"];
    const rows = vitals.map(v => [
      new Date(v.timestamp).toLocaleString(),
      v.heartRate,
      v.bloodPressureSystolic,
      v.bloodPressureDiastolic,
      v.oxygenSaturation,
      v.temperature,
      v.bloodGlucose,
      v.weight || "N/A"
    ]);

    setIsExportingSheet(true);
    try {
      const sheet = await createGoogleSheet(title, headers, rows);
      setSuccessMsg(`Vitals history successfully exported to Google Sheets!`);
      setTimeout(() => setSuccessMsg(""), 5000);
      loadRecentWorkspaceFiles();
      window.open(sheet.spreadsheetUrl, "_blank");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to export sheet: ${err.message || err}`);
    } finally {
      setIsExportingSheet(false);
    }
  };

  const handleExportLabsSheet = async () => {
    const title = `CarePulse Clinical Lab Panels - ${state.patient.name}`;
    const headers = ["Lab Name", "Category", "Date Checked", "Value", "Unit", "Reference Range", "Status", "Physician Comments"];
    const rows = labResults.map(l => [
      l.name,
      l.category,
      l.date,
      l.value,
      l.unit,
      l.referenceRange,
      l.status.toUpperCase(),
      l.doctorComments || "None"
    ]);

    setIsExportingSheet(true);
    try {
      const sheet = await createGoogleSheet(title, headers, rows);
      setSuccessMsg(`Clinical labs successfully exported to Google Sheets!`);
      setTimeout(() => setSuccessMsg(""), 5000);
      loadRecentWorkspaceFiles();
      window.open(sheet.spreadsheetUrl, "_blank");
    } catch (err: any) {
      console.error(err);
      alert(`Failed to export sheet: ${err.message || err}`);
    } finally {
      setIsExportingSheet(false);
    }
  };

  useEffect(() => {
    if (appointmentsWithSOAP.length > 0 && !selectedApptIdForDoc) {
      setSelectedApptIdForDoc(appointmentsWithSOAP[0].id);
    }
  }, [appointmentsWithSOAP]);

  const [successMsg, setSuccessMsg] = useState("");
  const [showLabsImportGuide, setShowLabsImportGuide] = useState(false);
  const [showVacImportGuide, setShowVacImportGuide] = useState(false);

  const exportLabsToExcel = () => {
    try {
      const dataToExport = labResults.map(lab => ({
        "Lab ID": lab.id,
        "Lab Name": lab.name,
        "Category": lab.category,
        "Date Checked": lab.date,
        "Value": lab.value,
        "Reference Range": lab.referenceRange,
        "Measurement Unit": lab.unit,
        "Status": lab.status.toUpperCase(),
        "Doctor Comments": lab.doctorComments || ""
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      ws["!cols"] = [
        { wch: 15 }, // ID
        { wch: 25 }, // Name
        { wch: 20 }, // Category
        { wch: 15 }, // Date
        { wch: 12 }, // Value
        { wch: 18 }, // Ref
        { wch: 12 }, // Unit
        { wch: 12 }, // Status
        { wch: 35 }  // Comments
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laboratory Panels");
      XLSX.writeFile(wb, "CarePulse_Laboratory_Panels.xlsx");
      setSuccessMsg("Laboratory records successfully exported to Excel!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to export laboratory results.");
    }
  };

  const exportVaccinesToExcel = () => {
    try {
      const dataToExport = vaccines.map(vac => ({
        "ID": vac.id,
        "Vaccine Name": vac.name,
        "Date Administered": vac.date,
        "Clinic Provider": vac.provider,
        "Notes": vac.notes || ""
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      ws["!cols"] = [
        { wch: 15 }, // ID
        { wch: 25 }, // Name
        { wch: 18 }, // Date
        { wch: 25 }, // Provider
        { wch: 30 }  // Notes
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Immunization Record");
      XLSX.writeFile(wb, "CarePulse_Immunization_Registry.xlsx");
      setSuccessMsg("Immunization record successfully exported to Excel!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to export vaccines.");
    }
  };

  const downloadLabsTemplate = () => {
    const sampleData = [
      {
        "Lab ID": "lab_sample_01",
        "Lab Name": "HbA1c Blood Test",
        "Category": "Blood Work",
        "Date Checked": "2026-06-25",
        "Value": 5.7,
        "Reference Range": "4.0 - 5.6",
        "Measurement Unit": "%",
        "Status": "normal",
        "Comments": "Target range maintained."
      },
      {
        "Lab ID": "lab_sample_02",
        "Lab Name": "Total Cholesterol",
        "Category": "Lipid Panel",
        "Date Checked": "2026-06-25",
        "Value": 210,
        "Reference Range": "< 200",
        "Measurement Unit": "mg/dL",
        "Status": "abnormal",
        "Comments": "Slightly elevated. Increase exercise."
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lab Template");
    XLSX.writeFile(wb, "CarePulse_Lab_Import_Template.xlsx");
  };

  const downloadVaccinesTemplate = () => {
    const sampleData = [
      {
        "ID": "vac_sample_01",
        "Vaccine Name": "Covid-19 Booster (Moderna)",
        "Date Administered": "2026-05-15",
        "Clinic Provider": "CVS Pharmacy #1902",
        "Notes": "Annual booster injection."
      },
      {
        "ID": "vac_sample_02",
        "Vaccine Name": "Influenza Quadrivalent",
        "Date Administered": "2025-10-10",
        "Clinic Provider": "CarePulse Primary Clinic",
        "Notes": "Seasonal flu immunization."
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vaccine Template");
    XLSX.writeFile(wb, "CarePulse_Vaccine_Import_Template.xlsx");
  };

  const handleLabsExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (!json || json.length === 0) {
          alert("Spreadsheet is empty.");
          return;
        }

        const newLabs: LabResult[] = json.map((row, idx) => {
          const val = parseFloat(row["Value"] || row["value"] || "0");
          return {
            id: row["Lab ID"] || row["id"] || `lab_${Date.now()}_${idx}`,
            name: row["Lab Name"] || row["name"] || "Unspecified Marker",
            category: row["Category"] || row["category"] || "Blood Work",
            date: row["Date Checked"] || row["date"] || new Date().toISOString().split('T')[0],
            value: isNaN(val) ? 0 : val,
            referenceRange: row["Reference Range"] || row["referenceRange"] || "Normal",
            unit: row["Measurement Unit"] || row["unit"] || "",
            status: (row["Status"] || row["status"] || "normal").toString().toLowerCase().trim() === "abnormal" ? "abnormal" : "normal",
            doctorComments: row["Comments"] || row["doctorComments"] || "Parsed via CarePulse Spreadsheet Engine",
            history: [{ date: row["Date Checked"] || row["date"] || new Date().toISOString().split('T')[0], value: isNaN(val) ? 0 : val }]
          };
        });

        const updatedState = {
          ...state,
          labResults: [...newLabs, ...state.labResults],
          notifications: [
            {
              id: `not_lab_import_${Date.now()}`,
              type: "lab" as const,
              title: "Laboratory Results Imported",
              body: `Successfully parsed and loaded ${newLabs.length} lab records from your worksheet.`,
              timestamp: new Date().toISOString(),
              read: false
            },
            ...state.notifications
          ]
        };

        onChangeState(updatedState);
        saveState(updatedState);
        setSuccessMsg(`Successfully imported ${newLabs.length} laboratory record(s) from Excel!`);
        setTimeout(() => setSuccessMsg(""), 5000);
      } catch (err) {
        console.error(err);
        alert("Failed to parse lab spreadsheet. Verify header layout matches template.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleVaccinesExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (!json || json.length === 0) {
          alert("Spreadsheet is empty.");
          return;
        }

        const newVaccines: VaccineRecord[] = json.map((row, idx) => ({
          id: row["ID"] || row["id"] || `vac_${Date.now()}_${idx}`,
          name: row["Vaccine Name"] || row["name"] || "Unknown Vaccine",
          date: row["Date Administered"] || row["date"] || new Date().toISOString().split('T')[0],
          provider: row["Clinic Provider"] || row["provider"] || "Imported Clinical Partner",
          notes: row["Notes"] || row["notes"] || "Imported via Excel"
        }));

        const updatedState = {
          ...state,
          vaccines: [...newVaccines, ...state.vaccines],
          notifications: [
            {
              id: `not_vac_import_${Date.now()}`,
              type: "lab" as const,
              title: "Immunizations Imported from Excel",
              body: `Successfully parsed and loaded ${newVaccines.length} vaccine records from your worksheet.`,
              timestamp: new Date().toISOString(),
              read: false
            },
            ...state.notifications
          ]
        };

        onChangeState(updatedState);
        saveState(updatedState);
        setSuccessMsg(`Successfully imported ${newVaccines.length} vaccine record(s) from Excel!`);
        setTimeout(() => setSuccessMsg(""), 5000);
      } catch (err) {
        console.error(err);
        alert("Failed to parse vaccine spreadsheet. Verify header layout matches template.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };
  
  const [filterType, setFilterType] = useState<string>("All");
  const [selectedLab, setSelectedLab] = useState<typeof labResults[0] | null>(null);

  // Document Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<UploadedDocument | null>(null);
  const [tagSelection, setTagSelection] = useState<'prescription' | 'lab result' | 'scan' | 'other'>("scan");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const documentCategories = ["All", "prescription", "lab result", "scan", "other"];

  const filteredDocuments = documents.filter((doc) => {
    return filterType === "All" || doc.category === filterType;
  });

  // DRAG & DROP FILE HANDLERS
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    // Validate file type
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Unsupported format. Please upload PDF, JPG, or PNG files only.");
      return;
    }

    // Size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File exceeds 10 MB limit.");
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);
    setUploadProgress(10);

    // Simulate progress increments
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        return prev + 25;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(timer);
      setUploadProgress(100);

      const sizeStr = (file.size / (1024 * 1024)).toFixed(1) + " MB";
      const newDoc: UploadedDocument = {
        id: `doc_file_${Date.now()}`,
        name: file.name,
        type: file.type.split("/")[1] as any,
        size: sizeStr,
        uploadDate: new Date().toISOString().split("T")[0],
        category: tagSelection,
        doctorName: "Self Uploaded"
      };

      const updatedState = {
        ...state,
        documents: [newDoc, ...state.documents]
      };

      onChangeState(updatedState);
      saveState(updatedState);

      setIsUploading(false);
      setUploadSuccess(newDoc);
    }, 1200);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Latest clinical biometrics
  const latestVital = vitals[vitals.length - 1] || {
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
    bloodGlucose: 95
  };

  const latestA1c = labResults.find(l => l.name.toLowerCase().includes("a1c"))?.value || 5.8;

  // Glossary dictionary
  const clinicalGlossary = [
    { term: "Subjective (S)", desc: "Your personal report of symptoms, history, feelings, and lifestyle details reported to the doctor during the visit." },
    { term: "Objective (O)", desc: "Quantifiable medical findings measured by clinical staff: vitals (BP, heart rate), physical exam details, and active lab panel results." },
    { term: "Assessment (A)", desc: "The physician's official diagnostics, interpretations, progress reviews, and clinical severity reasoning." },
    { term: "Plan (P)", desc: "The continuous treatment path: prescribed medications, follow-up timelines, dietary guidelines, and therapy targets." },
    { term: "BID", desc: "Twice daily (frequently used for diabetic/hypertension medication scheduling)." },
    { term: "PRN", desc: "As needed (e.g. taking chronic inhalers or pain relief strictly based on immediate symptoms)." }
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-left" id="medical-records-portal">
      
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-natural-border-light pb-5 text-left">
        <div className="space-y-1 max-w-xl">
          <h1 className="font-serif font-extrabold text-xl text-natural-dark-sage tracking-tight">Certified Medical Records Suite</h1>
          <p className="text-xs text-natural-muted">Access structured lab reports, immunization certificates, physician SOAP encounter notes, and custom patient care targets.</p>
        </div>
        <button
          onClick={() => {
            generateHealthSummaryPDF(state);
            setSuccessMsg("Certified Patient Health Summary PDF report generated and downloaded successfully!");
            setTimeout(() => setSuccessMsg(""), 6000);
          }}
          className="px-4.5 py-2.5 bg-natural-sage hover:bg-natural-dark-sage text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-md shadow-natural-sage/10 transition-all cursor-pointer shrink-0"
        >
          <FileText className="h-4 w-4" />
          <span>Download PDF Summary</span>
        </button>
      </div>

      {/* Primary Navigation Sub-Tabs */}
      <div className="flex border-b border-natural-border pb-px overflow-x-auto gap-2 mb-6 scrollbar-none">
        <button
          onClick={() => setActiveTab("labs")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "labs" 
              ? "border-natural-dark-sage text-natural-dark-sage font-extrabold" 
              : "border-transparent text-natural-muted hover:text-natural-sage"
          }`}
        >
          <span className="flex items-center space-x-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Labs & Vaccinations</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab("soap")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "soap" 
              ? "border-natural-dark-sage text-natural-dark-sage font-extrabold" 
              : "border-transparent text-natural-muted hover:text-natural-sage"
          }`}
        >
          <span className="flex items-center space-x-1.5">
            <FileText className="h-3.5 w-3.5" />
            <span>Clinical SOAP Notes</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab("careplan")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "careplan" 
              ? "border-natural-dark-sage text-natural-dark-sage font-extrabold" 
              : "border-transparent text-natural-muted hover:text-natural-sage"
          }`}
        >
          <span className="flex items-center space-x-1.5">
            <Heart className="h-3.5 w-3.5" />
            <span>Care Plan & Targets</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab("uploads")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "uploads" 
              ? "border-natural-dark-sage text-natural-dark-sage font-extrabold" 
              : "border-transparent text-natural-muted hover:text-natural-sage"
          }`}
        >
          <span className="flex items-center space-x-1.5">
            <Upload className="h-3.5 w-3.5" />
            <span>External Document Uploads</span>
          </span>
        </button>

        <button
          onClick={() => setActiveTab("google_workspace")}
          className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
            activeTab === "google_workspace" 
              ? "border-natural-dark-sage text-natural-dark-sage font-extrabold" 
              : "border-transparent text-natural-muted hover:text-natural-sage"
          }`}
        >
          <span className="flex items-center space-x-1.5">
            <Cloud className="h-3.5 w-3.5" />
            <span>Google Workspace</span>
          </span>
        </button>
      </div>

      {successMsg && (
        <div className="mb-6 p-3.5 bg-natural-sage/20 text-natural-dark-sage border border-natural-sage/30 rounded-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in">
          <CheckCircle className="h-4.5 w-4.5 text-natural-sage shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* TAB CONTENT: LABS & VACCINATIONS */}
      {activeTab === "labs" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
          <div className="lg:col-span-7 space-y-6">
            
            {/* LAB RESULTS */}
            <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-natural-border-light pb-3 mb-2">
                <div>
                  <span className="font-serif text-sm font-bold text-natural-dark-sage block">Released Lab Panel Results</span>
                  <p className="text-[10px] text-natural-muted font-bold">Import or export clinical panels via standard spreadsheets.</p>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={exportLabsToExcel}
                    className="p-1.5 bg-natural-sage/10 hover:bg-natural-sage/20 text-natural-dark-sage rounded-xl transition-all cursor-pointer border border-natural-sage/20"
                    title="Export laboratory panels to Excel"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                  </button>

                  <label className="p-1.5 bg-white hover:bg-natural-beige border border-natural-border text-natural-dark-sage rounded-xl transition-all cursor-pointer flex items-center justify-center">
                    <Upload className="h-3.5 w-3.5 animate-pulse" />
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleLabsExcelImport}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => setShowLabsImportGuide(!showLabsImportGuide)}
                    className="p-1.5 bg-white hover:bg-natural-beige border border-natural-border text-natural-muted hover:text-natural-dark-sage rounded-xl transition-all cursor-pointer"
                    title="Spreadsheet templates & format guidelines"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* EXPANDABLE SPREADSHEET IMPORT GUIDE FOR LABS */}
              {showLabsImportGuide && (
                <div className="p-3 bg-natural-beige/40 rounded-xl border border-natural-border-light text-[11px] text-natural-text text-left space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center">
                    <span className="font-serif font-black text-[11px] text-natural-dark-sage">Lab Results Import Layout</span>
                    <button
                      onClick={downloadLabsTemplate}
                      className="px-2 py-0.5 bg-natural-sage text-white rounded text-[9px] font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Download className="h-2.5 w-2.5" />
                      <span>Template</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-natural-muted font-semibold leading-normal">
                    Format columns: <span className="font-mono text-natural-dark-sage">Lab ID, Lab Name, Category, Date Checked, Value, Reference Range, Measurement Unit, Status, Comments</span>
                  </p>
                </div>
              )}
              
              <div className="divide-y divide-natural-border-light max-h-72 overflow-y-auto pr-1">
                {labResults.map((lab) => (
                  <div 
                    key={lab.id} 
                    onClick={() => setSelectedLab(lab)}
                    className={`py-3 flex justify-between items-center cursor-pointer hover:bg-natural-beige px-2.5 rounded-xl transition-all ${
                      selectedLab?.id === lab.id ? "bg-natural-beige" : ""
                    }`}
                  >
                    <div className="space-y-0.5 text-xs text-natural-text">
                      <span className="font-serif font-bold text-natural-dark-sage block">{lab.name}</span>
                      <span className="text-[10px] text-natural-muted block">{lab.category} — {lab.date}</span>
                    </div>

                    <div className="text-right text-xs">
                      <span className={`font-mono font-bold block ${lab.status === "abnormal" ? "text-natural-terracotta" : "text-natural-sage"}`}>
                        {lab.value} {lab.unit}
                      </span>
                      <span className="text-[9px] text-natural-muted font-bold">Ref: {lab.referenceRange}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* IMMUNIZATION REGISTRY */}
            <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-3.5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-natural-border-light pb-2.5 mb-2">
                <div>
                  <span className="font-serif text-sm font-bold text-natural-dark-sage block">Immunization & Vaccine Registry</span>
                  <p className="text-[10px] text-natural-muted font-bold">Import or export vaccine passports and logs.</p>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={exportVaccinesToExcel}
                    className="p-1.5 bg-natural-sage/10 hover:bg-natural-sage/20 text-natural-dark-sage rounded-xl transition-all cursor-pointer border border-natural-sage/20"
                    title="Export vaccination record to Excel"
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" />
                  </button>

                  <label className="p-1.5 bg-white hover:bg-natural-beige border border-natural-border text-natural-dark-sage rounded-xl transition-all cursor-pointer flex items-center justify-center">
                    <Upload className="h-3.5 w-3.5 animate-pulse" />
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleVaccinesExcelImport}
                      className="hidden"
                    />
                  </label>

                  <button
                    onClick={() => setShowVacImportGuide(!showVacImportGuide)}
                    className="p-1.5 bg-white hover:bg-natural-beige border border-natural-border text-natural-muted hover:text-natural-dark-sage rounded-xl transition-all cursor-pointer"
                    title="Vaccines spreadsheet templates & guidelines"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* EXPANDABLE SPREADSHEET IMPORT GUIDE FOR VACCINES */}
              {showVacImportGuide && (
                <div className="p-3 bg-natural-beige/40 rounded-xl border border-natural-border-light text-[11px] text-natural-text text-left space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex justify-between items-center">
                    <span className="font-serif font-black text-[11px] text-natural-dark-sage">Vaccine Records Import Layout</span>
                    <button
                      onClick={downloadVaccinesTemplate}
                      className="px-2 py-0.5 bg-natural-sage text-white rounded text-[9px] font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Download className="h-2.5 w-2.5" />
                      <span>Template</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-natural-muted font-semibold leading-normal">
                    Format columns: <span className="font-mono text-natural-dark-sage">ID, Vaccine Name, Date Administered, Clinic Provider, Notes</span>
                  </p>
                </div>
              )}

              <div className="divide-y divide-natural-border-light">
                {vaccines.map((vac) => (
                  <div key={vac.id} className="py-2.5 flex justify-between items-start text-xs text-natural-text">
                    <div className="space-y-0.5 text-left">
                      <span className="font-serif font-bold text-natural-dark-sage block">{vac.name}</span>
                      <span className="text-[10px] text-natural-muted block">Administered by {vac.provider}</span>
                    </div>
                    <span className="font-mono text-[10px] text-natural-muted font-semibold">{vac.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            {/* LAB RESULT DETAILS OR TIP CARD */}
            {selectedLab ? (
              <div className="bg-natural-beige border border-natural-border rounded-[28px] p-5 space-y-4 animate-in slide-in-from-bottom-2 text-left sticky top-4">
                <div className="flex justify-between items-center border-b border-natural-border-light pb-2.5">
                  <div>
                    <span className="font-serif text-sm font-bold text-natural-dark-sage block">{selectedLab.name} Details</span>
                    <span className="text-[9px] text-natural-muted uppercase font-bold tracking-widest">{selectedLab.category}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedLab(null)}
                    className="text-[9px] text-natural-muted hover:text-natural-dark-sage font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Close Detail
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-natural-border-light">
                    <span className="text-[9px] text-natural-muted block font-bold uppercase tracking-wider">Encounter Value</span>
                    <span className={`text-sm font-black font-mono block mt-0.5 ${selectedLab.status === "abnormal" ? "text-natural-terracotta" : "text-natural-sage"}`}>
                      {selectedLab.value} {selectedLab.unit}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-natural-border-light">
                    <span className="text-[9px] text-natural-muted block font-bold uppercase tracking-wider">Standard Target</span>
                    <span className="text-sm font-black font-mono text-natural-dark-sage block mt-0.5">{selectedLab.referenceRange}</span>
                  </div>
                </div>

                {selectedLab.doctorComments && (
                  <div className="bg-white p-3.5 border border-natural-border-light rounded-xl space-y-1 text-xs">
                    <span className="font-serif font-bold text-natural-dark-sage block">Physician Interpretation:</span>
                    <p className="text-natural-text leading-relaxed text-[11px]">"{selectedLab.doctorComments}"</p>
                  </div>
                )}

                {/* Historical Testing Trend Bar Chart */}
                <div className="bg-white p-3.5 border border-natural-border-light rounded-xl space-y-2">
                  <span className="text-[9px] font-bold text-natural-muted uppercase tracking-wider block">Historical Diagnostic Trend</span>
                  <div className="flex justify-between items-end h-16 pt-2 px-4 border-b border-natural-border-light">
                    {selectedLab.history.map((h, i) => {
                      const maxVal = Math.max(...selectedLab.history.map(pt => pt.value));
                      const minVal = Math.min(...selectedLab.history.map(pt => pt.value)) - 0.5;
                      const hRange = maxVal - minVal || 1;
                      const barHeight = ((h.value - minVal) / hRange) * 100;
                      return (
                        <div key={i} className="flex flex-col items-center flex-1 group/bar relative">
                          <div 
                            style={{ height: `${Math.max(15, barHeight)}%` }}
                            className={`w-4 rounded-t-sm transition-all ${selectedLab.status === "abnormal" ? "bg-natural-terracotta/60 group-hover/bar:bg-natural-terracotta" : "bg-natural-sage/60 group-hover/bar:bg-natural-sage"}`}
                          />
                          <span className="text-[8px] font-mono text-natural-muted mt-1">{h.date.split("-")[1]}/{h.date.split("-")[0].slice(2)}</span>
                          <div className="absolute bottom-full mb-1 opacity-0 group-hover/bar:opacity-100 bg-natural-dark-sage text-white text-[8px] font-mono px-1.5 py-0.5 rounded transition-opacity pointer-events-none z-10">
                            {h.value}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-natural-beige/35 border border-dashed border-natural-border rounded-[28px] p-6 text-center text-xs text-natural-muted space-y-2.5">
                <Info className="h-5 w-5 text-natural-sage mx-auto" />
                <span className="font-serif font-bold text-natural-dark-sage block text-sm">EHR Health Tip</span>
                <p className="leading-relaxed">Click any lab result on the left to review certified reference ranges, historical timeline trend chart, and doctor Vance's clinical interpretation notes.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: CLINICAL SOAP ENCOUNTER NOTES */}
      {activeTab === "soap" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
          
          {/* Main SOAP History */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
              <div className="flex justify-between items-center border-b border-natural-border-light pb-2.5">
                <div>
                  <span className="font-serif text-sm font-bold text-natural-dark-sage block">Released Consultation Clinical Notes</span>
                  <span className="text-[10px] text-natural-muted font-bold block uppercase mt-0.5">HIPAA Compliant OpenNotes Release</span>
                </div>
                <span className="text-[9px] font-mono bg-natural-sage/10 text-natural-dark-sage px-2 py-0.5 rounded font-extrabold">256-BIT CRYPTO</span>
              </div>

              {appointmentsWithSOAP.length === 0 ? (
                <div className="text-center py-12 text-natural-muted text-xs">
                  No signed clinician SOAP notes released yet. Once Dr. Vance updates your chart in the provider suite, your formal records will render here immediately.
                </div>
              ) : (
                <div className="space-y-6">
                  {appointmentsWithSOAP.map((appt) => (
                    <div key={appt.id} className="border border-natural-border-light rounded-2xl overflow-hidden shadow-xs">
                      
                      {/* Doctor Heading */}
                      <div className="bg-natural-beige/40 px-4 py-3 border-b border-natural-border-light flex justify-between items-center">
                        <div className="flex items-center space-x-2.5">
                          <img 
                            src={appt.doctorAvatar} 
                            alt={appt.doctorName} 
                            className="h-8 w-8 rounded-full border border-natural-border"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-serif font-extrabold text-xs text-natural-dark-sage block">{appt.doctorName}</span>
                            <span className="text-[9px] text-natural-muted font-bold block uppercase">{appt.doctorSpecialty}</span>
                          </div>
                        </div>
                        <div className="text-right text-xs">
                          <span className="font-bold text-natural-dark-sage block">{appt.date}</span>
                          <span className="text-[9px] text-natural-muted block font-bold">{appt.timeSlot} • {appt.type === "video" ? "Telehealth" : "Clinic visit"}</span>
                        </div>
                      </div>

                      {/* Diagnostic Summary */}
                      <div className="p-4 space-y-4 text-xs text-natural-text text-left">
                        <div className="bg-natural-sage/5 p-3 rounded-xl border border-natural-sage/10 text-xs">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-natural-muted">Primary Consultation Reason</span>
                          <p className="font-serif font-extrabold text-natural-dark-sage text-xs">{appt.reason}</p>
                        </div>

                        {/* SOAP Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1 bg-natural-bg/25 p-3 rounded-xl border border-natural-border-light">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-natural-muted block">Subjective (S)</span>
                            <p className="italic text-natural-dark-sage font-medium leading-relaxed">"{appt.soapNote?.subjective}"</p>
                          </div>

                          <div className="space-y-1 bg-natural-bg/25 p-3 rounded-xl border border-natural-border-light">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-natural-muted block">Objective (O)</span>
                            <p className="text-natural-dark-sage font-medium leading-relaxed">{appt.soapNote?.objective}</p>
                          </div>

                          <div className="space-y-1 bg-natural-bg/25 p-3 rounded-xl border border-natural-border-light">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-natural-muted block">Assessment (A)</span>
                            <p className="font-bold text-natural-dark-sage leading-relaxed">{appt.soapNote?.assessment}</p>
                          </div>

                          <div className="space-y-1 bg-natural-sage/10 p-3 rounded-xl border border-natural-sage/15">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-natural-dark-sage block">Plan & Treatment Path (P)</span>
                            <p className="font-bold text-natural-dark-sage leading-relaxed">{appt.soapNote?.plan}</p>
                          </div>
                        </div>

                        {/* Signatures */}
                        <div className="flex justify-between items-center pt-3 border-t border-natural-border-light text-[10px] text-natural-muted font-bold">
                          <span className="flex items-center space-x-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-natural-sage" />
                            <span>Signed Electronically by {appt.doctorName}</span>
                          </span>
                          <span>NPI Verified: Approved</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Clinical Dictionary Explanations */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-natural-beige border border-natural-border rounded-[28px] p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-natural-dark-sage border-b border-natural-border-light pb-2">
                <BookOpen className="h-4.5 w-4.5 text-natural-sage" />
                <span className="font-serif font-bold text-xs">OpenNotes Glossary</span>
              </div>
              <p className="text-[11px] text-natural-text leading-relaxed">Modern federal rules mandate immediate patient access to clinic logs. Here's a brief lookup to assist your interpretation of standard physician phrasing:</p>
              
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {clinicalGlossary.map((g, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-xl border border-natural-border-light text-[10px]">
                    <span className="font-bold text-natural-dark-sage block">{g.term}</span>
                    <span className="text-natural-muted mt-0.5 block font-medium leading-relaxed">{g.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: CARE PLAN & HEALTH TARGETS */}
      {activeTab === "careplan" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Panel */}
          <div className="bg-natural-sage/10 p-5 rounded-[28px] border border-natural-sage/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1 text-left">
              <span className="text-[9px] bg-natural-sage/20 text-natural-dark-sage px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Dynamic Disease Management</span>
              <h2 className="font-serif font-extrabold text-sm text-natural-dark-sage">Personalized Chronic Care Goals</h2>
              <p className="text-[10px] text-natural-muted font-bold">Synchronized in real-time with your continuous home biometric uploads and lab results.</p>
            </div>
            
            <button
              onClick={() => {
                generateHealthSummaryPDF(state);
                setSuccessMsg("Certified Health Summary and Care Plan PDF report generated and downloaded successfully!");
                setTimeout(() => setSuccessMsg(""), 6000);
              }}
              className="px-4 py-2 bg-natural-sage hover:bg-natural-dark-sage text-white text-[10px] font-bold rounded-full flex items-center space-x-1.5 shadow-sm transition-all uppercase tracking-wider cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export Care Plan (PDF)</span>
            </button>
          </div>

          {/* Goals Matrix Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            
            {/* Goal 1: Blood Pressure */}
            <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] bg-natural-sage/10 text-natural-dark-sage px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Cardiovascular</span>
                  <span className="text-[10px] font-bold text-natural-sage flex items-center space-x-1">
                    <CheckCircle className="h-3.5 w-3.5 text-natural-sage fill-current/5" />
                    <span>Controlled</span>
                  </span>
                </div>
                <span className="font-serif font-extrabold text-sm text-natural-dark-sage block pt-1">Blood Pressure Management</span>
                <p className="text-[10px] text-natural-muted leading-relaxed">Prescribed Lisinopril therapy to prevent target organ damage and hypertensive cardiac remodeling.</p>
              </div>

              <div className="bg-natural-bg/40 p-3.5 rounded-xl border border-natural-border-light flex justify-between items-center">
                <div className="text-xs">
                  <span className="text-[9px] text-natural-muted uppercase font-bold block">EHR Clinical Target</span>
                  <span className="font-mono font-bold text-natural-dark-sage">&lt; 130 / 80 mmHg</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-[9px] text-natural-muted uppercase font-bold block">Latest home check</span>
                  <span className="font-mono font-black text-natural-sage">{latestVital.bloodPressureSystolic} / {latestVital.bloodPressureDiastolic}</span>
                </div>
              </div>

              <div className="w-full bg-natural-beige h-1.5 rounded-full overflow-hidden">
                <div className="bg-natural-sage h-full w-[94%]" />
              </div>
            </div>

            {/* Goal 2: Blood Glucose */}
            <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] bg-natural-sage/10 text-natural-dark-sage px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Metabolic Panel</span>
                  <span className="text-[10px] font-bold text-natural-sage flex items-center space-x-1">
                    <CheckCircle className="h-3.5 w-3.5 text-natural-sage fill-current/5" />
                    <span>Optimal Range</span>
                  </span>
                </div>
                <span className="font-serif font-extrabold text-sm text-natural-dark-sage block pt-1">Glycemic HbA1c Target</span>
                <p className="text-[10px] text-natural-muted leading-relaxed">Managing mild Type 2 diabetes through twice-daily Metformin and strict glycemic diet plan.</p>
              </div>

              <div className="bg-natural-bg/40 p-3.5 rounded-xl border border-natural-border-light flex justify-between items-center">
                <div className="text-xs">
                  <span className="text-[9px] text-natural-muted uppercase font-bold block">EHR Clinical Target</span>
                  <span className="font-mono font-bold text-natural-dark-sage">&lt; 6.0 % (HbA1c)</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-[9px] text-natural-muted uppercase font-bold block">Certified Lab Result</span>
                  <span className="font-mono font-black text-natural-sage">{latestA1c}%</span>
                </div>
              </div>

              <div className="w-full bg-natural-beige h-1.5 rounded-full overflow-hidden">
                <div className="bg-natural-sage h-full w-[96%]" />
              </div>
            </div>

            {/* Goal 3: Medication Compliance */}
            <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] bg-natural-sage/10 text-natural-dark-sage px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Compliance</span>
                  <span className="text-[10px] font-bold text-natural-sage flex items-center space-x-1">
                    <CheckCircle className="h-3.5 w-3.5 text-natural-sage fill-current/5" />
                    <span>Excellent Adherence</span>
                  </span>
                </div>
                <span className="font-serif font-extrabold text-sm text-natural-dark-sage block pt-1">Active Medication Adherence</span>
                <p className="text-[10px] text-natural-muted leading-relaxed">Continuous digital confirmation logs of prescribed cardiovascular and diabetic agents.</p>
              </div>

              <div className="bg-natural-bg/40 p-3.5 rounded-xl border border-natural-border-light flex justify-between items-center">
                <div className="text-xs">
                  <span className="text-[9px] text-natural-muted uppercase font-bold block">Clinical Target Limit</span>
                  <span className="font-mono font-bold text-natural-dark-sage">&gt; 90% (Monthly Adherence)</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-[9px] text-natural-muted uppercase font-bold block">Logged Compliance</span>
                  <span className="font-mono font-black text-natural-sage">96 %</span>
                </div>
              </div>

              <div className="w-full bg-natural-beige h-1.5 rounded-full overflow-hidden">
                <div className="bg-natural-sage h-full w-[96%]" />
              </div>
            </div>

            {/* Goal 4: Lifestyle Physical Activity */}
            <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between items-start">
                  <span className="text-[9px] bg-natural-sage/10 text-natural-dark-sage px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Physical Health</span>
                  <span className="text-[10px] font-bold text-natural-sage flex items-center space-x-1">
                    <CheckCircle className="h-3.5 w-3.5 text-natural-sage fill-current/5" />
                    <span>Goal Reached</span>
                  </span>
                </div>
                <span className="font-serif font-extrabold text-sm text-natural-dark-sage block pt-1">Active Exercise Target</span>
                <p className="text-[10px] text-natural-muted leading-relaxed">Weekly aerobic/cardiovascular physical therapy sessions to stimulate endothelial function.</p>
              </div>

              <div className="bg-natural-bg/40 p-3.5 rounded-xl border border-natural-border-light flex justify-between items-center">
                <div className="text-xs">
                  <span className="text-[9px] text-natural-muted uppercase font-bold block">Weekly Minimum Goal</span>
                  <span className="font-mono font-bold text-natural-dark-sage">150 Minutes</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-[9px] text-natural-muted uppercase font-bold block">Recorded Last Week</span>
                  <span className="font-mono font-black text-natural-sage">165 Minutes</span>
                </div>
              </div>

              <div className="w-full bg-natural-beige h-1.5 rounded-full overflow-hidden">
                <div className="bg-natural-sage h-full w-full" />
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB CONTENT: EXTERNAL DOCUMENT UPLOAD MANAGER */}
      {activeTab === "uploads" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-200">
          
          {/* DRAG AND DROP UPLOAD PANEL */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-sm space-y-4">
              <span className="font-serif text-sm font-bold text-natural-dark-sage block text-left">External Document Upload Manager</span>

              <div className="flex justify-between items-center space-x-2 text-xs">
                <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider">1. File Category Tag:</span>
                <select 
                  value={tagSelection}
                  onChange={(e) => setTagSelection(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-natural-beige border border-natural-border rounded-lg text-xs outline-none text-natural-dark-sage font-bold"
                >
                  <option value="scan">Diagnostic Scan / Imaging</option>
                  <option value="prescription">Prescription Certificate</option>
                  <option value="lab result">Lab Panel Result</option>
                  <option value="other">Other Medical Document</option>
                </select>
              </div>

              <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all relative cursor-pointer ${
                  isDragging ? "border-natural-sage bg-natural-beige/50" : "border-natural-border hover:border-natural-sage"
                }`}
              >
                <input 
                  type="file" 
                  onChange={handleManualFileSelect}
                  accept="application/pdf, image/jpeg, image/png"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="doc-drag-upload"
                />
                <div className="space-y-2">
                  <div className="h-9 w-9 rounded-lg bg-natural-beige text-natural-sage border border-natural-border flex items-center justify-center mx-auto">
                    <Upload className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-natural-dark-sage block">Drag & Drop file here</span>
                    <span className="text-[9px] text-natural-muted block mt-0.5">Supports PDF, JPG, PNG up to 10MB</span>
                  </div>
                </div>
              </div>

              {isUploading && (
                <div className="space-y-1.5 text-xs text-left">
                  <div className="flex justify-between font-bold text-natural-dark-sage">
                    <span>Uploading files...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-natural-beige h-1.5 rounded-full overflow-hidden">
                    <div style={{ width: `${uploadProgress}%` }} className="bg-natural-sage h-full transition-all" />
                  </div>
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3.5 bg-natural-sage/20 border border-natural-sage/30 text-natural-dark-sage rounded-2xl flex items-start space-x-2.5 text-xs animate-in fade-in text-left">
                  <CheckCircle className="h-4.5 w-4.5 text-natural-sage shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Upload Completed Successfully</span>
                    Uploaded <span className="font-mono text-[10px] font-bold">{uploadSuccess.name}</span> tagged as <span className="font-bold uppercase text-[9px] bg-natural-sage/20 text-natural-dark-sage px-2 py-0.5 rounded-full ml-1">{uploadSuccess.category}</span>.
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="p-3.5 bg-natural-terracotta/10 border border-natural-terracotta/30 text-natural-text rounded-2xl flex items-start space-x-2.5 text-xs animate-in fade-in text-left">
                  <AlertCircle className="h-4.5 w-4.5 text-natural-terracotta shrink-0 mt-0.5" />
                  <div>{uploadError}</div>
                </div>
              )}
            </div>
          </div>

          {/* UPLOADED DOCUMENTS DIRECTORY */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-natural-border-light pb-3 gap-2">
                <span className="font-serif text-sm font-bold text-natural-dark-sage block text-left">External Files Directory</span>
                <div className="flex flex-wrap gap-1">
                  {documentCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterType(cat)}
                      className={`px-3 py-1 rounded-full text-[9px] font-bold border transition-all cursor-pointer ${
                        filterType === cat 
                          ? "bg-natural-dark-sage border-natural-dark-sage text-white shadow-xs" 
                          : "bg-natural-beige border-natural-border text-natural-text hover:bg-natural-border-light"
                      }`}
                    >
                      {cat === "All" ? "All" : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center py-8 text-natural-muted text-[10px] bg-natural-bg rounded-xl border border-dashed border-natural-border">
                    No documents found in this directory.
                  </div>
                ) : (
                  filteredDocuments.map((doc) => (
                    <div key={doc.id} className="p-2.5 bg-natural-bg hover:bg-natural-beige border border-natural-border rounded-xl flex justify-between items-center text-xs transition-colors text-left">
                      <div className="flex items-start space-x-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-white text-natural-sage border border-natural-border-light flex items-center justify-center shrink-0">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="space-y-0.5 text-left min-w-0">
                          <span className="font-serif font-bold text-natural-dark-sage block truncate" title={doc.name}>
                            {doc.name}
                          </span>
                          <div className="flex items-center space-x-1.5 text-[10px] text-natural-muted font-bold">
                            <span className="bg-natural-beige px-2 py-0.5 rounded-full text-[9px] uppercase font-bold text-natural-sage">{doc.category}</span>
                            <span>•</span>
                            <span>{doc.size}</span>
                          </div>
                        </div>
                      </div>

                      <a 
                        href="#" 
                        onClick={(e) => { e.preventDefault(); alert(`Simulating file download: ${doc.name}`); }}
                        className="p-1.5 hover:bg-white rounded-full border border-natural-border hover:border-natural-sage text-natural-muted hover:text-natural-dark-sage transition-all shrink-0 cursor-pointer"
                        title="Download record"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* TAB CONTENT: GOOGLE WORKSPACE SYNC SUITE */}
      {activeTab === "google_workspace" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Header Panel */}
          <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1 text-left max-w-xl">
              <span className="text-[9px] bg-natural-sage/20 text-natural-dark-sage px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Cloud Workspace Integration</span>
              <h2 className="font-serif font-extrabold text-sm text-natural-dark-sage">Google Docs, Sheets & Drive Clinical Sync</h2>
              <p className="text-[10px] text-natural-muted font-bold">Securely export your patient health files, structured clinical SOAP consultation notes, laboratory panels, and daily vitals log spreadsheets directly into your personal Google Workspace account.</p>
            </div>

            {/* Google Authentication Section */}
            {isWorkspaceAuthRequired ? (
              <button
                onClick={handleWorkspaceLogin}
                disabled={isWorkspaceLoading}
                className="gsi-material-button bg-white border border-gray-300 rounded-xl px-4.5 py-2.5 flex items-center justify-center space-x-2 text-xs font-bold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isWorkspaceLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin text-natural-sage" />
                ) : (
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-4 w-4 shrink-0">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                )}
                <span>Connect Google Workspace</span>
              </button>
            ) : (
              <div className="flex flex-col items-start md:items-end space-y-1.5">
                <div className="flex items-center space-x-2 text-xs font-bold text-natural-dark-sage bg-natural-sage/10 px-3.5 py-1.5 rounded-full border border-natural-sage/20">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Linked: {googleUser?.email}</span>
                </div>
                <button
                  onClick={handleWorkspaceLogout}
                  className="text-[10px] text-natural-terracotta hover:underline flex items-center space-x-1 font-bold pl-2 cursor-pointer"
                >
                  <LogOut className="h-3 w-3" />
                  <span>Disconnect Account</span>
                </button>
              </div>
            )}
          </div>

          {/* MAIN INTERFACES GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
            
            {/* Left Hand: Workspace Tools & Exporters */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Document Creators & Exporters */}
              <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-sm space-y-5">
                <div>
                  <span className="font-serif text-sm font-bold text-natural-dark-sage block">Clinical Google Workspace Exporters</span>
                  <p className="text-[10px] text-natural-muted font-bold">Convert structured electronic records into dynamic, collaborative files.</p>
                </div>

                <div className="space-y-4">
                  {/* Google Docs: Full Patient EHR Summary */}
                  <div className="p-4 bg-natural-bg border border-natural-border hover:border-natural-sage rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                    <div className="space-y-1">
                      <span className="flex items-center space-x-1.5 text-xs font-bold text-natural-dark-sage">
                        <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                        <span>Patient Health Summary (Google Doc)</span>
                      </span>
                      <p className="text-[10px] text-natural-muted max-w-md">Creates an active, beautifully laid out patient biometric resume detailing allergies, diagnoses, chronic conditions, and continuous immunization lists.</p>
                    </div>
                    <button
                      onClick={handleExportFullSummaryDoc}
                      disabled={isWorkspaceAuthRequired || isExportingDoc}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 text-white disabled:text-gray-400 text-[10px] font-bold rounded-full transition-all shrink-0 cursor-pointer shadow-sm"
                    >
                      {isExportingDoc ? "Exporting..." : "Export to Doc"}
                    </button>
                  </div>

                  {/* Google Sheets: Vitals History Log */}
                  <div className="p-4 bg-natural-bg border border-natural-border hover:border-natural-sage rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                    <div className="space-y-1">
                      <span className="flex items-center space-x-1.5 text-xs font-bold text-natural-dark-sage">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Biometrics & Vital Logs (Google Sheet)</span>
                      </span>
                      <p className="text-[10px] text-natural-muted max-w-md">Exports your active 30-day home telemetry logs (including blood pressure spikes, pulse rate rhythms, blood glucose readings, and oxygen levels) into a clean grid.</p>
                    </div>
                    <button
                      onClick={handleExportVitalsSheet}
                      disabled={isWorkspaceAuthRequired || isExportingSheet}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white disabled:text-gray-400 text-[10px] font-bold rounded-full transition-all shrink-0 cursor-pointer shadow-sm"
                    >
                      {isExportingSheet ? "Exporting..." : "Export to Sheet"}
                    </button>
                  </div>

                  {/* Google Sheets: Labs Panel Ledger */}
                  <div className="p-4 bg-natural-bg border border-natural-border hover:border-natural-sage rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
                    <div className="space-y-1">
                      <span className="flex items-center space-x-1.5 text-xs font-bold text-natural-dark-sage">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Clinical Lab Result panels (Google Sheet)</span>
                      </span>
                      <p className="text-[10px] text-natural-muted max-w-md">Syncs metabolic panel readings, lipid charts, and other lab values along with physician annotations and reference benchmarks into a spreadsheet.</p>
                    </div>
                    <button
                      onClick={handleExportLabsSheet}
                      disabled={isWorkspaceAuthRequired || isExportingSheet}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white disabled:text-gray-400 text-[10px] font-bold rounded-full transition-all shrink-0 cursor-pointer shadow-sm"
                    >
                      {isExportingSheet ? "Exporting..." : "Export to Sheet"}
                    </button>
                  </div>

                  {/* Google Docs: SOAP Note Exporter */}
                  <div className="p-4 bg-natural-bg border border-natural-border hover:border-natural-sage rounded-2xl space-y-3 transition-all">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <span className="flex items-center space-x-1.5 text-xs font-bold text-natural-dark-sage">
                          <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                          <span>Export Visit SOAP Note to Google Docs</span>
                        </span>
                        <p className="text-[10px] text-natural-muted max-w-md">Extracts clinical SOAP consult files (Subjective reports, Objective measures, Assessments, and continuous Treatment Plans) of a completed doctor appointment.</p>
                      </div>
                    </div>

                    {appointmentsWithSOAP.length === 0 ? (
                      <div className="text-[10px] text-natural-muted bg-natural-beige p-3 rounded-xl border border-dashed border-natural-border">
                        No completed appointments with available SOAP notes were found. Book or finalize a consultation first.
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3 pt-1">
                        <select
                          value={selectedApptIdForDoc}
                          onChange={(e) => setSelectedApptIdForDoc(e.target.value)}
                          disabled={isWorkspaceAuthRequired}
                          className="flex-1 px-3 py-2 bg-white border border-natural-border rounded-xl text-xs outline-none font-bold text-natural-dark-sage"
                        >
                          <option value="">-- Select Completed Visit SOAP Note --</option>
                          {appointmentsWithSOAP.map((appt) => (
                            <option key={appt.id} value={appt.id}>
                              {appt.date} - Dr. {appt.doctorName} ({appt.doctorSpecialty})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleExportSoapNote(selectedApptIdForDoc)}
                          disabled={isWorkspaceAuthRequired || !selectedApptIdForDoc || isExportingDoc}
                          className="px-4.5 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 text-white disabled:text-gray-400 text-[10px] font-bold rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                        >
                          {isExportingDoc ? "Generating..." : "Export SOAP"}
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>

            </div>

            {/* Right Hand: Google Drive Live File Sync Explorer */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-sm space-y-4 flex flex-col h-full min-h-[350px]">
                <div className="flex justify-between items-center border-b border-natural-border-light pb-3">
                  <div>
                    <span className="font-serif text-sm font-bold text-natural-dark-sage block">Google Drive Files Explorer</span>
                    <p className="text-[10px] text-natural-muted font-bold">Live synchronized clinical documents in your account.</p>
                  </div>
                  {!isWorkspaceAuthRequired && (
                    <button
                      onClick={loadRecentWorkspaceFiles}
                      disabled={isWorkspaceLoading}
                      className="p-1.5 bg-natural-bg hover:bg-natural-beige text-natural-dark-sage rounded-lg transition-all border border-natural-border cursor-pointer disabled:opacity-50"
                      title="Reload files from Google Drive"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${isWorkspaceLoading ? 'animate-spin text-natural-sage' : ''}`} />
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2.5 pr-1">
                  {isWorkspaceAuthRequired ? (
                    <div className="text-center py-16 text-natural-muted space-y-2 bg-natural-bg rounded-2xl border border-dashed border-natural-border">
                      <HardDrive className="h-8 w-8 mx-auto text-natural-border shrink-0" />
                      <div className="text-[10px] font-bold">Workspace Connection Required</div>
                      <p className="text-[9px] text-natural-muted max-w-[200px] mx-auto">Authorize with Google Workspace using the connect button above to view and open your clinical files.</p>
                    </div>
                  ) : isWorkspaceLoading && workspaceFiles.length === 0 ? (
                    <div className="text-center py-16 space-y-2">
                      <RefreshCw className="h-6 w-6 mx-auto animate-spin text-natural-sage" />
                      <div className="text-[10px] text-natural-muted font-bold">Synchronizing with Google Drive...</div>
                    </div>
                  ) : workspaceFiles.length === 0 ? (
                    <div className="text-center py-16 text-natural-muted space-y-2 bg-natural-bg rounded-2xl border border-dashed border-natural-border">
                      <HardDrive className="h-8 w-8 mx-auto text-natural-border shrink-0" />
                      <div className="text-[10px] font-bold">No Active Files Found</div>
                      <p className="text-[9px] text-natural-muted max-w-[200px] mx-auto">No clinical spreadsheets or text documents have been exported under this account scope yet.</p>
                    </div>
                  ) : (
                    workspaceFiles.map((file) => {
                      const isSpreadsheet = file.mimeType.includes("spreadsheet");
                      return (
                        <div key={file.id} className="p-3 bg-natural-bg hover:bg-natural-beige border border-natural-border rounded-xl flex justify-between items-center transition-colors text-xs text-left">
                          <div className="flex items-start space-x-2.5 min-w-0">
                            <div className={`h-8 w-8 rounded-lg bg-white border border-natural-border-light flex items-center justify-center shrink-0 ${isSpreadsheet ? 'text-emerald-600' : 'text-blue-500'}`}>
                              {isSpreadsheet ? (
                                <FileSpreadsheet className="h-4.5 w-4.5" />
                              ) : (
                                <FileText className="h-4.5 w-4.5" />
                              )}
                            </div>
                            <div className="space-y-0.5 text-left min-w-0">
                              <span className="font-serif font-bold text-natural-dark-sage block truncate" title={file.name}>
                                {file.name}
                              </span>
                              <div className="flex items-center space-x-1.5 text-[9px] text-natural-muted font-bold">
                                <span className={`px-1.5 py-0.5 rounded-sm uppercase text-[8px] font-extrabold ${isSpreadsheet ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
                                  {isSpreadsheet ? 'Sheet' : 'Doc'}
                                </span>
                                <span>•</span>
                                <span>{new Date(file.createdTime).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white hover:bg-natural-beige rounded-full border border-natural-border hover:border-natural-sage text-natural-muted hover:text-natural-dark-sage transition-all shrink-0 cursor-pointer flex items-center justify-center"
                            title="Open in Workspace"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
