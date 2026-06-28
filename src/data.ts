import { 
  Patient, 
  Doctor, 
  Appointment, 
  Message, 
  Conversation, 
  VitalReading, 
  Prescription, 
  VaccineRecord, 
  LabResult, 
  UploadedDocument, 
  Invoice, 
  HealthTip, 
  Notification,
  EmailRecord,
  SmsRecord
} from "./types";
import { saveStateToFirestore } from "./utils/firebaseDb";

// Standard formatting helpers
export const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0];
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

// 1. Initial Mock Patient Profile
export const initialPatient: Patient = {
  id: "pat_1",
  name: "Sarah Jenkins",
  dob: "1988-04-12",
  gender: "Female",
  email: "sarah.jenkins@gmail.com",
  phone: "(555) 234-5678",
  allergies: ["Penicillin", "Peanuts"],
  conditions: ["Hypertension", "Type 2 Diabetes (Mild)"],
  medications: ["Lisinopril 10mg Daily", "Metformin 500mg Twice Daily"],
  bloodType: "O-Positive (O+)",
  emergencyContact: {
    name: "Robert Jenkins",
    relationship: "Spouse",
    phone: "(555) 876-5432"
  },
  insurance: {
    provider: "Blue Cross Blue Shield",
    policyNumber: "BCBS-98745210",
    groupNumber: "GRP-4402",
    coverageDetails: "Co-pay: $20 Primary Care, $40 Specialist. 90% coverage for in-network lab work."
  },
  photoIdUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
  onboarded: true
};

// 2. Pre-populated Doctors List
export const mockDoctors: Doctor[] = [
  {
    id: "doc_1",
    name: "Dr. Elizabeth Vance",
    specialty: "Cardiology Specialist",
    hospital: "Metropolitan Medical Center",
    location: "Building A, Suite 302, Seattle WA",
    rating: 4.9,
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
    availability: ["09:00 AM", "10:30 AM", "11:00 AM", "01:30 PM", "03:00 PM"],
    specialtyCategory: "Cardiology"
  },
  {
    id: "doc_2",
    name: "Dr. Marcus Thorne",
    specialty: "Family Practitioner & Pediatrician",
    hospital: "Greenlake Health Center",
    location: "Suite 115, Seattle WA",
    rating: 4.8,
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    availability: ["08:30 AM", "09:30 AM", "10:00 AM", "02:00 PM", "04:30 PM"],
    specialtyCategory: "General Practice"
  },
  {
    id: "doc_3",
    name: "Dr. Priya Patel",
    specialty: "Consulting Neurologist",
    hospital: "Metropolitan Medical Center",
    location: "Building B, Suite 410, Seattle WA",
    rating: 4.7,
    avatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=200",
    availability: ["10:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"],
    specialtyCategory: "Neurology"
  },
  {
    id: "doc_4",
    name: "Dr. Sarah Lin",
    specialty: "Dermatologist & Skin Care",
    hospital: "Lakeview Specialty Clinic",
    location: "Floor 2, Seattle WA",
    rating: 4.9,
    avatar: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=200",
    availability: ["09:00 AM", "11:00 AM", "02:00 PM", "03:30 PM", "05:00 PM"],
    specialtyCategory: "Dermatology"
  },
  {
    id: "doc_5",
    name: "Dr. Arthur Pendelton",
    specialty: "Orthopedic Surgeon",
    hospital: "Seattle Bone & Joint Clinic",
    location: "Suite 500, Seattle WA",
    rating: 4.6,
    avatar: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200",
    availability: ["08:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "03:00 PM"],
    specialtyCategory: "Orthopedics"
  }
];

// 3. Initial Mock Appointments
export const mockAppointments: Appointment[] = [
  {
    id: "apt_1",
    patientId: "pat_1",
    patientName: "Sarah Jenkins",
    patientAge: 38,
    patientGender: "Female",
    doctorId: "doc_1",
    doctorName: "Dr. Elizabeth Vance",
    doctorSpecialty: "Cardiology Specialist",
    doctorAvatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
    date: formatDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)), // In 2 days
    timeSlot: "10:30 AM",
    reason: "Hypertension Routine Follow-up",
    notes: "Review Lisinopril efficacy, evaluate mild occasional palpitations.",
    type: "video",
    status: "scheduled",
    zoomLink: "https://meet.google.com/abc-defg-hij",
    costEstimate: 120
  },
  {
    id: "apt_2",
    patientId: "pat_1",
    patientName: "Sarah Jenkins",
    patientAge: 38,
    patientGender: "Female",
    doctorId: "doc_2",
    doctorName: "Dr. Marcus Thorne",
    doctorSpecialty: "Family Practitioner & Pediatrician",
    doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    date: formatDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)), // 10 days ago
    timeSlot: "02:00 PM",
    reason: "Annual Physical & Routine Bloodwork",
    notes: "Feeling healthy, need refill prescriptions.",
    type: "video",
    status: "completed",
    zoomLink: "https://meet.google.com/xyz-pdqr-wst",
    costEstimate: 150,
    soapNote: {
      subjective: "Patient reports overall good health. Continues with Lisinopril and Metformin. No active side effects. Occasional mild fatigue late in the afternoon, potentially related to sugar fluctuations.",
      objective: "BP: 124/82 mmHg. HR: 74 bpm. Temp: 98.4°F. Weight: 174 lbs (down 1 lb). Lungs clear, heart sounds normal S1/S2.",
      assessment: "Controlled primary essential hypertension and well-managed Type 2 Diabetes Mellitus. Lipid levels show positive trends.",
      plan: "1. Continue Lisinopril 10mg daily. 2. Continue Metformin 500mg BID. 3. Monitor blood pressure weekly at home. 4. Return for follow-up in 3 months."
    }
  }
];

