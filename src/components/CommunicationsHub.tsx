import React, { useState, useEffect, useRef } from "react";
import { 
  Mail, 
  Smartphone, 
  Send, 
  Check, 
  CheckCheck, 
  AlertCircle, 
  Inbox, 
  Filter, 
  Clock, 
  Plus, 
  Eye, 
  RefreshCw, 
  Bell, 
  ShieldCheck, 
  Pill, 
  Heart, 
  CreditCard,
  Trash2,
  Paperclip,
  Share2,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle,
  FileSpreadsheet
} from "lucide-react";
import { DashboardState, saveState } from "../data";
import { EmailRecord, SmsRecord } from "../types";
import * as XLSX from "xlsx";

interface CommunicationsHubProps {
  state: DashboardState;
  onChangeState: (newState: DashboardState) => void;
}

export default function CommunicationsHub({ state, onChangeState }: CommunicationsHubProps) {
  const { emails, smsLogs, patient, doctors } = state;

  const [activeTab, setActiveTab] = useState<"email" | "sms">("email");

  // Email States
  const [selectedEmailId, setSelectedEmailId] = useState<string>(emails[0]?.id || "");
  const [emailCategoryFilter, setEmailCategoryFilter] = useState<string>("all");
  const [showEmailCompose, setShowEmailCompose] = useState(false);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [composeCategory, setComposeCategory] = useState<EmailRecord["category"]>("clinical");
  const [successToast, setSuccessToast] = useState("");

  // SMS States
  const [selectedSmsId, setSelectedSmsId] = useState<string>(smsLogs[0]?.id || "");
  const [smsCategoryFilter, setSmsCategoryFilter] = useState<string>("all");
  const [smsInputText, setSmsInputText] = useState("");
  const [customSmsTriggerText, setCustomSmsTriggerText] = useState("");
  const [customSmsCategory, setCustomSmsCategory] = useState<SmsRecord["category"]>("clinical");

  // Notification Preferences (Locally updated in patient state)
  const [emailLabsPref, setEmailLabsPref] = useState(true);
  const [emailCareplanPref, setEmailCareplanPref] = useState(true);
  const [smsRefillPref, setSmsRefillPref] = useState(true);
  const [smsVitalsPref, setSmsVitalsPref] = useState(true);

  const selectedEmail = emails.find(e => e.id === selectedEmailId) || emails[0];
  const selectedSms = smsLogs.find(s => s.id === selectedSmsId) || smsLogs[0];

  // Auto scroll mobile mock chat down when SMS list updates
  const smsEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (activeTab === "sms") {
      smsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [smsLogs, activeTab]);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast("");
    }, 4500);
  };

  // Excel Integration state & handler
  const [exportDataset, setExportDataset] = useState<"vitals" | "prescriptions" | "billing">("vitals");

  const handleExportAndEmailExcel = () => {
    try {
      let dataToExport: any[] = [];
      let filename = "";
      let sheetName = "";
      let emailBodyHtml = "";

      if (exportDataset === "vitals") {
        dataToExport = state.vitals.map(v => ({
          "Timestamp": v.timestamp,
          "Systolic BP (mmHg)": v.bloodPressureSystolic,
          "Diastolic BP (mmHg)": v.bloodPressureDiastolic,
          "Heart Rate (bpm)": v.heartRate,
          "Blood Glucose (mg/dL)": v.bloodGlucose,
          "O2 Saturation (%)": v.oxygenSaturation,
          "Weight (lbs)": v.weight,
          "Temperature (°F)": v.temperature,
          "Notes": v.notes || ""
        }));
        filename = "CarePulse_Vitals_Telemetry.xlsx";
        sheetName = "Vitals Log";
        emailBodyHtml = `
          <h3>Secure Data Dispatch: Vitals Telemetry Report</h3>
          <p>Dear Sarah Jenkins,</p>
          <p>Your requested 30-day medical biometrics and vital signs registry has been compiled into an Excel spreadsheet (.xlsx format) and successfully transmitted to your verified primary email address <strong>sarah.jenkins@gmail.com</strong>.</p>
          <ul>
            <li><strong>Dataset:</strong> Vitals Log Telemetry (30 records)</li>
            <li><strong>Security Hash:</strong> SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}</li>
            <li><strong>Encryption Cipher:</strong> AES-256 TLS 1.3 Secure Envelope</li>
          </ul>
          <p>Your physician can import this file directly into their EHR system to review blood pressure and blood glucose trends.</p>
          <hr/>
          <p style="font-size:11px;color:#888;">CarePulse Automated Dispatcher • Seattle Clinical Group</p>
        `;
      } else if (exportDataset === "prescriptions") {
        dataToExport = state.prescriptions.map(p => ({
          "Medication Name": p.medicationName,
          "Dosage": p.dosage,
          "Frequency": p.frequency,
          "Refills Remaining": p.refillsRemaining,
          "Status": p.active ? "Active" : "Expired",
          "Start Date": p.startDate,
          "End Date": p.endDate,
          "Pharmacy Provider": p.pharmacy.name,
          "Pharmacy Phone": p.pharmacy.phone
        }));
        filename = "CarePulse_Prescriptions_Registry.xlsx";
        sheetName = "Prescriptions";
        emailBodyHtml = `
          <h3>Secure Data Dispatch: Prescriptions Registry</h3>
          <p>Dear Sarah Jenkins,</p>
          <p>As requested, your complete active pharmaceutical and electronic prescription ledger has been compiled and emailed to <strong>sarah.jenkins@gmail.com</strong>.</p>
          <ul>
            <li><strong>Dataset:</strong> Active Rx Registry</li>
            <li><strong>Security Hash:</strong> SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}</li>
          </ul>
          <p>Please present this compiled spreadsheet to any consulting specialist to prevent adverse pharmacological reactions.</p>
          <hr/>
          <p style="font-size:11px;color:#888;">CarePulse Automated Dispatcher • Seattle Clinical Group</p>
        `;
      } else {
        dataToExport = state.invoices.map(i => ({
          "Invoice ID": i.id,
          "Date Billed": i.date,
          "Description": i.description,
          "Total Gross Fee": i.amount,
          "Insurance Paid": i.insuranceCoverage,
          "Patient Copay Responsibility": i.patientResponsibility,
          "Billing Status": i.status.toUpperCase(),
          "Claim Status": i.claimStatus.toUpperCase(),
          "Payment Due Date": i.dueDate
        }));
        filename = "CarePulse_Billing_Insurance_Ledger.xlsx";
        sheetName = "Billing Ledger";
        emailBodyHtml = `
          <h3>Secure Data Dispatch: Billing & Insurance Claims Ledger</h3>
          <p>Dear Sarah Jenkins,</p>
          <p>Your itemized clinical invoice ledger, insurance claims approvals, and payment transaction audits have been successfully exported as an Excel workbook and emailed to <strong>sarah.jenkins@gmail.com</strong>.</p>
          <ul>
            <li><strong>Dataset:</strong> Billing & Insurance Claims Ledger</li>
            <li><strong>Security Hash:</strong> SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}</li>
          </ul>
          <p>Keep this file for tax deductions, flexible spending account (FSA) reimbursement, or health savings account (HSA) audits.</p>
          <hr/>
          <p style="font-size:11px;color:#888;">CarePulse Automated Dispatcher • Seattle Clinical Group</p>
        `;
      }

      // Generate Excel Binary using xlsx
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, filename);

      // Insert secure simulated email into state
      const newEmail: EmailRecord = {
        id: `em_xls_${Date.now()}`,
        sender: "no-reply@carepulse.org",
        recipient: "sarah.jenkins@gmail.com",
        subject: `Compiled Excel Data Delivered: ${sheetName}`,
        body: emailBodyHtml,
        timestamp: new Date().toISOString(),
        status: "delivered",
        category: "clinical"
      };

      const updatedState = {
        ...state,
        emails: [newEmail, ...state.emails],
        notifications: [
          {
            id: `not_xls_${Date.now()}`,
            type: "lab" as const,
            title: "Excel Compilation Emailed",
            body: `Excel file "${filename}" compiled, downloaded, and delivered to your portal email.`,
            timestamp: new Date().toISOString(),
            read: false
          },
          ...state.notifications
        ]
      };

      onChangeState(updatedState);
      saveState(updatedState);
      setSelectedEmailId(newEmail.id);
      triggerToast(`Compiled ${sheetName}! Spreadsheet downloaded and emailed to sarah.jenkins@gmail.com!`);
    } catch (err) {
      console.error(err);
      triggerToast("Error building secure Excel worksheet.");
    }
  };

  // 1. Send New Email handler
  const handleSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeSubject.trim() || !composeBody.trim()) return;

    const newEmail: EmailRecord = {
      id: `em_${Date.now()}`,
      sender: "sarah.jenkins@gmail.com",
      recipient: "support@carepulse.org",
      subject: composeSubject.trim(),
      body: `<p>${composeBody.replace(/\n/g, "<br />")}</p>`,
      timestamp: new Date().toISOString(),
      status: "sent",
      category: composeCategory
    };

    const updatedState: DashboardState = {
      ...state,
      emails: [newEmail, ...state.emails],
      notifications: [
        {
          id: `not_em_${Date.now()}`,
          type: "message",
          title: "Email Sent Successfully",
          body: `Subject: "${composeSubject.trim()}" dispatched to CarePulse Clinical Server.`,
          timestamp: new Date().toISOString(),
          read: false
        },
        ...state.notifications
      ]
    };

    onChangeState(updatedState);
    saveState(updatedState);

    // Reset Compose Form
    setComposeSubject("");
    setComposeBody("");
    setShowEmailCompose(false);
    setSelectedEmailId(newEmail.id);
    triggerToast("Email successfully dispatched to secure hospital servers!");

    // Simulate doctor support reply after 5 seconds
    setTimeout(() => {
      const autoReply: EmailRecord = {
        id: `em_reply_${Date.now()}`,
        sender: "support@carepulse.org",
        recipient: "sarah.jenkins@gmail.com",
        subject: `Re: ${composeSubject.trim()}`,
        body: `<p>Thank you for contacting CarePulse Patient Support.</p>
        <p>We received your query regarding: <em>"${composeSubject.trim()}"</em>.</p>
        <p>A clinical administrator has queued this for physician team routing. You will receive an SMS and email notification once your care team completes the clinical review.</p>
        <hr />
        <p style="font-size:11px;color:#888;">CarePulse Automated Helpdesk • Reply to check ticket status</p>`,
        timestamp: new Date().toISOString(),
        status: "delivered",
        category: "clinical"
      };

      const finalState: DashboardState = {
        ...state,
        emails: [autoReply, ...updatedState.emails],
        notifications: [
          {
            id: `not_em_reply_${Date.now()}`,
            type: "message",
            title: "New Support Email Received",
            body: `CarePulse Support replied regarding: "${composeSubject.trim()}"`,
            timestamp: new Date().toISOString(),
            read: false
          },
          ...updatedState.notifications
        ]
      };

      onChangeState(finalState);
      saveState(finalState);
    }, 5000);
  };

  // 2. Compose and Send SMS directly in phone mockup
  const handleSendSmsText = () => {
    if (!smsInputText.trim()) return;

    const patientSms: SmsRecord = {
      id: `sms_pat_${Date.now()}`,
      from: patient.phone,
      to: "847-22",
      body: smsInputText.trim(),
      timestamp: new Date().toISOString(),
      status: "sent",
      category: "other"
    };

    const updatedState: DashboardState = {
      ...state,
      smsLogs: [...state.smsLogs, patientSms]
    };

    onChangeState(updatedState);
    saveState(updatedState);
    setSmsInputText("");

    // Simulate shortcode auto-reply
    setTimeout(() => {
      let responseBody = "CarePulse: Message received. Our medical triage team has been alerted of your text response.";
      const text = patientSms.body.toLowerCase();

      if (text.includes("refill") || text.includes("rx") || text.includes("med")) {
        responseBody = "CarePulse Rx: Prescriptions are undergoing pharmacy lookup. We will text you once Walgreens confirms pickup readiness.";
      } else if (text.includes("vitals") || text.includes("bp") || text.includes("glucose")) {
        responseBody = "CarePulse Health: Vitals logged. Thank you for your consistent daily bio-monitoring data submission.";
      } else if (text.includes("help") || text.includes("otp")) {
        responseBody = "CarePulse: For patient security, your 2-Factor OTP has been reset. Your fresh code is " + Math.floor(100000 + Math.random() * 900000) + ".";
      }

      const replySms: SmsRecord = {
        id: `sms_reply_${Date.now()}`,
        from: "847-22",
        to: patient.phone,
        body: responseBody,
        timestamp: new Date().toISOString(),
        status: "delivered",
        category: "other"
      };

      const finalState: DashboardState = {
        ...state,
        smsLogs: [...updatedState.smsLogs, replySms],
        notifications: [
          {
            id: `not_sms_reply_${Date.now()}`,
            type: "message",
            title: "New SMS Text Received",
            body: responseBody,
            timestamp: new Date().toISOString(),
            read: false
          },
          ...updatedState.notifications
        ]
      };

      onChangeState(finalState);
      saveState(finalState);
    }, 2000);
  };

  // 3. Trigger simulated clinical SMS alerts on demand
  const handleTriggerRefillSmsSim = () => {
    const rxSms: SmsRecord = {
      id: `sms_rx_alert_${Date.now()}`,
      from: "847-22",
      to: patient.phone,
      body: `CarePulse Rx: Your prescription for Lisinopril 10mg is ready for pick-up at Walgreens Pharmacy #4402. Cost: $4.00 copay. Call pharmacy: (555) 909-1234.`,
      timestamp: new Date().toISOString(),
      status: "delivered",
      category: "refill"
    };

    const updatedState: DashboardState = {
      ...state,
      smsLogs: [...state.smsLogs, rxSms],
      notifications: [
        {
          id: `not_sms_rx_${Date.now()}`,
          type: "refill",
          title: "Prescription SMS Dispatch",
          body: "Walgreens Pharmacy pickup notification sent via SMS.",
          timestamp: new Date().toISOString(),
          read: false
        },
        ...state.notifications
      ]
    };

    onChangeState(updatedState);
    saveState(updatedState);
    triggerToast("Dispatched simulated Prescription Pickup SMS alert to patient phone!");
  };

  const handleTriggerVitalsAlertSmsSim = () => {
    const vitSms: SmsRecord = {
      id: `sms_vit_alert_${Date.now()}`,
      from: "847-22",
      to: patient.phone,
      body: `CarePulse Safety: Morning blood glucose registered as 112 mg/dL (slightly elevated fasting limit). Please review your daily diet suggestions in your CarePulse ledger.`,
      timestamp: new Date().toISOString(),
      status: "delivered",
      category: "vital_alert"
    };

    const updatedState: DashboardState = {
      ...state,
      smsLogs: [...state.smsLogs, vitSms],
      notifications: [
        {
          id: `not_sms_vit_${Date.now()}`,
          type: "lab",
          title: "Biometrics Limit SMS Alert",
          body: "Alert sent via text regarding elevated glucose logging.",
          timestamp: new Date().toISOString(),
          read: false
        },
        ...state.notifications
      ]
    };

    onChangeState(updatedState);
    saveState(updatedState);
    triggerToast("Dispatched simulated Biometrics Threshold Warning SMS alert!");
  };

  const handleTriggerCustomSmsSim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSmsTriggerText.trim()) return;

    const customSms: SmsRecord = {
      id: `sms_custom_${Date.now()}`,
      from: "847-22",
      to: patient.phone,
      body: customSmsTriggerText.trim(),
      timestamp: new Date().toISOString(),
      status: "delivered",
      category: customSmsCategory
    };

    const updatedState: DashboardState = {
      ...state,
      smsLogs: [...state.smsLogs, customSms],
      notifications: [
        {
          id: `not_sms_custom_${Date.now()}`,
          type: "message",
          title: "SMS Alert Broadcasted",
          body: customSmsTriggerText.trim(),
          timestamp: new Date().toISOString(),
          read: false
        },
        ...state.notifications
      ]
    };

    onChangeState(updatedState);
    saveState(updatedState);
    setCustomSmsTriggerText("");
    triggerToast("Custom SMS notification successfully pushed to patient device!");
  };

  // Helper filters
  const filteredEmails = emails.filter(email => {
    if (emailCategoryFilter === "all") return true;
    return email.category === emailCategoryFilter;
  });

  const filteredSmsLogs = smsLogs.filter(sms => {
    if (smsCategoryFilter === "all") return true;
    return sms.category === smsCategoryFilter;
  });

  // Get human friendly relative date/time
  const formatMsgDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6" id="communications-ecosystem">
      
      {/* 1. TOAST NOTIFICATION BANNER */}
      {successToast && (
        <div className="fixed top-20 right-4 bg-natural-sage text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center space-x-3 text-xs font-bold border border-natural-dark-sage/20 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="h-5 w-5 shrink-0 text-white" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 2. HEADER STRIP */}
      <div className="bg-white border border-natural-border rounded-[28px] p-6 text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-natural-sage/10 text-natural-dark-sage rounded-xl">
              <Mail className="h-4.5 w-4.5" />
            </span>
            <span className="font-serif font-black text-lg text-natural-dark-sage">CarePulse Clinical Communications</span>
          </div>
          <p className="text-xs text-natural-muted leading-relaxed">
            Configure patient preference pathways, trigger automated alerts, and audit outbox/inbox records. This interface manages encrypted email notifications and text message (SMS) delivery gateways in accordance with HIPAA standards.
          </p>
        </div>

        {/* TAB Toggles */}
        <div className="flex bg-natural-beige p-1 rounded-2xl border border-natural-border-light shrink-0">
          <button
            onClick={() => setActiveTab("email")}
            className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === "email" 
                ? "bg-white text-natural-dark-sage shadow-xs border border-natural-border-light/40" 
                : "text-natural-muted hover:text-natural-dark-sage"
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Secure Email Client</span>
          </button>
          <button
            onClick={() => setActiveTab("sms")}
            className={`px-4.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer ${
              activeTab === "sms" 
                ? "bg-white text-natural-dark-sage shadow-xs border border-natural-border-light/40" 
                : "text-natural-muted hover:text-natural-dark-sage"
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>SMS Text Gateway</span>
          </button>
        </div>
      </div>

      {/* 3. CORE INTERACTIVE COMMUNICATION TILES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT / CENTER VIEWPORTS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* SECURE EMAIL CLIENT PORTAL */}
          {activeTab === "email" && (
            <div className="bg-white border border-natural-border rounded-[28px] overflow-hidden shadow-xs h-[580px] grid grid-cols-1 md:grid-cols-12">
              
              {/* Email list pane */}
              <div className="md:col-span-5 border-r border-natural-border flex flex-col bg-natural-beige/10">
                {/* Search & filters */}
                <div className="p-4 bg-white border-b border-natural-border space-y-3 shrink-0">
                  <div className="flex justify-between items-center">
                    <span className="font-serif font-black text-xs text-natural-dark-sage">Patient Email Inbox</span>
                    <button
                      onClick={() => setShowEmailCompose(!showEmailCompose)}
                      className="px-2.5 py-1 bg-natural-sage hover:bg-natural-dark-sage text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Compose</span>
                    </button>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: "all", label: "All" },
                      { id: "appointment", label: "Visits" },
                      { id: "refill", label: "Refills" },
                      { id: "clinical", label: "Clinical" },
                      { id: "billing", label: "Billing" },
                      { id: "security", label: "Security" }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setEmailCategoryFilter(f.id)}
                        className={`px-2 py-1 rounded-md text-[9px] font-bold transition-all cursor-pointer ${
                          emailCategoryFilter === f.id 
                            ? "bg-natural-dark-sage text-white" 
                            : "bg-white border border-natural-border text-natural-muted hover:bg-natural-beige"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email list body */}
                <div className="flex-1 overflow-y-auto divide-y divide-natural-border-light">
                  {filteredEmails.length === 0 ? (
                    <div className="p-8 text-center text-natural-muted text-xs space-y-1">
                      <Inbox className="h-6 w-6 mx-auto text-slate-300" />
                      <p>No e-notifications match filter criteria.</p>
                    </div>
                  ) : (
                    filteredEmails.map(email => {
                      const active = email.id === selectedEmailId;
                      return (
                        <div
                          key={email.id}
                          onClick={() => {
                            setSelectedEmailId(email.id);
                            setShowEmailCompose(false);
                            // Mark opened in state
                            if (email.status === "delivered") {
                              const updatedEmails = emails.map(e => e.id === email.id ? { ...e, status: "opened" as const } : e);
                              onChangeState({ ...state, emails: updatedEmails });
                              saveState({ ...state, emails: updatedEmails });
                            }
                          }}
                          className={`p-3.5 text-left cursor-pointer transition-all flex flex-col space-y-1 ${
                            active ? "bg-natural-beige/25 border-l-4 border-natural-sage" : "hover:bg-natural-bg/20"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-[11px] text-natural-dark-sage truncate max-w-[130px]">
                              {email.sender === "sarah.jenkins@gmail.com" ? "Me (Patient)" : email.sender.split("@")[0]}
                            </span>
                            <span className="text-[9px] text-natural-muted font-mono">{formatMsgDate(email.timestamp).split(" ")[1] || ""}</span>
                          </div>
                          
                          <span className="font-serif font-black text-xs text-natural-text leading-tight truncate">
                            {email.subject}
                          </span>
                          
                          <div className="flex justify-between items-center pt-1.5">
                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                              email.category === "security" ? "bg-red-50 text-red-600" :
                              email.category === "billing" ? "bg-amber-50 text-amber-700" :
                              email.category === "appointment" ? "bg-blue-50 text-blue-600" :
                              "bg-emerald-50 text-emerald-700"
                            }`}>
                              {email.category}
                            </span>

                            <span className="text-[9px] text-natural-muted font-bold flex items-center space-x-1">
                              {email.status === "opened" ? (
                                <CheckCheck className="h-3 w-3 text-natural-sage" />
                              ) : email.status === "sent" ? (
                                <Check className="h-3 w-3 text-slate-400" />
                              ) : (
                                <Clock className="h-3 w-3 text-slate-400" />
                              )}
                              <span className="capitalize">{email.status}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Email Content Reader / Compose Pane */}
              <div className="md:col-span-7 flex flex-col bg-white">
                {showEmailCompose ? (
                  /* COMPOSE EMAIL VIEW */
                  <form onSubmit={handleSendEmail} className="p-5 space-y-4 flex flex-col h-full text-left justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex justify-between items-center border-b border-natural-border pb-2">
                        <span className="font-serif font-black text-xs text-natural-dark-sage">Compose Secure HIPAA Mail</span>
                        <button
                          type="button"
                          onClick={() => setShowEmailCompose(false)}
                          className="text-[10px] text-natural-muted hover:text-natural-dark-sage font-bold"
                        >
                          Discard
                        </button>
                      </div>

                      <div className="grid grid-cols-12 gap-3 text-xs">
                        <span className="col-span-2 text-natural-muted font-bold self-center">From:</span>
                        <input
                          type="text"
                          readOnly
                          value="sarah.jenkins@gmail.com (You)"
                          className="col-span-10 bg-natural-beige/30 border border-natural-border rounded-lg p-1.5 outline-none font-bold text-natural-dark-sage"
                        />

                        <span className="col-span-2 text-natural-muted font-bold self-center">To:</span>
                        <input
                          type="text"
                          readOnly
                          value="support@carepulse.org (Clinic Center)"
                          className="col-span-10 bg-natural-beige/30 border border-natural-border rounded-lg p-1.5 outline-none font-bold text-natural-dark-sage"
                        />

                        <span className="col-span-2 text-natural-muted font-bold self-center">Category:</span>
                        <select
                          value={composeCategory}
                          onChange={(e) => setComposeCategory(e.target.value as EmailRecord["category"])}
                          className="col-span-10 bg-white border border-natural-border rounded-lg p-1.5 outline-none font-bold text-natural-dark-sage text-xs cursor-pointer"
                        >
                          <option value="clinical">Clinical Consultation</option>
                          <option value="appointment">Appointment Rescheduling</option>
                          <option value="refill">Refill Escalation</option>
                          <option value="billing">Billing/Insurance Audit</option>
                        </select>

                        <span className="col-span-2 text-natural-muted font-bold self-center">Subject:</span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lisinopril medication Side Effects..."
                          value={composeSubject}
                          onChange={(e) => setComposeSubject(e.target.value)}
                          className="col-span-10 bg-white border border-natural-border focus:border-natural-sage rounded-lg p-1.5 outline-none font-bold text-natural-dark-sage text-xs text-left"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-xs text-natural-muted font-bold block">Secure Message Body:</span>
                        <textarea
                          required
                          rows={11}
                          placeholder="Provide details about your clinical query, refill request, or billing support ticket..."
                          value={composeBody}
                          onChange={(e) => setComposeBody(e.target.value)}
                          className="w-full bg-white border border-natural-border focus:border-natural-sage rounded-lg p-3 outline-none text-xs text-natural-dark-sage font-bold leading-relaxed resize-none text-left"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-natural-sage hover:bg-natural-dark-sage text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-natural-sage/20 cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Dispatch Secured Message</span>
                    </button>
                  </form>
                ) : selectedEmail ? (
                  /* READ EMAIL VIEW */
                  <div className="flex flex-col h-full justify-between">
                    <div className="p-5 space-y-4 text-left border-b border-natural-border flex-1 overflow-y-auto">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <h2 className="font-serif font-black text-sm text-natural-dark-sage leading-snug">
                            {selectedEmail.subject}
                          </h2>
                          <div className="text-[10px] text-natural-muted font-bold space-y-0.5">
                            <p>From: <span className="text-natural-dark-sage font-semibold">{selectedEmail.sender}</span></p>
                            <p>To: <span className="text-natural-dark-sage font-semibold">{selectedEmail.recipient}</span></p>
                          </div>
                        </div>

                        <span className={`text-[10px] shrink-0 px-2 py-1 rounded-full font-bold border ${
                          selectedEmail.sender === "sarah.jenkins@gmail.com" 
                            ? "bg-slate-50 border-slate-200 text-slate-500" 
                            : "bg-natural-sage/10 border-natural-sage/20 text-natural-dark-sage"
                        }`}>
                          {selectedEmail.sender === "sarah.jenkins@gmail.com" ? "Outbox Log" : "Inbox Encrypted"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-natural-muted-light border-y border-natural-border-light py-2">
                        <span className="font-bold flex items-center space-x-1">
                          <Clock className="h-3.5 w-3.5 text-natural-sage" />
                          <span>Delivered on: {formatMsgDate(selectedEmail.timestamp)}</span>
                        </span>
                        
                        <div className="flex items-center space-x-2">
                          <span className="font-mono bg-natural-beige text-[9px] text-natural-dark-sage px-2 py-0.5 rounded-md font-bold">
                            CAT: {selectedEmail.category.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {/* Render Sandboxed HTML Content safely */}
                      <div 
                        className="prose prose-xs max-w-none text-xs text-natural-text leading-relaxed font-bold py-2 space-y-3 bg-natural-beige/10 p-4 rounded-xl border border-natural-border-light/60 text-left"
                        dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                      />
                    </div>

                    {/* Email controls footer */}
                    <div className="p-3 bg-natural-beige/30 flex justify-between items-center shrink-0">
                      <div className="flex items-center space-x-1.5 text-[10px] text-natural-muted font-bold">
                        <ShieldCheck className="h-4 w-4 text-natural-sage shrink-0" />
                        <span>HIPAA Encrypted Email Exchange</span>
                      </div>

                      <button
                        onClick={() => {
                          const docWindow = window.open("", "_blank");
                          if (docWindow) {
                            docWindow.document.write(`
                              <html>
                                <head>
                                  <title>CarePulse HIPAA Statement Print</title>
                                  <style>
                                    body { font-family: sans-serif; padding: 40px; color: #333; }
                                    .header { border-bottom: 2px solid #5a6b5d; padding-bottom: 15px; margin-bottom: 20px; }
                                    .title { font-size: 20px; font-weight: bold; color: #354238; }
                                    .meta { font-size: 11px; color: #666; margin-top: 10px; }
                                    .content { font-size: 13px; line-height: 1.6; padding: 20px; background: #faf8f5; border: 1px solid #ddd; border-radius: 8px; }
                                  </style>
                                </head>
                                <body>
                                  <div class="header">
                                    <div class="title">${selectedEmail.subject}</div>
                                    <div class="meta">
                                      <p>Sender: ${selectedEmail.sender}</p>
                                      <p>Recipient: ${selectedEmail.recipient}</p>
                                      <p>Timestamp: ${selectedEmail.timestamp}</p>
                                    </div>
                                  </div>
                                  <div class="content">
                                    ${selectedEmail.body}
                                  </div>
                                </body>
                              </html>
                            `);
                            docWindow.document.close();
                          } else {
                            alert("Allow popups to print HIPAA e-statement summaries!");
                          }
                        }}
                        className="px-3 py-1.5 bg-white border border-natural-border hover:bg-natural-beige text-natural-dark-sage text-[10px] rounded-lg font-bold flex items-center space-x-1 cursor-pointer transition-all active:scale-95"
                      >
                        <ExternalLink className="h-3 w-3 text-natural-sage" />
                        <span>Print Statement</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-natural-muted text-center space-y-2">
                    <Mail className="h-8 w-8 text-slate-300 animate-bounce" />
                    <span className="font-serif font-bold text-natural-dark-sage block text-xs">Select Email Notification</span>
                    <p className="text-[10px] text-natural-muted max-w-xs mx-auto">Choose any clinical transaction notification on the left to verify active email pathways.</p>
                  </div>
                )}
              </div>

            </div>
          )}


          {/* SMS MOBILE GATEWAY & LOGS */}
          {activeTab === "sms" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[580px]">
              
              {/* SMARTPHONE MOBILE INTERFACE */}
              <div className="md:col-span-5 flex justify-center items-center h-full">
                
                {/* Physical Bezel structure */}
                <div className="w-[280px] h-[550px] bg-slate-900 rounded-[44px] p-3 shadow-2xl relative border-[4px] border-slate-700 flex flex-col overflow-hidden">
                  
                  {/* Speaker slot & camera dot bezel */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl z-40 flex justify-center items-center">
                    <div className="w-10 h-1 bg-slate-800 rounded-full mb-1 shrink-0" />
                    <div className="w-2.5 h-2.5 bg-slate-900 border border-slate-800 rounded-full shrink-0 ml-2" />
                  </div>

                  {/* Smartphone screen canvas */}
                  <div className="flex-1 bg-white rounded-[32px] overflow-hidden flex flex-col relative pt-5">
                    
                    {/* Top status bar mock */}
                    <div className="h-5 px-5 bg-natural-beige/30 border-b border-natural-border-light flex justify-between items-center text-[9px] text-natural-muted-light font-bold shrink-0">
                      <span>9:41 AM</span>
                      <div className="flex items-center space-x-1">
                        <span>5G</span>
                        <div className="w-4 h-2 bg-natural-muted rounded-xs" />
                      </div>
                    </div>

                    {/* Chat header bar */}
                    <div className="p-2 border-b border-natural-border bg-white flex items-center space-x-2 shrink-0">
                      <div className="h-7 w-7 rounded-full bg-natural-sage/15 text-natural-sage flex items-center justify-center font-bold text-[10px]">
                        CP
                      </div>
                      <div className="text-left leading-tight">
                        <span className="font-bold text-[10px] text-natural-dark-sage block">CarePulse Shortcode</span>
                        <span className="text-[8px] text-natural-sage font-bold block">● Online (847-22)</span>
                      </div>
                    </div>

                    {/* Chat bubbles list */}
                    <div className="flex-1 overflow-y-auto p-3 bg-natural-bg/10 space-y-2.5">
                      {smsLogs.map((sms) => {
                        const isPatient = sms.from === patient.phone;
                        return (
                          <div 
                            key={sms.id} 
                            onClick={() => setSelectedSmsId(sms.id)}
                            className={`flex ${isPatient ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
                          >
                            <div className={`max-w-[85%] p-2.5 rounded-2xl text-left space-y-0.5 shadow-xs ${
                              isPatient 
                                ? "bg-natural-dark-sage text-white rounded-tr-none text-[10px]" 
                                : "bg-white text-natural-text rounded-tl-none border border-natural-border text-[10px]"
                            }`}>
                              <p className="leading-relaxed font-bold">{sms.body}</p>
                              <div className="flex justify-between items-center text-[7px] opacity-65 pt-1 font-mono">
                                <span className="uppercase">{sms.category}</span>
                                <div className="flex items-center space-x-0.5">
                                  <span>{formatMsgDate(sms.timestamp).split(" ")[1] || ""}</span>
                                  {isPatient && <CheckCheck className="h-2 w-2 stroke-[3]" />}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={smsEndRef} />
                    </div>

                    {/* Smartphone message keyboard text area */}
                    <div className="p-2 border-t border-natural-border bg-white shrink-0 flex items-center space-x-1">
                      <input
                        type="text"
                        placeholder="Text CarePulse (847-22)..."
                        value={smsInputText}
                        onChange={(e) => setSmsInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendSmsText();
                        }}
                        className="flex-1 bg-natural-bg border border-natural-border rounded-xl px-3 py-1.5 text-[10px] outline-none text-left font-bold text-natural-dark-sage focus:border-natural-sage"
                      />
                      <button
                        onClick={handleSendSmsText}
                        disabled={!smsInputText.trim()}
                        className="p-1.5 bg-natural-sage hover:bg-natural-dark-sage disabled:opacity-40 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        <Send className="h-3.5 w-3.5 fill-white stroke-none" />
                      </button>
                    </div>

                  </div>
                </div>

              </div>

              {/* SMS GATEWAY DISPATCH CONTROL CENTER */}
              <div className="md:col-span-7 bg-white border border-natural-border rounded-[28px] p-5 shadow-xs flex flex-col justify-between text-left h-full">
                
                <div className="space-y-4 overflow-y-auto pr-1">
                  <div className="border-b border-natural-border-light pb-2.5">
                    <span className="font-serif font-black text-xs text-natural-dark-sage block">Clinical Text Alert Trigger</span>
                    <p className="text-[10px] text-natural-muted font-bold">Instantly push simulated medical notifications to Sarah's device.</p>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] text-natural-sage font-bold uppercase tracking-wider block">Standard Medical Presets</span>
                    
                    {/* Presets Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={handleTriggerRefillSmsSim}
                        className="p-3 bg-[#fdf9f5] hover:bg-[#faf4ed] border border-[#f5ece3] hover:border-natural-clay text-left rounded-xl transition-all cursor-pointer space-y-1 group"
                      >
                        <div className="flex items-center justify-between text-natural-clay">
                          <Pill className="h-4 w-4" />
                          <span className="text-[8px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">REFILL</span>
                        </div>
                        <span className="font-serif font-black text-[11px] text-[#3d463e] block">Prescription Pickup SMS</span>
                        <p className="text-[9px] text-natural-muted leading-snug">Simulate automated Walgreens pick-up pharmacy reminders.</p>
                      </button>

                      <button
                        onClick={handleTriggerVitalsAlertSmsSim}
                        className="p-3 bg-[#f4f7f4] hover:bg-[#edf2ed] border border-[#e1e9e2] hover:border-natural-sage text-left rounded-xl transition-all cursor-pointer space-y-1 group"
                      >
                        <div className="flex items-center justify-between text-natural-sage">
                          <Heart className="h-4 w-4" />
                          <span className="text-[8px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">VITAL</span>
                        </div>
                        <span className="font-serif font-black text-[11px] text-[#3d463e] block">Biometrics Limit Alert</span>
                        <p className="text-[9px] text-natural-muted leading-snug">Trigger text alert copy for glucose limits exceeded.</p>
                      </button>
                    </div>
                  </div>

                  {/* CUSTOM COMPOSED BROADCAST FORM */}
                  <form onSubmit={handleTriggerCustomSmsSim} className="space-y-3 pt-2">
                    <span className="text-[10px] text-natural-sage font-bold uppercase tracking-wider block">Compose Staff Broadcast SMS</span>
                    
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={customSmsCategory}
                          onChange={(e) => setComposeCategory(e.target.value as EmailRecord["category"])}
                          className="flex-1 bg-white border border-natural-border rounded-lg p-1.5 outline-none font-bold text-natural-dark-sage text-[10px] cursor-pointer"
                        >
                          <option value="appointment">Appointment Update</option>
                          <option value="refill">Refill Clearance</option>
                          <option value="clinical">Clinical Consultation</option>
                          <option value="security">Security / OTP Verify</option>
                        </select>
                        <input
                          type="text"
                          readOnly
                          value={`Recipient: ${patient.phone}`}
                          className="bg-natural-beige/30 border border-natural-border text-natural-muted rounded-lg p-1.5 text-[10px] outline-none font-bold"
                        />
                      </div>

                      <textarea
                        required
                        rows={4}
                        placeholder="Type SMS text message to dispatch to the Patient device... (max 160 chars)"
                        maxLength={160}
                        value={customSmsTriggerText}
                        onChange={(e) => setCustomSmsTriggerText(e.target.value)}
                        className="w-full bg-white border border-natural-border focus:border-natural-sage rounded-lg p-2.5 outline-none text-[11px] text-natural-dark-sage font-bold leading-normal resize-none text-left"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!customSmsTriggerText.trim()}
                      className="w-full py-2 bg-natural-sage hover:bg-natural-dark-sage disabled:opacity-50 text-white text-[11px] font-bold rounded-xl transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Dispatch Custom Shortcode Text</span>
                    </button>
                  </form>
                </div>

                {/* Info block */}
                <div className="bg-natural-beige/50 p-3 rounded-2xl border border-natural-border-light text-[10px] text-natural-muted space-y-1 mt-4">
                  <div className="flex items-center space-x-1.5 font-bold text-natural-dark-sage">
                    <Info className="h-3.5 w-3.5" />
                    <span>Clinical shortcode: 847-22</span>
                  </div>
                  <p className="leading-relaxed">
                    Shortcode exchanges bypass normal carrier lag to enforce immediate delivery. All responses are logged automatically in compliance with HIPAA audit trails.
                  </p>
                </div>

              </div>

            </div>
          )}

        </div>


        {/* RIGHT SIDEBAR: CHANNEL PREFERENCES & AUDIT CONTROLS */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* SECURE PREFERENCES CARD */}
          <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs text-left space-y-4">
            <div className="border-b border-natural-border-light pb-3">
              <span className="font-serif font-black text-xs text-natural-dark-sage block">Pathway Channels Preferences</span>
              <p className="text-[10px] text-natural-muted font-bold">Toggle automated clinical trigger pipelines.</p>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* Email section */}
              <div className="space-y-2">
                <span className="text-[10px] text-natural-sage font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Mail className="h-3 w-3" />
                  <span>Email Automations</span>
                </span>
                
                <div className="space-y-2 bg-natural-beige/10 p-3 rounded-xl border border-natural-border-light">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-natural-muted font-bold">Email Lab Result releases</span>
                    <input
                      type="checkbox"
                      checked={emailLabsPref}
                      onChange={(e) => {
                        setEmailLabsPref(e.target.checked);
                        triggerToast("Updated Automated Email configurations!");
                      }}
                      className="accent-natural-sage h-4 w-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-natural-muted font-bold">Email Care Plan summaries</span>
                    <input
                      type="checkbox"
                      checked={emailCareplanPref}
                      onChange={(e) => {
                        setEmailCareplanPref(e.target.checked);
                        triggerToast("Updated Care Plan delivery preferences!");
                      }}
                      className="accent-natural-sage h-4 w-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

              {/* SMS section */}
              <div className="space-y-2">
                <span className="text-[10px] text-natural-sage font-bold uppercase tracking-wider flex items-center space-x-1">
                  <Smartphone className="h-3 w-3" />
                  <span>SMS Carrier Alerts</span>
                </span>
                
                <div className="space-y-2 bg-natural-beige/10 p-3 rounded-xl border border-natural-border-light">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-natural-muted font-bold">SMS Prescription alerts</span>
                    <input
                      type="checkbox"
                      checked={smsRefillPref}
                      onChange={(e) => {
                        setSmsRefillPref(e.target.checked);
                        triggerToast("Updated Rx SMS notifications!");
                      }}
                      className="accent-natural-sage h-4 w-4 cursor-pointer"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs text-natural-muted font-bold">SMS Daily Vitals reminders</span>
                    <input
                      type="checkbox"
                      checked={smsVitalsPref}
                      onChange={(e) => {
                        setSmsVitalsPref(e.target.checked);
                        triggerToast("Updated bio-reminders!");
                      }}
                      className="accent-natural-sage h-4 w-4 cursor-pointer"
                    />
                  </label>
                </div>
              </div>

            </div>
          </div>

          {/* SECURE EXCEL DATA DISPATCHER CARD */}
          <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs text-left space-y-4">
            <div className="border-b border-natural-border-light pb-3">
              <span className="font-serif font-black text-xs text-natural-dark-sage block flex items-center gap-1.5">
                <FileSpreadsheet className="h-4.5 w-4.5 text-natural-sage shrink-0" />
                <span>Secure Excel Document Dispatcher</span>
              </span>
              <p className="text-[10px] text-natural-muted font-bold">Compile clinical ledgers into standard Excel sheets and send via email.</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-natural-sage font-bold uppercase tracking-wider block">1. Select Patient Dataset</span>
                <select
                  value={exportDataset}
                  onChange={(e) => setExportDataset(e.target.value as any)}
                  className="w-full bg-white border border-natural-border rounded-lg p-2 outline-none font-bold text-natural-dark-sage text-xs cursor-pointer"
                >
                  <option value="vitals">Vitals History Telemetry (30 days)</option>
                  <option value="prescriptions">Active Prescriptions Ledger</option>
                  <option value="billing">Billing & Insurance Ledger</option>
                </select>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] text-natural-sage font-bold uppercase tracking-wider block">2. Delivery Pathway</span>
                <div className="p-2.5 bg-natural-beige/30 border border-natural-border-light rounded-xl space-y-1 text-[11px]">
                  <p className="font-bold text-natural-dark-sage flex items-center gap-1">
                    <Mail className="h-3 w-3 text-natural-sage" />
                    <span>Send to: sarah.jenkins@gmail.com</span>
                  </p>
                  <p className="text-[9px] text-natural-muted leading-tight">
                    Simulates standard encrypted physician email routing with a physical file attachment download on completion.
                  </p>
                </div>
              </div>

              <button
                onClick={handleExportAndEmailExcel}
                className="w-full py-2.5 bg-natural-sage hover:bg-natural-dark-sage text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-natural-sage/10 cursor-pointer"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Export & Email Excel</span>
              </button>
            </div>
          </div>

          {/* SATELLITE STATISTICS CARD */}
          <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs text-left space-y-4">
            <div>
              <span className="font-serif font-black text-xs text-natural-dark-sage block">Ecosystem Integrity Scores</span>
              <p className="text-[10px] text-natural-muted font-bold">Operational integrity of outbound gateways.</p>
            </div>

            <div className="space-y-3.5 text-xs text-natural-text">
              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-natural-dark-sage">
                  <span>Outbound SMS Deliverability</span>
                  <span className="font-bold text-natural-sage">100.0%</span>
                </div>
                <div className="w-full bg-natural-beige h-1.5 rounded-full overflow-hidden">
                  <div className="bg-natural-sage h-full w-[100%]" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold text-natural-dark-sage">
                  <span>Outbound Email Spam Score</span>
                  <span className="font-bold text-natural-sage">0.05 (Safe)</span>
                </div>
                <div className="w-full bg-natural-beige h-1.5 rounded-full overflow-hidden">
                  <div className="bg-natural-sage h-full w-[10%]" />
                </div>
              </div>

              <div className="flex justify-between items-center bg-natural-beige/30 p-2.5 rounded-xl border border-natural-border-light text-[10px] font-bold text-natural-muted-light">
                <span>ACTIVE PATHS: SMTP & TWILIO MOCK</span>
                <span className="text-natural-sage font-mono text-[9px]">ENCRYPTED</span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
