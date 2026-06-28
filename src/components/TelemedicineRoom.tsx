import React, { useState, useEffect } from "react";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  MessageSquare, 
  FileText, 
  Share2, 
  Sparkles, 
  User, 
  Check, 
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { DashboardState, saveState } from "../data";
import { Appointment } from "../types";

interface TelemedicineRoomProps {
  state: DashboardState;
  onChangeState: (newState: DashboardState) => void;
  activeAppt: Appointment;
  onExit: () => void;
}

export default function TelemedicineRoom({ 
  state, 
  onChangeState, 
  activeAppt, 
  onExit 
}: TelemedicineRoomProps) {
  // Call States
  // 'lobby' | 'active' | 'summary'
  const [callState, setCallState] = useState<'lobby' | 'active' | 'summary'>('lobby');

  // Lobby device testing state
  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);

  // In-call local state
  const [showChat, setShowChat] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [callMessages, setCallMessages] = useState<{ sender: 'patient' | 'doctor', text: string, time: string }[]>([
    { sender: 'doctor', text: `Hi Sarah, I am reviewed your chart. Welcome to our virtual clinic!`, time: "Just now" }
  ]);

  // AI SOAP Note generation States
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [generatedSoap, setGeneratedSoap] = useState<{
    soapNote: { subjective: string, objective: string, assessment: string, plan: string },
    patientFriendlySummary: string,
    recommendedPrescriptions: { medication: string, dosage: string, frequency: string, reason: string }[],
    followUpTimeframe: string
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleJoinCall = () => {
    setCallState('active');
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setCallMessages(prev => [...prev, { sender: 'patient', text: chatInput.trim(), time: "Now" }]);
    const currentInput = chatInput.trim();
    setChatInput("");

    // Quick auto response simulation
    setTimeout(() => {
      setCallMessages(prev => [...prev, { 
        sender: 'doctor', 
        text: `Thanks for the input, Sarah. Let's make sure we log this in our clinical file.`, 
        time: "Now" 
      }]);
    }, 1500);
  };

  const handleEndCall = async () => {
    setCallState('summary');
    setIsGeneratingSummary(true);
    setErrorMsg(null);

    try {
      // Fetch dynamic medical visit summary from Gemini AI on the backend!
      const response = await fetch("/api/doctor-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: state.patient.name,
          age: 38,
          gender: state.patient.gender,
          vitals: state.vitals[state.vitals.length - 1] || {},
          primaryComplaint: activeAppt.reason,
          examFindings: activeAppt.notes
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact Gemini Clinical Summarizer.");
      }

      const data = await response.json();
      setGeneratedSoap(data);

      // Save SOAP Note back to this specific appointment in the global state!
      const updatedAppointments = state.appointments.map((appt) => {
        if (appt.id === activeAppt.id) {
          return {
            ...appt,
            status: "completed" as const,
            soapNote: data.soapNote
          };
        }
        return appt;
      });

      // Add prescription if recommended by Gemini
      let updatedPrescriptions = [...state.prescriptions];
      if (data.recommendedPrescriptions && data.recommendedPrescriptions.length > 0) {
        data.recommendedPrescriptions.forEach((rx: any, idx: number) => {
          updatedPrescriptions.push({
            id: `rx_ai_${Date.now()}_${idx}`,
            patientId: state.selectedPatientId,
            doctorId: activeAppt.doctorId,
            doctorName: activeAppt.doctorName,
            medicationName: rx.medication,
            dosage: rx.dosage,
            frequency: rx.frequency,
            refillsRemaining: 3,
            active: true,
            startDate: new Date().toISOString().split("T")[0],
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            pharmacy: {
              name: "Walgreens Pharmacy #4402",
              phone: "(555) 909-1234",
              address: "1205 NE Broadway, Seattle WA"
            },
            reminders: {
              enabled: true,
              time: "08:00 AM",
              frequency: rx.frequency
            }
          });
        });
      }

      const updatedState = {
        ...state,
        appointments: updatedAppointments,
        prescriptions: updatedPrescriptions
      };

      onChangeState(updatedState);
      saveState(updatedState);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to compile Clinical SOAP records.");
      loadBackupSoap();
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Safe High-Fidelity Backup SOAP note if AI key is missing
  const loadBackupSoap = () => {
    const backupData = {
      soapNote: {
        subjective: "Sarah reports occasional lightheadedness and moderate exhaustion during the day. Adherence to Lisinopril and Metformin remains high (94% compliance).",
        objective: "BP: 122/80 mmHg. Pulse: 72 bpm. Oxygen: 98% on room air. Lungs clear, healthy heart rhythm.",
        assessment: "Primary essential hypertension is well-controlled. Early symptoms of blood glucose fluctuations evaluated.",
        plan: "1. Continue daily Lisinopril 10mg. 2. Continue Metformin 500mg BID. 3. Track daily blood sugar before breakfast."
      },
      patientFriendlySummary: "Hello Sarah, your physical exam parameters look solid. We reviewed your daily blood pressure checks. Continue taking Lisinopril and Metformin as scheduled.",
      recommendedPrescriptions: [
        { medication: "CoQ10 Cardiovascular Supplement", dosage: "100mg", frequency: "Once daily with breakfast", reason: "Support cardiovascular muscle tone" }
      ],
      followUpTimeframe: "3 months standard wellness check"
    };

    setGeneratedSoap(backupData);

    const updatedAppointments = state.appointments.map((appt) => {
      if (appt.id === activeAppt.id) {
        return {
          ...appt,
          status: "completed" as const,
          soapNote: backupData.soapNote
        };
      }
      return appt;
    });

    const updatedState = {
      ...state,
      appointments: updatedAppointments
    };

    onChangeState(updatedState);
    saveState(updatedState);
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4" id="telehealth-video-room">
      
      {/* 1. LOBBY SCREEN (Camera/Mic Test) */}
      {callState === "lobby" && (
        <div className="bg-white rounded-[28px] border border-natural-border shadow-2xl overflow-hidden max-w-xl mx-auto p-6 md:p-8 space-y-6 text-left" id="telehealth-lobby">
          <div className="border-b border-natural-border-light pb-3">
            <span className="font-serif font-bold text-natural-dark-sage text-sm block">Pre-Visit Device Lobby</span>
            <span className="text-[10px] text-natural-muted block mt-1">Please test your camera and microphone components prior to starting your consult with {activeAppt.doctorName}.</span>
          </div>

          {/* Video Simulator feed */}
          <div className="relative bg-natural-dark-sage/95 aspect-video rounded-xl overflow-hidden flex items-center justify-center border border-natural-border">
            {cameraActive ? (
              <div className="absolute inset-0">
                <img 
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=600" 
                  alt="Self video preview" 
                  className="w-full h-full object-cover scale-x-[-1]"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-2.5 left-2.5 bg-natural-dark-sage/80 text-white text-[9px] px-2 py-0.5 rounded font-sans font-bold uppercase tracking-wider">
                  Self Preview (SARAH)
                </span>
              </div>
            ) : (
              <div className="text-center space-y-1 text-natural-beige">
                <VideoOff className="h-8 w-8 mx-auto stroke-[1.5]" />
                <span className="text-xs font-bold block">Camera Disabled</span>
              </div>
            )}
          </div>

          {/* Controls to toggle */}
          <div className="flex justify-center space-x-3">
            <button
              onClick={() => setCameraActive(!cameraActive)}
              className={`p-3 rounded-full border transition-all cursor-pointer ${
                cameraActive 
                  ? "bg-natural-beige text-natural-dark-sage border-natural-border hover:bg-natural-border-light" 
                  : "bg-natural-terracotta/10 text-natural-terracotta border-natural-terracotta/25 hover:bg-natural-terracotta/15"
              }`}
            >
              {cameraActive ? <Video className="h-4.5 w-4.5" /> : <VideoOff className="h-4.5 w-4.5" />}
            </button>
            <button
              onClick={() => setMicActive(!micActive)}
              className={`p-3 rounded-full border transition-all cursor-pointer ${
                micActive 
                  ? "bg-natural-beige text-natural-dark-sage border-natural-border hover:bg-natural-border-light" 
                  : "bg-natural-terracotta/10 text-natural-terracotta border-natural-terracotta/25 hover:bg-natural-terracotta/15"
              }`}
            >
              {micActive ? <Mic className="h-4.5 w-4.5" /> : <MicOff className="h-4.5 w-4.5" />}
            </button>
          </div>

          {/* Join Call action */}
          <button
            onClick={handleJoinCall}
            className="w-full py-2.5 bg-natural-sage hover:bg-natural-dark-sage text-white font-bold text-xs rounded-full shadow-md shadow-natural-sage/10 transition-all cursor-pointer uppercase tracking-wider"
          >
            Join Telehealth Consult
          </button>
        </div>
      )}

      {/* 2. ACTIVE ENCOUNTER SCREEN */}
      {callState === "active" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-slate-900 rounded-[28px] overflow-hidden border border-slate-800 shadow-2xl h-[550px]" id="telehealth-active-encounter">
          
          {/* Main Video stage */}
          <div className="lg:col-span-8 relative flex flex-col justify-between p-4 h-full">
            
            {/* Top Bar Doctor info */}
            <div className="flex justify-between items-center bg-slate-950/80 p-3 rounded-xl border border-slate-800/40 z-10">
              <div className="flex items-center space-x-2 text-left">
                <div className="h-7 w-7 rounded-full overflow-hidden border border-slate-700">
                  <img src={activeAppt.doctorAvatar} alt={activeAppt.doctorName} className="h-full w-full object-cover" />
                </div>
                <div>
                  <span className="text-white text-xs font-bold block">{activeAppt.doctorName}</span>
                  <span className="text-[9px] text-emerald-400 font-semibold block leading-none">{activeAppt.doctorSpecialty}</span>
                </div>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </div>

            {/* Doctor Avatar/simulated feed */}
            <div className="absolute inset-0 z-0">
              <img 
                src={activeAppt.doctorAvatar} 
                alt="Doctor Feed" 
                className="w-full h-full object-cover opacity-85"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Bottom Controls panel */}
            <div className="flex justify-center items-center space-x-3 bg-slate-950/80 py-3 px-6 rounded-full border border-slate-800/40 self-center z-10">
              <button 
                onClick={() => setMicActive(!micActive)}
                className={`p-2.5 rounded-full transition-colors cursor-pointer ${micActive ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-rose-600 text-white"}`}
              >
                {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </button>
              <button 
                onClick={() => setCameraActive(!cameraActive)}
                className={`p-2.5 rounded-full transition-colors cursor-pointer ${cameraActive ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-rose-600 text-white"}`}
              >
                {cameraActive ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </button>
              <button 
                onClick={() => setShowChat(!showChat)}
                className={`p-2.5 rounded-full transition-colors cursor-pointer ${showChat ? "bg-natural-sage text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
              >
                <MessageSquare className="h-4 w-4" />
              </button>
              <button 
                onClick={handleEndCall}
                className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition-colors cursor-pointer"
                title="End Consultation"
              >
                <PhoneOff className="h-4 w-4" />
              </button>
            </div>

          </div>

          {/* Right Chat/Document Sidebar */}
          {showChat && (
            <div className="lg:col-span-4 bg-slate-950 border-l border-slate-800/60 flex flex-col h-full text-xs text-slate-400">
              <div className="p-3 border-b border-slate-800/60 text-left shrink-0">
                <span className="text-slate-200 font-serif font-bold">Encounter Session Chat</span>
              </div>

              {/* Chat threads messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {callMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === "patient" ? "justify-end" : "justify-start"}`}>
                    <div className={`p-2.5 rounded-xl max-w-[80%] text-left ${
                      msg.sender === "patient" ? "bg-slate-800 text-slate-100" : "bg-slate-900 text-slate-300 border border-slate-800"
                    }`}>
                      <p className="text-[11px] leading-relaxed">{msg.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input panel */}
              <div className="p-2.5 border-t border-slate-800/60 bg-slate-950 flex space-x-1.5 shrink-0">
                <input 
                  type="text" 
                  placeholder="Type session note..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 text-xs outline-none focus:border-slate-700"
                />
                <button 
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-natural-sage hover:bg-natural-dark-sage text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Send
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. POST CALL CLINICAL SUMMARY (AI GENERATED SOAP NOTES) */}
      {callState === "summary" && (
        <div className="bg-white border border-natural-border rounded-[28px] p-6 md:p-8 shadow-2xl text-left space-y-6 max-w-2xl mx-auto" id="telehealth-soap-notes-summary">
          <div className="flex justify-between items-center border-b border-natural-border-light pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5 text-natural-sage">
                <Sparkles className="h-4 w-4 animate-pulse fill-natural-sage/10" />
                <span className="text-[10px] font-bold uppercase tracking-wider">AI Doctor Co-Pilot Summary</span>
              </div>
              <h2 className="font-serif font-extrabold text-lg text-natural-dark-sage tracking-tight">Clinical Encounter Completed</h2>
            </div>
            <button 
              onClick={onExit}
              className="px-4 py-2 bg-natural-beige hover:bg-natural-border-light text-natural-dark-sage font-bold text-xs rounded-full transition-colors cursor-pointer"
            >
              Exit Consultation
            </button>
          </div>

          {isGeneratingSummary && (
            <div className="py-12 text-center space-y-3.5">
              <div className="h-10 w-10 rounded-full border-2 border-natural-sage border-t-transparent animate-spin mx-auto" />
              <div>
                <span className="text-xs font-bold text-natural-dark-sage block">Compiling SOAP notes records...</span>
                <span className="text-[10px] text-natural-muted block mt-1">Gemini is parsing transcription, logging objective vitals and compiling the care plan...</span>
              </div>
            </div>
          )}

          {generatedSoap && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Patient friendly summary */}
              <div className="bg-natural-beige border border-natural-border-light p-4 rounded-xl space-y-1.5 text-natural-dark-sage">
                <span className="font-serif font-bold text-xs block text-natural-dark-sage">Patient-Friendly Encounter Summary</span>
                <p className="text-[11px] leading-relaxed text-natural-text/90 font-medium">"{generatedSoap.patientFriendlySummary}"</p>
              </div>

              {/* SOAP Details Accordion */}
              <div className="border border-natural-border rounded-xl overflow-hidden text-xs text-natural-text">
                <div className="bg-natural-beige px-4 py-2.5 border-b border-natural-border font-serif font-bold text-natural-dark-sage tracking-wider text-[10px]">
                  ELECTRONIC SOAP CLINICAL ENCOUNTER NOTE
                </div>
                
                <div className="p-4 space-y-4">
                  <div>
                    <span className="font-serif font-bold text-natural-dark-sage block text-[11px] uppercase tracking-wide">Subjective (S)</span>
                    <p className="text-natural-muted text-[11px] mt-0.5 leading-relaxed">{generatedSoap.soapNote.subjective}</p>
                  </div>
                  <div className="border-t border-natural-border-light pt-3">
                    <span className="font-serif font-bold text-natural-dark-sage block text-[11px] uppercase tracking-wide">Objective (O)</span>
                    <p className="text-natural-muted text-[11px] mt-0.5 leading-relaxed">{generatedSoap.soapNote.objective}</p>
                  </div>
                  <div className="border-t border-natural-border-light pt-3">
                    <span className="font-serif font-bold text-natural-dark-sage block text-[11px] uppercase tracking-wide">Assessment (A)</span>
                    <p className="text-natural-muted text-[11px] mt-0.5 leading-relaxed">{generatedSoap.soapNote.assessment}</p>
                  </div>
                  <div className="border-t border-natural-border-light pt-3">
                    <span className="font-serif font-bold text-natural-dark-sage block text-[11px] uppercase tracking-wide">Plan (P)</span>
                    <p className="text-natural-muted text-[11px] mt-0.5 leading-relaxed">{generatedSoap.soapNote.plan}</p>
                  </div>
                </div>
              </div>

              {/* Recommended Prescriptions */}
              {generatedSoap.recommendedPrescriptions && generatedSoap.recommendedPrescriptions.length > 0 && (
                <div className="space-y-2.5 text-left">
                  <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block">Recommended Prescriptions</span>
                  <div className="space-y-2">
                    {generatedSoap.recommendedPrescriptions.map((rx, idx) => (
                      <div key={idx} className="p-3.5 bg-natural-sage/20 border border-natural-sage/30 rounded-xl text-natural-dark-sage flex justify-between items-center">
                        <div className="space-y-0.5 text-left text-xs">
                          <span className="font-serif font-bold text-natural-dark-sage block">{rx.medication}</span>
                          <span className="text-[10px] text-natural-sage font-bold block">Dose: {rx.dosage} — {rx.frequency}</span>
                          <span className="text-[9px] text-natural-muted italic block">Reason: {rx.reason}</span>
                        </div>
                        <span className="text-[9px] bg-natural-sage/35 text-natural-dark-sage px-2 py-0.5 rounded-full font-bold">Approved</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Followup */}
              <div className="flex justify-between items-center text-xs text-natural-muted bg-natural-bg p-3.5 rounded-xl border border-natural-border-light">
                <span className="font-bold text-natural-muted">Follow-up Timeframe Recommendation:</span>
                <span className="font-serif font-bold text-natural-dark-sage bg-natural-beige px-2.5 py-0.5 rounded-full border border-natural-border-light">{generatedSoap.followUpTimeframe}</span>
              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