// 4. Initial Mock Messages
export const mockMessages: Message[] = [
  {
    id: "msg_1",
    conversationId: "conv_doc_1",
    senderId: "doc_1",
    senderRole: "doctor",
    text: "Hi Sarah, I reviewed your daily blood pressure logs. They look excellent, mostly averaging 122/80.",
    timestamp: "2026-06-25T09:30:00Z",
    read: true
  },
  {
    id: "msg_2",
    conversationId: "conv_doc_1",
    senderId: "pat_1",
    senderRole: "patient",
    text: "Thank you Dr. Vance! Should I continue taking the Lisinopril at the same time every morning?",
    timestamp: "2026-06-25T10:15:00Z",
    read: true
  },
  {
    id: "msg_3",
    conversationId: "conv_doc_1",
    senderId: "doc_1",
    senderRole: "doctor",
    text: "Yes, consistency is key. Keep logging them, and we will do a quick check-in at your upcoming appointment on Tuesday.",
    timestamp: "2026-06-25T11:00:00Z",
    read: true
  },
  {
    id: "msg_4",
    conversationId: "conv_doc_2",
    senderId: "doc_2",
    senderRole: "doctor",
    text: "Hello Sarah, your recent blood lab results have arrived and they look solid. Your HbA1c is 5.8%, which is excellent control!",
    timestamp: "2026-06-26T14:20:00Z",
    read: true
  }
];

export const mockConversations: Conversation[] = [
  {
    id: "conv_doc_1",
    doctorId: "doc_1",
    doctorName: "Dr. Elizabeth Vance",
    doctorSpecialty: "Cardiology",
    doctorAvatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200",
    lastMessageText: "Yes, consistency is key. Keep logging them, and we will do a quick check...",
    lastMessageTime: "2026-06-25T11:00:00Z",
    unreadCount: 0,
    doctorResponseTime: "Usually responds in 2 hours"
  },
  {
    id: "conv_doc_2",
    doctorId: "doc_2",
    doctorName: "Dr. Marcus Thorne",
    doctorSpecialty: "General Practice",
    doctorAvatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200",
    lastMessageText: "Hello Sarah, your recent blood lab results have arrived and they look...",
    lastMessageTime: "2026-06-26T14:20:00Z",
    unreadCount: 0,
    doctorResponseTime: "Usually responds in 4 hours"
  }
];

