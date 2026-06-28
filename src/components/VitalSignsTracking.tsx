import React, { useState, useEffect } from "react";
import { 
  Heart, 
  Activity, 
  Thermometer, 
  Scale, 
  Droplet, 
  Wind, 
  Plus, 
  Check, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  Clock,
  Sparkles,
  Cpu,
  ArrowUpCircle,
  Info,
  Download,
  Share2,
  Trash2,
  Filter,
  TrendingDown,
  Wifi,
  WifiOff,
  Battery,
  RefreshCw,
  Lock,
  Unlock,
  Sliders,
  CheckCircle,
  Shield,
  Radio,
  Server,
  Upload,
  FileSpreadsheet
} from "lucide-react";
import { DashboardState, saveState, formatDate } from "../data";
import { VitalReading } from "../types";
import * as XLSX from "xlsx";

interface VitalSignsTrackingProps {
  state: DashboardState;
  onChangeState: (newState: DashboardState) => void;
}

export default function VitalSignsTracking({ state, onChangeState }: VitalSignsTrackingProps) {
  const { vitals } = state;

  // Time filter state
  const [timePeriod, setTimePeriod] = useState<'7d' | '15d' | 'all'>('15d');

  // Interactive hover coordinate tracker for SVG chart
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // New vitals logging form state
  const [systolic, setSystolic] = useState("120");
  const [diastolic, setDiastolic] = useState("80");
  const [heartRate, setHeartRate] = useState("72");
  const [temp, setTemp] = useState("98.6");
  const [weight, setWeight] = useState("174.5");
  const [glucose, setGlucose] = useState("95");
  const [oxygen, setOxygen] = useState("98");
  const [dateStr, setDateStr] = useState(formatDate(new Date()) + "T" + new Date().toTimeString().slice(0, 5));
  const [notes, setNotes] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);

  const [showVitalsImportGuide, setShowVitalsImportGuide] = useState(false);

  const exportVitalsToExcel = () => {
    try {
      const dataToExport = vitals.map(reading => ({
        "Reading ID": reading.id,
        "Logged Timestamp": reading.timestamp,
        "Blood Pressure Systolic": reading.bloodPressureSystolic,
        "Blood Pressure Diastolic": reading.bloodPressureDiastolic,
        "Heart Rate (bpm)": reading.heartRate,
        "Body Temp (F)": reading.temperature,
        "Weight (lbs)": reading.weight,
        "Blood Glucose (mg/dL)": reading.bloodGlucose,
        "Oxygen Saturation (%)": reading.oxygenSaturation,
        "Clinical Notes": reading.notes || ""
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      ws["!cols"] = [
        { wch: 15 }, // ID
        { wch: 25 }, // Timestamp
        { wch: 22 }, // BP Sys
        { wch: 22 }, // BP Dia
        { wch: 15 }, // HR
        { wch: 15 }, // Temp
        { wch: 15 }, // Weight
        { wch: 22 }, // Glucose
        { wch: 22 }, // O2
        { wch: 35 }  // Notes
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Biometric Logs");
      XLSX.writeFile(wb, "CarePulse_Biometric_Logs.xlsx");
      setSuccessMsg("Biometric log history successfully exported to Excel!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      alert("Failed to export vitals to Excel.");
    }
  };

  const handleVitalsExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        const newVitals: VitalReading[] = json.map((row, idx) => {
          const sys = parseInt(row["Blood Pressure Systolic"] || row["systolic"] || "120");
          const dia = parseInt(row["Blood Pressure Diastolic"] || row["diastolic"] || "80");
          const hr = parseInt(row["Heart Rate (bpm)"] || row["heartRate"] || "72");
          const tempVal = parseFloat(row["Body Temp (F)"] || row["temperature"] || "98.6");
          const wt = parseFloat(row["Weight (lbs)"] || row["weight"] || "175");
          const bg = parseInt(row["Blood Glucose (mg/dL)"] || row["bloodGlucose"] || "95");
          const o2 = parseInt(row["Oxygen Saturation (%)"] || row["oxygenSaturation"] || "98");

          return {
            id: row["Reading ID"] || row["id"] || `v_xls_${Date.now()}_${idx}`,
            patientId: state.patient.id,
            timestamp: row["Logged Timestamp"] || row["timestamp"] || new Date().toISOString(),
            bloodPressureSystolic: isNaN(sys) ? 120 : sys,
            bloodPressureDiastolic: isNaN(dia) ? 80 : dia,
            heartRate: isNaN(hr) ? 72 : hr,
            temperature: isNaN(tempVal) ? 98.6 : tempVal,
            weight: isNaN(wt) ? 175 : wt,
            bloodGlucose: isNaN(bg) ? 95 : bg,
            oxygenSaturation: isNaN(o2) ? 98 : o2,
            notes: row["Clinical Notes"] || row["notes"] || "Imported via Excel"
          };
        });

        // Merge or replace
        const mergedVitals = [...newVitals, ...vitals];
        // Deduplicate by ID
        const uniqueVitals = mergedVitals.filter((v, index, self) =>
          self.findIndex(t => t.id === v.id) === index
        );

        const updatedState = {
          ...state,
          vitals: uniqueVitals,
          notifications: [
            {
              id: `not_vitals_import_${Date.now()}`,
              type: "refill" as const,
              title: "Biometrics Imported from Excel",
              body: `Successfully imported ${newVitals.length} vitals record(s) from Excel spreadsheet.`,
              timestamp: new Date().toISOString(),
              read: false
            },
            ...state.notifications
          ]
        };

        onChangeState(updatedState);
        saveState(updatedState);
        setSuccessMsg(`Successfully imported ${newVitals.length} biometric logs from Excel!`);
        setTimeout(() => setSuccessMsg(""), 5000);
      } catch (err) {
        console.error(err);
        alert("Error parsing Excel file. Please make sure headers match the template.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const downloadVitalsTemplate = () => {
    const sampleData = [
      {
        "Reading ID": "vit_sample_01",
        "Logged Timestamp": "2026-06-27T08:00:00",
        "Blood Pressure Systolic": 118,
        "Blood Pressure Diastolic": 76,
        "Heart Rate (bpm)": 68,
        "Body Temp (F)": 98.4,
        "Weight (lbs)": 174.2,
        "Blood Glucose (mg/dL)": 92,
        "Oxygen Saturation (%)": 99,
        "Clinical Notes": "Morning reading. Felt great."
      },
      {
        "Reading ID": "vit_sample_02",
        "Logged Timestamp": "2026-06-27T20:00:00",
        "Blood Pressure Systolic": 121,
        "Blood Pressure Diastolic": 82,
        "Heart Rate (bpm)": 75,
        "Body Temp (F)": 98.8,
        "Weight (lbs)": 174.8,
        "Blood Glucose (mg/dL)": 110,
        "Oxygen Saturation (%)": 98,
        "Clinical Notes": "After-dinner reading."
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vitals Import Template");
    XLSX.writeFile(wb, "CarePulse_Vitals_Import_Template.xlsx");
  };

  // Selected metric for visualizer: 'bp' | 'hr' | 'bg' | 'o2'
  const [activeMetric, setActiveMetric] = useState<'bp' | 'hr' | 'bg' | 'o2'>("bp");

  // Wi-Fi Smart Devices states
  const [activeTrackingMode, setActiveTrackingMode] = useState<'trends' | 'devices'>('trends');
  
  interface WifiDevice {
    id: string;
    name: string;
    model: string;
    icon: 'heart' | 'activity' | 'scale' | 'wind';
    status: 'connected' | 'disconnected' | 'pairing' | 'weak';
    ssid: string;
    signalStrength: number; // dBm
    batteryLevel: number;
    lastSynced: string;
    macAddress: string;
    ipAddress: string;
    firmware: string;
  }

  const [devices, setDevices] = useState<WifiDevice[]>([
    {
      id: "dev_bp",
      name: "Smart Blood Pressure Cuff",
      model: "CarePulse BP-Sync v2",
      icon: "heart",
      status: "connected",
      ssid: "Home_WiFi_5G",
      signalStrength: -62,
      batteryLevel: 92,
      lastSynced: "1 hour ago",
      macAddress: "B4:E6:2D:11:A4:9C",
      ipAddress: "192.168.1.112",
      firmware: "v2.1.4-build08"
    },
    {
      id: "dev_cgm",
      name: "Continuous Glucose Monitor",
      model: "CarePulse SugarWave Pro",
      icon: "activity",
      status: "connected",
      ssid: "Home_WiFi_5G",
      signalStrength: -54,
      batteryLevel: 78,
      lastSynced: "5 minutes ago",
      macAddress: "40:F5:20:9A:8B:11",
      ipAddress: "192.168.1.115",
      firmware: "v1.0.9-release"
    },
    {
      id: "dev_scale",
      name: "Smart Weight Scale",
      model: "CarePulse LibraTrack v3",
      icon: "scale",
      status: "disconnected",
      ssid: "None",
      signalStrength: 0,
      batteryLevel: 64,
      lastSynced: "Yesterday",
      macAddress: "F8:9A:C4:B3:22:90",
      ipAddress: "0.0.0.0",
      firmware: "v3.0.2-std"
    },
    {
      id: "dev_ox",
      name: "Clinical Pulse Oximeter",
      model: "CarePulse OxyFlow IoT",
      icon: "wind",
      status: "weak",
      ssid: "Home_WiFi_5G_Ext",
      signalStrength: -84,
      batteryLevel: 45,
      lastSynced: "3 hours ago",
      macAddress: "3C:A6:F6:12:D5:EB",
      ipAddress: "192.168.1.189",
      firmware: "v1.4.1"
    }
  ]);

  const [syncingDeviceId, setSyncingDeviceId] = useState<string | null>(null);
  const [syncProgress, setSyncProgress] = useState<string>("");
  const [syncStep, setSyncStep] = useState<number>(0);

  const [configureDeviceId, setConfigureDeviceId] = useState<string | null>(null);
  const [pairingStep, setPairingStep] = useState<number>(1);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scannedNetworks, setScannedNetworks] = useState<{ ssid: string; strength: number; secured: boolean }[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [wifiPassword, setWifiPassword] = useState<string>("");
  const [showWifiPassword, setShowWifiPassword] = useState<boolean>(false);
  const [pairingStatusMsg, setPairingStatusMsg] = useState<string>("");

  // Diagnostics states
  const [pingStatus, setPingStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [pingLog, setPingLog] = useState<string[]>([]);
  const [activeTabDiagnostic, setActiveTabDiagnostic] = useState<'ping' | 'signal' | 'faq'>('faq');
  const [noiseLevel, setNoiseLevel] = useState<number>(-75);

  // Software & Firmware Update Center states
  const [appVersion, setAppVersion] = useState<string>("v4.2.1-stable");
  const [appUpdating, setAppUpdating] = useState<boolean>(false);
  const [appUpdateProgress, setAppUpdateProgress] = useState<number>(0);
  const [appUpdateStatus, setAppUpdateStatus] = useState<string>("");

  const [updatingDeviceId, setUpdatingDeviceId] = useState<string | null>(null);
  const [deviceUpdateProgress, setDeviceUpdateProgress] = useState<number>(0);
  const [deviceUpdateStatus, setDeviceUpdateStatus] = useState<string>("");

  // Handler for Portal App Update
  const handleUpdateApp = () => {
    if (appUpdating) return;
    setAppUpdating(true);
    setAppUpdateProgress(0);
    setAppUpdateStatus("Initializing secure pipeline connection...");

    const intervals = [
      { progress: 10, status: "Connecting to scg-telemetry-server-us-east.carepulse.org..." },
      { progress: 28, status: "Retrieving secure payload block (AES-256 encrypted)..." },
      { progress: 45, status: "Extracting bundle & validating GPG SHA256 integrity signatures..." },
      { progress: 68, status: "Applying software updates and hot-patching system layers..." },
      { progress: 85, status: "Recompiling and clearing stale virtual DOM caching layers..." },
      { progress: 100, status: "Rebooting dashboard telemetry context..." }
    ];

    let currentStep = 0;
    const runUpdate = () => {
      if (currentStep < intervals.length) {
        const step = intervals[currentStep];
        setAppUpdateProgress(step.progress);
        setAppUpdateStatus(step.status);
        currentStep++;
        setTimeout(runUpdate, 1000);
      } else {
        setAppVersion("v4.2.2-patch3");
        setAppUpdating(false);
        
        // Add clinical portal notification
        const updatedState = {
          ...state,
          notifications: [
            {
              id: `not_app_update_${Date.now()}`,
              type: "reminder" as const,
              title: "System Update Completed",
              body: "CarePulse Portal successfully updated to v4.2.2-patch3. Bluetooth telemetry modules and battery reports re-calibrated.",
              timestamp: new Date().toISOString(),
              read: false
            },
            ...state.notifications
          ]
        };
        onChangeState(updatedState);
        saveState(updatedState);

        setSuccessMsg("Portal application successfully updated to v4.2.2-patch3!");
        setTimeout(() => setSuccessMsg(""), 6000);
      }
    };

    setTimeout(runUpdate, 600);
  };

  // Handler for Device Firmware Update
  const handleUpdateDeviceFirmware = (deviceId: string, targetFirmware: string) => {
    if (updatingDeviceId) return;
    setUpdatingDeviceId(deviceId);
    setDeviceUpdateProgress(0);
    setDeviceUpdateStatus("Initializing secure Over-The-Air connection...");

    const intervals = [
      { progress: 15, status: "Establishing encrypted connection over local SSID network..." },
      { progress: 40, status: "Streaming compressed firmware binary block (AES-256 decrypted)..." },
      { progress: 70, status: "Flushing device EEPROM sectors and writing binary system image..." },
      { progress: 90, status: "Performing firmware self-test & sensor calibration audits..." },
      { progress: 100, status: "Rebooting micro-controller. Safe execution verified." }
    ];

    let currentStep = 0;
    const runUpdate = () => {
      if (currentStep < intervals.length) {
        const step = intervals[currentStep];
        setDeviceUpdateProgress(step.progress);
        setDeviceUpdateStatus(step.status);
        currentStep++;
        setTimeout(runUpdate, 1000);
      } else {
        // Complete the update
        setDevices(prev => prev.map(d => {
          if (d.id === deviceId) {
            return { ...d, firmware: targetFirmware };
          }
          return d;
        }));
        setUpdatingDeviceId(null);

        const devName = devices.find(d => d.id === deviceId)?.name || "Device";

        // Add clinical portal notification
        const updatedState = {
          ...state,
          notifications: [
            {
              id: `not_dev_update_${Date.now()}`,
              type: "refill" as const,
              title: `${devName} Firmware Flashed`,
              body: `Successfully upgraded ${devName} Over-The-Air to firmware version ${targetFirmware}.`,
              timestamp: new Date().toISOString(),
              read: false
            },
            ...state.notifications
          ]
        };
        onChangeState(updatedState);
        saveState(updatedState);

        setSuccessMsg(`Device "${devName}" firmware successfully updated to ${targetFirmware}!`);
        setTimeout(() => setSuccessMsg(""), 6000);
      }
    };

    setTimeout(runUpdate, 600);
  };

  const handleSyncDevice = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device || device.status === 'disconnected') {
      setSuccessMsg("Cannot sync: Device is disconnected from Wi-Fi.");
      setTimeout(() => setSuccessMsg(""), 4000);
      return;
    }

    setSyncingDeviceId(deviceId);
    setSyncStep(1);
    setSyncProgress("Establishing secure handshaking to clinical EHR gateway...");

    setTimeout(() => {
      setSyncStep(2);
      setSyncProgress("Transmitting cryptographically signed biometric telemetry packets...");
      
      setTimeout(() => {
        setSyncStep(3);
        setSyncProgress("Verifying transmission checksum with server NTP clocks...");

        setTimeout(() => {
          // Generate realistic biometric readings
          let s = 120;
          let d = 80;
          let hr = 72;
          let o2 = 98;
          let bg = 95;
          let tempVal = 98.4;
          let wt = 174.5;
          let notesStr = "";

          const now = new Date();

          if (deviceId === 'dev_bp') {
            s = Math.floor(Math.random() * (128 - 115) + 115);
            d = Math.floor(Math.random() * (83 - 73) + 73);
            hr = Math.floor(Math.random() * (78 - 66) + 66);
            notesStr = `Auto-synced via Wi-Fi: ${device.model}. Blood pressure trends stable.`;
          } else if (deviceId === 'dev_cgm') {
            bg = Math.floor(Math.random() * (135 - 82) + 82);
            notesStr = `Auto-synced continuous glucose monitor: ${device.model}.`;
          } else if (deviceId === 'dev_scale') {
            wt = parseFloat((174.5 + (Math.random() * 2 - 1)).toFixed(1));
            notesStr = `Smart scale telemetry upload: ${device.model}.`;
          } else if (deviceId === 'dev_ox') {
            o2 = Math.floor(Math.random() * (100 - 95) + 95);
            hr = Math.floor(Math.random() * (84 - 68) + 68);
            notesStr = `Oxygen saturation pulse telemetry: ${device.model}.`;
          }

          const newReading: VitalReading = {
            id: "vital_" + Date.now(),
            patientId: state.patient.id,
            timestamp: now.toISOString(),
            bloodPressureSystolic: s,
            bloodPressureDiastolic: d,
            heartRate: hr,
            temperature: tempVal,
            weight: wt,
            bloodGlucose: bg,
            oxygenSaturation: o2,
            notes: notesStr
          };

          // Update state
          const updatedVitals = [...state.vitals, newReading].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          onChangeState({
            ...state,
            vitals: updatedVitals
          });
          saveState({
            ...state,
            vitals: updatedVitals
          });

          // Update device synced status
          setDevices(prev => prev.map(d => {
            if (d.id === deviceId) {
              return { ...d, lastSynced: "Just now", signalStrength: deviceId === 'dev_ox' ? -80 : d.signalStrength };
            }
            return d;
          }));

          setSyncingDeviceId(null);
          setSyncStep(0);
          setSuccessMsg(`Telemetry sync complete! Imported new reading: ${deviceId === 'dev_bp' ? `${s}/${d} mmHg` : deviceId === 'dev_cgm' ? `${bg} mg/dL` : deviceId === 'dev_ox' ? `${o2}% O₂` : `${wt} lbs`}`);
          setTimeout(() => setSuccessMsg(""), 5000);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const handleScanNetworks = () => {
    setIsScanning(true);
    setScannedNetworks([]);
    setTimeout(() => {
      setScannedNetworks([
        { ssid: "Home_WiFi_5G", strength: -52, secured: true },
        { ssid: "Jenkins_Secure_IoT", strength: -48, secured: true },
        { ssid: "Guest_WiFi_Unsecured", strength: -80, secured: false },
        { ssid: "Neighborhood_Public_Xfinity", strength: -88, secured: true }
      ]);
      setIsScanning(false);
    }, 1500);
  };

  const handleConnectDevice = (deviceId: string) => {
    if (!selectedNetwork) return;
    setPairingStep(2);
    setPairingStatusMsg("Negotiating secure pairing connection...");

    setTimeout(() => {
      setPairingStatusMsg("Performing WPA2/WPA3 Auth security handshake...");
      
      setTimeout(() => {
        setPairingStatusMsg("Obtaining local IP address configuration via DHCP...");

        setTimeout(() => {
          setPairingStatusMsg("Verifying cryptographic CarePulse medical server handshake...");

          setTimeout(() => {
            // Update device status to Connected
            setDevices(prev => prev.map(d => {
              if (d.id === deviceId) {
                return {
                  ...d,
                  status: "connected",
                  ssid: selectedNetwork || "Home_WiFi_5G",
                  signalStrength: selectedNetwork === "Home_WiFi_5G" ? -55 : -60,
                  ipAddress: "192.168.1." + Math.floor(Math.random() * (254 - 100) + 100),
                  lastSynced: "Just now"
                };
              }
              return d;
            }));

            setPairingStep(3);
            setTimeout(() => {
              setConfigureDeviceId(null);
              setPairingStep(1);
              setSelectedNetwork(null);
              setWifiPassword("");
              setSuccessMsg(`Successfully connected device to ${selectedNetwork}!`);
              setTimeout(() => setSuccessMsg(""), 4000);
            }, 1500);
          }, 1200);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const handleRunPingTest = () => {
    setPingStatus('testing');
    setPingLog(["Pinging CarePulse EHR Servers [34.120.45.89] with 32 bytes of data:"]);
    
    setTimeout(() => {
      setPingLog(prev => [...prev, "Reply from 34.120.45.89: bytes=32 time=31ms TTL=54"]);
      
      setTimeout(() => {
        setPingLog(prev => [...prev, "Reply from 34.120.45.89: bytes=32 time=35ms TTL=54"]);
        
        setTimeout(() => {
          setPingLog(prev => [...prev, "Reply from 34.120.45.89: bytes=32 time=29ms TTL=54"]);
          
          setTimeout(() => {
            setPingLog(prev => [...prev, "Reply from 34.120.45.89: bytes=32 time=32ms TTL=54", "", "Ping statistics:", "  Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)", "Approximate round trip times in milli-seconds:", "  Minimum = 29ms, Maximum = 35ms, Average = 31.75ms"]);
            setPingStatus('success');
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  // Normal range configurations
  const limits = {
    bp: { 
      sysMin: 110, 
      sysMax: 129, 
      diaMin: 70, 
      diaMax: 84, 
      label: "Blood Pressure", 
      unit: "mmHg",
      normalStr: "110-129 / 70-84 mmHg",
      description: "An indicator of blood force against arterial walls. Ideal values sit below 130/85 mmHg."
    },
    hr: { 
      min: 60, 
      max: 100, 
      label: "Heart Rate", 
      unit: "bpm",
      normalStr: "60 - 100 bpm",
      description: "Resting pulse frequency. Values below 60 or above 100 in resting state warrant physician review."
    },
    bg: { 
      min: 70, 
      max: 140, 
      label: "Blood Glucose", 
      unit: "mg/dL",
      normalStr: "70 - 140 mg/dL",
      description: "Fasting or postprandial sugar. Crucial index for pre-diabetic and metabolic tracking."
    },
    o2: { 
      min: 95, 
      max: 100, 
      label: "Oxygen Saturation", 
      unit: "%",
      normalStr: "95 - 100%",
      description: "Arterial oxygen saturation level. Continuous readings below 95% require immediate consultation."
    }
  };

  const getFilteredVitals = () => {
    const sorted = [...vitals].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    if (timePeriod === '7d') return sorted.slice(-7);
    if (timePeriod === '15d') return sorted.slice(-15);
    return sorted;
  };

  const currentData = getFilteredVitals();

  const handleLogVitals = (e: React.FormEvent) => {
    e.preventDefault();

    const newReading: VitalReading = {
      id: `vit_${Date.now()}`,
      patientId: state.selectedPatientId,
      timestamp: new Date(dateStr).toISOString(),
      bloodPressureSystolic: Number(systolic),
      bloodPressureDiastolic: Number(diastolic),
      heartRate: Number(heartRate),
      temperature: Number(temp),
      weight: Number(weight),
      bloodGlucose: Number(glucose),
      oxygenSaturation: Number(oxygen),
      notes: notes.trim() || undefined
    };

    const updatedState = {
      ...state,
      vitals: [...state.vitals, newReading].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    };

    const alerts: string[] = [];
    if (newReading.bloodPressureSystolic > limits.bp.sysMax || newReading.bloodPressureDiastolic > limits.bp.diaMax) {
      alerts.push("Elevated Blood Pressure");
    }
    if (newReading.bloodGlucose > limits.bg.max) {
      alerts.push("Elevated Blood Glucose");
    }
    if (newReading.oxygenSaturation < limits.o2.min) {
      alerts.push("Low Oxygen Saturation");
    }

    if (alerts.length > 0) {
      const alertNotif = {
        id: `not_alert_${Date.now()}`,
        type: "lab" as const,
        title: "Abnormal Vital Signs Flagged",
        body: `Home monitoring flagged abnormal parameters: ${alerts.join(", ")}. Logged on ${new Date(dateStr).toLocaleDateString()}.`,
        timestamp: new Date().toISOString(),
        read: false
      };
      updatedState.notifications = [alertNotif, ...updatedState.notifications];
    }

    onChangeState(updatedState);
    saveState(updatedState);

    setSuccessMsg("Biometric log recorded successfully!");
    setNotes("");
    setShowForm(false);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleDeleteVital = (id: string) => {
    if (!window.confirm("Are you sure you want to delete this vital record?")) return;
    const updatedState = {
      ...state,
      vitals: state.vitals.filter(v => v.id !== id)
    };
    onChangeState(updatedState);
    saveState(updatedState);
    setSuccessMsg("Vital reading deleted successfully.");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const latest = vitals[vitals.length - 1] || {
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    heartRate: 72,
    temperature: 98.6,
    weight: 174.5,
    bloodGlucose: 95,
    oxygenSaturation: 98,
    timestamp: new Date().toISOString()
  };

  // Abnormal checks for latest stats
  const isBPAbnormal = latest.bloodPressureSystolic > limits.bp.sysMax || latest.bloodPressureDiastolic > limits.bp.diaMax;
  const isHRAbnormal = latest.heartRate < limits.hr.min || latest.heartRate > limits.hr.max;
  const isBGAbnormal = latest.bloodGlucose < limits.bg.min || latest.bloodGlucose > limits.bg.max;
  const isO2Abnormal = latest.oxygenSaturation < limits.o2.min;

  // Calculate statistics for the active metric in the current view slice
  const calculateStats = () => {
    if (currentData.length === 0) return { avg: "0", min: "0", max: "0", stability: "100%" };

    let values: number[] = [];
    let diaValues: number[] = []; // for BP
    let withinTargetCount = 0;

    if (activeMetric === "bp") {
      values = currentData.map(v => v.bloodPressureSystolic);
      diaValues = currentData.map(v => v.bloodPressureDiastolic);
      currentData.forEach(v => {
        const sysIn = v.bloodPressureSystolic >= limits.bp.sysMin && v.bloodPressureSystolic <= limits.bp.sysMax;
        const diaIn = v.bloodPressureDiastolic >= limits.bp.diaMin && v.bloodPressureDiastolic <= limits.bp.diaMax;
        if (sysIn && diaIn) withinTargetCount++;
      });
    } else {
      currentData.forEach(v => {
        let val = 0;
        if (activeMetric === "hr") {
          val = v.heartRate;
          if (val >= limits.hr.min && val <= limits.hr.max) withinTargetCount++;
        } else if (activeMetric === "bg") {
          val = v.bloodGlucose;
          if (val >= limits.bg.min && val <= limits.bg.max) withinTargetCount++;
        } else if (activeMetric === "o2") {
          val = v.oxygenSaturation;
          if (val >= limits.o2.min && val <= limits.o2.max) withinTargetCount++;
        }
        values.push(val);
      });
    }

    const avg = values.length > 0 ? (values.reduce((sum, v) => sum + v, 0) / values.length).toFixed(1) : "0";
    const avgDia = diaValues.length > 0 ? (diaValues.reduce((sum, v) => sum + v, 0) / diaValues.length).toFixed(1) : "";
    const minVal = values.length > 0 ? Math.min(...values) : 0;
    const maxVal = values.length > 0 ? Math.max(...values) : 0;
    const stability = ((withinTargetCount / currentData.length) * 100).toFixed(0);

    return {
      avg: activeMetric === "bp" ? `${avg}/${avgDia}` : avg,
      min: activeMetric === "bp" ? `${Math.min(...values)}/${Math.min(...diaValues)}` : String(minVal),
      max: activeMetric === "bp" ? `${Math.max(...values)}/${Math.max(...diaValues)}` : String(maxVal),
      stability: `${stability}%`
    };
  };

  const stats = calculateStats();

  // Custom SVG Trend Line Renderer with threshold target bands & snap interactive guides
  const renderTrendSVG = () => {
    if (currentData.length === 0) {
      return (
        <div className="h-48 flex flex-col justify-center items-center text-natural-muted space-y-1.5 bg-natural-bg/20 rounded-xl">
          <Info className="h-6 w-6 text-slate-300" />
          <span className="text-xs font-bold uppercase tracking-wider">No Biometric Logs in Window</span>
        </div>
      );
    }

    const width = 720;
    const height = 240;
    const paddingLeft = 40;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 40;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    let points1: { x: number; y: number; val: number; date: string; notes?: string }[] = [];
    let points2: { x: number; y: number; val: number; date: string; notes?: string }[] = []; // For diastolic BP

    // Bounds calculations
    let maxVal = 100;
    let minVal = 0;

    if (activeMetric === "bp") {
      const allVals = currentData.flatMap(v => [v.bloodPressureSystolic, v.bloodPressureDiastolic]);
      maxVal = Math.max(...allVals) + 15;
      minVal = Math.min(...allVals) - 15;
    } else if (activeMetric === "hr") {
      const hrVals = currentData.map(v => v.heartRate);
      maxVal = Math.max(...hrVals) + 15;
      minVal = Math.min(...hrVals) - 15;
    } else if (activeMetric === "bg") {
      const bgVals = currentData.map(v => v.bloodGlucose);
      maxVal = Math.max(...bgVals) + 20;
      minVal = Math.min(...bgVals) - 20;
    } else if (activeMetric === "o2") {
      const o2Vals = currentData.map(v => v.oxygenSaturation);
      maxVal = 100;
      minVal = 90;
    }

    if (minVal < 0) minVal = 0;
    const valueRange = maxVal - minVal || 1;

    // Map coordinates
    currentData.forEach((reading, index) => {
      const step = currentData.length > 1 ? index / (currentData.length - 1) : 0.5;
      const x = paddingLeft + step * chartWidth;
      const formattedDate = new Date(reading.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      if (activeMetric === "bp") {
        const ySys = paddingTop + chartHeight - ((reading.bloodPressureSystolic - minVal) / valueRange) * chartHeight;
        const yDia = paddingTop + chartHeight - ((reading.bloodPressureDiastolic - minVal) / valueRange) * chartHeight;
        points1.push({ x, y: ySys, val: reading.bloodPressureSystolic, date: formattedDate, notes: reading.notes });
        points2.push({ x, y: yDia, val: reading.bloodPressureDiastolic, date: formattedDate, notes: reading.notes });
      } else {
        let val = 0;
        if (activeMetric === "hr") val = reading.heartRate;
        else if (activeMetric === "bg") val = reading.bloodGlucose;
        else if (activeMetric === "o2") val = reading.oxygenSaturation;

        const y = paddingTop + chartHeight - ((val - minVal) / valueRange) * chartHeight;
        points1.push({ x, y, val, date: formattedDate, notes: reading.notes });
      }
    });

    const createPathD = (pts: typeof points1) => {
      if (pts.length === 0) return "";
      return pts.reduce((acc, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, "");
    };

    const createAreaD = (pts: typeof points1) => {
      if (pts.length === 0) return "";
      const pathD = createPathD(pts);
      return `${pathD} L ${pts[pts.length - 1].x} ${height - paddingBottom} L ${pts[0].x} ${height - paddingBottom} Z`;
    };

    // Calculate Y coordinates of clinical normal bands
    let normalBandY1 = 0;
    let normalBandY2 = 0;
    let normalBandYDia1 = 0;
    let normalBandYDia2 = 0;

    if (activeMetric === "bp") {
      normalBandY1 = paddingTop + chartHeight - ((limits.bp.sysMax - minVal) / valueRange) * chartHeight;
      normalBandY2 = paddingTop + chartHeight - ((limits.bp.sysMin - minVal) / valueRange) * chartHeight;
      normalBandYDia1 = paddingTop + chartHeight - ((limits.bp.diaMax - minVal) / valueRange) * chartHeight;
      normalBandYDia2 = paddingTop + chartHeight - ((limits.bp.diaMin - minVal) / valueRange) * chartHeight;
    } else {
      const activeLimit = limits[activeMetric];
      normalBandY1 = paddingTop + chartHeight - ((activeLimit.max - minVal) / valueRange) * chartHeight;
      normalBandY2 = paddingTop + chartHeight - ((activeLimit.min - minVal) / valueRange) * chartHeight;
    }

    // Capture click or hover to find coordinates
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * width;
      
      let closestIdx = 0;
      let minDistance = Infinity;

      points1.forEach((p, i) => {
        const dist = Math.abs(p.x - mouseX);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      });

      if (minDistance < 40) {
        setHoveredIdx(closestIdx);
      } else {
        setHoveredIdx(null);
      }
    };

    const hoveredPoint = hoveredIdx !== null ? points1[hoveredIdx] : null;
    const hoveredPoint2 = hoveredIdx !== null && activeMetric === "bp" ? points2[hoveredIdx] : null;

    return (
      <div className="relative">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-auto bg-[#faf9f6] rounded-2xl border border-natural-border/60 overflow-visible select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#657f6d" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#657f6d" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="secondaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c28b74" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#c28b74" stopOpacity="0" />
            </linearGradient>
            <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#2c3c30" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = paddingTop + ratio * chartHeight;
            const gridVal = Math.round(maxVal - ratio * valueRange);
            return (
              <g key={`grid_${index}`}>
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - paddingRight} 
                  y2={y} 
                  stroke="#eef0ed" 
                  strokeDasharray={index === 4 ? "0" : "4 4"} 
                  strokeWidth={index === 4 ? "1.5" : "1"} 
                />
                <text 
                  x={paddingLeft - 8} 
                  y={y + 3} 
                  fontSize="8" 
                  fontWeight="bold" 
                  fontFamily="monospace" 
                  fill="#8c8980" 
                  textAnchor="end"
                >
                  {gridVal}
                </text>
              </g>
            );
          })}

          {/* Render Target Clinical reference band */}
          {activeMetric !== "bp" && normalBandY1 < height && normalBandY2 < height && (
            <rect 
              x={paddingLeft} 
              y={Math.min(normalBandY1, normalBandY2)} 
              width={chartWidth} 
              height={Math.abs(normalBandY2 - normalBandY1)} 
              fill="#657f6d" 
              fillOpacity="0.04" 
            />
          )}

          {activeMetric === "bp" && (
            <>
              {/* Systolic Reference Band */}
              <rect 
                x={paddingLeft} 
                y={Math.min(normalBandY1, normalBandY2)} 
                width={chartWidth} 
                height={Math.abs(normalBandY2 - normalBandY1)} 
                fill="#657f6d" 
                fillOpacity="0.04" 
              />
              {/* Diastolic Reference Band */}
              <rect 
                x={paddingLeft} 
                y={Math.min(normalBandYDia1, normalBandYDia2)} 
                width={chartWidth} 
                height={Math.abs(normalBandYDia2 - normalBandYDia1)} 
                fill="#c28b74" 
                fillOpacity="0.03" 
              />
            </>
          )}

          {/* Area Gradients */}
          {activeMetric !== "bp" && points1.length > 0 && (
            <path d={createAreaD(points1)} fill="url(#primaryAreaGrad)" />
          )}

          {activeMetric === "bp" && points1.length > 0 && (
            <>
              <path d={createAreaD(points1)} fill="url(#primaryAreaGrad)" />
              <path d={createAreaD(points2)} fill="url(#secondaryAreaGrad)" />
            </>
          )}

          {/* Clinical Threshold Labels */}
          {activeMetric !== "bp" && (
            <line 
              x1={paddingLeft} 
              y1={normalBandY2} 
              x2={width - paddingRight} 
              y2={normalBandY2} 
              stroke="#657f6d" 
              strokeOpacity="0.25" 
              strokeDasharray="2 2" 
            />
          )}

          {/* Render lines */}
          <path d={createPathD(points1)} fill="none" stroke="#657f6d" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {activeMetric === "bp" && (
            <path d={createPathD(points2)} fill="none" stroke="#c28b74" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Snap Indicator Guideline on Hover */}
          {hoveredPoint && (
            <line 
              x1={hoveredPoint.x} 
              y1={paddingTop} 
              x2={hoveredPoint.x} 
              y2={height - paddingBottom} 
              stroke="#657f6d" 
              strokeWidth="1.5" 
              strokeDasharray="3 3" 
              strokeOpacity="0.7" 
            />
          )}

          {/* Render standard coordinate dots */}
          {points1.map((p, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g key={`p1_${i}`}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={isHovered ? "7" : "4"} 
                  fill="#657f6d" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                  filter={isHovered ? "url(#shadow)" : ""} 
                  className="transition-all duration-150" 
                />
              </g>
            );
          })}

          {activeMetric === "bp" && points2.map((p, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g key={`p2_${i}`}>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r={isHovered ? "7" : "4"} 
                  fill="#c28b74" 
                  stroke="#ffffff" 
                  strokeWidth="2" 
                  filter={isHovered ? "url(#shadow)" : ""} 
                  className="transition-all duration-150" 
                />
              </g>
            );
          })}

          {/* Render horizontal timeline coordinates */}
          {currentData.map((d, i) => {
            if (currentData.length > 8 && i % 2 !== 0) return null; // reduce label clutter on wider data sets
            const x = paddingLeft + (currentData.length > 1 ? i / (currentData.length - 1) : 0.5) * chartWidth;
            const dateStr = new Date(d.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
            return (
              <text 
                key={`lbl_${i}`} 
                x={x} 
                y={height - paddingBottom + 16} 
                fontSize="8.5" 
                fontWeight="bold" 
                fill="#a39e93" 
                textAnchor="middle"
              >
                {dateStr}
              </text>
            );
          })}
        </svg>

        {/* Floating Custom HUD Tooltip triggered on coordinate hover */}
        {hoveredPoint && (
          <div 
            className="absolute z-10 bg-[#212a23] text-white p-3.5 rounded-xl border border-[#ffffff15] shadow-xl text-left text-[11px] space-y-1 w-52 pointer-events-none transition-all duration-150 animate-in fade-in duration-100"
            style={{ 
              left: `${Math.min((hoveredPoint.x / width) * 100, 72)}%`, 
              top: `${Math.max((hoveredPoint.y / height) * 100 - 35, 10)}%` 
            }}
          >
            <div className="flex items-center justify-between text-natural-cream/60 font-bold uppercase text-[9px]">
              <div className="flex items-center space-x-1">
                <Clock className="h-2.5 w-2.5" />
                <span>{hoveredPoint.date}</span>
              </div>
            </div>
            
            <div className="pt-1 flex items-baseline space-x-2">
              <span className="text-sm font-extrabold text-white font-mono">
                {activeMetric === "bp" && hoveredPoint2 
                  ? `${hoveredPoint.val} / ${hoveredPoint2.val}` 
                  : hoveredPoint.val
                }
              </span>
              <span className="text-[9px] text-natural-cream/70 font-semibold">{limits[activeMetric].unit}</span>
            </div>

            {hoveredPoint.notes && (
              <p className="text-[10px] text-natural-cream/80 border-t border-[#ffffff10] pt-1.5 mt-1 font-medium leading-relaxed italic">
                "{hoveredPoint.notes}"
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 md:px-6" id="vitals-tracking-portal">
      
      {/* 1. TOP HEADER PANEL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 bg-gradient-to-r from-natural-beige/35 to-white border border-natural-border/70 p-6 rounded-[28px]">
        <div className="space-y-1 text-left">
          <div className="flex items-center space-x-2 text-natural-dark-sage">
            <TrendingUp className="h-5 w-5 text-natural-sage" />
            <h1 className="font-serif font-black text-xl tracking-tight">Home Bio-Monitoring Trends</h1>
          </div>
          <p className="text-xs text-natural-muted font-semibold max-w-xl leading-relaxed">
            Continuously log and evaluate systemic blood pressure metrics, resting cardiac patterns, metabolic glucose loads, and cellular oxygen levels.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowShareModal(true)}
            className="px-4 py-2.5 bg-white border border-natural-border hover:border-natural-sage text-natural-dark-sage font-bold text-xs rounded-full flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share Clinical PDF</span>
          </button>
          
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4.5 py-2.5 bg-natural-sage hover:bg-natural-dark-sage text-white font-bold text-xs rounded-full flex items-center space-x-1.5 shadow-md shadow-natural-sage/10 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Log Biometrics</span>
          </button>
        </div>
      </div>

      {/* NAVIGATION TABS FOR BIOMETRICS VS DEVICES */}
      <div className="flex border-b border-natural-border-light mb-8" id="vitals-wifi-navigation-tabs">
        <button
          onClick={() => setActiveTrackingMode('trends')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTrackingMode === 'trends'
              ? 'border-natural-sage text-natural-dark-sage font-extrabold'
              : 'border-transparent text-natural-muted hover:text-natural-dark-sage'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Biometric Logs & Charts</span>
        </button>
        <button
          onClick={() => setActiveTrackingMode('devices')}
          className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center space-x-2 cursor-pointer ${
            activeTrackingMode === 'devices'
              ? 'border-natural-sage text-natural-dark-sage font-extrabold'
              : 'border-transparent text-natural-muted hover:text-natural-dark-sage'
          }`}
        >
          <Wifi className="h-4 w-4 animate-pulse text-natural-sage" />
          <span>Wi-Fi Connected Devices</span>
          <span className="bg-natural-sage/10 text-natural-dark-sage text-[10px] px-2 py-0.5 rounded-full font-extrabold font-mono ml-2">
            {devices.filter(d => d.status === 'connected' || d.status === 'weak').length}/4 Online
          </span>
        </button>
      </div>

      {successMsg && (
        <div className="mb-6 p-4 bg-natural-sage/15 text-natural-dark-sage border border-natural-sage/20 rounded-2xl flex items-center space-x-2.5 text-xs font-bold animate-in fade-in">
          <Check className="h-4 w-4 text-natural-sage stroke-[3] bg-natural-sage/10 p-0.5 rounded-full" />
          <span>{successMsg}</span>
        </div>
      )}

      {activeTrackingMode === 'trends' ? (
        <>

      {/* 2. MANUAL BIOMETRIC LOGGING PANEL */}
      {showForm && (
        <div className="mb-8 bg-white border border-natural-border rounded-[28px] p-6 shadow-xl text-left space-y-5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center border-b border-natural-border-light pb-3">
            <div className="flex items-center space-x-1.5 text-natural-dark-sage">
              <Plus className="h-4.5 w-4.5 text-natural-sage" />
              <span className="font-serif font-black text-sm block">Add New Biometric Vital Record</span>
            </div>
            <button 
              onClick={() => setShowForm(false)} 
              className="text-[10px] font-black uppercase tracking-wider text-natural-muted hover:text-natural-terracotta cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleLogVitals} className="space-y-4 text-xs text-natural-text">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-natural-bg/15 p-3 rounded-2xl border border-natural-border/30">
                <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block mb-1.5">Systolic BP (mmHg)</label>
                <input 
                  type="number" 
                  value={systolic} 
                  onChange={(e) => setSystolic(e.target.value)} 
                  className="w-full px-3 py-1.5 bg-white border border-natural-border rounded-xl outline-none text-natural-dark-sage font-black focus:border-natural-sage text-xs" 
                  required 
                />
              </div>
              <div className="bg-natural-bg/15 p-3 rounded-2xl border border-natural-border/30">
                <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block mb-1.5">Diastolic BP (mmHg)</label>
                <input 
                  type="number" 
                  value={diastolic} 
                  onChange={(e) => setDiastolic(e.target.value)} 
                  className="w-full px-3 py-1.5 bg-white border border-natural-border rounded-xl outline-none text-natural-dark-sage font-black focus:border-natural-sage text-xs" 
                  required 
                />
              </div>
              <div className="bg-natural-bg/15 p-3 rounded-2xl border border-natural-border/30">
                <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block mb-1.5">Heart Rate (bpm)</label>
                <input 
                  type="number" 
                  value={heartRate} 
                  onChange={(e) => setHeartRate(e.target.value)} 
                  className="w-full px-3 py-1.5 bg-white border border-natural-border rounded-xl outline-none text-natural-dark-sage font-black focus:border-natural-sage text-xs" 
                  required 
                />
              </div>
              <div className="bg-natural-bg/15 p-3 rounded-2xl border border-natural-border/30">
                <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block mb-1.5">Oxygen Sat. (%)</label>
                <input 
                  type="number" 
                  value={oxygen} 
                  onChange={(e) => setOxygen(e.target.value)} 
                  className="w-full px-3 py-1.5 bg-white border border-natural-border rounded-xl outline-none text-natural-dark-sage font-black focus:border-natural-sage text-xs" 
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-natural-bg/15 p-3 rounded-2xl border border-natural-border/30">
                <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block mb-1.5">Blood Glucose (mg/dL)</label>
                <input 
                  type="number" 
                  value={glucose} 
                  onChange={(e) => setGlucose(e.target.value)} 
                  className="w-full px-3 py-1.5 bg-white border border-natural-border rounded-xl outline-none text-natural-dark-sage font-black focus:border-natural-sage text-xs" 
                  required 
                />
              </div>
              <div className="bg-natural-bg/15 p-3 rounded-2xl border border-natural-border/30">
                <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block mb-1.5">Body Temp (°F)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={temp} 
                  onChange={(e) => setTemp(e.target.value)} 
                  className="w-full px-3 py-1.5 bg-white border border-natural-border rounded-xl outline-none text-natural-dark-sage font-black focus:border-natural-sage text-xs" 
                  required 
                />
              </div>
              <div className="bg-natural-bg/15 p-3 rounded-2xl border border-natural-border/30">
                <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block mb-1.5">Body Weight (lbs)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)} 
                  className="w-full px-3 py-1.5 bg-white border border-natural-border rounded-xl outline-none text-natural-dark-sage font-black focus:border-natural-sage text-xs" 
                  required 
                />
              </div>
              <div className="bg-natural-bg/15 p-3 rounded-2xl border border-natural-border/30">
                <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block mb-1.5">Date & Time Record</label>
                <input 
                  type="datetime-local" 
                  value={dateStr} 
                  onChange={(e) => setDateStr(e.target.value)} 
                  className="w-full px-3 py-1.5 bg-white border border-natural-border rounded-xl outline-none text-natural-dark-sage font-bold focus:border-natural-sage text-xs" 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-natural-dark-sage uppercase tracking-wider block mb-1.5">Log notes / Activities Excerpt</label>
              <textarea 
                rows={1.5}
                placeholder="e.g., Logged pre-breakfast fasting. Mild morning headache noted." 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                className="w-full px-3.5 py-2.5 bg-white border border-natural-border rounded-xl outline-none text-natural-dark-sage font-semibold focus:border-natural-sage text-xs resize-none" 
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-natural-sage hover:bg-natural-dark-sage text-white font-bold text-xs rounded-full transition-all cursor-pointer uppercase tracking-wider shadow-md shadow-natural-sage/10"
            >
              Commit Log Entry to Clinic Record
            </button>
          </form>
        </div>
      )}

      {/* 3. CORE METRIC WIDGET GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Widget 1: Blood Pressure */}
        <button 
          type="button"
          onClick={() => setActiveMetric("bp")}
          className={`p-5 rounded-2xl border cursor-pointer text-left transition-all flex flex-col justify-between ${
            activeMetric === "bp" 
              ? "bg-natural-dark-sage border-natural-dark-sage text-white shadow-lg ring-4 ring-natural-sage/15 transform -translate-y-0.5" 
              : "bg-white border-natural-border text-natural-text hover:border-natural-sage hover:shadow-md"
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <div className={`p-2 rounded-xl ${activeMetric === "bp" ? "bg-white/10 text-natural-cream" : "bg-natural-terracotta/10 text-natural-terracotta"}`}>
              <Heart className="h-5 w-5" />
            </div>
            {isBPAbnormal && (
              <span className={`text-[8px] font-black rounded-full px-2 py-0.5 uppercase tracking-wider ${activeMetric === "bp" ? "bg-white/20 text-white" : "bg-natural-terracotta/15 text-natural-terracotta"}`}>
                Elevated
              </span>
            )}
          </div>
          <div className="mt-5 leading-none">
            <span className={`text-[9px] font-bold uppercase block tracking-wider ${activeMetric === "bp" ? "text-natural-cream/60" : "text-natural-muted"}`}>Blood Pressure</span>
            <span className="text-2xl font-serif font-black block mt-2 font-mono">
              {latest.bloodPressureSystolic}<span className="text-sm font-normal mx-0.5 opacity-60">/</span>{latest.bloodPressureDiastolic}
            </span>
            <span className={`text-[9px] font-bold block mt-1 ${activeMetric === "bp" ? "text-natural-cream/60" : "text-natural-muted"}`}>mmHg (Clinician Target)</span>
          </div>
        </button>

        {/* Widget 2: Heart Rate */}
        <button 
          type="button"
          onClick={() => setActiveMetric("hr")}
          className={`p-5 rounded-2xl border cursor-pointer text-left transition-all flex flex-col justify-between ${
            activeMetric === "hr" 
              ? "bg-natural-dark-sage border-natural-dark-sage text-white shadow-lg ring-4 ring-natural-sage/15 transform -translate-y-0.5" 
              : "bg-white border-natural-border text-natural-text hover:border-natural-sage hover:shadow-md"
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <div className={`p-2 rounded-xl ${activeMetric === "hr" ? "bg-white/10 text-natural-cream" : "bg-natural-sage/10 text-natural-sage"}`}>
              <Activity className="h-5 w-5" />
            </div>
            {isHRAbnormal && (
              <span className={`text-[8px] font-black rounded-full px-2 py-0.5 uppercase tracking-wider ${activeMetric === "hr" ? "bg-white/20 text-white" : "bg-natural-terracotta/15 text-natural-terracotta"}`}>
                Anomalous
              </span>
            )}
          </div>
          <div className="mt-5 leading-none">
            <span className={`text-[9px] font-bold uppercase block tracking-wider ${activeMetric === "hr" ? "text-natural-cream/60" : "text-natural-muted"}`}>Heart Rate</span>
            <span className="text-2xl font-serif font-black block mt-2 font-mono">
              {latest.heartRate}
            </span>
            <span className={`text-[9px] font-bold block mt-1 ${activeMetric === "hr" ? "text-natural-cream/60" : "text-natural-muted"}`}>bpm (Resting state)</span>
          </div>
        </button>

        {/* Widget 3: Blood Glucose */}
        <button 
          type="button"
          onClick={() => setActiveMetric("bg")}
          className={`p-5 rounded-2xl border cursor-pointer text-left transition-all flex flex-col justify-between ${
            activeMetric === "bg" 
              ? "bg-natural-dark-sage border-natural-dark-sage text-white shadow-lg ring-4 ring-natural-sage/15 transform -translate-y-0.5" 
              : "bg-white border-natural-border text-natural-text hover:border-natural-sage hover:shadow-md"
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <div className={`p-2 rounded-xl ${activeMetric === "bg" ? "bg-white/10 text-natural-cream" : "bg-natural-clay/15 text-[#a16d56]"}`}>
              <Droplet className="h-5 w-5" />
            </div>
            {isBGAbnormal && (
              <span className={`text-[8px] font-black rounded-full px-2 py-0.5 uppercase tracking-wider ${activeMetric === "bg" ? "bg-white/20 text-white" : "bg-natural-terracotta/15 text-natural-terracotta"}`}>
                High
              </span>
            )}
          </div>
          <div className="mt-5 leading-none">
            <span className={`text-[9px] font-bold uppercase block tracking-wider ${activeMetric === "bg" ? "text-natural-cream/60" : "text-natural-muted"}`}>Blood Glucose</span>
            <span className="text-2xl font-serif font-black block mt-2 font-mono">
              {latest.bloodGlucose}
            </span>
            <span className={`text-[9px] font-bold block mt-1 ${activeMetric === "bg" ? "text-natural-cream/60" : "text-natural-muted"}`}>mg/dL (Fasting mean)</span>
          </div>
        </button>

        {/* Widget 4: Oxygen Saturation */}
        <button 
          type="button"
          onClick={() => setActiveMetric("o2")}
          className={`p-5 rounded-2xl border cursor-pointer text-left transition-all flex flex-col justify-between ${
            activeMetric === "o2" 
              ? "bg-natural-dark-sage border-natural-dark-sage text-white shadow-lg ring-4 ring-natural-sage/15 transform -translate-y-0.5" 
              : "bg-white border-natural-border text-natural-text hover:border-natural-sage hover:shadow-md"
          }`}
        >
          <div className="flex justify-between items-center w-full">
            <div className={`p-2 rounded-xl ${activeMetric === "o2" ? "bg-white/10 text-natural-cream" : "bg-natural-dark-sage/10 text-natural-dark-sage"}`}>
              <Wind className="h-5 w-5" />
            </div>
            {isO2Abnormal && (
              <span className={`text-[8px] font-black rounded-full px-2 py-0.5 uppercase tracking-wider ${activeMetric === "o2" ? "bg-white/20 text-white" : "bg-natural-terracotta/15 text-natural-terracotta"}`}>
                Desat
              </span>
            )}
          </div>
          <div className="mt-5 leading-none">
            <span className={`text-[9px] font-bold uppercase block tracking-wider ${activeMetric === "o2" ? "text-natural-cream/60" : "text-natural-muted"}`}>Oxygen Sat.</span>
            <span className="text-2xl font-serif font-black block mt-2 font-mono">
              {latest.oxygenSaturation}<span className="text-sm font-normal opacity-60">%</span>
            </span>
            <span className={`text-[9px] font-bold block mt-1 ${activeMetric === "o2" ? "text-natural-cream/60" : "text-natural-muted"}`}>SpO₂ (Normal ventilation)</span>
          </div>
        </button>

      </div>

      {/* 4. VISUALIZATION AND STATISTICAL INDEXES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 text-left">
        
        {/* Chart Window (Span 8) */}
        <div className="lg:col-span-8 bg-white border border-natural-border rounded-[28px] p-6 shadow-xs flex flex-col justify-between space-y-4">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-natural-border-light pb-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-1.5 text-natural-dark-sage">
                <Sparkles className="h-4.5 w-4.5 text-natural-sage fill-natural-sage/10" />
                <span className="font-serif font-black text-sm block capitalize">{limits[activeMetric].label} Coordinates Chart</span>
              </div>
              <p className="text-[10px] text-natural-muted font-semibold">Hover point coordinates to highlight individual logs & clinician notes.</p>
            </div>

            {/* Time period filter pill */}
            <div className="flex items-center space-x-1 bg-natural-beige/45 p-1 rounded-full border border-natural-border-light text-[10px] font-bold">
              <button 
                type="button"
                onClick={() => { setTimePeriod('7d'); setHoveredIdx(null); }}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${timePeriod === '7d' ? "bg-white text-natural-dark-sage shadow-xs" : "text-natural-muted hover:text-natural-dark-sage"}`}
              >
                7 Logs
              </button>
              <button 
                type="button"
                onClick={() => { setTimePeriod('15d'); setHoveredIdx(null); }}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${timePeriod === '15d' ? "bg-white text-natural-dark-sage shadow-xs" : "text-natural-muted hover:text-natural-dark-sage"}`}
              >
                15 Logs
              </button>
              <button 
                type="button"
                onClick={() => { setTimePeriod('all'); setHoveredIdx(null); }}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${timePeriod === 'all' ? "bg-white text-natural-dark-sage shadow-xs" : "text-natural-muted hover:text-natural-dark-sage"}`}
              >
                All
              </button>
            </div>
          </div>

          <div className="py-2">
            {renderTrendSVG()}
          </div>

          {/* Quick interactive note */}
          <div className="flex items-center space-x-2 text-[10px] text-natural-muted bg-natural-beige/20 p-3 rounded-xl border border-natural-border-light">
            <Info className="h-4 w-4 text-natural-sage shrink-0" />
            <p className="leading-relaxed font-semibold">
              The light-colored background horizontal bands reflect standard <span className="text-natural-dark-sage font-extrabold">Clinical Reference Ranges</span>. Standard clinical target ranges: {limits[activeMetric].normalStr}.
            </p>
          </div>
        </div>

        {/* Statistical Analysis Index Grid (Span 4) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-4">
          
          {/* Metadata Card */}
          <div className="bg-white border border-natural-border rounded-[28px] p-5 space-y-4 shadow-xs flex-1">
            <span className="text-[10px] font-black text-natural-muted uppercase tracking-widest block font-serif">Clinical Metric Overview</span>
            
            <p className="text-[11px] text-natural-muted leading-relaxed font-medium">
              {limits[activeMetric].description}
            </p>

            <div className="border-t border-natural-border-light pt-3 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-natural-muted font-bold">Clinical Target Threshold</span>
                <span className="text-[11px] text-natural-dark-sage font-black font-serif">{limits[activeMetric].normalStr}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] text-natural-muted font-bold">Standard Unit</span>
                <span className="text-[11px] text-natural-dark-sage font-mono font-bold bg-natural-bg px-2 py-0.5 rounded-md">{limits[activeMetric].unit}</span>
              </div>
            </div>
          </div>

          {/* Statistical Computations Block */}
          <div className="bg-gradient-to-br from-[#2a332c] to-[#1e241f] text-white rounded-[28px] p-5 shadow-lg space-y-4">
            <div className="flex items-center space-x-2 text-natural-cream/65 border-b border-white/5 pb-2.5">
              <TrendingUp className="h-4 w-4 text-natural-sage" />
              <span className="text-[9px] font-black uppercase tracking-widest block font-serif">Calculated Metric Analytics</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] text-natural-cream/50 uppercase font-bold tracking-wider block">Average (Mean)</span>
                <span className="text-lg font-mono font-black text-white">{stats.avg}</span>
                <span className="text-[8px] text-natural-cream/40 block">Unit: {limits[activeMetric].unit}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-natural-cream/50 uppercase font-bold tracking-wider block">Stability score</span>
                <span className="text-lg font-mono font-black text-[#96baa2]">{stats.stability}</span>
                <span className="text-[8px] text-natural-cream/40 block">% Logs in target range</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1.5">
              <div className="space-y-1">
                <span className="text-[9px] text-natural-cream/50 uppercase font-bold tracking-wider block">Peak Coordinate</span>
                <span className="text-sm font-mono font-bold text-white">{stats.max}</span>
                <span className="text-[8px] text-natural-cream/40 block">Highest record</span>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] text-natural-cream/50 uppercase font-bold tracking-wider block">Trough Coordinate</span>
                <span className="text-sm font-mono font-bold text-white">{stats.min}</span>
                <span className="text-[8px] text-natural-cream/40 block">Lowest record</span>
              </div>
            </div>
          </div>

          {/* Dynamic Warning Alert Box */}
          {(isBPAbnormal || isBGAbnormal || isO2Abnormal) && (
            <div className="p-4 bg-natural-terracotta/10 border border-natural-terracotta/20 rounded-2xl space-y-2 text-natural-terracotta">
              <div className="flex items-center space-x-1.5 text-natural-terracotta font-black text-[10px] uppercase tracking-wide">
                <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
                <span>Threshold breach alert</span>
              </div>
              <p className="text-[10px] text-natural-terracotta/90 leading-relaxed font-semibold">
                Biometric logs indicate spikes above desired parameters. Please coordinate with clinical coordinators to adjust prescription parameters.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* 5. HISTORIC BIOMETRIC DATALOGS TABLE */}
      <div className="bg-white border border-natural-border rounded-[28px] p-6 shadow-xs text-left space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-natural-border-light pb-4 mb-2">
          <div className="space-y-0.5 text-left">
            <div className="flex items-center space-x-2">
              <span className="font-serif font-black text-sm text-natural-dark-sage">Historical Bio-Monitoring Chart Logs</span>
              <span className="text-[10px] bg-natural-sage/10 text-natural-sage px-2 py-0.5 rounded-full font-bold">
                {vitals.length} Logs
              </span>
            </div>
            <span className="text-[10px] text-natural-muted font-bold block">Patient: Sarah Jenkins (EHR ID: EHR-942-03)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportVitalsToExcel}
              className="px-3 py-1.5 bg-natural-sage/10 hover:bg-natural-sage/20 text-natural-dark-sage rounded-xl text-xs font-bold transition-all flex items-center space-x-1 border border-natural-sage/20 cursor-pointer active:scale-95"
              title="Export biometric history to Excel spreadsheet"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-natural-sage" />
              <span>Export Vitals</span>
            </button>

            <label className="px-3 py-1.5 bg-white hover:bg-natural-beige border border-natural-border text-natural-dark-sage rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer active:scale-95">
              <Upload className="h-3.5 w-3.5 text-natural-sage" />
              <span>Import Vitals</span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleVitalsExcelImport}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setShowVitalsImportGuide(!showVitalsImportGuide)}
              className="p-1.5 bg-white hover:bg-natural-beige border border-natural-border text-natural-muted hover:text-natural-dark-sage rounded-xl transition-all cursor-pointer"
              title="Show spreadsheet import guidelines & template"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* EXPANDABLE SPREADSHEET IMPORT GUIDE FOR VITALS */}
        {showVitalsImportGuide && (
          <div className="p-4 bg-natural-beige/40 rounded-2xl border border-natural-border-light text-xs text-natural-text text-left space-y-3.5 animate-in fade-in duration-200">
            <div className="flex justify-between items-start">
              <div className="space-y-0.5">
                <span className="font-serif font-black text-xs text-natural-dark-sage block">Biometrics Excel Import Guidelines</span>
                <p className="text-[10px] text-natural-muted font-bold">Your spreadsheet should have these exact headers for bulk biometric logging:</p>
              </div>
              <button
                onClick={downloadVitalsTemplate}
                className="px-2.5 py-1 bg-natural-sage text-white rounded-lg text-[10px] font-bold flex items-center space-x-1 cursor-pointer hover:bg-natural-dark-sage"
              >
                <Download className="h-3 w-3" />
                <span>Download Template</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-white p-3 rounded-xl border border-natural-border/60 text-[10px] font-semibold text-natural-muted">
              <div className="space-y-0.5">
                <span className="font-mono text-natural-dark-sage block">Reading ID</span>
                <span className="text-slate-400 block">Optional (e.g. vit_01)</span>
              </div>
              <div className="space-y-0.5">
                <span className="font-mono text-natural-dark-sage block">Logged Timestamp</span>
                <span className="text-slate-400 block">YYYY-MM-DDTHH:MM:SS</span>
              </div>
              <div className="space-y-0.5">
                <span className="font-mono text-natural-dark-sage block">Blood Pressure Systolic</span>
                <span className="text-slate-400 block">Numeric mmHg (e.g. 120)</span>
              </div>
              <div className="space-y-0.5">
                <span className="font-mono text-natural-dark-sage block">Blood Pressure Diastolic</span>
                <span className="text-slate-400 block">Numeric mmHg (e.g. 80)</span>
              </div>
              <div className="space-y-0.5">
                <span className="font-mono text-natural-dark-sage block">Heart Rate (bpm)</span>
                <span className="text-slate-400 block">Beats/min (e.g. 72)</span>
              </div>
              <div className="space-y-0.5">
                <span className="font-mono text-natural-dark-sage block">Body Temp (F)</span>
                <span className="text-slate-400 block">Fahrenheit (e.g. 98.6)</span>
              </div>
              <div className="space-y-0.5">
                <span className="font-mono text-natural-dark-sage block">Weight (lbs)</span>
                <span className="text-slate-400 block">Pounds (e.g. 175)</span>
              </div>
              <div className="space-y-0.5">
                <span className="font-mono text-natural-dark-sage block">Blood Glucose (mg/dL)</span>
                <span className="text-slate-400 block">Sugar concentration (e.g. 95)</span>
              </div>
              <div className="space-y-0.5 col-span-2">
                <span className="font-mono text-natural-dark-sage block">Oxygen Saturation (%)</span>
                <span className="text-slate-400 block">O₂ percentage (e.g. 98)</span>
              </div>
              <div className="space-y-0.5 col-span-2">
                <span className="font-mono text-natural-dark-sage block">Clinical Notes</span>
                <span className="text-slate-400 block">Context notes (e.g. Post-lunch)</span>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-natural-text">
            <thead>
              <tr className="border-b border-natural-border/40 text-[9px] font-bold text-natural-muted uppercase tracking-wider text-left bg-natural-bg/15 rounded-t-xl">
                <th className="p-3">Logged Date & Time</th>
                <th className="p-3">Blood Pressure (mmHg)</th>
                <th className="p-3">Heart Rate (bpm)</th>
                <th className="p-3">Blood Glucose (mg/dL)</th>
                <th className="p-3">O₂ Saturation (%)</th>
                <th className="p-3">Body Temp / Weight</th>
                <th className="p-3">Clinical Note / Context</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-natural-border-light/45">
              {[...vitals]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((reading) => {
                  const s = reading.bloodPressureSystolic;
                  const d = reading.bloodPressureDiastolic;
                  const isRecordBPAbnormal = s > limits.bp.sysMax || d > limits.bp.diaMax;
                  const isRecordBGAbnormal = reading.bloodGlucose > limits.bg.max;
                  const isRecordO2Abnormal = reading.oxygenSaturation < limits.o2.min;

                  return (
                    <tr key={reading.id} className="hover:bg-natural-bg/10 transition-colors">
                      <td className="p-3 font-semibold text-natural-muted whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Calendar className="h-3.5 w-3.5 text-natural-sage" />
                          <span>{new Date(reading.timestamp).toLocaleDateString()}</span>
                          <span className="text-[9px] opacity-60">({new Date(reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})</span>
                        </div>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        <span className={isRecordBPAbnormal ? "text-natural-terracotta bg-natural-terracotta/10 px-2 py-0.5 rounded-md font-extrabold" : "text-natural-dark-sage"}>
                          {s}/{d}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-natural-dark-sage">
                        {reading.heartRate} bpm
                      </td>
                      <td className="p-3 font-mono font-bold">
                        <span className={isRecordBGAbnormal ? "text-natural-terracotta bg-natural-terracotta/10 px-2 py-0.5 rounded-md font-extrabold" : "text-natural-dark-sage"}>
                          {reading.bloodGlucose}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold">
                        <span className={isRecordO2Abnormal ? "text-natural-terracotta font-extrabold" : "text-natural-sage"}>
                          {reading.oxygenSaturation}%
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-natural-muted">
                        {reading.temperature}°F / {reading.weight} lbs
                      </td>
                      <td className="p-3 max-w-xs truncate text-natural-muted font-medium italic">
                        {reading.notes || "—"}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteVital(reading.id)}
                          className="p-1.5 hover:bg-natural-terracotta/10 rounded-lg text-natural-muted hover:text-natural-terracotta transition-all cursor-pointer"
                          title="Delete vital record"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      ) : (
        /* WI-FI SMART DEVICES PANEL */
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300" id="wifi-smart-devices-panel">
          
          {/* Devices and Diagnostics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Section: Active Wi-Fi connected devices list (Span 7) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-gradient-to-br from-[#fafbfc] to-white border border-natural-border rounded-[32px] p-6 shadow-xs text-left">
                <div className="flex justify-between items-center border-b border-natural-border-light pb-4 mb-6">
                  <div className="space-y-1">
                    <h2 className="font-serif font-black text-base text-natural-dark-sage flex items-center gap-2">
                      <Radio className="h-4.5 w-4.5 text-natural-sage animate-pulse" />
                      <span>Remote Smart Biometrics Devices</span>
                    </h2>
                    <p className="text-[10px] text-natural-muted font-bold">
                      Manage home IoT medical equipment synced with your clinical portal.
                    </p>
                  </div>
                  <span className="text-[10px] bg-natural-sage/10 text-natural-dark-sage px-3 py-1 rounded-full font-extrabold uppercase font-mono flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-natural-sage animate-ping" />
                    <span>RPM System Active</span>
                  </span>
                </div>

                {/* Device cards list */}
                <div className="space-y-4">
                  {devices.map(device => {
                    const isConnected = device.status === 'connected';
                    const isWeak = device.status === 'weak';
                    const isDisconnected = device.status === 'disconnected';
                    
                    const targetFW = device.id === "dev_bp" ? "v2.2.0-stable" : device.id === "dev_cgm" ? "v1.1.2-stable" : device.id === "dev_ox" ? "v1.5.0-patch2" : null;
                    const hasUpdate = targetFW !== null && device.firmware !== targetFW;

                    // Choose corresponding icon
                    let DevIcon = Heart;
                    if (device.icon === 'activity') DevIcon = Activity;
                    if (device.icon === 'scale') DevIcon = Scale;
                    if (device.icon === 'wind') DevIcon = Wind;

                    return (
                      <div 
                        key={device.id} 
                        className={`p-5 rounded-2xl border transition-all duration-200 bg-white shadow-xs hover:shadow-md ${
                          isDisconnected 
                            ? 'border-slate-200 opacity-75' 
                            : isWeak 
                            ? 'border-amber-200 hover:border-amber-400' 
                            : 'border-natural-border hover:border-natural-sage'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                          
                          {/* Device Left metadata */}
                          <div className="flex items-center space-x-3.5 text-left">
                            <div className={`h-11 w-11 rounded-xl flex items-center justify-center border transition-colors ${
                              isDisconnected
                                ? 'bg-slate-100 text-slate-400 border-slate-200'
                                : isWeak
                                ? 'bg-amber-50 text-amber-500 border-amber-200'
                                : 'bg-natural-beige/30 text-natural-sage border-natural-border'
                            }`}>
                              <DevIcon className="h-5 w-5" />
                            </div>
                            <div className="space-y-0.5">
                              <span className="font-serif font-black text-xs text-natural-dark-sage block leading-tight">
                                {device.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-natural-muted font-bold block">
                                  {device.model} • FW: <span className="font-mono text-[9px]">{device.firmware}</span>
                                </span>
                                {hasUpdate && !isDisconnected && (
                                  <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[8px] font-black tracking-wide uppercase font-mono animate-pulse">
                                    Update Available
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Connection status badges */}
                          <div className="flex items-center space-x-2 self-stretch sm:self-auto justify-between">
                            {isConnected && (
                              <div className="px-2.5 py-1 bg-natural-sage/10 text-natural-dark-sage text-[9px] font-extrabold uppercase rounded-md flex items-center gap-1 font-mono">
                                <Wifi className="h-3 w-3 stroke-[3]" />
                                <span>Connected</span>
                              </div>
                            )}
                            {isWeak && (
                              <div className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-extrabold uppercase rounded-md flex items-center gap-1 font-mono">
                                <AlertTriangle className="h-3 w-3 stroke-[2.5]" />
                                <span>Weak Signal</span>
                              </div>
                            )}
                            {isDisconnected && (
                              <div className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[9px] font-extrabold uppercase rounded-md flex items-center gap-1 font-mono">
                                <WifiOff className="h-3 w-3" />
                                <span>Offline</span>
                              </div>
                            )}

                            {/* Battery indicator */}
                            <div className="flex items-center space-x-1 text-slate-400 font-mono text-[10px] font-bold">
                              <Battery className={`h-4 w-4 ${device.batteryLevel < 30 ? 'text-natural-terracotta' : device.batteryLevel < 60 ? 'text-amber-500' : 'text-natural-sage'}`} />
                              <span>{device.batteryLevel}%</span>
                            </div>
                          </div>

                        </div>

                        {/* Interactive network metadata parameters */}
                        <div className="mt-4 pt-4 border-t border-natural-border-light grid grid-cols-2 sm:grid-cols-4 gap-4 text-left text-[10px] font-semibold text-natural-muted">
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase tracking-wider block font-bold text-slate-400">Wi-Fi Network</span>
                            <span className="font-bold text-natural-dark-sage truncate block max-w-xs">
                              {device.ssid}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase tracking-wider block font-bold text-slate-400">Signal strength</span>
                            <span className="font-mono font-bold text-natural-dark-sage block">
                              {isDisconnected ? "—" : `${device.signalStrength} dBm (${device.signalStrength > -65 ? "Excellent" : device.signalStrength > -80 ? "Good" : "Poor"})`}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase tracking-wider block font-bold text-slate-400">Device IP / MAC</span>
                            <span className="font-mono text-[9.5px] text-natural-dark-sage block">
                              {isDisconnected ? "None" : device.ipAddress}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase tracking-wider block font-bold text-slate-400">Last Synced</span>
                            <span className="font-bold text-natural-dark-sage block">
                              {device.lastSynced}
                            </span>
                          </div>
                        </div>

                        {/* Card CTA Actions */}
                        <div className="mt-4 pt-3 border-t border-natural-border-light/50 flex justify-end gap-2 flex-wrap">
                          {hasUpdate && !isDisconnected && (
                            <button
                              onClick={() => handleUpdateDeviceFirmware(device.id, targetFW)}
                              disabled={updatingDeviceId !== null || syncingDeviceId !== null}
                              className={`px-3.5 py-1.5 text-white font-bold text-[10.5px] rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer ${
                                updatingDeviceId !== null || syncingDeviceId !== null
                                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                                  : 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10'
                              }`}
                            >
                              <ArrowUpCircle className="h-3.5 w-3.5 text-white" />
                              <span>Update Firmware</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setConfigureDeviceId(device.id);
                              setPairingStep(1);
                              setSelectedNetwork(null);
                              setWifiPassword("");
                              handleScanNetworks();
                            }}
                            className="px-3.5 py-1.5 bg-white border border-natural-border hover:border-natural-sage text-natural-dark-sage font-bold text-[10.5px] rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Sliders className="h-3.5 w-3.5 text-natural-sage" />
                            <span>Configure Wi-Fi</span>
                          </button>
                          
                          <button
                            onClick={() => handleSyncDevice(device.id)}
                            disabled={isDisconnected || syncingDeviceId !== null || updatingDeviceId !== null}
                            className={`px-4 py-1.5 text-white font-bold text-[10.5px] rounded-lg shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer ${
                              isDisconnected || updatingDeviceId !== null
                                ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                                : syncingDeviceId === device.id
                                ? 'bg-natural-sage/50 cursor-wait shadow-none'
                                : 'bg-natural-sage hover:bg-natural-dark-sage'
                            }`}
                          >
                            <RefreshCw className={`h-3 w-3 ${syncingDeviceId === device.id ? 'animate-spin' : ''}`} />
                            <span>{syncingDeviceId === device.id ? 'Syncing...' : 'Sync Now'}</span>
                          </button>
                        </div>

                        {/* Expanded Synchronizing overlay screen inside the card */}
                        {syncingDeviceId === device.id && (
                          <div className="mt-4 p-4 bg-[#232b25] text-white rounded-xl border border-[#ffffff10] space-y-3 animate-in fade-in duration-200">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-natural-cream/80 flex items-center gap-1.5">
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#d9ad8c]" />
                                <span>SSL Encrypted Handshake</span>
                              </span>
                              <span className="font-mono text-[9px] bg-white/10 px-2 py-0.5 rounded-md">Step {syncStep} of 3</span>
                            </div>

                            <p className="text-xs font-semibold leading-relaxed text-natural-cream text-left">
                              {syncProgress}
                            </p>

                            {/* Animating status bar */}
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#d9ad8c] h-full transition-all duration-300"
                                style={{ width: `${(syncStep / 3) * 100}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Expanded Firmware Flashing overlay screen inside the card */}
                        {updatingDeviceId === device.id && (
                          <div className="mt-4 p-4 bg-slate-900 text-white rounded-xl border border-white/10 space-y-3 animate-in fade-in duration-200">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 font-mono">
                                <RefreshCw className="h-3.5 w-3.5 animate-spin text-amber-400" />
                                <span>OTA FIRMWARE UPGRADE IN PROGRESS</span>
                              </span>
                              <span className="font-mono text-[9px] bg-white/10 px-2 py-0.5 rounded-md">{deviceUpdateProgress}%</span>
                            </div>

                            <p className="text-xs font-semibold leading-relaxed text-slate-300 text-left">
                              {deviceUpdateStatus}
                            </p>

                            {/* Animating status bar */}
                            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-amber-400 h-full transition-all duration-300"
                                style={{ width: `${deviceUpdateProgress}%` }}
                              />
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Section: Wi-Fi pairing connection wizard or Diagnostics (Span 5) */}
            <div className="lg:col-span-5 space-y-6 text-left">
              
              {/* INTERACTIVE CONNECTION WIZARD MODAL CARD */}
              {configureDeviceId && (
                <div className="bg-white border-2 border-natural-sage rounded-[32px] p-6 shadow-xl animate-in zoom-in-95 duration-200 text-left space-y-4">
                  <div className="flex justify-between items-center border-b border-natural-border-light pb-3">
                    <div className="space-y-0.5">
                      <span className="font-serif font-black text-sm text-natural-dark-sage block">Wireless Device Pairing Wizard</span>
                      <span className="text-[10px] text-natural-muted font-bold block">
                        Targeting: {devices.find(d => d.id === configureDeviceId)?.name}
                      </span>
                    </div>
                    <button 
                      onClick={() => setConfigureDeviceId(null)}
                      className="text-[10px] font-black uppercase text-natural-muted hover:text-natural-terracotta cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  {/* Step 1: Scanning & Network Selection */}
                  {pairingStep === 1 && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-natural-beige/40 p-3.5 rounded-xl border border-natural-border-light text-[11px] font-semibold text-natural-dark-sage">
                        <span>Select nearby 2.4/5GHz Wi-Fi network</span>
                        <button 
                          onClick={handleScanNetworks}
                          disabled={isScanning}
                          className="text-[10px] text-natural-sage hover:text-natural-dark-sage font-black flex items-center space-x-1 uppercase cursor-pointer"
                        >
                          <RefreshCw className={`h-3 w-3 ${isScanning ? 'animate-spin' : ''}`} />
                          <span>{isScanning ? 'Scanning...' : 'Rescan'}</span>
                        </button>
                      </div>

                      {isScanning ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-3">
                          <div className="relative h-14 w-14 mx-auto rounded-full border border-natural-sage/20 flex items-center justify-center bg-natural-sage/5 animate-pulse">
                            <Radio className="h-6 w-6 text-natural-sage animate-ping absolute" />
                            <Wifi className="h-6 w-6 text-natural-sage" />
                          </div>
                          <span className="text-[11px] font-bold text-natural-muted-light uppercase tracking-widest animate-pulse block text-center">Scanning surrounding frequencies...</span>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {scannedNetworks.map(net => (
                            <div 
                              key={net.ssid}
                              onClick={() => setSelectedNetwork(net.ssid)}
                              className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center text-xs font-semibold ${
                                selectedNetwork === net.ssid
                                  ? 'border-natural-sage bg-natural-sage/5 text-natural-dark-sage'
                                  : 'border-natural-border/60 hover:bg-natural-bg/10 text-natural-text'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <Wifi className="h-4 w-4 text-natural-sage" />
                                <span>{net.ssid}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-natural-muted">
                                <span className="font-mono text-[10px]">{net.strength} dBm</span>
                                {net.secured ? <Lock className="h-3 w-3 text-natural-sage" /> : <Unlock className="h-3 w-3 text-slate-400" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Password Input form if network selected */}
                      {selectedNetwork && (
                        <div className="space-y-3 pt-3 border-t border-natural-border-light animate-in fade-in duration-200">
                          <div>
                            <label className="text-[9.5px] font-bold text-natural-dark-sage uppercase tracking-wider block mb-1.5">Enter Network Security Key (Password)</label>
                            <div className="relative">
                              <input 
                                type={showWifiPassword ? "text" : "password"} 
                                value={wifiPassword} 
                                onChange={(e) => setWifiPassword(e.target.value)} 
                                placeholder="••••••••••••••" 
                                className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-natural-border rounded-xl outline-none text-natural-dark-sage font-mono text-xs focus:border-natural-sage" 
                              />
                              <button 
                                type="button" 
                                onClick={() => setShowWifiPassword(!showWifiPassword)}
                                className="absolute right-3.5 top-2.5 text-natural-muted hover:text-natural-dark-sage"
                              >
                                {showWifiPassword ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => handleConnectDevice(configureDeviceId)}
                            disabled={!wifiPassword}
                            className={`w-full py-2.5 text-white font-bold text-xs rounded-full uppercase tracking-wider transition-all cursor-pointer shadow-md ${
                              !wifiPassword 
                                ? 'bg-slate-300 shadow-none cursor-not-allowed' 
                                : 'bg-natural-sage hover:bg-natural-dark-sage shadow-natural-sage/20'
                            }`}
                          >
                            Establish Wireless Sync Protocol
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Transition / Pairing Handshake Progress */}
                  {pairingStep === 2 && (
                    <div className="py-8 space-y-4 text-center">
                      <div className="relative h-14 w-14 mx-auto rounded-full border border-natural-sage/20 flex items-center justify-center bg-natural-sage/5">
                        <RefreshCw className="h-6 w-6 text-natural-sage animate-spin absolute" />
                        <Shield className="h-5 w-5 text-[#d9ad8c]" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-natural-dark-sage block">Authenticating Secure Handshake</span>
                        <p className="text-[10px] text-natural-muted font-bold italic">
                          "{pairingStatusMsg}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Successfully Configured Success Overlay */}
                  {pairingStep === 3 && (
                    <div className="py-8 space-y-4 text-center animate-in zoom-in-95 duration-200">
                      <div className="h-14 w-14 mx-auto rounded-full bg-natural-sage/10 text-natural-sage flex items-center justify-center shadow-inner">
                        <CheckCircle className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs font-black text-natural-dark-sage block uppercase tracking-wider">Device Configured Successfully</span>
                        <p className="text-[10px] text-natural-muted font-bold">
                          The wireless adapter has registered with the medical data sync portal.
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* WIRELESS NETWORK DIAGNOSTICS & TELEMETRY TOOL */}
              <div className="bg-white border border-natural-border rounded-[32px] p-6 shadow-xs text-left">
                <div className="border-b border-natural-border-light pb-3 mb-4 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h3 className="font-serif font-black text-sm text-natural-dark-sage flex items-center gap-1.5">
                      <Sliders className="h-4 w-4 text-natural-sage" />
                      <span>Local Signal Diagnostics Hub</span>
                    </h3>
                    <p className="text-[9px] text-natural-muted font-bold">Monitor local interference, latency limits and gateway security.</p>
                  </div>
                </div>

                {/* Diagnostics Tab Navigation */}
                <div className="flex bg-natural-bg/15 p-1 rounded-xl mb-4 text-[10.5px] font-bold text-natural-muted">
                  <button
                    onClick={() => setActiveTabDiagnostic('faq')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                      activeTabDiagnostic === 'faq' ? 'bg-white text-natural-dark-sage shadow-sm' : 'hover:text-natural-dark-sage'
                    }`}
                  >
                    Help Guide
                  </button>
                  <button
                    onClick={() => {
                      setActiveTabDiagnostic('ping');
                      if (pingStatus === 'idle') handleRunPingTest();
                    }}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                      activeTabDiagnostic === 'ping' ? 'bg-white text-natural-dark-sage shadow-sm' : 'hover:text-natural-dark-sage'
                    }`}
                  >
                    Gateway Ping
                  </button>
                  <button
                    onClick={() => setActiveTabDiagnostic('signal')}
                    className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                      activeTabDiagnostic === 'signal' ? 'bg-white text-natural-dark-sage shadow-sm' : 'hover:text-natural-dark-sage'
                    }`}
                  >
                    RF Signal map
                  </button>
                </div>

                {/* Tab content: FAQ */}
                {activeTabDiagnostic === 'faq' && (
                  <div className="space-y-3.5 text-xs">
                    <div className="p-3 bg-natural-beige/30 rounded-xl border border-natural-border-light">
                      <span className="font-bold text-natural-dark-sage block mb-1 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 text-natural-sage shrink-0" />
                        <span>How is clinical wireless security managed?</span>
                      </span>
                      <p className="text-[10px] text-natural-muted leading-relaxed font-semibold">
                        All CarePulse devices establish an encrypted connection over Wi-Fi, utilizing AES-256 standard wrapping for all biometric readings before local transfer. This complies with strict HIPAA guidelines for patient protection.
                      </p>
                    </div>

                    <div className="p-3 bg-natural-beige/30 rounded-xl border border-natural-border-light">
                      <span className="font-bold text-natural-dark-sage block mb-1 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 text-natural-sage shrink-0" />
                        <span>Which Wi-Fi frequency band should I use?</span>
                      </span>
                      <p className="text-[10px] text-natural-muted leading-relaxed font-semibold">
                        Most home medical biometric gear operates best on the **2.4 GHz band** because it extends farther through drywalls. High-throughput sensors like the Continuous Glucose Monitor support both 2.4 GHz and 5 GHz networks.
                      </p>
                    </div>

                    <div className="p-3 bg-natural-beige/30 rounded-xl border border-natural-border-light">
                      <span className="font-bold text-natural-dark-sage block mb-1 flex items-center gap-1">
                        <Info className="h-3.5 w-3.5 text-natural-sage shrink-0" />
                        <span>Resetting Wi-Fi on biometric devices</span>
                      </span>
                      <p className="text-[10px] text-natural-muted leading-relaxed font-semibold">
                        Hold down the physical power button on the device for 10 seconds until the Wi-Fi icon blinks. Then open the "Configure Wi-Fi" pairing wizard to establish a new sync connection.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab content: Ping Tool */}
                {activeTabDiagnostic === 'ping' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-[#171c19] text-natural-cream text-[10px] font-mono rounded-xl border border-white/5 shadow-inner h-44 overflow-y-auto space-y-1">
                      {pingLog.map((line, idx) => (
                        <p key={idx} className="leading-relaxed text-left whitespace-pre-wrap">{line}</p>
                      ))}
                      {pingStatus === 'testing' && (
                        <p className="animate-pulse text-[#d9ad8c]">...</p>
                      )}
                    </div>
                    
                    <button
                      onClick={handleRunPingTest}
                      disabled={pingStatus === 'testing'}
                      className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-full uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Server className="h-3.5 w-3.5" />
                      <span>{pingStatus === 'testing' ? 'Testing gateway latency...' : 'Test Sync Server Latency'}</span>
                    </button>
                  </div>
                )}

                {/* Tab content: Signal RF Map */}
                {activeTabDiagnostic === 'signal' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-natural-beige/30 border border-natural-border-light rounded-xl flex flex-col justify-between items-center text-center space-y-4">
                      
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Environment SNR</span>
                        <span className="font-mono text-xs font-bold text-natural-dark-sage">{noiseLevel} dBm (RSSI)</span>
                      </div>

                      {/* Animated wireless signal radar bar graph */}
                      <div className="flex items-end gap-1.5 h-16 w-full max-w-xs justify-center">
                        {[50, 85, 30, 95, 60, 45, 75, 20, 85, 40, 90, 15, 65, 80].map((ht, idx) => (
                          <div 
                            key={idx} 
                            className={`w-2.5 rounded-full transition-all duration-300 ${
                              idx % 2 === 0 ? 'bg-natural-sage/40' : 'bg-natural-sage'
                            }`}
                            style={{ 
                              height: `${ht}%`,
                              animation: `pulse 1.5s infinite ease-in-out`,
                              animationDelay: `${idx * 0.1}s`
                            }}
                          />
                        ))}
                      </div>

                      <div className="space-y-1.5 w-full">
                        <div className="flex justify-between text-[11px] font-bold text-natural-dark-sage">
                          <span>Wireless Packet Loss Ratio</span>
                          <span className="text-natural-sage">0.02% (Optimal)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-natural-sage h-full w-[99.8%]" />
                        </div>
                      </div>

                      <p className="text-[10.5px] font-semibold text-natural-muted leading-relaxed">
                        Excellent wireless environment. Signal attenuation is minimal. Place devices within 15 meters of the primary routing gateway for best coverage.
                      </p>

                    </div>
                  </div>
                )}

              </div>

              {/* SYSTEM & FIRMWARE SOFTWARE UPDATE CENTER CARD */}
              <div className="bg-white border border-natural-border rounded-[32px] p-6 shadow-xs text-left space-y-4" id="system-software-update-center">
                <div className="border-b border-natural-border-light pb-3 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h3 className="font-serif font-black text-sm text-natural-dark-sage flex items-center gap-1.5">
                      <Cpu className="h-4 w-4 text-natural-sage" />
                      <span>EHR Software & Update Center</span>
                    </h3>
                    <p className="text-[9px] text-natural-muted font-bold">Manage clinical system patches and certified biometrics firmware.</p>
                  </div>
                  <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                    v4.2
                  </span>
                </div>

                {/* Application Portal Update Segment */}
                <div className="p-4 bg-natural-beige/10 rounded-2xl border border-natural-border/60 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-black text-natural-dark-sage block font-sans">CarePulse Client Web Portal</span>
                      <span className="text-[10px] text-natural-muted font-mono block">Current: <strong className="text-natural-dark-sage font-bold">{appVersion}</strong></span>
                    </div>
                    {appVersion === "v4.2.1-stable" ? (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[8.5px] font-black uppercase font-mono animate-pulse">
                        Update Available
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-natural-sage/10 text-natural-dark-sage border border-natural-sage/20 rounded text-[8.5px] font-black uppercase font-mono">
                        Up to Date
                      </span>
                    )}
                  </div>

                  {appUpdating ? (
                    <div className="space-y-3 pt-1">
                      <div className="p-3 bg-[#111512] rounded-xl border border-white/5 space-y-1.5 text-[10px] font-mono text-natural-cream shadow-inner text-left">
                        <div className="flex justify-between items-center text-slate-500 border-b border-white/5 pb-1">
                          <span>SYSTEM FLASH UTILITY</span>
                          <span>{appUpdateProgress}%</span>
                        </div>
                        <p className="text-natural-sage animate-pulse">{appUpdateStatus}</p>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-natural-sage h-full transition-all duration-300" 
                          style={{ width: `${appUpdateProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : appVersion === "v4.2.1-stable" ? (
                    <div className="space-y-3">
                      <div className="text-[9.5px] bg-white border border-natural-border p-2.5 rounded-xl space-y-1 text-natural-muted font-bold">
                        <div className="text-[10px] text-natural-dark-sage font-extrabold uppercase tracking-wider mb-1">Changelog v4.2.2-patch3:</div>
                        <p>• Optimized real-time CGM telemetry chart FPS graph refresh rate</p>
                        <p>• Corrected battery depletion warning reporting bounds</p>
                        <p>• Cryptographic enhancement to local database storage structures</p>
                      </div>

                      <button
                        onClick={handleUpdateApp}
                        className="w-full py-2 bg-natural-sage hover:bg-natural-dark-sage text-white text-[10.5px] font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <ArrowUpCircle className="h-4 w-4" />
                        <span>Download & Apply Update (3.4 MB)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-natural-sage font-semibold bg-natural-sage/5 p-3 rounded-xl border border-natural-sage/20 leading-relaxed">
                      ✓ System is running the latest certified clinical security image. Next automated verification audit: July 2026.
                    </div>
                  )}
                </div>

                {/* IoT Connected Hardware Firmware Overview Segment */}
                <div className="p-4 bg-natural-beige/10 rounded-2xl border border-natural-border/60 space-y-2">
                  <span className="text-[11px] font-black text-natural-dark-sage block font-sans">Connected Medical Equipment Firmware</span>
                  
                  <div className="space-y-2 pt-1 text-[10.5px]">
                    {devices.map(d => {
                      const target = d.id === "dev_bp" ? "v2.2.0-stable" : d.id === "dev_cgm" ? "v1.1.2-stable" : d.id === "dev_ox" ? "v1.5.0-patch2" : null;
                      const hasUp = target !== null && d.firmware !== target;
                      return (
                        <div key={d.id} className="flex justify-between items-center border-b border-natural-border-light/40 pb-1.5 last:border-0 last:pb-0 font-semibold font-sans">
                          <span className="text-natural-muted font-bold">{d.name}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-[9.5px] text-slate-500">{d.firmware}</span>
                            {hasUp ? (
                              <span className="text-[8px] font-black uppercase text-amber-600 bg-amber-50 border border-amber-100 px-1 rounded font-mono">
                                Update Ready
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold uppercase text-natural-sage bg-natural-sage/10 px-1 rounded font-sans">
                                Certified
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 6. CLINICAL REPORT EXPORT MODAL (SIMULATED FOR PREMIUM INTEGRITY) */}
      {showShareModal && (
        <div className="fixed inset-0 bg-[#00000045] backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-natural-border rounded-[32px] p-6 max-w-md w-full shadow-2xl text-left space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-natural-border-light pb-3">
              <div className="flex items-center space-x-1.5 text-natural-dark-sage">
                <Share2 className="h-4.5 w-4.5 text-natural-sage" />
                <span className="font-serif font-black text-sm">Export Clinical Biometric Report</span>
              </div>
              <button 
                onClick={() => setShowShareModal(false)} 
                className="text-[10px] font-black uppercase tracking-wider text-natural-muted hover:text-natural-terracotta cursor-pointer"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-natural-muted leading-relaxed font-semibold">
              Generate a cryptographically signed clinical report enclosing all blood pressure logs, heart rate streams, glycemic charts, and provider communications to transmit directly to external EHRs or cardiology consultants.
            </p>

            <div className="space-y-2 bg-natural-beige/30 p-4 rounded-2xl border border-natural-border-light text-xs font-semibold text-natural-dark-sage space-y-2.5">
              <div className="flex justify-between items-center border-b border-natural-border-light pb-1.5">
                <span>Patient EHR Subject:</span>
                <span className="font-bold">Sarah Jenkins</span>
              </div>
              <div className="flex justify-between items-center border-b border-natural-border-light pb-1.5">
                <span>Format Standard:</span>
                <span className="font-mono text-[10px] font-bold">FHIR JSON / Clinical PDF</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Target Integration:</span>
                <span className="text-natural-sage font-extrabold uppercase text-[10px]">Active EHR Sync Port (3000)</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  setSuccessMsg("Clinical report downloaded to system in FHIR PDF format.");
                  setTimeout(() => setSuccessMsg(""), 4000);
                }}
                className="flex-1 py-2.5 bg-natural-sage hover:bg-natural-dark-sage text-white font-bold text-xs rounded-full uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                Download PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowShareModal(false);
                  setSuccessMsg("FHIR record transmitted successfully to provider network.");
                  setTimeout(() => setSuccessMsg(""), 4000);
                }}
                className="flex-1 py-2.5 bg-[#2a332c] hover:bg-[#1e241f] text-white font-bold text-xs rounded-full uppercase tracking-wider transition-all cursor-pointer text-center"
              >
                Direct EHR Sync
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
