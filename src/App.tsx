import React, { useState, useEffect } from "react";
import { 
  Heart, 
  Activity, 
  TrendingUp, 
  Clock, 
  Calendar, 
  FileText, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  Users, 
  FileSpreadsheet, 
  ChevronRight,
  ShieldCheck,
  Video,
  Sparkles,
  Award,
  BellRing,
  Mail
} from "lucide-react";
import { getInitialState, DashboardState, saveState, formatDate } from "./data";
import Header from "./components/Header";
import EmergencySOS from "./components/EmergencySOS";
import PatientOnboarding from "./components/PatientOnboarding";
import SymptomChecker from "./components/SymptomChecker";
import AppointmentBooking from "./components/AppointmentBooking";
import VitalSignsTracking from "./components/VitalSignsTracking";
import MedicalRecords from "./components/MedicalRecords";
import PrescriptionTracker from "./components/PrescriptionTracker";
import SecureMessaging from "./components/SecureMessaging";
import BillingInsurance from "./components/BillingInsurance";
import TelemedicineRoom from "./components/TelemedicineRoom";
import DoctorPortal from "./components/DoctorPortal";
import LiveEmergencyMonitor from "./components/LiveEmergencyMonitor";
import CommunicationsHub from "./components/CommunicationsHub";
import { Appointment, Doctor, Patient } from "./types";
import { testConnection, loadStateFromFirestore } from "./utils/firebaseDb";