// 5. Vitals History over the last 30 days
export const generateVitalsHistory = (): VitalReading[] => {
  const readings: VitalReading[] = [];
  const baseDate = new Date();
  
  // Backfill 30 days of daily readings with realistic fluctuations
  for (let i = 29; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - i);
    
    // Slight upward trend/fluctuation in BP, heart rate, weight
    // Add noise
    const randomBPsys = Math.round(118 + Math.sin(i / 2) * 5 + Math.random() * 4);
    const randomBPdia = Math.round(76 + Math.cos(i / 2.5) * 3 + Math.random() * 3);
    const randomHR = Math.round(70 + Math.sin(i / 1.5) * 4 + Math.random() * 5);
    const randomBG = Math.round(90 + Math.cos(i) * 8 + Math.random() * 6);
    const randomWeight = Number((174.5 + Math.sin(i / 10) * 1.5 + Math.random() * 0.4).toFixed(1));
    const randomTemp = Number((98.2 + Math.random() * 0.6).toFixed(1));
    const randomO2 = Math.round(97 + Math.random() * 2.5);

    readings.push({
      id: `vit_${i}`,
      patientId: "pat_1",
      timestamp: formatDate(d) + "T08:00:00Z",
      bloodPressureSystolic: randomBPsys,
      bloodPressureDiastolic: randomBPdia,
      heartRate: randomHR,
      temperature: randomTemp,
      weight: randomWeight,
      bloodGlucose: randomBG,
      oxygenSaturation: randomO2 > 100 ? 100 : randomO2,
      notes: "Routine morning home screening"
    });
  }
  return readings;
};

// 6. Active Prescriptions
export const mockPrescriptions: Prescription[] = [
  {
    id: "rx_1",
    patientId: "pat_1",
    doctorId: "doc_1",
    doctorName: "Dr. Elizabeth Vance",
    medicationName: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily (Morning)",
    refillsRemaining: 3,
    active: true,
    startDate: "2026-05-10",
    endDate: "2026-11-10",
    pharmacy: {
      name: "Walgreens Pharmacy #4402",
      phone: "(555) 909-1234",
      address: "1205 NE Broadway, Seattle WA"
    },
    reminders: {
      enabled: true,
      time: "08:00 AM",
      frequency: "Every day"
    },
    adherenceLogs: {
      "2026-06-25": true,
      "2026-06-26": true,
      "2026-06-27": true
    }
  },
  {
    id: "rx_2",
    patientId: "pat_1",
    doctorId: "doc_2",
    doctorName: "Dr. Marcus Thorne",
    medicationName: "Metformin ER",
    dosage: "500mg",
    frequency: "Twice daily (Breakfast & Dinner)",
    refillsRemaining: 5,
    active: true,
    startDate: "2026-05-10",
    endDate: "2026-11-10",
    pharmacy: {
      name: "Walgreens Pharmacy #4402",
      phone: "(555) 909-1234",
      address: "1205 NE Broadway, Seattle WA"
    },
    reminders: {
      enabled: true,
      time: "08:30 AM",
      frequency: "Breakfast & Dinner"
    },
    adherenceLogs: {
      "2026-06-25": true,
      "2026-06-26": false,
      "2026-06-27": true
    }
  },
  {
    id: "rx_3",
    patientId: "pat_1",
    doctorId: "doc_4",
    doctorName: "Dr. Sarah Lin",
    medicationName: "Hydrocortisone Cream",
    dosage: "1%",
    frequency: "Apply BID as needed",
    refillsRemaining: 0,
    active: false,
    startDate: "2026-01-15",
    endDate: "2026-02-15",
    pharmacy: {
      name: "Walgreens Pharmacy #4402",
      phone: "(555) 909-1234",
      address: "1205 NE Broadway, Seattle WA"
    },
    reminders: {
      enabled: false,
      time: "09:00 PM",
      frequency: "As needed"
    }
  }
];

