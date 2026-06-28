export interface Patient {
  id: string;
  name: string;
  dob: string;
  gender: string;
  email: string;
  phone: string;
  allergies: string[];
  conditions: string[];
  medications: string[];
  bloodType: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    coverageDetails: string;
  };
  photoIdUrl?: string;
  onboarded: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  location: string;
  rating: number;
  avatar: string;
  availability: string[]; // e.g., ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"]
  specialtyCategory: 'Cardiology' | 'Dermatology' | 'Pediatrics' | 'General Practice' | 'Neurology' | 'Orthopedics';
}

export interface PreVisitQuestionnaire {
  symptomsChecked: string[];
  description: string;
  severity: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  date: string;
  timeSlot: string;
  reason: string;
  notes: string;
  type: 'video' | 'audio' | 'chat';
  preVisitQuestionnaire?: PreVisitQuestionnaire;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  zoomLink?: string;
  costEstimate: number;
  reminder24hSent?: boolean;
  reminder1hSent?: boolean;
  soapNote?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'patient' | 'doctor';
  text: string;
  imageUrl?: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
  doctorResponseTime?: string; // e.g., "Usually responds in 1 hour"
}

export interface VitalReading {
  id: string;
  patientId: string;
  timestamp: string;
  bloodPressureSystolic: number; // e.g., 120
  bloodPressureDiastolic: number; // e.g., 80
  heartRate: number; // e.g., 72
  temperature: number; // e.g., 98.6
  weight: number; // e.g., 175
  bloodGlucose: number; // e.g., 95
  oxygenSaturation: number; // e.g., 98
  notes?: string;
}

export interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  refillsRemaining: number;
  active: boolean;
  startDate: string;
  endDate: string;
  pharmacy: {
    name: string;
    phone: string;
    address: string;
  };
  reminders: {
    enabled: boolean;
    time: string;
    frequency: string;
  };
  adherenceLogs?: { [date: string]: boolean }; // Track daily adherence
}

export interface VaccineRecord {
  id: string;
  name: string;
  date: string;
  provider: string;
  notes?: string;
}

export interface LabResult {
  id: string;
  name: string;
  category: 'Blood Work' | 'Urinalysis' | 'Metabolic Panel' | 'Lipid Panel' | 'Imaging';
  date: string;
  value: number;
  referenceRange: string;
  unit: string;
  status: 'normal' | 'abnormal';
  doctorComments?: string;
  pdfUrl?: string;
  history: { date: string; value: number }[];
}

export interface UploadedDocument {
  id: string;
  name: string;
  type: 'pdf' | 'jpg' | 'png';
  size: string; // e.g. "2.4 MB"
  uploadDate: string;
  category: 'prescription' | 'lab result' | 'scan' | 'other';
  doctorName?: string;
  fileUrl?: string;
}

export interface Invoice {
  id: string;
  date: string;
  description: string;
  amount: number;
  insuranceCoverage: number;
  patientResponsibility: number;
  status: 'paid' | 'pending' | 'unpaid';
  claimStatus: 'submitted' | 'approved' | 'denied' | 'processing';
  dueDate: string;
}

export interface HealthTip {
  id: string;
  category: 'heart' | 'diet' | 'mental' | 'general' | 'exercise';
  title: string;
  content: string;
}

export interface Notification {
  id: string;
  type: 'appointment' | 'refill' | 'lab' | 'message' | 'reminder';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

export interface EmailRecord {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  body: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
  category: 'appointment' | 'refill' | 'clinical' | 'billing' | 'security' | 'other';
}

export interface SmsRecord {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  category: 'appointment' | 'refill' | 'vital_alert' | 'sos' | 'security' | 'other';
}

