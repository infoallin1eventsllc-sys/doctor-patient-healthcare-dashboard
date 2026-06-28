import React, { useState, useEffect, useRef } from "react";
import { 
  Activity, 
  Heart, 
  Smartphone, 
  AlertOctagon, 
  Sliders, 
  CheckCircle, 
  PhoneCall, 
  ShieldAlert, 
  MessageSquare, 
  MapPin, 
  X, 
  Flame, 
  Thermometer, 
  Droplet, 
  Wind,
  Plus,
  RefreshCw,
  AlertTriangle
} from "lucide-react";
import { DashboardState } from "../data";
import { VitalReading } from "../types";

interface LiveEmergencyMonitorProps {
  state: DashboardState;
  onChangeState: (newState: DashboardState) => void;
}

export default function LiveEmergencyMonitor({ state, onChangeState }: LiveEmergencyMonitorProps) {
  // Device Connection states
  const [deviceConnected, setDeviceConnected] = useState(true);
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [signalStrength, setSignalStrength] = useState("Excellent");

  // Real-time vital metrics
  const [liveHeartRate, setLiveHeartRate] = useState(72);
  const [liveSystolic, setLiveSystolic] = useState(120);
  const [liveDiastolic, setLiveDiastolic] = useState(80);
  const [liveGlucose, setLiveGlucose] = useState(96);
  const [liveOxygen, setLiveOxygen] = useState(98);
  const [liveTemp, setLiveTemp] = useState(98.6);

  // Simulation State
  const [activeEmergency, setActiveEmergency] = useState<string | null>(null);
  const [emergencySeverity, setEmergencySeverity] = useState<"warning" | "critical" | null>(null);
  const [dispatchCountdown, setDispatchCountdown] = useState(10);
  const [dispatchActive, setDispatchActive] = useState(false);
  const [simLog, setSimLog] = useState<string[]>([]);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // EKG wave offset state for animating the heartbeat line
  const [ekgOffset, setEkgOffset] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Log simulation events helper
  const addLog = (message: string) => {
    setSimLog((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 15)]);
  };

  // Generate real-time fluctuating bio-metrics
  useEffect(() => {
    const streamTimer = setInterval(() => {
      if (activeEmergency) {
        // Fluctuations inside emergency levels
        if (activeEmergency === "tachycardia") {
          setLiveHeartRate((prev) => Math.min(160, Math.max(140, prev + (Math.random() > 0.5 ? 1 : -1))));
          setLiveSystolic((prev) => Math.min(145, Math.max(130, prev + (Math.random() > 0.5 ? 2 : -2))));
        } else if (activeEmergency === "hypoxia") {
          setLiveOxygen((prev) => Math.min(88, Math.max(82, prev + (Math.random() > 0.5 ? 1 : -1))));
          setLiveHeartRate((prev) => Math.min(105, Math.max(90, prev + (Math.random() > 0.5 ? 1 : -1))));
        } else if (activeEmergency === "diabetes") {
          setLiveGlucose((prev) => Math.min(48, Math.max(34, prev + (Math.random() > 0.5 ? 1 : -1))));
          setLiveHeartRate((prev) => Math.min(115, Math.max(95, prev + (Math.random() > 0.5 ? 2 : -2))));
        } else if (activeEmergency === "hypertension") {
          setLiveSystolic((prev) => Math.min(210, Math.max(185, prev + (Math.random() > 0.5 ? 3 : -3))));
          setLiveDiastolic((prev) => Math.min(125, Math.max(110, prev + (Math.random() > 0.5 ? 2 : -2))));
          setLiveHeartRate((prev) => Math.min(95, Math.max(80, prev + (Math.random() > 0.5 ? 1 : -1))));
        }
      } else {
        // Normal healthy bio-rhythm fluctuations
        setLiveHeartRate((prev) => Math.min(82, Math.max(64, prev + (Math.random() > 0.7 ? 1 : Math.random() < 0.3 ? -1 : 0))));
        setLiveSystolic((prev) => Math.min(126, Math.max(115, prev + (Math.random() > 0.7 ? 1 : Math.random() < 0.3 ? -1 : 0))));
        setLiveDiastolic((prev) => Math.min(84, Math.max(76, prev + (Math.random() > 0.7 ? 1 : Math.random() < 0.3 ? -1 : 0))));
        setLiveGlucose((prev) => Math.min(110, Math.max(85, prev + (Math.random() > 0.8 ? 1 : Math.random() < 0.2 ? -1 : 0))));
        setLiveOxygen((prev) => Math.min(100, Math.max(97, prev + (Math.random() > 0.9 ? 1 : Math.random() < 0.1 ? -1 : 0))));
        setLiveTemp((prev) => Math.min(98.9, Math.max(98.3, prev + (Math.random() > 0.8 ? 0.1 : Math.random() < 0.2 ? -0.1 : 0))));
      }
    }, 1500);

    return () => clearInterval(streamTimer);
  }, [activeEmergency]);

  // Handle continuous EKG waveform animation shift
  useEffect(() => {
    // Speed up EKG visual cycles for fast heartbeats
    const speedMultiplier = activeEmergency === "tachycardia" ? 2.2 : 1.0;
    const frameTimer = setInterval(() => {
      setEkgOffset((prev) => (prev + 3 * speedMultiplier) % 600);
    }, 30);

    return () => clearInterval(frameTimer);
  }, [activeEmergency]);

  // Handle dispatch timer tick down during critical emergencies
  useEffect(() => {
    let countdownTimer: NodeJS.Timeout;
    if (activeEmergency && emergencySeverity === "critical" && dispatchCountdown > 0 && !dispatchActive) {
      countdownTimer = setInterval(() => {
        setDispatchCountdown((prev) => prev - 1);
      }, 1000);
    } else if (activeEmergency && emergencySeverity === "critical" && dispatchCountdown === 0 && !dispatchActive) {
      triggerEmergencyDispatch();
    }

    return () => clearInterval(countdownTimer);
  }, [activeEmergency, emergencySeverity, dispatchCountdown, dispatchActive]);

  // Clear or select specific simulated conditions
  const handleSimulateEmergency = (condition: "tachycardia" | "hypoxia" | "diabetes" | "hypertension" | "none") => {
    setAlertDismissed(false);
    if (condition === "none") {
      setActiveEmergency(null);
      setEmergencySeverity(null);
      setDispatchCountdown(10);
      setDispatchActive(false);
      // Reset back to baseline normal stats
      setLiveHeartRate(72);
      setLiveSystolic(120);
      setLiveDiastolic(80);
      setLiveGlucose(95);
      setLiveOxygen(98);
      setLiveTemp(98.6);
      addLog("Telemetry Guardian restored to healthy baseline.");
    } else {
      setActiveEmergency(condition);
      setDispatchActive(false);
      setDispatchCountdown(10);

      // Instantly set critical thresholds
      if (condition === "tachycardia") {
        setLiveHeartRate(148);
        setLiveSystolic(135);
        setLiveDiastolic(85);
        setEmergencySeverity("critical");
        addLog("CRITICAL DETECTED: Acute Tachycardia warning (Wearable reported 148 bpm).");
        triggerAbnormalStateLog(148, 135, 85, liveGlucose, liveOxygen, "Wearable sensor flagged sustained acute tachycardia (148 bpm) while sedentary.");
      } else if (condition === "hypoxia") {
        setLiveOxygen(84);
        setLiveHeartRate(94);
        setEmergencySeverity("critical");
        addLog("CRITICAL DETECTED: Severe Hypoxia warning (O₂ levels plummeted to 84%).");
        triggerAbnormalStateLog(94, liveSystolic, liveDiastolic, liveGlucose, 84, "Pulse oximeter reported severe hypoxemia (84% O₂ saturation). Emergency protocols ready.");
      } else if (condition === "diabetes") {
        setLiveGlucose(38);
        setLiveHeartRate(102);
        setEmergencySeverity("critical");
        addLog("CRITICAL DETECTED: Diabetic shock alert (Blood Glucose dropped below 40 mg/dL).");
        triggerAbnormalStateLog(102, liveSystolic, liveDiastolic, 38, liveOxygen, "Continuous glucose monitor (CGM) reports critical hypoglycemia (38 mg/dL) indicating high coma risk.");
      } else if (condition === "hypertension") {
        setLiveSystolic(195);
        setLiveDiastolic(118);
        setLiveHeartRate(88);
        setEmergencySeverity("warning"); // BP spike is a severe warning
        addLog("SEVERE WARNING: Hypertensive Crisis detection (Blood Pressure 195/118 mmHg).");
        triggerAbnormalStateLog(88, 195, 118, liveGlucose, liveOxygen, "Automatic cuff verified hypertensive emergency category 2 (195/118 mmHg).");
      }
    }
  };

  // Helper: Append the emergency reading directly to the patient's EHR vitals list
  // This updates the entire state, enabling Dr. Vance (and tabs) to see it!
  const triggerAbnormalStateLog = (
    hr: number, 
    sys: number, 
    dia: number, 
    glu: number, 
    oxy: number,
    criticalNotes: string
  ) => {
    const newReading: VitalReading = {
      id: `vit_critical_${Date.now()}`,
      patientId: state.selectedPatientId || "pat_1",
      timestamp: new Date().toISOString(),
      bloodPressureSystolic: sys,
      bloodPressureDiastolic: dia,
      heartRate: hr,
      temperature: liveTemp,
      weight: 174.5,
      bloodGlucose: glu,
      oxygenSaturation: oxy,
      notes: criticalNotes
    };

    // Add high-urgency notifications to patient dashboard
    const newAlertNotification = {
      id: `not_critical_${Date.now()}`,
      type: "appointment" as const,
      title: "🚨 Emergency Sensor Flagged",
      body: criticalNotes + " Clinical staff has been notified via emergency websocket.",
      timestamp: new Date().toISOString(),
      read: false
    };

    const updatedState = {
      ...state,
      vitals: [...state.vitals, newReading],
      notifications: [newAlertNotification, ...state.notifications]
    };

    onChangeState(updatedState);
  };

  // Trigger dispatch sequence simulation
  const triggerEmergencyDispatch = () => {
    setDispatchActive(true);
    addLog("🚑 EMERGENCY ROUTE DEPLOYED: GPS coordinates broadcasted to Seattle EMS.");
    addLog("🚨 Spouse Robert Jenkins notified with live map link.");
    addLog("📞 Establishing VoIP Audio stream to closest dispatcher.");
  };

  // Terminate/Override dispatch sequence
  const cancelDispatch = () => {
    setDispatchActive(false);
    setActiveEmergency(null);
    setEmergencySeverity(null);
    setDispatchCountdown(10);
    addLog("❌ Dispatch broadcast cancelled by user PIN override.");
  };

  // Build the EKG Path
  // It generates standard P-Q-R-S-T heartbeat wave spikes dynamically
  const generateEKGPath = () => {
    const width = 600;
    const height = 120;
    const points: string[] = [];
    
    // Beat interval changes with heart rate
    const pulseCycle = activeEmergency === "tachycardia" ? 50 : 100;

    for (let x = 0; x <= width; x++) {
      let y = height / 2;
      
      // Calculate index relative to the animating offset
      const relativeX = (x + ekgOffset) % width;
      const cycleIndex = relativeX % pulseCycle;
      
      // Heartbeat wave segments (P-Q-R-S-T)
      if (cycleIndex > 10 && cycleIndex <= 20) {
        // P Wave
        const progress = (cycleIndex - 10) / 10;
        y -= Math.sin(progress * Math.PI) * 6;
      } else if (cycleIndex > 22 && cycleIndex <= 25) {
        // Q Wave (slight dip)
        const progress = (cycleIndex - 22) / 3;
        y += progress * 4;
      } else if (cycleIndex > 25 && cycleIndex <= 29) {
        // R Wave (massive vertical systolic spike!)
        const progress = (cycleIndex - 25) / 4;
        y -= progress * 45;
      } else if (cycleIndex > 29 && cycleIndex <= 33) {
        // S Wave (deep diastolic dip!)
        const progress = (cycleIndex - 29) / 4;
        y += (1 - progress) * 45 - progress * 15;
      } else if (cycleIndex > 33 && cycleIndex <= 37) {
        // Returning to baseline
        const progress = (cycleIndex - 33) / 4;
        y += -15 + progress * 15;
      } else if (cycleIndex > 42 && cycleIndex <= 55) {
        // T Wave (medium repolarization dome)
        const progress = (cycleIndex - 42) / 13;
        y -= Math.sin(progress * Math.PI) * 10;
      }

      points.push(`${x},${y}`);
    }

    return `M ${points.join(" L ")}`;
  };

  return (
    <div className="bg-white border border-natural-border rounded-[32px] p-6 shadow-sm space-y-6 text-left" id="live-emergency-monitor">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-natural-border-light pb-4 gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-natural-terracotta opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-natural-terracotta"></span>
            </span>
            <span className="text-[10px] font-bold text-natural-terracotta uppercase tracking-widest">Live Bio-Telemetry Guard</span>
          </div>
          <h2 className="font-serif font-extrabold text-lg text-natural-dark-sage">Sensor Emergency Sync</h2>
          <p className="text-xs text-natural-muted">Continuous cloud analyzer assessing wearable telemetry for acute life-threatening medical conditions.</p>
        </div>

        {/* Device Sync Info */}
        <div className="flex items-center space-x-3.5 bg-natural-beige/40 px-3.5 py-2 rounded-xl border border-natural-border-light text-xs">
          <Smartphone className="h-4.5 w-4.5 text-natural-sage" />
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-natural-dark-sage">Smartwatch Sync</span>
              <span className="h-1.5 w-1.5 rounded-full bg-natural-sage" />
            </div>
            <span className="text-[10px] text-natural-muted font-bold block">Signal: {signalStrength} • Battery: {batteryLevel}%</span>
          </div>
        </div>
      </div>

      {/* ACTIVE EMERGENCY CRITICAL MODAL / OVERLAY IF TRIGGERED */}
      {activeEmergency && !alertDismissed && (
        <div className={`p-5 rounded-2xl border ${
          emergencySeverity === "critical" 
            ? "bg-natural-terracotta/10 border-natural-terracotta/40 text-natural-text" 
            : "bg-natural-clay/10 border-natural-clay/40 text-natural-text"
        } animate-pulse relative overflow-hidden`}>
          <div className="absolute top-3 right-3 flex items-center space-x-2">
            <button 
              onClick={() => setAlertDismissed(true)}
              className="p-1 hover:bg-black/5 rounded-lg text-natural-muted hover:text-natural-dark-sage cursor-pointer"
              title="Acknowledge & Dismiss visual warning"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-start space-x-4">
            <div className="p-3 bg-natural-terracotta text-white rounded-xl shadow-md shrink-0">
              <AlertOctagon className="h-6 w-6 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div className="space-y-3 flex-1 text-left text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider block text-natural-terracotta">
                  {emergencySeverity === "critical" ? "🚨 CRITICAL BIOMETRIC ALERT" : "⚠️ SUSPECTED HEALTH ANOMALY"}
                </span>
                <span className="font-serif font-black text-sm text-natural-dark-sage block mt-0.5 capitalize">
                  {activeEmergency === "tachycardia" && "Sustained Acute Ventricular Tachycardia"}
                  {activeEmergency === "hypoxia" && "Critical Respiratory Hypoxemia Detected"}
                  {activeEmergency === "diabetes" && "Hypoglycemic Diabetic Shock Warning"}
                  {activeEmergency === "hypertension" && "Dangerous Hypertensive Urgency / Spike"}
                </span>
              </div>

              {/* Countdown or Dispatch Message */}
              <div className="bg-white/80 p-3 rounded-xl border border-natural-border-light space-y-2">
                {!dispatchActive ? (
                  <div className="flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-natural-muted font-bold uppercase">Automated dispatch sequence</span>
                      <p className="font-semibold text-natural-dark-sage">Broadcasting EHR Medical Profile in <span className="text-natural-terracotta font-black font-mono text-sm">{dispatchCountdown}s</span></p>
                    </div>
                    <button 
                      onClick={cancelDispatch}
                      className="px-3 py-1.5 bg-natural-dark-sage hover:bg-[#202722] text-white text-[10px] font-bold rounded-lg transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      PIN Override
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <span className="font-bold text-natural-terracotta flex items-center space-x-1.5">
                      <span className="h-2 w-2 rounded-full bg-natural-terracotta animate-ping" />
                      <span>Seattle 911 EMS Dispatched</span>
                    </span>
                    <p className="text-[11px] text-natural-muted">Full medical passport, emergency contact list, and location logs have been transmitted. Emergency responders are en route.</p>
                  </div>
                )}
              </div>

              {/* Core Emergency Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button 
                  onClick={triggerEmergencyDispatch}
                  className="px-4 py-2 bg-natural-terracotta hover:bg-[#b05e4f] text-white font-bold text-[10px] rounded-full flex items-center space-x-1 shadow-sm transition-all uppercase tracking-wider cursor-pointer"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>Manual 911 Trigger</span>
                </button>

                <a 
                  href="#secure-chat" 
                  onClick={() => alert("Connecting live VOIP link to clinic staff desk...")}
                  className="px-4 py-2 bg-natural-sage hover:bg-natural-dark-sage text-white font-bold text-[10px] rounded-full flex items-center space-x-1 shadow-sm transition-all uppercase tracking-wider cursor-pointer"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Fast-Track Dr. Vance</span>
                </a>

                {dispatchActive && (
                  <button 
                    onClick={cancelDispatch}
                    className="px-4 py-2 bg-white hover:bg-natural-beige text-natural-dark-sage border border-natural-border font-bold text-[10px] rounded-full transition-all uppercase tracking-wider cursor-pointer"
                  >
                    Resolve / False Alarm
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED STATS GRID & EKG SCREEN */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* EKG Screen Block */}
        <div className="lg:col-span-8 bg-[#202722] rounded-2xl p-4 flex flex-col justify-between border border-natural-sage/20 relative overflow-hidden shadow-inner">
          {/* Grid background overlay for cathode ray vibe */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none" 
            style={{
              backgroundImage: "linear-gradient(90deg, #657f6d 1px, transparent 1px), linear-gradient(180deg, #657f6d 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }} 
          />

          <div className="flex justify-between items-center text-xs text-natural-cream/70 relative z-10 border-b border-white/5 pb-2">
            <div className="flex items-center space-x-1.5 font-mono">
              <Activity className="h-4 w-4 text-[#86d997] animate-pulse" />
              <span className="font-bold tracking-wider">LIVE TELEMETRY WAVEFORM</span>
            </div>
            <span className="font-mono text-[10px] tracking-widest text-[#86d997] font-bold">
              {activeEmergency ? "⚠️ ANOMALY DETECTED" : "✅ STEADY GENERAL SINUS RHYTHM"}
            </span>
          </div>

          {/* Animating Waveform Area */}
          <div className="py-6 h-32 flex items-center relative z-10 overflow-hidden">
            <svg viewBox="0 0 600 120" className="w-full h-full overflow-visible">
              <path 
                d={generateEKGPath()} 
                fill="none" 
                stroke={activeEmergency ? "#f2856d" : "#86d997"} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="transition-colors duration-300"
              />
            </svg>
          </div>

          <div className="flex justify-between items-center text-[10px] font-mono text-natural-cream/55 relative z-10 pt-2 border-t border-white/5">
            <span>Sweep: 25 mm/s</span>
            <span>Freq: Lead II Simulated Sync</span>
            <span>Scale: 1 mV/cm</span>
          </div>
        </div>

        {/* Live Metrics values readout */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          
          {/* Heart Rate Vitals block */}
          <div className="bg-natural-beige/35 border border-natural-border rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center">
              <Heart className={`h-4.5 w-4.5 ${activeEmergency === "tachycardia" ? "text-natural-terracotta animate-bounce" : "text-natural-sage"}`} />
              <span className="text-[8px] bg-white text-natural-muted font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Real-time</span>
            </div>
            <div className="mt-4 text-left">
              <span className="text-[9px] text-natural-muted font-bold uppercase tracking-wider block">Pulse Rate</span>
              <span className={`text-2xl font-black font-mono block mt-0.5 ${liveHeartRate > 100 || liveHeartRate < 50 ? "text-natural-terracotta" : "text-natural-dark-sage"}`}>
                {liveHeartRate}
              </span>
              <span className="text-[8px] text-natural-muted font-bold block">bpm</span>
            </div>
          </div>

          {/* Blood Pressure vital block */}
          <div className="bg-natural-beige/35 border border-natural-border rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center">
              <Activity className="h-4.5 w-4.5 text-natural-sage" />
              <span className="text-[8px] bg-white text-natural-muted font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Real-time</span>
            </div>
            <div className="mt-4 text-left">
              <span className="text-[9px] text-natural-muted font-bold uppercase tracking-wider block">Blood Pressure</span>
              <span className={`text-2xl font-black font-mono block mt-0.5 ${liveSystolic > 140 || liveDiastolic > 90 ? "text-natural-terracotta" : "text-natural-dark-sage"}`}>
                {liveSystolic}/{liveDiastolic}
              </span>
              <span className="text-[8px] text-natural-muted font-bold block">mmHg</span>
            </div>
          </div>

          {/* Blood Glucose block */}
          <div className="bg-natural-beige/35 border border-natural-border rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center">
              <Droplet className="h-4.5 w-4.5 text-natural-clay" />
              <span className="text-[8px] bg-white text-natural-muted font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Real-time</span>
            </div>
            <div className="mt-4 text-left">
              <span className="text-[9px] text-natural-muted font-bold uppercase tracking-wider block">Blood Sugar</span>
              <span className={`text-2xl font-black font-mono block mt-0.5 ${liveGlucose < 60 || liveGlucose > 180 ? "text-natural-terracotta" : "text-natural-dark-sage"}`}>
                {liveGlucose}
              </span>
              <span className="text-[8px] text-natural-muted font-bold block">mg/dL</span>
            </div>
          </div>

          {/* Oxygen Saturation block */}
          <div className="bg-natural-beige/35 border border-natural-border rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden">
            <div className="flex justify-between items-center">
              <Wind className="h-4.5 w-4.5 text-natural-sage" />
              <span className="text-[8px] bg-white text-natural-muted font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Real-time</span>
            </div>
            <div className="mt-4 text-left">
              <span className="text-[9px] text-natural-muted font-bold uppercase tracking-wider block">Oxygen Sat.</span>
              <span className={`text-2xl font-black font-mono block mt-0.5 ${liveOxygen < 93 ? "text-natural-terracotta animate-pulse" : "text-natural-dark-sage"}`}>
                {liveOxygen}%
              </span>
              <span className="text-[8px] text-natural-muted font-bold block">SpO₂</span>
            </div>
          </div>

        </div>

      </div>

      {/* HEALTH ANOMALY SIMULATOR WORKBENCH */}
      <div className="p-4 bg-natural-beige/40 rounded-2xl border border-natural-border-light space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Sliders className="h-4 w-4 text-natural-sage" />
            <span className="text-xs font-serif font-extrabold text-natural-dark-sage">Interactive Emergency Simulator Workbench</span>
          </div>
          <span className="text-[9px] bg-natural-sage/20 text-natural-dark-sage px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Aistudio Sandbox</span>
        </div>
        
        <p className="text-[11px] text-natural-muted leading-relaxed">
          Test the CarePulse digital emergency loop by simulating acute conditions. Triggering a crisis generates real-time biometric anomalies, logs telemetry values to the patient's EHR records, and prompts automated dispatch workflows.
        </p>

        {/* Buttons to simulate various crises */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <button
            onClick={() => handleSimulateEmergency("tachycardia")}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeEmergency === "tachycardia" 
                ? "bg-natural-terracotta text-white border-natural-terracotta" 
                : "bg-white hover:bg-natural-beige border-natural-border text-natural-text"
            }`}
          >
            🔥 Heart Attack Risk (HR)
          </button>

          <button
            onClick={() => handleSimulateEmergency("hypoxia")}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeEmergency === "hypoxia" 
                ? "bg-natural-terracotta text-white border-natural-terracotta" 
                : "bg-white hover:bg-natural-beige border-natural-border text-natural-text"
            }`}
          >
            💨 Oxygen Drop (O₂)
          </button>

          <button
            onClick={() => handleSimulateEmergency("diabetes")}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeEmergency === "diabetes" 
                ? "bg-natural-terracotta text-white border-natural-terracotta" 
                : "bg-white hover:bg-natural-beige border-natural-border text-natural-text"
            }`}
          >
            🩸 Sugar Crash (Glu)
          </button>

          <button
            onClick={() => handleSimulateEmergency("hypertension")}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeEmergency === "hypertension" 
                ? "bg-natural-clay text-white border-natural-clay" 
                : "bg-white hover:bg-natural-beige border-natural-border text-natural-text"
            }`}
          >
            ⚠️ BP Spike (Hypert)
          </button>

          <button
            onClick={() => handleSimulateEmergency("none")}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-natural-sage text-white border border-natural-sage hover:bg-natural-dark-sage transition-all cursor-pointer col-span-2 sm:col-span-1"
          >
            🔄 Reset Normal Baseline
          </button>
        </div>
      </div>

      {/* TELEMETRY EVENT TRANSACTION LOGS */}
      <div className="bg-natural-bg/50 border border-natural-border rounded-xl p-4 space-y-2">
        <span className="text-[10px] font-bold text-natural-muted uppercase tracking-wider block">Secure Telemetry Transaction Audit Trail</span>
        <div className="space-y-1.5 max-h-32 overflow-y-auto font-mono text-[10px] text-natural-muted pr-1 text-left">
          {simLog.length === 0 ? (
            <p className="italic text-natural-muted/65 py-2">No emergency alert triggers logged in active session.</p>
          ) : (
            simLog.map((log, idx) => (
              <p key={idx} className="border-b border-natural-border-light pb-1 last:border-0">{log}</p>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