// 7. Vaccination Log
export const mockVaccines: VaccineRecord[] = [
  {
    id: "vac_1",
    name: "COVID-19 Bivalent Booster (Pfizer)",
    date: "2025-10-15",
    provider: "Rite Aid Pharmacy",
    notes: "Dose 5. Normal localized soreness."
  },
  {
    id: "vac_2",
    name: "Influenza Seasonal Quadrivalent",
    date: "2025-10-15",
    provider: "Rite Aid Pharmacy",
    notes: "Right arm."
  },
  {
    id: "vac_3",
    name: "Tdap (Tetanus, Diphtheria, Pertussis)",
    date: "2021-04-20",
    provider: "Greenlake Health Center",
    notes: "Routine booster. Good for 10 years."
  }
];

// 8. Lab Results
export const mockLabResults: LabResult[] = [
  {
    id: "lab_1",
    name: "Hemoglobin A1c (HbA1c)",
    category: "Metabolic Panel",
    date: "2026-06-17",
    value: 5.8,
    referenceRange: "4.0 - 5.6",
    unit: "%",
    status: "abnormal", // Highlighted because above 5.6 (Prediabetes range is 5.7 - 6.4)
    doctorComments: "Excellent progress, Sarah! Down from 6.1% last quarter. Your daily glucose management and diet efforts are paying off. Keep it up.",
    pdfUrl: "#",
    history: [
      { date: "2025-06-15", value: 6.4 },
      { date: "2025-09-15", value: 6.2 },
      { date: "2025-12-15", value: 6.1 },
      { date: "2026-03-15", value: 5.9 },
      { date: "2026-06-17", value: 5.8 }
    ]
  },
  {
    id: "lab_2",
    name: "Total Cholesterol",
    category: "Lipid Panel",
    date: "2026-06-17",
    value: 185,
    referenceRange: "< 200",
    unit: "mg/dL",
    status: "normal",
    doctorComments: "Total cholesterol remains in the optimal range. Nice work.",
    pdfUrl: "#",
    history: [
      { date: "2025-06-15", value: 210 },
      { date: "2025-12-15", value: 195 },
      { date: "2026-06-17", value: 185 }
    ]
  },
  {
    id: "lab_3",
    name: "LDL Cholesterol ('Bad')",
    category: "Lipid Panel",
    date: "2026-06-17",
    value: 98,
    referenceRange: "< 100",
    unit: "mg/dL",
    status: "normal",
    doctorComments: "LDL under 100 is great. Continue with current cardioprotective dietary measures.",
    pdfUrl: "#",
    history: [
      { date: "2025-06-15", value: 115 },
      { date: "2025-12-15", value: 104 },
      { date: "2026-06-17", value: 98 }
    ]
  }
];

// 9. Uploaded Documents
export const mockDocuments: UploadedDocument[] = [
  {
    id: "doc_file_1",
    name: "Chest_XRay_Report_May2026.pdf",
    type: "pdf",
    size: "1.8 MB",
    uploadDate: "2026-05-15",
    category: "scan",
    doctorName: "Dr. Marcus Thorne"
  },
  {
    id: "doc_file_2",
    name: "Dermatology_Skin_Lesion_Photo.jpg",
    type: "jpg",
    size: "4.2 MB",
    uploadDate: "2026-06-01",
    category: "other",
    doctorName: "Dr. Sarah Lin"
  }
];

// 10. Billing and Invoices
export const mockInvoices: Invoice[] = [
  {
    id: "inv_1",
    date: "2026-06-18",
    description: "Metabolic Lab Panel & Lipid Assessment",
    amount: 180.00,
    insuranceCoverage: 162.00,
    patientResponsibility: 18.00,
    status: "paid",
    claimStatus: "approved",
    dueDate: "2026-07-18"
  },
  {
    id: "inv_2",
    date: "2026-06-10",
    description: "Annual Physical Comprehensive Evaluation",
    amount: 250.00,
    insuranceCoverage: 250.00,
    patientResponsibility: 0.00,
    status: "paid",
    claimStatus: "approved",
    dueDate: "2026-07-10"
  },
  {
    id: "inv_3",
    date: "2026-06-27",
    description: "Cardiology Specialist Consultation (Pre-authorization)",
    amount: 150.00,
    insuranceCoverage: 110.00,
    patientResponsibility: 40.00,
    status: "unpaid",
    claimStatus: "submitted",
    dueDate: "2026-07-27"
  }
];

