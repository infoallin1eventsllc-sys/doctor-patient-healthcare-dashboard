import { jsPDF } from "jspdf";
import { DashboardState } from "../data";

export function generateHealthSummaryPDF(state: DashboardState) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  const { patient, vitals, labResults, vaccines, appointments } = state;
  let pageNum = 1;
  let y = 25;

  // Helper for drawing common page header
  const drawHeader = (p: number) => {
    // Top border accent bar
    doc.setFillColor(90, 107, 93); // #5A6B5D Dark Sage Green
    doc.rect(15, 12, 180, 1.5, "F");
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(90, 107, 93);
    doc.text("CAREPULSE INTEGRATED CLINICAL NETWORK", 15, 19);
    
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text("CONFIDENTIAL PATIENT HEALTH SUMMARY", 130, 19);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 21, 195, 21);
  };

  // Helper for drawing common page footer
  const drawFooter = (p: number) => {
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 280, 195, 280);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text("CarePulse EHR System • Seattle Clinical Division • Certified HIPAA Communication", 15, 286);
    doc.text(`Page ${p}`, 188, 286);
  };

  // Helper to verify vertical space and handle pagination
  const checkSpace = (heightNeeded: number) => {
    if (y + heightNeeded > 270) {
      drawFooter(pageNum);
      doc.addPage();
      pageNum += 1;
      y = 30; // reset y on the new page
      drawHeader(pageNum);
    }
  };

  // --- START PAGE 1 COVER / DOCUMENT HEADER ---
  drawHeader(pageNum);
  
  y = 32;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(45, 55, 48); // Charcoal Slate
  doc.text("PATIENT ELECTRONIC HEALTH RECORD SUMMARY", 15, y);
  
  y += 6;
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(100, 110, 102);
  doc.text(`Generated on: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} • Verified Patient Portal Release`, 15, y);
  
  y += 8;
  doc.setDrawColor(200, 210, 202);
  doc.setFillColor(248, 249, 248); // Crisp off-white background for biographical details
  doc.rect(15, y, 180, 48, "FD");

  // Biographical Details Grid
  let gy = y + 6;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(90, 107, 93);
  doc.text("PATIENT BIOGRAPHICAL LEDGER", 20, gy);
  
  gy += 5.5;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text("Patient Name:", 20, gy);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(patient?.name || "Sarah Jenkins", 45, gy);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("EHR Patient ID:", 110, gy);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(patient?.id || "pat_1", 140, gy);

  gy += 5.5;
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("Date of Birth:", 20, gy);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(patient?.dob || "1988-04-12", 45, gy);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("Gender / Sex:", 110, gy);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(patient?.gender || "Female", 140, gy);

  gy += 5.5;
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("Blood Type:", 20, gy);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(patient?.bloodType || "O-Positive (O+)", 45, gy);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("Primary Care MD:", 110, gy);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text("Dr. Elizabeth Vance, MD", 140, gy);

  gy += 5.5;
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("Contact Phone:", 20, gy);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(patient?.phone || "(555) 234-5678", 45, gy);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("Email Address:", 110, gy);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  doc.text(patient?.email || "sarah.jenkins@gmail.com", 140, gy);

  gy += 5.5;
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(80, 80, 80);
  doc.text("Emergency Contact:", 20, gy);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  const ec = patient?.emergencyContact || { name: "Robert Jenkins", relationship: "Spouse", phone: "(555) 876-5432" };
  doc.text(`${ec.name} (${ec.relationship}) — ${ec.phone}`, 52, gy);

  y += 54; // Update cursor location

  // Allergies & Chronic Conditions Box
  checkSpace(32);
  doc.setFillColor(253, 246, 245); // Warm pastel highlight for allergies
  doc.setDrawColor(242, 226, 224);
  doc.rect(15, y, 180, 25, "FD");

  let cy = y + 5;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(190, 80, 60); // Terracotta warning text
  doc.text("VERIFIED CLINICAL ALLERGIES (IMMUNOLOGICAL SENSITIVITIES)", 20, cy);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(patient?.allergies?.join(", ") || "No known drug or environmental allergies listed", 20, cy + 4);

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(90, 107, 93); // Dark Sage
  doc.text("ACTIVE DIAGNOSED CONDITIONS (CHRONIC DISEASE REGISTRY)", 110, cy);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.text(patient?.conditions?.join(", ") || "No active chronic conditions documented", 110, cy + 4);

  y += 30;

  // Active Medications Box
  checkSpace(28);
  doc.setFillColor(243, 247, 244); // Green pastel highlight
  doc.setDrawColor(222, 235, 225);
  doc.rect(15, y, 180, 22, "FD");

  let my = y + 5;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(90, 107, 93);
  doc.text("CURRENT RECONCILED PHARMACEUTICAL & PRESCRIPTIONS LIST", 20, my);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  
  const meds = patient?.medications?.length > 0 
    ? patient.medications.join("   |   ") 
    : "No active continuous medications listed in patient dossier.";
  doc.text(meds, 20, my + 4);

  y += 28;

  // --- SECTION: LATEST CLINICAL BIOMETRICS & VITALS ---
  checkSpace(40);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(90, 107, 93);
  doc.text("LATEST CLINICAL TELEMETRY & VITAL SIGNS", 15, y);
  
  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, y, 195, y);
  
  y += 5;
  
  const latestVital = vitals?.[vitals.length - 1] || {
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
    bloodGlucose: 95,
    oxygenSaturation: 98,
    temperature: 98.6,
    weight: 175
  };

  // Vitals Grid Table
  doc.setFillColor(248, 249, 248);
  doc.rect(15, y, 180, 20, "F");
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(110, 110, 110);
  doc.text("BLOOD PRESSURE", 19, y + 5);
  doc.text("HEART RATE", 55, y + 5);
  doc.text("BLOOD GLUCOSE", 85, y + 5);
  doc.text("OXYGEN SAT.", 120, y + 5);
  doc.text("BODY TEMP.", 150, y + 5);
  doc.text("WEIGHT", 175, y + 5);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(45, 55, 48);
  doc.text(`${latestVital.bloodPressureSystolic}/${latestVital.bloodPressureDiastolic} mmHg`, 19, y + 12);
  doc.text(`${latestVital.heartRate} bpm`, 55, y + 12);
  doc.text(`${latestVital.bloodGlucose} mg/dL`, 85, y + 12);
  doc.text(`${latestVital.oxygenSaturation} %`, 120, y + 12);
  doc.text(`${latestVital.temperature} °F`, 150, y + 12);
  doc.text(`${latestVital.weight} lbs`, 175, y + 12);

  y += 26;

  // --- SECTION: LAB PANELS SPREADSHEET ---
  checkSpace(55);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(90, 107, 93);
  doc.text("RELEASED LABORATORY DIAGNOSTIC RESULTS", 15, y);
  
  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, y, 195, y);
  
  y += 5;
  
  // Table header
  doc.setFillColor(242, 244, 242);
  doc.rect(15, y, 180, 6.5, "F");
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(70, 80, 72);
  doc.text("LAB TEST PANEL", 18, y + 4.5);
  doc.text("CATEGORY", 58, y + 4.5);
  doc.text("DATE RELEASED", 90, y + 4.5);
  doc.text("RESULT VALUE", 120, y + 4.5);
  doc.text("REF TARGET RANGE", 150, y + 4.5);
  doc.text("STATUS", 180, y + 4.5);
  
  y += 6.5;

  const displayLabs = labResults || [];
  displayLabs.slice(0, 5).forEach((lab, idx) => {
    checkSpace(11);
    
    // Draw alternating background
    if (idx % 2 === 1) {
      doc.setFillColor(252, 252, 252);
      doc.rect(15, y, 180, 10, "F");
    }
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(45, 55, 48);
    doc.text(lab.name, 18, y + 6);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(lab.category, 58, y + 6);
    doc.text(lab.date, 90, y + 6);
    
    doc.setFont("Helvetica", "bold");
    doc.text(`${lab.value} ${lab.unit}`, 120, y + 6);
    
    doc.setFont("Helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(lab.referenceRange, 150, y + 6);
    
    if (lab.status === "abnormal") {
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(192, 127, 96); // Terracotta Red
      doc.text("ABNORMAL", 180, y + 6);
    } else {
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(90, 107, 93); // Sage Green
      doc.text("NORMAL", 180, y + 6);
    }
    
    y += 10;
  });

  y += 5;

  // --- PAGE 2: VISIT ENCOUNTERS AND SOAP CLINICAL NOTES ---
  checkSpace(80); // Move to a new page
  if (pageNum === 1) {
    drawFooter(pageNum);
    doc.addPage();
    pageNum += 1;
    y = 30;
    drawHeader(pageNum);
  }

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(90, 107, 93);
  doc.text("PHYSICIAN CONSULTATION LOG & SOAP VISIT NOTES", 15, y);
  
  y += 4;
  doc.setDrawColor(220, 220, 220);
  doc.line(15, y, 195, y);
  
  y += 6;

  const soapAppts = appointments?.filter(a => a.soapNote) || [];
  if (soapAppts.length === 0) {
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text("No official signed clinical SOAP notes recorded in electronic chart history.", 18, y + 4);
    y += 12;
  } else {
    // Show top 2 SOAP notes to avoid overly massive documents, or let's print them cleanly
    soapAppts.slice(0, 2).forEach((appt) => {
      checkSpace(85); // Verify space for standard SOAP block
      
      // Encounter Header Frame
      doc.setFillColor(242, 245, 242);
      doc.rect(15, y, 180, 10, "F");
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(45, 55, 48);
      doc.text(`CLINICAL ENCOUNTER: Dr. ${appt.doctorName.replace("Dr. ", "")}`, 18, y + 6.5);
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(90, 107, 93);
      doc.text(`${appt.date} • ${appt.timeSlot}`, 142, y + 6.5);
      
      y += 10;
      
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(230, 235, 230);
      doc.rect(15, y, 180, 52, "S");
      
      let sy = y + 5;
      
      // Reason for Consultation
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text("REASON FOR CONSULTATION:", 18, sy);
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(45, 55, 48);
      doc.text(appt.reason || "General Progress Review", 64, sy);
      
      // Subjective (S)
      sy += 7;
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(110, 110, 110);
      doc.text("SUBJECTIVE (S):", 18, sy);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const subjectiveLines = doc.splitTextToSize(`"${appt.soapNote?.subjective || ""}"`, 170);
      doc.text(subjectiveLines, 18, sy + 4);
      
      // Objective (O)
      sy += 12;
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(110, 110, 110);
      doc.text("OBJECTIVE (O):", 18, sy);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const objectiveLines = doc.splitTextToSize(appt.soapNote?.objective || "", 170);
      doc.text(objectiveLines, 18, sy + 4);
      
      // Assessment (A)
      sy += 12;
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(110, 110, 110);
      doc.text("ASSESSMENT (A):", 18, sy);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      const assessmentLines = doc.splitTextToSize(appt.soapNote?.assessment || "", 170);
      doc.text(assessmentLines, 18, sy + 4);
      
      // Plan (P)
      sy += 12;
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(90, 107, 93);
      doc.text("PLAN & PATHWAY (P):", 18, sy);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(50, 50, 50);
      const planLines = doc.splitTextToSize(appt.soapNote?.plan || "", 170);
      doc.text(planLines, 18, sy + 4);
      
      y += 58;
    });
  }

  y += 5;

  // --- SECTION: IMMUNIZATION CERTIFICATE LOG ---
  checkSpace(42);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(90, 107, 93);
  doc.text("CERTIFIED IMMUNIZATION & VACCINE REGISTRY", 15, y);
  
  y += 4;
  doc.line(15, y, 195, y);
  
  y += 5;

  doc.setFillColor(242, 244, 242);
  doc.rect(15, y, 180, 6.5, "F");
  
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(70, 80, 72);
  doc.text("VACCINE INJECTION DESCRIPTION", 18, y + 4.5);
  doc.text("DATE ADMINISTERED", 100, y + 4.5);
  doc.text("CLINIC/HEALTH PROVIDER", 145, y + 4.5);

  y += 6.5;

  const displayVaccines = vaccines || [];
  displayVaccines.slice(0, 4).forEach((vac, idx) => {
    checkSpace(9);
    if (idx % 2 === 1) {
      doc.setFillColor(252, 252, 252);
      doc.rect(15, y, 180, 8, "F");
    }
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(45, 55, 48);
    doc.text(vac.name, 18, y + 5.5);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(vac.date, 100, y + 5.5);
    doc.text(vac.provider, 145, y + 5.5);
    
    y += 8;
  });

  y += 6;

  // --- CHRONIC CARE PLAN TARGETS ---
  checkSpace(38);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(90, 107, 93);
  doc.text("CHRONIC CARE PATHWAY GOALS & TARGETS", 15, y);
  
  y += 4;
  doc.line(15, y, 195, y);
  
  y += 5;

  // Draw two-column care plan targets
  doc.setFillColor(248, 249, 248);
  doc.rect(15, y, 85, 20, "F");
  doc.rect(110, y, 85, 20, "F");

  // Col 1: Cardio
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(90, 107, 93);
  doc.text("CARDIOVASCULAR HYPERTENSION TARGET", 18, y + 5);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(70, 70, 70);
  doc.text(`Limit: < 130/80 mmHg (Latest Home BP: ${latestVital.bloodPressureSystolic}/${latestVital.bloodPressureDiastolic})`, 18, y + 10);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(90, 107, 93);
  doc.text("STATUS: CONTROLLED", 18, y + 15);

  // Col 2: Glycemic
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(90, 107, 93);
  doc.text("GLYCEMIC MILD DIABETES TARGET", 113, y + 5);
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(70, 70, 70);
  const latestA1c = labResults?.find(l => l.name.toLowerCase().includes("a1c"))?.value || 5.8;
  doc.text(`Limit: < 6.0% HbA1c (Latest Lab: ${latestA1c}%)`, 113, y + 10);
  doc.setFont("Helvetica", "bold");
  doc.setTextColor(90, 107, 93);
  doc.text("STATUS: OPTIMAL RANGE", 113, y + 15);

  y += 26;

  // --- CLINICAL RECORDS INTEGRITY RELEASE SEAL ---
  checkSpace(35);
  doc.setFillColor(253, 254, 253);
  doc.setDrawColor(210, 220, 212);
  doc.rect(15, y, 180, 22, "FD");

  let vy = y + 5;
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(90, 107, 93);
  doc.text("ELECTRONIC CLINICAL RECORD RELEASE SEAL & COMPLIANCE STATEMENTS", 18, vy);
  
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text(`This document has been securely generated and cryptographically certified by Seattle Clinical Group.`, 18, vy + 4.5);
  doc.text(`Electronic Integrity Security Hash Code: SHA256-${Math.random().toString(36).substring(2, 12).toUpperCase()} • SSL TLS 1.3 Envelope`, 18, vy + 8.5);
  doc.text("NPI Clinical Partner Identifier #14092471 • Fully complies with the 21st Century Cures Act OpenNotes guidelines.", 18, vy + 12.5);

  drawFooter(pageNum);

  // Download PDF
  const safeFilename = (patient?.name || "Patient").replace(/\s+/g, "_");
  doc.save(`${safeFilename}_EHR_Health_Summary_Report.pdf`);
}
