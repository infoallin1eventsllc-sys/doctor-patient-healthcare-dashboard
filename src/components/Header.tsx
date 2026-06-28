import React, { useState } from "react";
import { 
  Activity, 
  Bell, 
  Shield, 
  User, 
  RefreshCw, 
  AlertTriangle, 
  Settings, 
  Check, 
  LogOut 
} from "lucide-react";
import { DashboardState, saveState } from "../data";

interface HeaderProps {
  state: DashboardState;
  onChangeState: (newState: DashboardState) => void;
  onNavigate: (tab: string) => void;
  currentTab: string;
  onTriggerSOS: () => void;
}

export default function Header({ 
  state, 
  onChangeState, 
  onNavigate, 
  currentTab,
  onTriggerSOS 
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { activeUserRole, notifications, patient } = state;

  const unreadNotifications = notifications.filter(n => !n.read);

  const toggleRole = () => {
    const nextRole: "patient" | "doctor" = activeUserRole === "patient" ? "doctor" : "patient";
    const updatedState = { ...state, activeUserRole: nextRole };
    onChangeState(updatedState);
    saveState(updatedState);
    
    // Auto-navigate to appropriate default page for the role
    if (nextRole === "patient") {
      onNavigate("dashboard");
    } else {
      onNavigate("doctor-home");
    }
  };

  const markAllNotificationsAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    const updatedState = { ...state, notifications: updatedNotifications };
    onChangeState(updatedState);
    saveState(updatedState);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-natural-border shadow-sm" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Brand/Logo */}
          <div 
            onClick={() => onNavigate(activeUserRole === "patient" ? "dashboard" : "doctor-home")} 
            className="flex items-center space-x-2.5 cursor-pointer select-none"
            id="brand-logo"
          >
            <div className="bg-natural-sage text-white p-2 rounded-xl flex items-center justify-center shadow-md shadow-natural-sage/20">
              <Activity className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-serif font-bold text-lg text-natural-dark-sage tracking-tight block leading-none">
                CarePulse
              </span>
              <span className="text-[10px] text-natural-muted-light font-mono tracking-wider uppercase">
                HEALTH PORTAL
              </span>
            </div>
          </div>

          {/* Quick Controls & Navigation */}
          <div className="flex items-center space-x-4">
            
            {/* Quick SOS Trigger Button */}
            <button 
              id="sos-trigger-button"
              onClick={onTriggerSOS}
              className="relative px-3.5 py-1.5 bg-natural-terracotta/10 border border-natural-terracotta/30 text-natural-terracotta hover:bg-natural-terracotta/20 active:scale-95 transition-all text-xs font-semibold rounded-lg flex items-center space-x-1.5 shadow-xs overflow-hidden group"
            >
              <div className="absolute inset-0 bg-natural-terracotta/10 animate-ping rounded-lg pointer-events-none" />
              <AlertTriangle className="h-3.5 w-3.5 stroke-[2.5] animate-pulse" />
              <span>SOS Emergency</span>
            </button>

            {/* Role Switcher Toggle */}
            <button
              id="role-switch-button"
              onClick={toggleRole}
              className="px-3.5 py-1.5 bg-natural-beige border border-natural-border text-natural-text hover:bg-natural-cream transition-all text-xs font-semibold rounded-lg flex items-center space-x-2"
              title={`Switch to ${activeUserRole === "patient" ? "Doctor" : "Patient"} View`}
            >
              <RefreshCw className="h-3.5 w-3.5 text-natural-sage" />
              <span className="hidden md:inline text-natural-muted">Mode:</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                activeUserRole === "patient" 
                  ? "bg-natural-sage/20 text-natural-dark-sage" 
                  : "bg-natural-clay/20 text-natural-forest"
              }`}>
                {activeUserRole === "patient" ? "Patient (Sarah)" : "Doctor (Dr. Vance)"}
              </span>
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                id="notifications-dropdown-button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-natural-muted hover:text-natural-text hover:bg-natural-beige rounded-lg relative transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-natural-terracotta text-[10px] font-bold text-white ring-2 ring-white animate-bounce">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div 
                  className="absolute right-0 mt-2 w-80 bg-white border border-natural-border rounded-xl shadow-lg overflow-hidden z-50 animate-in fade-in slide-in-from-top-2"
                  id="notifications-panel"
                >
                  <div className="p-3 border-b border-natural-border-light bg-natural-beige flex justify-between items-center">
                    <span className="text-xs font-bold text-natural-dark-sage">Notifications</span>
                    {unreadNotifications.length > 0 && (
                      <button 
                        onClick={markAllNotificationsAsRead}
                        className="text-[10px] text-natural-sage hover:text-natural-dark-sage font-semibold"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-natural-border-light">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-natural-muted-light">No notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id} 
                          className={`p-3 text-xs transition-colors ${notif.read ? "bg-white text-natural-muted" : "bg-natural-cream/50 text-natural-text font-medium"}`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold">{notif.title}</span>
                            <span className="text-[10px] text-natural-muted-light">{notif.timestamp.split("T")[0]}</span>
                          </div>
                          <p className="mt-1 text-natural-muted text-[11px] leading-relaxed">{notif.body}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Summary */}
            <div className="flex items-center space-x-2 pl-2 border-l border-natural-border">
              <div className="h-8 w-8 rounded-full bg-natural-cream overflow-hidden ring-2 ring-natural-sage/20">
                <img 
                  src={
                    activeUserRole === "patient" 
                      ? patient.photoIdUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200" 
                      : "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200"
                  } 
                  alt="Avatar" 
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="hidden lg:block text-left leading-none">
                <span className="text-xs font-bold text-natural-text block">
                  {activeUserRole === "patient" ? patient.name : "Dr. Elizabeth Vance"}
                </span>
                <span className="text-[10px] text-natural-muted-light font-medium">
                  {activeUserRole === "patient" ? "Patient File" : "Cardiology (Admin)"}
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
