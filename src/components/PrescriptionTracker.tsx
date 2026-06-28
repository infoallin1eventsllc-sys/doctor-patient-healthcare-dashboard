import React, { useState } from "react";
import { 
  FileText, 
  RefreshCw, 
  Check, 
  MapPin, 
  Clock, 
  Phone, 
  Bell, 
  User, 
  History, 
  CheckCircle, 
  Heart,
  AlertCircle
} from "lucide-react";
import { DashboardState, saveState } from "../data";
import { Prescription } from "../types";

interface PrescriptionTrackerProps {
  state: DashboardState;
  onChangeState: (newState: DashboardState) => void;
}

export default function PrescriptionTracker({ state, onChangeState }: PrescriptionTrackerProps) {
  const { prescriptions } = state;
  const [successMsg, setSuccessMsg] = useState("");
  const [activePrescriptionsOnly, setActivePrescriptionsOnly] = useState(true);

  // Reminders configuring modal state
  const [editingReminder, setEditingReminder] = useState<Prescription | null>(null);
  const [reminderTime, setReminderTime] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);

  const filteredPrescriptions = prescriptions.filter((rx) => {
    return !activePrescriptionsOnly || rx.active;
  });

  const handleToggleAdherence = (rxId: string, dateStr: string) => {
    const updatedPrescriptions = prescriptions.map((rx) => {
      if (rx.id === rxId) {
        const logs = { ...rx.adherenceLogs };
        logs[dateStr] = !logs[dateStr];
        return { ...rx, adherenceLogs: logs };
      }
      return rx;
    });

    const updatedState = { ...state, prescriptions: updatedPrescriptions };
    onChangeState(updatedState);
    saveState(updatedState);
  };

  const handleRefillRequest = (rx: Prescription) => {
    if (rx.refillsRemaining <= 0) {
      alert("No refills remaining on this prescription. Please coordinate with your provider for a new clinical panel.");
      return;
    }

    // Add a notification/request to the doctor admin!
    const refillRequestNotification = {
      id: `not_refill_${rx.id}_${Date.now()}`,
      type: "refill" as const,
      title: `Refill Request: ${rx.medicationName}`,
      body: `Refill requested by Sarah Jenkins for ${rx.medicationName} ${rx.dosage} (${rx.refillsRemaining} remaining).`,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Auto decrement refills remaining
    const updatedPrescriptions = prescriptions.map((item) => {
      if (item.id === rx.id) {
        return {
          ...item,
          refillsRemaining: item.refillsRemaining - 1
        };
      }
      return item;
    });

    const updatedState = {
      ...state,
      prescriptions: updatedPrescriptions,
      notifications: [refillRequestNotification, ...state.notifications]
    };

    onChangeState(updatedState);
    saveState(updatedState);

    setSuccessMsg(`Refill request successfully sent to ${rx.doctorName}!`);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const openReminderEditor = (rx: Prescription) => {
    setEditingReminder(rx);
    setReminderTime(rx.reminders.time);
    setReminderEnabled(rx.reminders.enabled);
  };

  const saveReminderSettings = () => {
    if (!editingReminder) return;

    const updatedPrescriptions = prescriptions.map((rx) => {
      if (rx.id === editingReminder.id) {
        return {
          ...rx,
          reminders: {
            ...rx.reminders,
            enabled: reminderEnabled,
            time: reminderTime
          }
        };
      }
      return rx;
    });

    const updatedState = { ...state, prescriptions: updatedPrescriptions };
    onChangeState(updatedState);
    saveState(updatedState);

    setEditingReminder(null);
    setSuccessMsg("Medication daily reminders updated!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-left" id="prescription-tracker-portal">
      
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-natural-beige p-6 rounded-[24px] border border-natural-border text-left">
        <div className="space-y-1">
          <h1 className="font-serif font-extrabold text-xl text-natural-dark-sage tracking-tight">Prescription & Medication Tracker</h1>
          <p className="text-xs text-natural-muted">Track current doses, schedule daily alarm reminders, log compliance logs, and coordinate Walgreens refills.</p>
        </div>
        <div className="flex items-center space-x-2.5">
          <label className="text-xs text-natural-muted font-bold">Active Only:</label>
          <button 
            onClick={() => setActivePrescriptionsOnly(!activePrescriptionsOnly)}
            className={`px-4 py-2 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${
              activePrescriptionsOnly 
                ? "bg-natural-dark-sage text-white border-natural-dark-sage shadow-xs" 
                : "bg-white text-natural-muted border-natural-border hover:bg-natural-bg"
            }`}
          >
            {activePrescriptionsOnly ? "Yes" : "Show All History"}
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-3.5 bg-natural-sage/20 border border-natural-sage/30 text-natural-dark-sage rounded-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in">
          <CheckCircle className="h-4.5 w-4.5 text-natural-sage shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* RENDER REMINDER SETTINGS POPUP MODAL */}
      {editingReminder && (
        <div className="fixed inset-0 bg-[#2f3630]/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] p-6 max-w-sm w-full border border-natural-border shadow-2xl space-y-4 text-left">
            <div className="border-b border-natural-border-light pb-2">
              <span className="font-serif font-bold text-natural-dark-sage text-sm block">Configure Reminders</span>
              <span className="text-[9px] text-natural-muted font-bold uppercase tracking-wider">{editingReminder.medicationName}</span>
            </div>

            <div className="space-y-3.5 text-xs text-natural-text">
              <div className="flex justify-between items-center">
                <span>Daily Reminders Enabled:</span>
                <input 
                  type="checkbox" 
                  checked={reminderEnabled} 
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="rounded h-4.5 w-4.5 accent-natural-sage cursor-pointer"
                />
              </div>

              {reminderEnabled && (
                <div className="space-y-1">
                  <label className="text-[10px] text-natural-muted font-bold block uppercase tracking-wider">Reminder Time</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 08:30 AM" 
                    value={reminderTime} 
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full px-3 py-1.5 border border-natural-border bg-white rounded-md text-xs outline-none focus:border-natural-sage text-natural-dark-sage font-mono"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t border-natural-border-light">
              <button 
                onClick={() => setEditingReminder(null)}
                className="px-4 py-2 bg-natural-beige hover:bg-natural-border-light text-natural-muted text-[10px] font-bold rounded-full cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={saveReminderSettings}
                className="px-4 py-2 bg-natural-sage hover:bg-natural-dark-sage text-white text-[10px] font-bold rounded-full cursor-pointer uppercase tracking-wider"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Prescriptions Directory */}
        <div className="lg:col-span-8 space-y-4">
          {filteredPrescriptions.length === 0 ? (
            <div className="text-center py-12 text-natural-muted text-xs bg-natural-bg rounded-[28px] border border-dashed border-natural-border">
              No prescriptions in this classification directory.
            </div>
          ) : (
            filteredPrescriptions.map((rx) => {
              const adheredToday = rx.adherenceLogs ? rx.adherenceLogs[todayStr] : false;
              return (
                <div key={rx.id} className={`p-6 bg-white border rounded-[28px] flex flex-col justify-between hover:shadow-md transition-all ${
                  rx.active ? "border-natural-border" : "border-natural-border-light opacity-65"
                }`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-natural-border-light pb-3 mb-3">
                    <div className="space-y-0.5 text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-serif font-extrabold text-natural-dark-sage text-sm">{rx.medicationName}</span>
                        <span className="text-[10px] bg-natural-beige text-natural-sage px-2 py-0.5 rounded-full font-mono font-bold">{rx.dosage}</span>
                        {rx.active ? (
                          <span className="h-2 w-2 rounded-full bg-natural-sage animate-pulse" title="Active prescription" />
                        ) : (
                          <span className="text-[9px] bg-natural-terracotta/20 text-natural-terracotta px-2 py-0.5 rounded-full font-bold">Ended</span>
                        )}
                      </div>
                      <span className="text-[10px] text-natural-muted font-bold block">Prescribed by {rx.doctorName} — QD: {rx.frequency}</span>
                    </div>

                    {rx.active && (
                      <button
                        onClick={() => handleToggleAdherence(rx.id, todayStr)}
                        className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold border transition-all flex items-center space-x-1.5 cursor-pointer ${
                          adheredToday 
                            ? "bg-natural-sage/20 text-natural-dark-sage border-natural-sage/30 font-bold" 
                            : "bg-natural-bg hover:bg-natural-beige border-natural-border text-natural-muted"
                        }`}
                      >
                        <Check className={`h-3.5 w-3.5 ${adheredToday ? "text-natural-sage stroke-[3]" : "text-natural-muted"}`} />
                        <span>{adheredToday ? "Taken Today" : "Log taken today"}</span>
                      </button>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-natural-text mb-4 text-left">
                    <div>
                      <span className="text-[9px] text-natural-muted uppercase font-bold tracking-wider block">Refills Remaining</span>
                      <span className="font-serif font-bold text-natural-dark-sage block mt-0.5">{rx.refillsRemaining} Refills</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-natural-muted uppercase font-bold tracking-wider block">Reminders Status</span>
                      <button 
                        onClick={() => rx.active && openReminderEditor(rx)}
                        disabled={!rx.active}
                        className="text-[11px] text-natural-sage font-bold flex items-center space-x-1 mt-0.5 hover:underline cursor-pointer"
                      >
                        <Clock className="h-3.5 w-3.5 shrink-0" />
                        <span>{rx.reminders.enabled ? rx.reminders.time : "None"}</span>
                      </button>
                    </div>
                    <div>
                      <span className="text-[9px] text-natural-muted uppercase font-bold tracking-wider block">Start Date</span>
                      <span className="font-mono text-natural-text font-bold block mt-0.5">{rx.startDate}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-natural-muted uppercase font-bold tracking-wider block">Expiration Date</span>
                      <span className="font-mono text-natural-text font-bold block mt-0.5">{rx.endDate}</span>
                    </div>
                  </div>

                  {/* Refill trigger */}
                  {rx.active && (
                    <div className="flex justify-end pt-3 border-t border-natural-border-light mt-1">
                      <button
                        onClick={() => handleRefillRequest(rx)}
                        className="px-4 py-2 bg-natural-sage hover:bg-natural-dark-sage text-white text-[10px] font-bold rounded-full flex items-center space-x-1.5 transition-all cursor-pointer uppercase tracking-wider shadow-xs"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Request Pharmacy Refill</span>
                      </button>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Right Side: Pharmacy and Compliance Stats */}
        <div className="lg:col-span-4 space-y-6 text-xs text-natural-text">
          
          {/* Pharmacy Finder Card */}
          <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-sm space-y-4">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block text-left">Assigned Delivery Pharmacy</span>
            
            <div className="space-y-3.5">
              <div className="p-3.5 bg-natural-beige border border-natural-border-light rounded-xl space-y-2 text-[11px] text-left">
                <div className="flex items-center space-x-1.5 text-natural-dark-sage">
                  <MapPin className="h-4.5 w-4.5 text-natural-terracotta shrink-0" />
                  <span className="font-serif font-extrabold">{prescriptions[0]?.pharmacy.name || "Walgreens Pharmacy #4402"}</span>
                </div>
                <p className="text-natural-muted pl-6">{prescriptions[0]?.pharmacy.address || "1205 NE Broadway, Seattle WA"}</p>
                <div className="flex items-center space-x-1.5 pl-6 text-natural-muted">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-mono text-[10px] font-bold">{prescriptions[0]?.pharmacy.phone || "(555) 909-1234"}</span>
                </div>
              </div>

              <p className="text-[10px] text-natural-muted leading-relaxed text-center block max-w-xs mx-auto">
                Delivery scripts are handled automatically by CarePulse. Contact Walgreens at the number above to modify shipment or schedule courier drop-offs.
              </p>
            </div>
          </div>

          {/* Adherence / Compliance Card */}
          <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-sm space-y-3">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block text-left">Adherence metrics</span>
            
            <div className="bg-natural-sage/20 text-natural-dark-sage border border-natural-sage/30 p-4 rounded-xl space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <span className="font-serif font-bold text-[11px]">Compliance Rating</span>
                <span className="font-serif text-sm font-black text-natural-dark-sage">94%</span>
              </div>
              <p className="text-[10px] text-natural-dark-sage/90 leading-relaxed">
                Excellent! Your Lisinopril and Metformin log adherence averages 94% over the last 30 days, lowering systemic cardiovascular risk factors.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
