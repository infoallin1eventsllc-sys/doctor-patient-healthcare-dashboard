import React, { useState } from "react";
import { 
  FileText, 
  CreditCard, 
  ShieldCheck, 
  Download, 
  Plus, 
  Check, 
  AlertTriangle, 
  DollarSign, 
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Upload,
  FileUp,
  Info
} from "lucide-react";
import { DashboardState, saveState } from "../data";
import { Invoice } from "../types";
import * as XLSX from "xlsx";

interface BillingInsuranceProps {
  state: DashboardState;
  onChangeState: (newState: DashboardState) => void;
}

export default function BillingInsurance({ state, onChangeState }: BillingInsuranceProps) {
  const { invoices, patient } = state;

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // New Credit Card Form state
  const [cardNumber, setCardNumber] = useState("•••• •••• •••• 4402");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCVC, setCardCVC] = useState("•••");

  const [showImportGuide, setShowImportGuide] = useState(false);

  const exportLedgerToExcel = () => {
    try {
      const dataToExport = invoices.map(inv => ({
        "Invoice ID": inv.id,
        "Statement Date": inv.date,
        "Description": inv.description,
        "Total Amount ($)": inv.amount,
        "Insurance Covered ($)": inv.insuranceCoverage,
        "Patient Responsibility ($)": inv.patientResponsibility,
        "Status": inv.status.toUpperCase(),
        "Claim Status": inv.claimStatus.toUpperCase(),
        "Due Date": inv.dueDate
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      
      // Auto-size columns slightly
      const max_len = dataToExport.reduce((w, r) => Math.max(w, r["Description"].length), 20);
      ws["!cols"] = [
        { wch: 15 }, // ID
        { wch: 15 }, // Date
        { wch: max_len + 2 }, // Description
        { wch: 15 }, // Amount
        { wch: 20 }, // Insurance
        { wch: 22 }, // Patient Resp
        { wch: 12 }, // Status
        { wch: 15 }, // Claim
        { wch: 15 }  // Due Date
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Billing Ledger");
      XLSX.writeFile(wb, `Billing_Ledger_${patient.name.replace(/\s+/g, "_")}.xlsx`);
      setSuccessMsg("Billing statement ledger successfully exported to Excel!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to export ledger to Excel.");
    }
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (!json || json.length === 0) {
          alert("The uploaded Excel sheet appears to be empty.");
          return;
        }

        // Validate headers/fields
        const newInvoices: Invoice[] = json.map((row, idx) => {
          const desc = row["Description"] || row["description"] || `Imported Item #${idx + 1}`;
          const amount = parseFloat(row["Total Amount ($)"] || row["amount"] || "0");
          const insCoverage = parseFloat(row["Insurance Covered ($)"] || row["insuranceCoverage"] || "0");
          const patResp = parseFloat(row["Patient Responsibility ($)"] || row["patientResponsibility"] || "0");
          const statusVal = (row["Status"] || row["status"] || "unpaid").toString().toLowerCase().trim();
          const claimVal = (row["Claim Status"] || row["claimStatus"] || "submitted").toString().toLowerCase().trim();
          
          let validStatus: 'paid' | 'pending' | 'unpaid' = 'unpaid';
          if (['paid', 'pending', 'unpaid'].includes(statusVal)) {
            validStatus = statusVal as any;
          }
          
          let validClaim: 'submitted' | 'approved' | 'denied' | 'processing' = 'submitted';
          if (['submitted', 'approved', 'denied', 'processing'].includes(claimVal)) {
            validClaim = claimVal as any;
          }

          return {
            id: row["Invoice ID"] || row["id"] || `inv_xls_${Date.now()}_${idx}`,
            date: row["Statement Date"] || row["date"] || new Date().toISOString().split('T')[0],
            description: desc,
            amount: isNaN(amount) ? 0 : amount,
            insuranceCoverage: isNaN(insCoverage) ? 0 : insCoverage,
            patientResponsibility: isNaN(patResp) ? 0 : patResp,
            status: validStatus,
            claimStatus: validClaim,
            dueDate: row["Due Date"] || row["dueDate"] || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          };
        });

        // Merge or replace
        const mergedInvoices = [...newInvoices, ...invoices];
        
        // Remove duplicates by ID, keeping the newly imported ones first
        const uniqueInvoices = mergedInvoices.filter((inv, index, self) =>
          self.findIndex(t => t.id === inv.id) === index
        );

        const updatedState = {
          ...state,
          invoices: uniqueInvoices,
          notifications: [
            {
              id: `not_billing_import_${Date.now()}`,
              type: "refill" as const,
              title: "Billing Records Imported",
              body: `Successfully imported ${newInvoices.length} invoices/statements from Excel.`,
              timestamp: new Date().toISOString(),
              read: false
            },
            ...state.notifications
          ]
        };

        onChangeState(updatedState);
        saveState(updatedState);
        setSuccessMsg(`Successfully imported ${newInvoices.length} billing items from Excel!`);
        setTimeout(() => setSuccessMsg(""), 5000);
      } catch (err) {
        console.error(err);
        alert("Error parsing Excel file. Please ensure it has correct formatting.");
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input
    e.target.value = "";
  };

  const downloadBillingTemplate = () => {
    const sampleData = [
      {
        "Invoice ID": "inv_sample_101",
        "Statement Date": "2026-06-27",
        "Description": "Routine Physical & Lab Work",
        "Total Amount ($)": 350.00,
        "Insurance Covered ($)": 300.00,
        "Patient Responsibility ($)": 50.00,
        "Status": "unpaid",
        "Claim Status": "approved",
        "Due Date": "2026-07-27"
      },
      {
        "Invoice ID": "inv_sample_102",
        "Statement Date": "2026-06-15",
        "Description": "Cardiology Specialist consultation",
        "Total Amount ($)": 240.00,
        "Insurance Covered ($)": 200.00,
        "Patient Responsibility ($)": 40.00,
        "Status": "paid",
        "Claim Status": "approved",
        "Due Date": "2026-07-15"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Billing Template");
    XLSX.writeFile(wb, "CarePulse_Billing_Import_Template.xlsx");
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const submitSimulatedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsPaying(true);

    // Simulate Stripe payment request processing
    setTimeout(() => {
      setIsPaying(false);

      const updatedInvoices = invoices.map((inv) => {
        if (inv.id === selectedInvoice.id) {
          return {
            ...inv,
            status: "paid" as const,
            claimStatus: "approved" as const
          };
        }
        return inv;
      });

      const paymentNotification = {
        id: `not_payment_${selectedInvoice.id}_${Date.now()}`,
        type: "refill" as const, // standard payment style alert
        title: "Invoice Paid Successfully",
        body: `Payment of $${selectedInvoice.patientResponsibility.toFixed(2)} for ${selectedInvoice.description} has been approved via Stripe.`,
        timestamp: new Date().toISOString(),
        read: false
      };

      const updatedState = {
        ...state,
        invoices: updatedInvoices,
        notifications: [paymentNotification, ...state.notifications]
      };

      onChangeState(updatedState);
      saveState(updatedState);

      setSuccessMsg(`Stripe payment approved! Invoice ${selectedInvoice.id} successfully paid.`);
      setSelectedInvoice(null);
      setTimeout(() => setSuccessMsg(""), 3000);
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-left" id="billing-insurance-portal">
      
      {/* Page Header */}
      <div className="mb-8 space-y-1">
        <h1 className="font-serif font-extrabold text-xl text-natural-dark-sage tracking-tight">Billing Ledger & Insurance Claims</h1>
        <p className="text-xs text-natural-muted">Review claims filed, settle co-pays securely via Stripe, and download historical medical expense statements.</p>
      </div>

      {successMsg && (
        <div className="mb-6 p-3.5 bg-natural-sage/20 text-natural-dark-sage border border-natural-sage/30 rounded-xl flex items-center space-x-2 text-xs font-bold animate-in fade-in">
          <CheckCircle className="h-4.5 w-4.5 text-natural-sage shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STRIPE SIMULATED CHECKOUT DRAWER */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-[#2f3630]/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-sm w-full border border-natural-border shadow-2xl overflow-hidden flex flex-col">
            
            <div className="bg-natural-dark-sage text-white p-4 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-natural-beige" />
                <span className="font-serif font-bold text-xs uppercase tracking-wider">Stripe Secure Checkout</span>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)} 
                className="text-xs font-bold text-natural-beige hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={submitSimulatedPayment} className="p-5 space-y-4 text-xs text-natural-text flex-1">
              <div className="bg-natural-beige p-3.5 border border-natural-border-light rounded-xl text-left space-y-2">
                <span className="text-[10px] text-natural-muted uppercase font-bold tracking-wider">Payment Summary</span>
                <p className="font-serif font-bold text-natural-dark-sage">{selectedInvoice.description}</p>
                <div className="flex justify-between items-center text-natural-text">
                  <span>Settle Balance Due:</span>
                  <span className="font-mono text-sm font-black text-natural-dark-sage">${selectedInvoice.patientResponsibility.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-natural-muted font-bold block uppercase tracking-wider mb-1">Credit Card Number</label>
                  <input 
                    type="text" 
                    value={cardNumber} 
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-natural-border bg-white rounded-lg text-xs outline-none focus:border-natural-sage font-mono text-natural-text"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-natural-muted font-bold block uppercase tracking-wider mb-1">Expiry Date</label>
                    <input 
                      type="text" 
                      value={cardExpiry} 
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 border border-natural-border bg-white rounded-lg text-xs outline-none focus:border-natural-sage font-mono text-natural-text"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-natural-muted font-bold block uppercase tracking-wider mb-1">CVC / CVV</label>
                    <input 
                      type="password" 
                      value={cardCVC} 
                      onChange={(e) => setCardCVC(e.target.value)}
                      className="w-full px-3 py-2 border border-natural-border bg-white rounded-lg text-xs outline-none focus:border-natural-sage font-mono text-natural-text"
                      maxLength={3}
                      required
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isPaying}
                className="w-full py-2.5 bg-natural-sage hover:bg-natural-dark-sage disabled:opacity-50 text-white font-bold text-xs rounded-full transition-all shadow-md shadow-natural-sage/10 flex items-center justify-center space-x-1 uppercase tracking-wider"
              >
                {isPaying ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin mr-1.5" />
                    <span>Authorizing Stripe transaction...</span>
                  </>
                ) : (
                  <span>Pay ${selectedInvoice.patientResponsibility.toFixed(2)} securely</span>
                )}
              </button>

              <span className="text-[9px] text-natural-muted text-center block max-w-xs mx-auto leading-relaxed">
                🛡️ Card details are encrypted. Stripe token ID: <span className="font-mono text-natural-sage font-bold">tok_9824_carepulse</span> referenced in clinical database logs.
              </span>
            </form>

          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Invoice Lists ledger */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-natural-border-light pb-4 mb-2">
              <div>
                <span className="font-serif text-sm font-bold text-natural-dark-sage block">Patient Billing Statement Ledger</span>
                <p className="text-[10px] text-natural-muted font-bold">Import or export financial statements via standard Excel worksheets.</p>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={exportLedgerToExcel}
                  className="px-3 py-1.5 bg-natural-sage/10 hover:bg-natural-sage/20 text-natural-dark-sage rounded-xl text-xs font-bold transition-all flex items-center space-x-1 border border-natural-sage/20 cursor-pointer active:scale-95"
                  title="Export entire list to Excel"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-natural-sage" />
                  <span>Export to Excel</span>
                </button>

                <label className="px-3 py-1.5 bg-white hover:bg-natural-beige border border-natural-border text-natural-dark-sage rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer active:scale-95">
                  <Upload className="h-3.5 w-3.5 text-natural-sage" />
                  <span>Import Excel</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleExcelImport}
                    className="hidden"
                  />
                </label>

                <button
                  onClick={() => setShowImportGuide(!showImportGuide)}
                  className="p-1.5 bg-white hover:bg-natural-beige border border-natural-border text-natural-muted hover:text-natural-dark-sage rounded-xl transition-all cursor-pointer"
                  title="Show spreadsheet import guidelines & template"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* EXPANDABLE SPREADSHEET IMPORT GUIDE */}
            {showImportGuide && (
              <div className="p-4 bg-natural-beige/40 rounded-2xl border border-natural-border-light text-xs text-natural-text text-left space-y-3.5 animate-in fade-in duration-200">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="font-serif font-black text-xs text-natural-dark-sage block">Excel Import Guidelines</span>
                    <p className="text-[10px] text-natural-muted font-bold">Ensure your Excel sheet contains the following headers to load billing statements:</p>
                  </div>
                  <button
                    onClick={downloadBillingTemplate}
                    className="px-2.5 py-1 bg-natural-sage text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer hover:bg-natural-dark-sage"
                  >
                    <Download className="h-3 w-3" />
                    <span>Download Template</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-natural-border/60 text-[10px] font-semibold text-natural-muted">
                  <div className="space-y-0.5">
                    <span className="font-mono text-natural-dark-sage block">Invoice ID</span>
                    <span className="text-slate-400 block">Optional (e.g., inv_101)</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-natural-dark-sage block">Statement Date</span>
                    <span className="text-slate-400 block">YYYY-MM-DD format</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-natural-dark-sage block">Description</span>
                    <span className="text-slate-400 block">The service name (Required)</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-natural-dark-sage block">Total Amount ($)</span>
                    <span className="text-slate-400 block">Numeric amount (e.g. 350.00)</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-natural-dark-sage block">Insurance Covered ($)</span>
                    <span className="text-slate-400 block">Numeric amount (e.g. 300.00)</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-natural-dark-sage block">Patient Responsibility ($)</span>
                    <span className="text-slate-400 block">Numeric amount (e.g. 50.00)</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-natural-dark-sage block">Status</span>
                    <span className="text-slate-400 block">paid | unpaid | pending</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-natural-dark-sage block">Claim Status</span>
                    <span className="text-slate-400 block">submitted | approved | denied</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="font-mono text-natural-dark-sage block">Due Date</span>
                    <span className="text-slate-400 block">YYYY-MM-DD format</span>
                  </div>
                </div>
              </div>
            )}

            <div className="divide-y divide-natural-border-light">
              {invoices.map((inv) => {
                const unpaid = inv.status === "unpaid";
                return (
                  <div key={inv.id} className="py-3.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="space-y-0.5 text-xs text-natural-text text-left">
                      <div className="flex items-center space-x-2">
                        <span className="font-serif font-bold text-natural-dark-sage">{inv.description}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          inv.status === "paid" 
                            ? "bg-natural-sage/20 text-natural-dark-sage" 
                            : "bg-natural-terracotta/20 text-natural-terracotta"
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-natural-muted block">Statement Date: {inv.date} — Invoice ID: {inv.id}</span>
                      <span className="text-[10px] text-natural-sage font-bold block">Claim Status: {inv.claimStatus}</span>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right text-xs">
                        <span className="font-mono text-natural-muted block">Est: ${inv.amount.toFixed(2)}</span>
                        <span className="font-serif font-bold text-natural-dark-sage block">Due: ${inv.patientResponsibility.toFixed(2)}</span>
                      </div>
                      {unpaid ? (
                        <button
                          onClick={() => handlePayInvoice(inv)}
                          className="px-4 py-2 bg-natural-sage hover:bg-natural-dark-sage text-white text-[10px] font-bold rounded-full transition-colors cursor-pointer"
                        >
                          Settle Bill
                        </button>
                      ) : (
                        <button
                          onClick={() => alert(`Simulating statement PDF download for invoice ${inv.id}`)}
                          className="p-1.5 hover:bg-natural-beige rounded-full border border-natural-border text-natural-muted hover:text-natural-dark-sage cursor-pointer"
                          title="Download Statement"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: Insurance policy Details */}
        <div className="lg:col-span-4 space-y-6 text-xs text-natural-text">
          
          {/* Insurance Information Card */}
          <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">Insured Benefits Record</span>
            
            <div className="space-y-2.5 text-[11px] text-left">
              <div>
                <span className="text-[9px] text-natural-muted block font-bold uppercase tracking-wider">Provider</span>
                <span className="font-serif font-bold text-natural-dark-sage block">{patient.insurance.provider}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 border-t border-natural-border-light pt-2.5">
                <div>
                  <span className="text-[9px] text-natural-muted block font-bold uppercase tracking-wider">Policy Number</span>
                  <span className="font-mono font-bold text-natural-dark-sage">{patient.insurance.policyNumber}</span>
                </div>
                <div>
                  <span className="text-[9px] text-natural-muted block font-bold uppercase tracking-wider">Group ID</span>
                  <span className="font-mono font-bold text-natural-dark-sage">{patient.insurance.groupNumber}</span>
                </div>
              </div>
              <div className="border-t border-natural-border-light pt-2.5">
                <span className="text-[9px] text-natural-muted block font-bold uppercase tracking-wider">Coverage Details</span>
                <p className="text-natural-muted leading-relaxed text-[10px]">{patient.insurance.coverageDetails}</p>
              </div>
            </div>
          </div>

          {/* Simulated Stripe Checkout payment method card */}
          <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs space-y-4">
            <span className="text-[10px] font-bold text-natural-muted uppercase tracking-widest block">Wallet Payment Methods</span>
            
            <div className="p-3.5 bg-natural-beige border border-natural-border rounded-xl flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4.5 w-4.5 text-natural-sage shrink-0" />
                <span className="font-mono font-bold text-[11px] text-natural-dark-sage">•••• 4402 (Visa)</span>
              </div>
              <span className="text-[8px] uppercase bg-natural-sage/20 text-natural-dark-sage px-2 py-0.5 rounded-full font-bold">Default</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
