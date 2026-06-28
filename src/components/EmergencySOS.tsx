import React, { useState, useEffect } from "react";
import { 
  AlertOctagon, 
  PhoneCall, 
  MapPin, 
  X, 
  User, 
  Activity, 
  CheckCircle, 
  AlertTriangle 
} from "lucide-react";
import { DashboardState } from "../data";

interface EmergencySOSProps {
  state: DashboardState;
  isOpen: boolean;
  onClose: () => void;
}

export default function EmergencySOS({ state, isOpen, onClose }: EmergencySOSProps) {
  const { patient } = state;
  const [sosTriggered, setSosTriggered] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [simulatedStatus, setSimulatedStatus] = useState<string>("");
  const [sosActive, setSosActive] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (sosTriggered && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (sosTriggered && countdown === 0) {
      setSosTriggered(false);
      setSosActive(true);
      triggerSOSProcess();
    }
    return () => clearTimeout(timer);
  }, [sosTriggered, countdown]);

  const initiateSOS = () => {
    setCountdown(5);
    setSosTriggered(true);
    setSosActive(false);
    setSimulatedStatus("");
  };

  const cancelSOS = () => {
    setSosTriggered(false);
    setCountdown(5);
    setSimulatedStatus("Emergency dispatch sequence cancelled.");
  };

  const triggerSOSProcess = () => {
    setSimulatedStatus("Locating precise GPS coordinates...");
    
    setTimeout(() => {
      setSimulatedStatus("GPS locked: 47.6062° N, 122.3321° W (Seattle, WA).");
      
      setTimeout(() => {
        setSimulatedStatus("SMS alert dispatched to emergency contact: Robert Jenkins (Spouse).");
        
        setTimeout(() => {
          setSimulatedStatus("911 Emergency Services auto-routed with full medical profile and GPS link.");
        }, 2000);
      }, 2000);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#2f3630]/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" id="sos-modal">
      <div className="bg-white rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl border border-natural-border flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-natural-terracotta text-white p-5 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-2.5">
            <AlertOctagon className="h-6 w-6 animate-pulse" />
            <h2 className="font-serif italic font-bold text-lg tracking-tight">CarePulse SOS Emergency</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-natural-cream hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Active Countdown Trigger */}
          {sosTriggered && (
            <div className="p-5 bg-natural-terracotta/10 border border-natural-terracotta/30 rounded-2xl text-center space-y-4 animate-pulse">
              <span className="text-5xl font-serif font-bold text-natural-terracotta block">{countdown}</span>
              <p className="text-xs font-bold text-natural-terracotta tracking-wider uppercase">
                INITIATING EMERGENCY SEQUENCE IN {countdown} SECONDS...
              </p>
              <p className="text-[11px] text-natural-text leading-relaxed">
                This will automatically send your precise GPS coordinates, allergies, and emergency medical information to 911 Dispatch and your primary emergency contacts.
              </p>
              <button 
                onClick={cancelSOS}
                className="w-full py-2.5 bg-natural-dark-sage hover:bg-[#2f3630] text-white font-bold text-xs rounded-full transition-all tracking-wider uppercase"
              >
                CANCEL SEQUENCE
              </button>
            </div>
          )}

          {/* Active Dispatch Progress */}
          {sosActive && (
            <div className="p-5 bg-natural-dark-sage text-white rounded-2xl space-y-3 shadow-inner">
              <div className="flex items-center space-x-2 text-[#d9ad8c]">
                <Activity className="h-5 w-5 animate-bounce" />
                <span className="text-xs font-bold tracking-widest uppercase">SOS ALIVE STATUS</span>
              </div>
              <div className="space-y-2 text-xs font-mono">
                <p className="text-natural-cream">⚡ Initialized: {new Date().toLocaleTimeString()}</p>
                {simulatedStatus && <p className="text-[#d9ad8c]">🛰️ {simulatedStatus}</p>}
                <p className="text-[11px] text-natural-cream/80">🚨 Responders may contact you via {patient.phone} immediately.</p>
              </div>
              <button 
                onClick={() => setSosActive(false)}
                className="w-full py-2 bg-natural-terracotta hover:bg-[#b05e4f] text-white font-bold text-xs rounded-full transition-colors uppercase tracking-wider"
              >
                Clear Alert Status
              </button>
            </div>
          )}

          {/* One Tap SOS Trigger */}
          {!sosTriggered && !sosActive && (
            <div className="text-center space-y-3 py-4">
              <button 
                onClick={initiateSOS}
                className="h-28 w-28 rounded-full bg-natural-terracotta hover:bg-[#b05e4f] text-white flex flex-col items-center justify-center mx-auto shadow-lg shadow-natural-terracotta/30 active:scale-95 transition-all group"
              >
                <PhoneCall className="h-10 w-10 stroke-[2.5] group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs font-bold mt-1 tracking-widest uppercase font-serif">TAP SOS</span>
              </button>
              <p className="text-xs text-natural-muted max-w-xs mx-auto">
                Press and hold to start a 5-second automatic emergency contact and 911 dispatch broadcast.
              </p>
            </div>
          )}

          {/* EMERGENCY MEDICAL CARD (HIPAA Compliant pre-auth) */}
          <div className="border border-natural-border rounded-2xl overflow-hidden shadow-xs bg-white">
            <div className="bg-natural-beige px-4 py-3 border-b border-natural-border flex items-center justify-between">
              <span className="text-xs font-bold text-natural-dark-sage tracking-widest font-sans uppercase">EMERGENCY MEDICAL CARD</span>
              <span className="text-[10px] bg-natural-terracotta/20 text-natural-terracotta px-2 py-0.5 rounded-full font-bold">
                CRITICAL INFO
              </span>
            </div>
            
            <div className="p-4 space-y-3.5 text-xs text-natural-text">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-natural-muted block font-bold uppercase tracking-wider">Patient Name</span>
                  <span className="font-bold text-natural-dark-sage text-sm">{patient.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-natural-muted block font-bold uppercase tracking-wider">Blood Type</span>
                  <span className="font-bold text-natural-terracotta flex items-center space-x-1 text-sm">
                    <Activity className="h-3 w-3 inline text-natural-terracotta" />
                    <span>{patient.bloodType || "O-Positive"}</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-natural-muted block font-bold uppercase tracking-wider">Allergies</span>
                  <span className="font-bold text-natural-dark-sage">
                    {patient.allergies.length > 0 ? patient.allergies.join(", ") : "None Known"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-natural-muted block font-bold uppercase tracking-wider">Chronic Conditions</span>
                  <span className="font-bold text-natural-dark-sage">
                    {patient.conditions.length > 0 ? patient.conditions.join(", ") : "None Reported"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-natural-muted block font-bold uppercase tracking-wider">Current Medications</span>
                <span className="font-bold text-natural-dark-sage leading-relaxed block">
                  {patient.medications.length > 0 ? patient.medications.join(", ") : "None Reported"}
                </span>
              </div>

              <div className="border-t border-natural-border-light pt-3">
                <span className="text-[10px] text-natural-muted block font-bold uppercase tracking-wider">Primary Emergency Contact</span>
                <div className="mt-1.5 flex justify-between items-center">
                  <div>
                    <span className="font-serif font-bold text-natural-dark-sage block">
                      {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
                    </span>
                    <span className="text-natural-muted font-mono text-[11px]">{patient.emergencyContact.phone}</span>
                  </div>
                  <a 
                    href={`tel:${patient.emergencyContact.phone}`}
                    className="p-2.5 bg-natural-sage/10 hover:bg-natural-sage/20 text-natural-sage rounded-xl transition-colors"
                  >
                    <PhoneCall className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Active Coverage Info */}
          <div className="p-4 bg-natural-beige border border-natural-border-light rounded-2xl flex items-start space-x-3 text-xs text-natural-muted">
            <AlertTriangle className="h-5 w-5 text-[#d9ad8c] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-natural-dark-sage block mb-0.5">Immediate dispatch integration</span>
              CarePulse binds standard phone protocols and coordinates with your regional public safety answering point (PSAP) to transfer structured digital clinical files securely.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-natural-beige px-6 py-4 border-t border-natural-border flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 bg-natural-cream hover:bg-natural-border text-natural-text font-bold text-xs rounded-full transition-colors uppercase tracking-wider"
          >
            Close Emergency Portal
          </button>
        </div>

      </div>
    </div>
  );
}