export default function App() {
  const [state, setState] = useState<DashboardState>(getInitialState());
  const [dbLoading, setDbLoading] = useState(true);

  // Sync state with Cloud Firestore on boot
  useEffect(() => {
    async function syncCloudState() {
      try {
        await testConnection();
        const cloudState = await loadStateFromFirestore();
        if (cloudState) {
          setState(cloudState);
          // Sync to localStorage
          localStorage.setItem("CAREPULSE_DASHBOARD_STATE", JSON.stringify(cloudState));
        }
      } catch (err) {
        // Silent fallback to localStorage state — Firestore unavailable
      } finally {
        setDbLoading(false);
      }
    }
    syncCloudState();
  }, []);

  // Navigation and Modal State
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [showSOS, setShowSOS] = useState(false);

  // Active Telehealth Call Room state
  const [activeTelehealthAppt, setActiveTelehealthAppt] = useState<Appointment | null>(null);

  // Prefilled symptom evaluation data to pipe straight into Booking Appointment workflow!
  const [prefillBookingData, setPrefillBookingData] = useState<{ symptoms: string[]; severity: number; notes: string } | null>(null);

  // Doctor Admin sub-states (when role === 'doctor')
  const [selectedDoctorPatientId, setSelectedDoctorPatientId] = useState<string>("pat_1");

  // Keep state saved and synced
  const handleUpdateState = (newState: DashboardState) => {
    setState(newState);
    saveState(newState);
  };

  const handleTriggerBookingPrefill = (data: { symptoms: string[]; severity: number; notes: string }) => {
    setPrefillBookingData(data);
    setCurrentTab("booking");
  };

  // Helper calculation for dashboard summaries
  const todayStr = new Date().toISOString().split("T")[0];
  const activePrescriptions = state.prescriptions.filter(p => p.active);
  const pendingAppointments = state.appointments.filter(a => a.status === "scheduled");
  const completedAppointments = state.appointments.filter(a => a.status === "completed");

  const latestVital = state.vitals[state.vitals.length - 1] || {
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
    oxygenSaturation: 98,
    timestamp: new Date().toISOString()
  };

  const handleLaunchTelehealth = (appt: Appointment) => {
    setActiveTelehealthAppt(appt);
  };

  if (dbLoading) {
    return (
      <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col items-center justify-center p-6" id="carepulse-application-loader">
        <div className="text-center space-y-4 max-w-sm">
          <div className="h-12 w-12 rounded-full border-4 border-natural-sage border-t-transparent animate-spin mx-auto" />
          <h1 className="font-serif font-extrabold text-xl text-natural-dark-sage tracking-tight">CarePulse EHR</h1>
          <p className="text-xs text-natural-muted font-bold">Securely synchronizing clinical health records & patient files with your Cloud Firestore fallback database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-natural-bg text-natural-text font-sans flex flex-col justify-between selection:bg-natural-cream selection:text-natural-dark-sage" id="carepulse-application-root">
      
      {/* GLOBAL HEADERS & EMERGENCY TRIGGER MODAL */}
      <Header 
        state={state} 
        onChangeState={handleUpdateState} 
        currentTab={currentTab} 
        onNavigate={setCurrentTab} 
        onTriggerSOS={() => setShowSOS(true)} 
      />

      <EmergencySOS 
        state={state} 
        isOpen={showSOS}
        onClose={() => setShowSOS(false)} 
      />

      {/* ACTIVE CLINICAL TELEHEALTH ROOM OVERLAY */}
      {activeTelehealthAppt && (
        <div className="fixed inset-0 bg-[#2f3630]/95 z-50 overflow-y-auto flex items-center justify-center p-4 backdrop-blur-xs">
          <TelemedicineRoom 
            state={state} 
            onChangeState={handleUpdateState} 
            activeAppt={activeTelehealthAppt} 
            onExit={() => setActiveTelehealthAppt(null)} 
          />
        </div>
      )}

      {/* CORE ROUTING STAGE */}
      <main className="flex-1 max-w-7xl w-full mx-auto pb-16">
        
        {/* IF USER ROLE IS DOCTOR / CLINIC STAFF ADMIN */}
        {state.activeUserRole === "doctor" ? (
          <DoctorPortal 
            state={state} 
            onChangeState={handleUpdateState} 
          />
        ) : (
          /* OTHERWISE USER IS A PATIENT (SARAH JENKINS) */
          <div className="px-4">
            
            {/* Elegant Sub-Header Navigation for Patient Ecosystem */}
            <div className="max-w-7xl mx-auto mt-4 mb-6 flex flex-wrap gap-2 pb-4 border-b border-natural-border-light overflow-x-auto justify-start" id="patient-navigation-menu">
              {[
                { id: "dashboard", label: "Dashboard", icon: Activity },
                { id: "vitals", label: "Vitals & Wi-Fi", icon: Heart },
                { id: "records", label: "Medical Records", icon: FileText },
                { id: "prescriptions", label: "Medications", icon: Clock },
                { id: "messaging", label: "Doctor Chat", icon: Users },
                { id: "checker", label: "Symptom Triage", icon: Sparkles },
                { id: "booking", label: "Book Appointment", icon: Calendar },
                { id: "billing", label: "Billing Ledger", icon: FileSpreadsheet },
                { id: "communications", label: "Email & SMS Hub", icon: Mail }
              ].map(tab => {
                const TabIcon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentTab(tab.id)}
                    className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                      isActive 
                        ? "bg-natural-sage text-white shadow-md shadow-natural-sage/20" 
                        : "bg-white border border-natural-border/60 hover:bg-natural-beige text-natural-muted hover:text-natural-dark-sage"
                    }`}
                  >
                    <TabIcon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
            
            {/* TAB 1: Main Patient Dashboard */}
            {currentTab === "dashboard" && (
              <div className="py-8 space-y-8 text-left" id="patient-dashboard-tab">
                
                {/* Onboarding checklist flag (Only shows if onboarding is incomplete) */}
                {!state.patient.onboardingCompleted && (
                  <div className="p-5 bg-natural-terracotta/10 border border-natural-terracotta/30 rounded-[24px] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs animate-pulse">
                    <div className="flex items-start space-x-3 text-xs text-natural-text">
                      <AlertTriangle className="h-5 w-5 text-natural-terracotta shrink-0 mt-0.5" />
                      <div>
                        <span className="font-serif font-bold text-sm text-natural-dark-sage block mb-0.5">Patient Electronic Records Incomplete</span>
                        Your state-required HIPAA consent forms, clinical questionnaire, and insurance card logs are outstanding. Let's resolve this before booking a physician consult.
                      </div>
                    </div>
                    <button 
                      onClick={() => setCurrentTab("onboarding")}
                      className="px-5 py-2.5 bg-natural-terracotta hover:bg-[#b05e4f] text-white text-xs font-bold rounded-full transition-all shrink-0 shadow-md shadow-natural-terracotta/20 uppercase tracking-wider"
                    >
                      Complete Records File
                    </button>
                  </div>
                )}

                {/* Dashboard grid widgets summary */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Quick Actions and metrics */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Visual metrics cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      {/* BP card */}
                      <div 
                        onClick={() => setCurrentTab("vitals")}
                        className="bg-[#f6f7fb] border border-[#e8ecf5] hover:border-[#6c86d9] hover:shadow-md transition-all duration-200 cursor-pointer p-5 rounded-[24px] flex justify-between items-center shadow-xs group"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] text-natural-muted font-bold uppercase tracking-widest block group-hover:text-[#6c86d9]">Blood Pressure</span>
                          <span className="text-2xl font-serif font-bold block text-natural-dark-sage">
                            {latestVital.bloodPressureSystolic}/{latestVital.bloodPressureDiastolic}
                          </span>
                          <span className="text-[10px] text-natural-muted block">mmHg • Systolic/Diastolic</span>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-white text-[#6c86d9] border border-[#e8ecf5] flex items-center justify-center shadow-xs group-hover:bg-[#6c86d9] group-hover:text-white transition-all">
                          <Heart className="h-5 w-5 fill-current" />
                        </div>
                      </div>

                      {/* Pulse rate card */}
                      <div 
                        onClick={() => setCurrentTab("vitals")}
                        className="bg-[#f4f7f4] border border-[#e1e9e2] hover:border-natural-sage hover:shadow-md transition-all duration-200 cursor-pointer p-5 rounded-[24px] flex justify-between items-center shadow-xs group"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] text-natural-sage font-bold uppercase tracking-widest block group-hover:text-natural-sage">Pulse Rate</span>
                          <span className="text-2xl font-serif font-bold block text-[#3d463e]">
                            {latestVital.heartRate} <span className="text-xs italic text-natural-sage font-normal">bpm</span>
                          </span>
                          <span className="text-[10px] text-natural-muted block">Steady normal rhythm</span>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-white text-natural-sage border border-[#e1e9e2] flex items-center justify-center shadow-xs group-hover:bg-natural-sage group-hover:text-white transition-all">
                          <Activity className="h-5 w-5" />
                        </div>
                      </div>

                      {/* Oxygen card */}
                      <div 
                        onClick={() => setCurrentTab("vitals")}
                        className="bg-[#fdf9f5] border border-[#f5ece3] hover:border-natural-clay hover:shadow-md transition-all duration-200 cursor-pointer p-5 rounded-[24px] flex justify-between items-center shadow-xs group"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] text-natural-clay font-bold uppercase tracking-widest block group-hover:text-natural-clay">Oxygen Level</span>
                          <span className="text-2xl font-serif font-bold block text-[#3d463e]">
                            {latestVital.oxygenSaturation}<span className="text-xs italic text-natural-clay font-normal">% O₂</span>
                          </span>
                          <span className="text-[10px] text-natural-muted block">Normal blood oxygen</span>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-white text-natural-clay border border-[#f5ece3] flex items-center justify-center shadow-xs group-hover:bg-natural-clay group-hover:text-white transition-all">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                      </div>

                    </div>

                    {/* Real-time Emergency Medical Telemetry Guard */}
                    <LiveEmergencyMonitor state={state} onChangeState={handleUpdateState} />

                    {/* Pending virtual consult queues */}
                    <div className="bg-white border border-natural-border rounded-[32px] p-6 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-natural-border-light pb-3">
                        <span className="font-serif text-lg text-natural-dark-sage font-bold">Upcoming Physician Appointments</span>
                        <button 
                          onClick={() => setCurrentTab("booking")}
                          className="text-[10px] text-natural-sage font-bold uppercase tracking-widest underline underline-offset-4 hover:text-natural-dark-sage"
                        >
                          Book consultation
                        </button>
                      </div>

                      <div className="space-y-3">
                        {pendingAppointments.length === 0 ? (
                          <div className="py-8 text-center text-xs text-natural-muted">No scheduled visits in your dashboard.</div>
                        ) : (
                          pendingAppointments.map(appt => (
                            <div key={appt.id} className="p-4 bg-natural-beige rounded-2xl border border-natural-border-light flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs text-natural-text">
                              <div className="text-left space-y-0.5">
                                <span className="font-serif font-bold text-natural-dark-sage block text-sm">Consultation with {appt.doctorName}</span>
                                <span className="text-[10px] text-natural-muted block">Scheduled: {appt.date} @ {appt.timeSlot} — Modality: {appt.type}</span>
                                <span className="text-[10px] text-natural-sage font-bold block">Reason: {appt.reason}</span>
                              </div>

                              <button 
                                onClick={() => handleLaunchTelehealth(appt)}
                                className="px-4 py-2 bg-natural-sage hover:bg-natural-dark-sage text-white text-xs font-bold rounded-full flex items-center space-x-1.5 shadow-md shadow-natural-sage/20 transition-all"
                              >
                                <Video className="h-3.5 w-3.5" />
                                <span>Join Virtual Room</span>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Active prescription dosage checklists */}
                    <div className="bg-white border border-natural-border rounded-[32px] p-6 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-natural-border-light pb-3">
                        <span className="font-serif text-lg text-natural-dark-sage font-bold">Your Active Daily Medications</span>
                        <button 
                          onClick={() => setCurrentTab("prescriptions")}
                          className="text-[10px] text-natural-sage font-bold uppercase tracking-widest underline underline-offset-4 hover:text-natural-dark-sage"
                        >
                          View refills
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activePrescriptions.map(p => (
                          <div key={p.id} className="p-4 bg-natural-beige border border-natural-border-light rounded-2xl flex justify-between items-center text-xs">
                            <div className="text-left space-y-1">
                              <span className="font-serif font-bold text-natural-dark-sage block text-sm">{p.medicationName}</span>
                              <span className="text-[10px] text-natural-muted block">Dosage: {p.dosage} • {p.frequency}</span>
                            </div>
                            <span className="font-mono text-[10px] text-natural-clay font-bold bg-white px-2 py-1 rounded-md border border-natural-border-light">Refills: {p.refillsRemaining}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: AI Co-pilot assistant quick panel & stats */}
                  <div className="lg:col-span-4 space-y-6">
                    
                    {/* AI helper box */}
                    <div className="bg-[#5a6b5d] text-white rounded-[32px] p-6 shadow-md space-y-4 relative overflow-hidden border border-[#70827133]">
                      <div className="absolute -bottom-10 -right-10 opacity-10">
                        <Sparkles className="h-28 w-28 text-[#d9ad8c]" />
                      </div>

                      <div className="space-y-1 relative z-10">
                        <div className="flex items-center space-x-1.5 text-[#d9ad8c]">
                          <Sparkles className="h-4 w-4 animate-pulse fill-[#d9ad8c]/20" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Clinical AI Assistant</span>
                        </div>
                        <h3 className="font-serif font-bold text-base text-white block">Symptom Checker Evaluation</h3>
                        <p className="text-xs text-natural-cream/90 leading-relaxed">
                          Feeling unwell? Answer a quick set of medical questions to instantly run triage and estimate clinical severity.
                        </p>
                      </div>

                      <button 
                        onClick={() => setCurrentTab("checker")}
                        className="w-full py-2.5 bg-white text-natural-forest hover:bg-natural-beige font-bold text-xs rounded-full shadow-lg shadow-[#70827122] transition-all relative z-10 uppercase tracking-wider"
                      >
                        Analyze Symptoms Now
                      </button>
                    </div>

                    {/* Patient health scores scorecard */}
                    <div className="bg-white border border-natural-border rounded-[32px] p-6 shadow-sm space-y-3.5">
                      <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">Clinical Target Scores</span>
                      
                      <div className="space-y-4 text-xs text-natural-text">
                        <div className="space-y-1.5">
                          <div className="flex justify-between font-semibold text-natural-dark-sage">
                            <span>Prescription compliance rating</span>
                            <span className="font-bold text-natural-sage">94%</span>
                          </div>
                          <div className="w-full bg-natural-beige h-1.5 rounded-full overflow-hidden">
                            <div className="bg-natural-sage h-full w-[94%]" />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between font-semibold text-natural-dark-sage">
                            <span>Biometric monitoring coverage</span>
                            <span className="font-bold text-natural-sage">100%</span>
                          </div>
                          <div className="w-full bg-natural-beige h-1.5 rounded-full overflow-hidden">
                            <div className="bg-natural-sage h-full w-[100%]" />
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: Onboarding */}
            {currentTab === "onboarding" && (
              <PatientOnboarding 
                state={state} 
                onChangeState={handleUpdateState} 
                onComplete={() => setCurrentTab("dashboard")} 
              />
            )}

            {/* TAB 3: Symptom Triage Checker */}
            {currentTab === "checker" && (
              <SymptomChecker 
                state={state} 
                onChangeState={handleUpdateState} 
                onNavigateToBooking={handleTriggerBookingPrefill} 
                onTriggerSOS={() => setShowSOS(true)}
              />
            )}

            {/* TAB 4: Booking */}
            {currentTab === "booking" && (
              <AppointmentBooking 
                state={state} 
                onChangeState={handleUpdateState} 
                prefillData={prefillBookingData} 
                onClearPrefill={() => setPrefillBookingData(null)}
                onNavigateToDashboard={() => setCurrentTab("dashboard")} 
              />
            )}

            {/* TAB 5: Vitals tracking */}
            {currentTab === "vitals" && (
              <VitalSignsTracking 
                state={state} 
                onChangeState={handleUpdateState} 
              />
            )}

            {/* TAB 6: Medical Records */}
            {currentTab === "records" && (
              <MedicalRecords 
                state={state} 
                onChangeState={handleUpdateState} 
              />
            )}

            {/* TAB 7: Prescription Tracker */}
            {currentTab === "prescriptions" && (
              <PrescriptionTracker 
                state={state} 
                onChangeState={handleUpdateState} 
              />
            )}

            {/* TAB 8: Secure chat */}
            {currentTab === "messaging" && (
              <SecureMessaging 
                state={state} 
                onChangeState={handleUpdateState} 
              />
            )}

            {/* TAB 9: Billing Ledger */}
            {currentTab === "billing" && (
              <BillingInsurance 
                state={state} 
                onChangeState={handleUpdateState} 
              />
            )}

            {/* TAB 10: Communications Hub (Email & SMS) */}
            {currentTab === "communications" && (
              <CommunicationsHub 
                state={state} 
                onChangeState={handleUpdateState} 
              />
            )}

          </div>
        )}

      </main>

      {/* FOOTER METADATA */}
      <footer className="border-t border-slate-200 bg-white py-5 shrink-0">
        <div className="max-w-7xl w-full mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider gap-2">
          <span>CarePulse • HIPAA Encrypted Healthcare Ecosystem</span>
          <span>© {new Date().getFullYear()} Clinical Networks Inc. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}