// 11. Initial Notifications
export const mockNotifications: Notification[] = [
  {
    id: "not_1",
    type: "appointment",
    title: "Upcoming Appointment Reminder",
    body: "You have a Telehealth consultation with Dr. Elizabeth Vance in 2 days (June 29th) at 10:30 AM.",
    timestamp: "2026-06-27T08:00:00Z",
    read: false
  },
  {
    id: "not_2",
    type: "lab",
    title: "New Lab Results Released",
    body: "Your Blood Panel results from June 17th are now available to view.",
    timestamp: "2026-06-18T16:45:00Z",
    read: true
  },
  {
    id: "not_3",
    type: "message",
    title: "New Message from Dr. Marcus Thorne",
    body: "Hello Sarah, your recent blood lab results have arrived...",
    timestamp: "2026-06-26T14:20:00Z",
    read: true
  }
];

// 12. Health Tips / Articles
export const mockHealthTips: HealthTip[] = [
  {
    id: "tip_1",
    category: "heart",
    title: "Sodium Control for Hypertension",
    content: "Aim for less than 1,500 mg of sodium daily. Focus on whole, fresh vegetables, lean proteins, and avoid pre-packaged soups or frozen meals which harbor hidden salt."
  },
  {
    id: "tip_2",
    category: "diet",
    title: "The Power of Dietary Fiber",
    content: "Adding soluble fiber (like oats, beans, avocados, and berries) slows glucose absorption, helping stabilize blood sugar levels and improving insulin sensitivity."
  },
  {
    id: "tip_3",
    category: "exercise",
    title: "Aerobic Activity Recommendations",
    content: "Perform 150 minutes of moderate aerobic exercise (brisk walking, cycling) weekly. Strive for 30 minutes, 5 days a week, to naturally lower systemic vascular resistance."
  },
  {
    id: "tip_4",
    category: "mental",
    title: "Mindful Breathing & Vagal Tone",
    content: "Just 5 minutes of slow diaphragmatic breathing (inhale 4s, hold 4s, exhale 6s) can trigger your parasympathetic nervous system, decreasing acute blood pressure spikes."
  }
];


// 13. Initial Mock Emails & SMS
export const mockEmails: EmailRecord[] = [
  {
    id: "em_1",
    sender: "no-reply@carepulse.org",
    recipient: "sarah.jenkins@gmail.com",
    subject: "Welcome to CarePulse Portal — EHR Identity Verified",
    body: `<h3>Welcome Sarah Jenkins,</h3>
    <p>Your electronic healthcare record onboarding is officially verified and linked to our clinical network. You now have full access to view biometrics, request RX refills, and conduct secure telehealth consultations.</p>
    <p><strong>Your Assigned EHR Identifier:</strong> EHR-942-03</p>
    <p>For security, please ensure 2-factor authentication is active on your profile settings.</p>
    <hr />
    <p style="font-size:11px;color:#888;">CarePulse Inc. • Seattle Clinical Division • Confidential HIPAA Communication</p>`,
    timestamp: "2026-06-15T09:00:00Z",
    status: "opened",
    category: "security"
  },
  {
    id: "em_2",
    sender: "scheduling@carepulse.org",
    recipient: "sarah.jenkins@gmail.com",
    subject: "Appointment Confirmed: Cardiology Telehealth Consult",
    body: `<h3>Consultation Confirmed</h3>
    <p>Your upcoming virtual cardiology review has been booked successfully with <strong>Dr. Elizabeth Vance</strong>.</p>
    <ul>
      <li><strong>Date:</strong> Monday, June 29, 2026</li>
      <li><strong>Time:</strong> 10:30 AM PST</li>
      <li><strong>Modality:</strong> Encrypted Video Room</li>
    </ul>
    <p>You may join the call directly from your CarePulse Patient Dashboard 10 minutes prior to the start time.</p>
    <hr />
    <p style="font-size:11px;color:#888;">Clinical Scheduling Dept • Reply to this email if you need to reschedule.</p>`,
    timestamp: "2026-06-27T08:05:00Z",
    status: "delivered",
    category: "appointment"
  },
  {
    id: "em_3",
    sender: "billing@carepulse.org",
    recipient: "sarah.jenkins@gmail.com",
    subject: "CarePulse E-Statement: Payment Received ($18.00)",
    body: `<h3>E-Statement Receipts</h3>
    <p>We have successfully processed your credit card payment for <strong>Invoice #inv_1</strong>.</p>
    <p><strong>Service:</strong> Metabolic Lab Panel & Lipid Assessment (Date: June 18, 2026)</p>
    <ul>
      <li><strong>Gross Medical Fees:</strong> $180.00</li>
      <li><strong>Insurance Paid (BCBS):</strong> $162.00</li>
      <li><strong>Patient Co-Pay Amount:</strong> $18.00</li>
      <li><strong>Amount Charged:</strong> $18.00 (Auth: 098412)</li>
    </ul>
    <p>Status: <strong>PAID IN FULL</strong>. Your ledger is current.</p>
    <hr />
    <p style="font-size:11px;color:#888;">CarePulse Billing & Insurance Services • Seattle Health Network</p>`,
    timestamp: "2026-06-19T10:15:00Z",
    status: "opened",
    category: "billing"
  }
];

