import { createContext, useContext, useState, ReactNode } from 'react';
import { Language } from './translations';

interface SettingsContextType {
  binName: string;
  setBinName: (name: string) => void;
  notifications: {
    binFull: boolean;
    collectionReminder: boolean;
    systemAlerts: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsAlerts: boolean;
  };
  setNotifications: (notifications: any) => void;
  binSettings: {
    fullThreshold: number;
    collectionSchedule: string;
    autoEmptyAlert: boolean;
    lowBatteryAlert: boolean;
    maintenanceMode: boolean;
  };
  setBinSettings: (settings: any) => void;
  systemSettings: {
    dataRetention: string;
    autoBackup: boolean;
    darkMode: boolean;
    language: Language;
    timezone: string;
    refreshInterval: number;
  };
  setSystemSettings: (settings: any) => void;
  userProfile: {
    name: string;
    email: string;
    phone: string;
    organization: string;
  };
  setUserProfile: (profile: any) => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [binName, setBinName] = useState('R3 Bin');
  
  const [notifications, setNotifications] = useState({
    binFull: true,
    collectionReminder: true,
    systemAlerts: true,
    emailNotifications: false,
    pushNotifications: true,
    smsAlerts: false
  });

  const [binSettings, setBinSettings] = useState({
    fullThreshold: 85,
    collectionSchedule: 'daily',
    autoEmptyAlert: true,
    lowBatteryAlert: true,
    maintenanceMode: false
  });

  const [systemSettings, setSystemSettings] = useState({
    dataRetention: '1year',
    autoBackup: true,
    darkMode: false,
    language: 'english',
    timezone: 'IST',
    refreshInterval: 30
  });

  const [userProfile, setUserProfile] = useState({
    name: 'R3 Bin Administrator',
    email: 'admin@r3bin.com',
    phone: '+91 9876543210',
    organization: 'KJ Somaiya College of Engineering'
  });

  const resetSettings = () => {
    setBinName('R3 Bin');
    setNotifications({
      binFull: true,
      collectionReminder: true,
      systemAlerts: true,
      emailNotifications: false,
      pushNotifications: true,
      smsAlerts: false
    });
    setBinSettings({
      fullThreshold: 85,
      collectionSchedule: 'daily',
      autoEmptyAlert: true,
      lowBatteryAlert: true,
      maintenanceMode: false
    });
    setSystemSettings(prev => ({
      dataRetention: '1year',
      autoBackup: true,
      darkMode: prev.darkMode, // Keep current dark mode state
      language: 'english',
      timezone: 'IST',
      refreshInterval: 30
    }));
    setUserProfile({
      name: 'R3 Bin Administrator',
      email: 'admin@r3bin.com',
      phone: '+91 9876543210',
      organization: 'KJ Somaiya College of Engineering'
    });
  };

  const value = {
    binName,
    setBinName,
    notifications,
    setNotifications,
    binSettings,
    setBinSettings,
    systemSettings,
    setSystemSettings,
    userProfile,
    setUserProfile,
    resetSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}