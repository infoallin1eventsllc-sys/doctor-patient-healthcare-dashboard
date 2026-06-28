import React, { useState } from "react";
import { 
  Check, 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  FileText, 
  ShieldCheck, 
  AlertCircle 
} from "lucide-react";
import { DashboardState, saveState } from "../data";

interface PatientOnboardingProps {
  state: DashboardState;
  onChangeState: (newState: DashboardState) => void;
  onComplete: () => void;
}

export default function PatientOnboarding({ state, onChangeState, onComplete }: PatientOnboardingProps) {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Local state for the form progress
  const [formData, setFormData] = useState({
    name: state.patient.name,
    email: state.patient.email,
    phone: state.patient.phone,
    dob: state.patient.dob,
    gender: state.patient.gender,
    allergies: state.patient.allergies.join(", "),
    conditions: state.patient.conditions.join(", "),
    medications: state.patient.medications.join(", "),
    bloodType: state.patient.bloodType,
    emergencyContactName: state.patient.emergencyContact.name,
    emergencyContactRelationship: state.patient.emergencyContact.relationship,
    emergencyContactPhone: state.patient.emergencyContact.phone,
    photoIdUrl: state.patient.photoIdUrl || ""
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const validateStep = (currentStep: number) => {
    const newErrors: { [key: string]: string } = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = "Full Name is required.";
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Please enter a valid email address.";
      }
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required.";
      if (!formData.dob) newErrors.dob = "Date of Birth is required.";
      if (!formData.gender) newErrors.gender = "Gender is required.";
    }

    if (currentStep === 2) {
      if (!formData.emergencyContactName.trim()) {
        newErrors.emergencyContactName = "Emergency contact name is required.";
      }
      if (!formData.emergencyContactPhone.trim()) {
        newErrors.emergencyContactPhone = "Emergency contact phone is required.";
      }
    }

    if (currentStep === 3) {
      if (!formData.photoIdUrl) {
        newErrors.photoIdUrl = "Please upload a valid Photo ID to complete verification.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Simulating Photo ID Upload (with drag-and-drop support)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // File type validation
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ photoIdUrl: "Only JPG, PNG, and PDF documents are supported." });
        return;
      }

      // Size limit (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors({ photoIdUrl: "Maximum allowed file size is 10 MB." });
        return;
      }

      setIsUploading(true);
      setErrors({});
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadSuccess(true);
        setFormData(prev => ({
          ...prev,
          photoIdUrl: URL.createObjectURL(file) // Local mock URL
        }));
      }, 1500);
    }
  };

  const handleSubmit = () => {
    if (!validateStep(3)) return;

    // Map local state to patient model
    const updatedPatient = {
      ...state.patient,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      dob: formData.dob,
      gender: formData.gender,
      allergies: formData.allergies.split(",").map(s => s.trim()).filter(Boolean),
      conditions: formData.conditions.split(",").map(s => s.trim()).filter(Boolean),
      medications: formData.medications.split(",").map(s => s.trim()).filter(Boolean),
      bloodType: formData.bloodType,
      emergencyContact: {
        name: formData.emergencyContactName,
        relationship: formData.emergencyContactRelationship,
        phone: formData.emergencyContactPhone
      },
      photoIdUrl: formData.photoIdUrl,
      onboarded: true
    };

    // Add a custom welcome notification
    const welcomeNotif = {
      id: "not_welcome",
      type: "appointment" as const,
      title: "Profile Onboarding Completed",
      body: `Welcome to CarePulse, ${formData.name}! Your medical files and onboarding are fully active.`,
      timestamp: new Date().toISOString(),
      read: false
    };

    const updatedState = {
      ...state,
      patient: updatedPatient,
      notifications: [welcomeNotif, ...state.notifications]
    };

    onChangeState(updatedState);
    saveState(updatedState);
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4" id="onboarding-flow">
      
      {/* Onboarding Header */}
      <div className="text-center mb-8">
        <h1 className="font-serif font-extrabold text-2xl text-natural-dark-sage tracking-tight">
          Complete Patient Onboarding
        </h1>
        <p className="text-xs text-natural-muted mt-1.5">
          CarePulse complies with HIPAA guidelines. Keep your information updated to ensure safe care routing.
        </p>
      </div>

      {/* Progress Stepper bar */}
      <div className="mb-10 relative">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-natural-border-light -translate-y-1/2 z-0" />
        <div className="flex justify-between relative z-10">
          {[
            { stepNum: 1, label: "Basic Info" },
            { stepNum: 2, label: "Medical Summary" },
            { stepNum: 3, label: "Verification" }
          ].map((item) => (
            <div key={item.stepNum} className="flex flex-col items-center">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center font-sans text-xs font-bold transition-all ${
                step > item.stepNum 
                  ? "bg-natural-sage text-white" 
                  : step === item.stepNum 
                  ? "bg-natural-dark-sage text-white ring-4 ring-natural-beige" 
                  : "bg-white text-natural-muted border border-natural-border"
              }`}>
                {step > item.stepNum ? <Check className="h-4 w-4" /> : item.stepNum}
              </div>
              <span className={`text-[10px] mt-1.5 font-bold uppercase tracking-wider ${
                step === item.stepNum ? "text-natural-dark-sage" : "text-natural-muted"
              }`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Card Content */}
      <div className="bg-white rounded-[28px] border border-natural-border shadow-xl p-6 md:p-8">
        
        {/* STEP 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-4" id="onboarding-step-1">
            <h3 className="font-serif font-bold text-natural-dark-sage text-sm border-b border-natural-border-light pb-2 flex items-center space-x-2">
              <ShieldCheck className="h-4 w-4 text-natural-sage" />
              <span>Step 1: Contact & Demographic Records</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div>
                <label className="text-[10px] font-bold text-natural-muted uppercase block mb-1 tracking-wider">Full Legal Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2 border border-natural-border rounded-lg text-xs focus:ring-2 focus:ring-natural-sage/20 focus:border-natural-sage transition-all outline-none text-natural-dark-sage font-bold"
                  placeholder="e.g. Sarah Jenkins"
                />
                {errors.name && <span className="text-[10px] text-natural-terracotta font-semibold mt-1 block">{errors.name}</span>}
              </div>

              <div>
                <label className="text-[10px] font-bold text-natural-muted uppercase block mb-1 tracking-wider">Email Address</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2 border border-natural-border rounded-lg text-xs focus:ring-2 focus:ring-natural-sage/20 focus:border-natural-sage transition-all outline-none text-natural-dark-sage font-bold"
                  placeholder="e.g. sarah.j@example.com"
                />
                {errors.email && <span className="text-[10px] text-natural-terracotta font-semibold mt-1 block">{errors.email}</span>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <div>
                <label className="text-[10px] font-bold text-natural-muted uppercase block mb-1 tracking-wider">Mobile Phone</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2 border border-natural-border rounded-lg text-xs focus:ring-2 focus:ring-natural-sage/20 focus:border-natural-sage transition-all outline-none text-natural-dark-sage font-bold"
                  placeholder="(555) 000-0000"
                />
                {errors.phone && <span className="text-[10px] text-natural-terracotta font-semibold mt-1 block">{errors.phone}</span>}
              </div>

              <div>
                <label className="text-[10px] font-bold text-natural-muted uppercase block mb-1 tracking-wider">Date of Birth</label>
                <input 
                  type="date" 
                  name="dob" 
                  value={formData.dob} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2 border border-natural-border rounded-lg text-xs focus:ring-2 focus:ring-natural-sage/20 focus:border-natural-sage transition-all outline-none text-natural-dark-sage font-bold"
                />
                {errors.dob && <span className="text-[10px] text-natural-terracotta font-semibold mt-1 block">{errors.dob}</span>}
              </div>

              <div>
                <label className="text-[10px] font-bold text-natural-muted uppercase block mb-1 tracking-wider">Biological Gender</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2 border border-natural-border bg-white rounded-lg text-xs focus:ring-2 focus:ring-natural-sage/20 focus:border-natural-sage transition-all outline-none text-natural-dark-sage font-bold"
                >
                  <option value="">Select Gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer Not To Say">Prefer Not To Say</option>
                </select>
                {errors.gender && <span className="text-[10px] text-natural-terracotta font-semibold mt-1 block">{errors.gender}</span>}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Medical Summary & Emergency Contact */}
        {step === 2 && (
          <div className="space-y-4 text-left" id="onboarding-step-2">
            <h3 className="font-serif font-bold text-natural-dark-sage text-sm border-b border-natural-border-light pb-2 flex items-center space-x-2">
              <FileText className="h-4 w-4 text-natural-sage" />
              <span>Step 2: Medical Summary & Contacts</span>
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-bold text-natural-muted uppercase block mb-1 tracking-wider">
                  Allergies (comma separated)
                </label>
                <input 
                  type="text" 
                  name="allergies" 
                  value={formData.allergies} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2 border border-natural-border rounded-lg text-xs focus:ring-2 focus:ring-natural-sage/20 focus:border-natural-sage transition-all outline-none text-natural-dark-sage font-bold"
                  placeholder="e.g. Penicillin, Peanuts, Pollen"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-natural-muted uppercase block mb-1 tracking-wider">
                  Active Medical Conditions (comma separated)
                </label>
                <input 
                  type="text" 
                  name="conditions" 
                  value={formData.conditions} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2 border border-natural-border rounded-lg text-xs focus:ring-2 focus:ring-natural-sage/20 focus:border-natural-sage transition-all outline-none text-natural-dark-sage font-bold"
                  placeholder="e.g. Hypertension, Asthma"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-natural-muted uppercase block mb-1 tracking-wider">
                  Current Maintenance Medications (comma separated)
                </label>
                <input 
                  type="text" 
                  name="medications" 
                  value={formData.medications} 
                  onChange={handleChange} 
                  className="w-full px-3.5 py-2 border border-natural-border rounded-lg text-xs focus:ring-2 focus:ring-natural-sage/20 focus:border-natural-sage transition-all outline-none text-natural-dark-sage font-bold"
                  placeholder="e.g. Lisinopril 10mg QD, Metformin 500mg BID"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-natural-border-light pt-3">
                <div>
                  <label className="text-[10px] font-bold text-natural-muted uppercase block mb-1 tracking-wider">Blood Type</label>
                  <select 
                    name="bloodType" 
                    value={formData.bloodType} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2 border border-natural-border bg-white rounded-lg text-xs focus:ring-2 focus:ring-natural-sage/20 focus:border-natural-sage transition-all outline-none text-natural-dark-sage font-bold"
                  >
                    <option value="">Unknown</option>
                    <option value="A-Positive (A+)">A-Positive (A+)</option>
                    <option value="A-Negative (A-)">A-Negative (A-)</option>
                    <option value="B-Positive (B+)">B-Positive (B+)</option>
                    <option value="B-Negative (B-)">B-Negative (B-)</option>
                    <option value="O-Positive (O+)">O-Positive (O+)</option>
                    <option value="O-Negative (O-)">O-Negative (O-)</option>
                    <option value="AB-Positive (AB+)">AB-Positive (AB+)</option>
                    <option value="AB-Negative (AB-)">AB-Negative (AB-)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-natural-muted uppercase block mb-1 tracking-wider">Emergency Contact Full Name</label>
                  <input 
                    type="text" 
                    name="emergencyContactName" 
                    value={formData.emergencyContactName} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2 border border-natural-border rounded-lg text-xs focus:ring-2 focus:ring-natural-sage/20 focus:border-natural-sage transition-all outline-none text-natural-dark-sage font-bold"
                    placeholder="e.g. Robert Jenkins"
                  />
                  {errors.emergencyContactName && <span className="text-[10px] text-natural-terracotta font-semibold mt-1 block">{errors.emergencyContactName}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-natural-muted uppercase block mb-1 tracking-wider">Relationship</label>
                  <input 
                    type="text" 
                    name="emergencyContactRelationship" 
                    value={formData.emergencyContactRelationship} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2 border border-natural-border rounded-lg text-xs focus:ring-2 focus:ring-natural-sage/20 focus:border-natural-sage transition-all outline-none text-natural-dark-sage font-bold"
                    placeholder="e.g. Spouse, Father"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-natural-muted uppercase block mb-1 tracking-wider">Emergency Phone Number</label>
                  <input 
                    type="text" 
                    name="emergencyContactPhone" 
                    value={formData.emergencyContactPhone} 
                    onChange={handleChange} 
                    className="w-full px-3.5 py-2 border border-natural-border rounded-lg text-xs focus:ring-2 focus:ring-natural-sage/20 focus:border-natural-sage transition-all outline-none text-natural-dark-sage font-bold"
                    placeholder="(555) 000-0000"
                  />
                  {errors.emergencyContactPhone && <span className="text-[10px] text-natural-terracotta font-semibold mt-1 block">{errors.emergencyContactPhone}</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Verification (Photo ID Upload) */}
        {step === 3 && (
          <div className="space-y-4 text-left" id="onboarding-step-3">
            <h3 className="font-serif font-bold text-natural-dark-sage text-sm border-b border-natural-border-light pb-2 flex items-center space-x-2">
              <Upload className="h-4 w-4 text-natural-sage" />
              <span>Step 3: Identity Verification (HIPAA Compliant)</span>
            </h3>

            <p className="text-xs text-natural-muted leading-relaxed">
              Please upload a copy of your driver's license, passport, or medical benefits card to verify your record authenticity prior to video telehealth routing.
            </p>

            <div className="border-2 border-dashed border-natural-border rounded-xl p-8 hover:border-natural-sage transition-all relative cursor-pointer">
              <input 
                type="file" 
                id="photo-id-file-input"
                onChange={handlePhotoUpload} 
                accept="image/png, image/jpeg, application/pdf"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="text-center space-y-2">
                <div className="h-10 w-10 bg-natural-beige text-natural-sage flex items-center justify-center rounded-xl mx-auto border border-natural-border-light">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-natural-dark-sage block">Drag & Drop ID Card Here</span>
                  <span className="text-[10px] text-natural-muted block mt-0.5">Supports PNG, JPG, or PDF (Max 10MB)</span>
                </div>
              </div>
            </div>

            {isUploading && (
              <div className="p-3.5 bg-natural-beige rounded-xl flex items-center space-x-2.5">
                <div className="h-4 w-4 rounded-full border-2 border-natural-sage border-t-transparent animate-spin" />
                <span className="text-xs text-natural-muted font-bold">Encrypting and uploading credentials securely...</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-3.5 bg-natural-sage/20 text-natural-dark-sage border border-natural-sage/30 rounded-2xl flex items-start space-x-3 text-xs">
                <Check className="h-4 w-4 text-natural-sage shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Identity Verification Loaded</span>
                  Clinical records successfully bound to photo document. Verified status will display during physician encounters.
                </div>
              </div>
            )}

            {errors.photoIdUrl && (
              <div className="p-3.5 bg-natural-terracotta/10 text-natural-text border border-natural-terracotta/30 rounded-2xl flex items-start space-x-3 text-xs">
                <AlertCircle className="h-4 w-4 text-natural-terracotta shrink-0 mt-0.5" />
                <div>{errors.photoIdUrl}</div>
              </div>
            )}
          </div>
        )}

        {/* Step Buttons */}
        <div className="flex justify-between border-t border-natural-border-light pt-6 mt-8">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-natural-beige hover:bg-natural-border-light text-natural-dark-sage font-bold text-xs rounded-full flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="px-4 py-2 bg-natural-sage hover:bg-natural-dark-sage text-white font-bold text-xs rounded-full flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <span>Next Step</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isUploading}
              className="px-5 py-2.5 bg-natural-dark-sage hover:bg-natural-sage text-white font-bold text-xs rounded-full flex items-center space-x-1.5 shadow-md shadow-natural-sage/10 transition-all disabled:opacity-50 cursor-pointer uppercase tracking-wider"
            >
              <Check className="h-4 w-4" />
              <span>Complete Records Onboarding</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