export const mockSmsLogs: SmsRecord[] = [
  {
    id: "sms_1",
    from: "847-22", // Clinic shortcode
    to: "(555) 234-5678",
    body: "CarePulse Security OTP: Your 2-Factor code is 482-901. Valid for 10 minutes. Do not share.",
    timestamp: "2026-06-15T08:45:00Z",
    status: "read",
    category: "security"
  },
  {
    id: "sms_2",
    from: "847-22",
    to: "(555) 234-5678",
    body: "CarePulse Rx Alert: Your Metformin ER 500mg prescription is ready for pickup at Walgreens Pharmacy #4402 (1205 NE Broadway). Prescriber: Dr. Thorne. Phone: (555) 909-1234.",
    timestamp: "2026-06-25T14:30:00Z",
    status: "read",
    category: "refill"
  },
  {
    id: "sms_3",
    from: "847-22",
    to: "(555) 234-5678",
    body: "CarePulse Safety Guard: Warning - Morning Blood Pressure registered as 134/86 mmHg, slightly exceeding your baseline average. Deep breathing exercises recommended.",
    timestamp: "2026-06-27T08:15:00Z",
    status: "delivered",
    category: "vital_alert"
  }
];


// STORAGE AND RECOVERY SYSTEM (Unified state across dashboards)
export interface DashboardState {
  patient: Patient;
  doctors: Doctor[];
  appointments: Appointment[];
  messages: Message[];
  conversations: Conversation[];
  vitals: VitalReading[];
  prescriptions: Prescription[];
  vaccines: VaccineRecord[];
  labResults: LabResult[];
  documents: UploadedDocument[];
  invoices: Invoice[];
  notifications: Notification[];
  activeUserRole: 'patient' | 'doctor';
  selectedPatientId: string;
  emails: EmailRecord[];
  smsLogs: SmsRecord[];
}

const STORAGE_KEY = "CAREPULSE_DASHBOARD_STATE";

export const getInitialState = (): DashboardState => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Backwards compatibility if storage exists without emails/sms
        if (!parsed.emails) parsed.emails = mockEmails;
        if (!parsed.smsLogs) parsed.smsLogs = mockSmsLogs;
        return parsed;
      } catch {
        // Corrupted localStorage entry — fall through to default state
      }
    }
  }

  return {
    patient: initialPatient,
    doctors: mockDoctors,
    appointments: mockAppointments,
    messages: mockMessages,
    conversations: mockConversations,
    vitals: generateVitalsHistory(),
    prescriptions: mockPrescriptions,
    vaccines: mockVaccines,
    labResults: mockLabResults,
    documents: mockDocuments,
    invoices: mockInvoices,
    notifications: mockNotifications,
    activeUserRole: "patient",
    selectedPatientId: "pat_1",
    emails: mockEmails,
    smsLogs: mockSmsLogs
  };
};

export const saveState = (state: DashboardState) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  // Persist to Cloud Firestore as fallback
  saveStateToFirestore(state).catch(() => {
    // Firestore unavailable — localStorage is the source of truth
  });
};
