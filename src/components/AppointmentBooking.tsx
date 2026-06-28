import React, { useState, useEffect } from "react";
import { 
  Search, 
  Video, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  ShieldAlert,
  ArrowLeft
} from "lucide-react";
import { DashboardState, saveState, formatDate } from "../data";
import { Appointment, Doctor } from "../types";

interface AppointmentBookingProps {
  state: DashboardState;
  onChangeState: (newState: DashboardState) => void;
  prefillData: { symptoms: string[]; severity: number; notes: string } | null;
  onClearPrefill: () => void;
  onNavigateToDashboard: () => void;
}

export default function AppointmentBooking({ 
  state, 
  onChangeState, 
  prefillData, 
  onClearPrefill,
  onNavigateToDashboard 
}: AppointmentBookingProps) {
  const { doctors, patient } = state;

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("All");

  // Booking Flow Steps
  // 1: Choose Doctor, 2: Select Date/Time & Visit Type, 3: Pre-visit Questionnaire & Confirmation
  const [step, setStep] = useState(1);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Booking form details
  const [visitType, setVisitType] = useState<'video' | 'audio' | 'chat'>("video");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  // Reminder preferences
  const [reminderEmail, setReminderEmail] = useState(true);
  const [reminderSMS, setReminderSMS] = useState(true);

  // Success state
  const [bookingSuccess, setBookingSuccess] = useState<Appointment | null>(null);

  // Apply pre-filled details if available
  useEffect(() => {
    if (prefillData) {
      setReason(`Symptom evaluation: ${prefillData.symptoms.join(", ")}`);
      setNotes(`Pain Severity: ${prefillData.severity}/10. Additional clinical details: ${prefillData.notes}`);
      
      // Auto-focus onto Step 1 with a prefilled general physician if needed
      const gpDoctor = doctors.find(d => d.specialtyCategory === "General Practice") || doctors[0];
      setSelectedDoctor(gpDoctor);
      setStep(2); // Jump to Step 2 to select date and slot!
    }
  }, [prefillData, doctors]);

  const specialties = ["All", "Cardiology", "General Practice", "Neurology", "Dermatology", "Orthopedics"];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === "All" || doc.specialtyCategory === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const handleSelectDoctor = (doc: Doctor) => {
    setSelectedDoctor(doc);
    setStep(2);
  };

  const handleBookAppointment = () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !reason.trim()) {
      alert("Please fill out all fields.");
      return;
    }

    const apptId = `apt_${Date.now()}`;
    const costEstimate = visitType === "video" ? 120 : visitType === "audio" ? 80 : 50;

    const newAppointment: Appointment = {
      id: apptId,
      patientId: patient.id,
      patientName: patient.name,
      patientAge: 38,
      patientGender: patient.gender,
      doctorId: selectedDoctor.id,
      doctorName: selectedDoctor.name,
      doctorSpecialty: selectedDoctor.specialty,
      doctorAvatar: selectedDoctor.avatar,
      date: selectedDate,
      timeSlot: selectedSlot,
      reason,
      notes,
      type: visitType,
      status: "scheduled",
      zoomLink: visitType === "video" ? `https://meet.google.com/carepulse-${apptId}` : undefined,
      costEstimate,
      reminder24hSent: false,
      reminder1hSent: false,
      preVisitQuestionnaire: prefillData ? {
        symptomsChecked: prefillData.symptoms,
        description: prefillData.notes,
        severity: prefillData.severity
      } : {
        symptomsChecked: [],
        description: reason,
        severity: 5
      }
    };

    // Create a notification for the patient
    const apptNotification = {
      id: `not_appt_${apptId}`,
      type: "appointment" as const,
      title: "Appointment Successfully Scheduled",
      body: `You scheduled a ${visitType} consult with ${selectedDoctor.name} on ${selectedDate} at ${selectedSlot}.`,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Auto-update availability on the doctor (remove the booked slot)
    const updatedDoctors = doctors.map(doc => {
      if (doc.id === selectedDoctor.id) {
        return {
          ...doc,
          availability: doc.availability.filter(slot => slot !== selectedSlot)
        };
      }
      return doc;
    });

    const updatedState = {
      ...state,
      appointments: [newAppointment, ...state.appointments],
      notifications: [apptNotification, ...state.notifications],
      doctors: updatedDoctors
    };

    onChangeState(updatedState);
    saveState(updatedState);
    
    setBookingSuccess(newAppointment);
    onClearPrefill(); // Wipe out symptom prefill
  };

  const handleCloseSuccess = () => {
    setBookingSuccess(null);
    setSelectedDoctor(null);
    setSelectedDate("");
    setSelectedSlot("");
    setReason("");
    setNotes("");
    setStep(1);
    onNavigateToDashboard();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" id="appointment-booking-portal">
      
      {/* Booking SUCCESS SCREEN overlay */}
      {bookingSuccess && (
        <div className="fixed inset-0 bg-[#2f3630]/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 text-center border border-natural-border shadow-2xl space-y-5 animate-in zoom-in-95">
            <div className="h-14 w-14 bg-natural-sage/20 text-natural-sage rounded-full flex items-center justify-center mx-auto ring-4 ring-natural-sage/10 animate-bounce">
              <CheckCircle className="h-8 w-8" />
            </div>
            
            <div className="space-y-1">
              <h2 className="font-serif font-extrabold text-lg text-natural-dark-sage tracking-tight">Appointment Confirmed!</h2>
              <p className="text-xs text-natural-muted">Your clinical consult is successfully routed and secured.</p>
            </div>

            <div className="bg-natural-beige p-4 rounded-xl border border-natural-border-light text-left text-xs space-y-2.5 font-sans text-natural-text">
              <div className="flex justify-between">
                <span className="text-natural-muted font-bold">Doctor:</span>
                <span className="font-bold text-natural-dark-sage">{bookingSuccess.doctorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-natural-muted font-bold">Date & Time:</span>
                <span className="font-bold text-natural-dark-sage">{bookingSuccess.date} @ {bookingSuccess.timeSlot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-natural-muted font-bold">Care Type:</span>
                <span className="font-bold text-natural-sage capitalize flex items-center space-x-1">
                  {bookingSuccess.type === "video" ? <Video className="h-3.5 w-3.5 inline" /> : <Phone className="h-3.5 w-3.5 inline" />}
                  <span>{bookingSuccess.type} Consultation</span>
                </span>
              </div>
              {bookingSuccess.zoomLink && (
                <div className="flex flex-col border-t border-natural-border-light pt-2.5">
                  <span className="text-natural-muted font-bold mb-1">Telehealth Meeting URL:</span>
                  <a 
                    href={bookingSuccess.zoomLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-natural-sage font-mono text-[11px] hover:underline break-all"
                  >
                    {bookingSuccess.zoomLink}
                  </a>
                </div>
              )}
            </div>

            {/* Email/SMS Reminder Confirmation Notification */}
            <div className="text-left text-[11px] p-3 bg-natural-beige text-natural-text rounded-xl border border-natural-border flex items-start space-x-2">
              <ShieldAlert className="h-4 w-4 text-natural-sage shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-natural-dark-sage">Reminder System Active</span>
                Automated reminders will be delivered to <span className="font-semibold">{patient.email}</span> and <span className="font-semibold">{patient.phone}</span> at 24 hours and 1 hour before the session.
              </div>
            </div>

            <button 
              onClick={handleCloseSuccess}
              className="w-full py-2.5 bg-natural-sage hover:bg-natural-dark-sage text-white font-bold text-xs rounded-full transition-colors uppercase tracking-wider shadow-sm"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Main Flow Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="font-serif font-extrabold text-xl text-natural-dark-sage tracking-tight">Schedule clinical consult</h1>
          <p className="text-xs text-natural-muted mt-0.5">Filter by clinical category or select available timeslots below.</p>
        </div>
        {step > 1 && (
          <button 
            onClick={() => setStep(step - 1)}
            className="px-3.5 py-1.5 bg-natural-beige hover:bg-natural-border border border-natural-border text-natural-text text-xs font-bold rounded-full flex items-center space-x-1 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* STEP 1: Search & Choose Doctor */}
      {step === 1 && (
        <div className="space-y-6" id="booking-step-1">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-natural-border shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-natural-muted" />
              <input 
                type="text" 
                placeholder="Search physicians by name, specialty or clinic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-natural-bg border border-natural-border rounded-lg text-xs outline-none focus:bg-white focus:border-natural-sage text-natural-text transition-all"
              />
            </div>
            
            <div className="flex flex-wrap gap-1">
              {specialties.map((spec) => (
                <button
                  key={spec}
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                    selectedSpecialty === spec 
                      ? "bg-natural-sage text-white border-natural-sage shadow-xs" 
                      : "bg-white text-natural-text border-natural-border hover:bg-natural-bg"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDoctors.length === 0 ? (
              <div className="col-span-2 py-12 text-center text-natural-muted text-xs bg-natural-bg rounded-2xl border border-dashed border-natural-border">
                No specialists matching the selected criteria were found.
              </div>
            ) : (
              filteredDoctors.map((doc) => (
                <div 
                  key={doc.id} 
                  className="bg-white border border-natural-border rounded-[24px] p-5 flex flex-col justify-between hover:shadow-md hover:border-natural-sage transition-all cursor-pointer text-left"
                  onClick={() => handleSelectDoctor(doc)}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 border-2 border-natural-beige">
                      <img src={doc.avatar} alt={doc.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="space-y-0.5 text-left">
                      <span className="font-serif font-bold text-natural-dark-sage text-sm block leading-tight">{doc.name}</span>
                      <span className="text-[10px] text-natural-sage font-bold block">{doc.specialty}</span>
                      <span className="text-[10px] text-natural-muted block">{doc.hospital}</span>
                    </div>
                  </div>

                  <div className="border-t border-natural-border-light pt-3 mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-natural-clay bg-natural-beige px-2.5 py-1 rounded-full">
                      ★ {doc.rating} / 5.0 Rating
                    </span>
                    <button 
                      className="px-4 py-2 bg-natural-sage hover:bg-natural-dark-sage text-white text-[10px] font-bold rounded-full flex items-center space-x-1"
                    >
                      <span>Book Appointment</span>
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Selected Doctor, Time & visit type selection */}
      {step === 2 && selectedDoctor && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="booking-step-2">
          
          {/* Left panel: Form fields */}
          <div className="lg:col-span-7 bg-white rounded-[28px] border border-natural-border shadow-xs p-6 space-y-5 text-left">
            
            {/* Visit type Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
                1. Select Encounter Modality
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "video", label: "Video", icon: Video, desc: "Interactive Telehealth" },
                  { id: "audio", label: "Phone", icon: Phone, desc: "Audio Telehealth" },
                  { id: "chat", label: "Chat", icon: MessageSquare, desc: "Messaging consult" }
                ].map((item) => {
                  const active = visitType === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setVisitType(item.id as any)}
                      className={`p-3 rounded-xl border flex flex-col items-center text-center space-y-1 transition-all cursor-pointer ${
                        active 
                          ? "bg-natural-beige border-natural-sage text-natural-dark-sage shadow-inner" 
                          : "bg-white border-natural-border text-natural-text hover:bg-natural-bg"
                      }`}
                    >
                      <Icon className={`h-4.5 w-4.5 ${active ? "text-natural-sage" : "text-natural-muted"}`} />
                      <span className="text-xs font-bold block">{item.label}</span>
                      <span className="text-[8px] text-natural-muted leading-none">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date and Timeslots picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">
                  2. Choose Visit Date
                </label>
                <input 
                  type="date" 
                  min={formatDate(new Date())}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border rounded-lg text-xs outline-none bg-white focus:border-natural-sage text-natural-text"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">
                  3. Select Available Slot
                </label>
                {selectedDoctor.availability.length === 0 ? (
                  <div className="p-2 border border-natural-border rounded text-[10px] text-natural-muted bg-natural-bg">No slots available today</div>
                ) : (
                  <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                    {selectedDoctor.availability.map((slot) => {
                      const active = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-1.5 px-2 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                            active 
                              ? "bg-natural-dark-sage text-white border-natural-dark-sage shadow-xs" 
                              : "bg-natural-beige border-natural-border text-natural-text hover:bg-natural-bg"
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Reason and clinical notes */}
            <div className="space-y-3 pt-3 border-t border-natural-border-light">
              <div>
                <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">
                  4. Primary Reason for Consultation
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Hypertension refill request, follow up blood results"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-natural-border rounded-lg text-xs outline-none focus:border-natural-sage text-natural-text"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block mb-1">
                  Additional Encounter Notes (Optional)
                </label>
                <textarea 
                  placeholder="Please list any questions or details you would like the doctor to review ahead of time..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-natural-border rounded-lg text-xs outline-none focus:border-natural-sage text-natural-text resize-none"
                />
              </div>
            </div>

            {/* Notification settings */}
            <div className="p-4 bg-natural-beige rounded-2xl space-y-2.5">
              <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block">
                5. Reminder Prefs (24h & 1h prior)
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center space-x-2 text-xs font-semibold text-natural-text cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reminderEmail} 
                    onChange={(e) => setReminderEmail(e.target.checked)} 
                    className="rounded accent-natural-sage h-4 w-4 border-natural-border"
                  />
                  <span>Email Alerts</span>
                </label>
                <label className="flex items-center space-x-2 text-xs font-semibold text-natural-text cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={reminderSMS} 
                    onChange={(e) => setReminderSMS(e.target.checked)} 
                    className="rounded accent-natural-sage h-4 w-4 border-natural-border"
                  />
                  <span>SMS Alerts</span>
                </label>
              </div>
            </div>

            {/* Book trigger */}
            <button
              onClick={handleBookAppointment}
              className="w-full py-2.5 bg-natural-sage hover:bg-natural-dark-sage text-white font-bold text-xs rounded-full transition-all shadow-md shadow-natural-sage/15 uppercase tracking-wider"
            >
              Secure & Book Doctor Consult
            </button>

          </div>

          {/* Right panel: Doctor summary & Cost breakdown */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Physician Card summary */}
            <div className="bg-natural-beige border border-natural-border rounded-[24px] p-5 text-center space-y-3.5 text-xs text-natural-text shadow-inner">
              <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
                Physician File
              </span>
              <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-white mx-auto shadow-md">
                <img src={selectedDoctor.avatar} alt={selectedDoctor.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="space-y-0.5">
                <span className="font-serif font-bold text-natural-dark-sage text-sm block leading-tight">{selectedDoctor.name}</span>
                <span className="text-[10px] text-natural-sage font-bold block">{selectedDoctor.specialty}</span>
                <span className="text-[10px] text-natural-muted block">{selectedDoctor.hospital}</span>
              </div>
              <p className="text-[10px] text-natural-text bg-white p-3 border border-natural-border-light rounded-xl max-w-xs mx-auto italic leading-relaxed">
                "Specialist clinic focused on proactive monitoring. Full patient records linked natively."
              </p>
            </div>

            {/* Care Estimate / Billing estimate card */}
            <div className="bg-white rounded-[24px] border border-natural-border shadow-sm p-5 space-y-4 text-xs text-natural-text text-left">
              <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">
                Estimated Out-Of-Pocket Expenses
              </span>

              <div className="space-y-2.5 border-b border-natural-border-light pb-3">
                <div className="flex justify-between font-bold text-natural-dark-sage">
                  <span>Modality Fee ({visitType}):</span>
                  <span>{visitType === "video" ? "$120.00" : visitType === "audio" ? "$80.00" : "$50.00"}</span>
                </div>
                <div className="flex justify-between text-natural-muted">
                  <span>Insurance Co-Pay:</span>
                  <span className="text-natural-sage font-bold">- $20.00 co-pay applied</span>
                </div>
                <div className="flex justify-between text-natural-muted">
                  <span>In-Network Deductible:</span>
                  <span>Satisfied</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-natural-dark-sage">
                <span className="text-xs font-bold uppercase tracking-wider">Patient Est. Responsibility:</span>
                <span className="font-mono text-base font-black text-natural-sage">
                  {visitType === "video" ? "$20.00" : visitType === "audio" ? "$15.00" : "$10.00"}
                </span>
              </div>

              <div className="p-3 bg-natural-beige text-natural-text border border-natural-border rounded-xl text-[10px] leading-relaxed flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-natural-clay shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5 text-natural-dark-sage">Insurance Pre-authorization Approved</span>
                  CarePulse completed automated benefits processing with {patient.insurance.provider}. Standard 90% outpatient coverage verified.
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
