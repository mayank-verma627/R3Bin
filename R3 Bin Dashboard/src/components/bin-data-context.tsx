import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Mock historical data for waste collections
export let historyData = [
  {
    id: 1,
    date: new Date('2024-01-15T10:30:00'),
    action: 'Emptied',
    binName: 'Organic Waste',
    binId: 1,
    fillLevel: 95,
    volume: '4.75L'
  },
  {
    id: 2,
    date: new Date('2024-01-15T10:32:00'),
    action: 'Emptied',
    binName: 'Plastic Waste',
    binId: 2,
    fillLevel: 88,
    volume: '4.40L'
  },
  {
    id: 3,
    date: new Date('2024-01-14T16:45:00'),
    action: 'Collected',
    binName: 'Paper Waste',
    binId: 3,
    fillLevel: 85,
    volume: '4.25L'
  },
  {
    id: 4,
    date: new Date('2024-01-14T09:15:00'),
    action: 'Emptied',
    binName: 'Metal Waste',
    binId: 4,
    fillLevel: 92,
    volume: '4.60L'
  },
  {
    id: 5,
    date: new Date('2024-01-13T14:20:00'),
    action: 'Collected',
    binName: 'Organic Waste',
    binId: 1,
    fillLevel: 78,
    volume: '3.90L'
  },
  {
    id: 6,
    date: new Date('2024-01-12T11:10:00'),
    action: 'Emptied',
    binName: 'Plastic Waste',
    binId: 2,
    fillLevel: 96,
    volume: '4.80L'
  },
  {
    id: 7,
    date: new Date('2024-01-11T08:30:00'),
    action: 'Collected',
    binName: 'Paper Waste',
    binId: 3,
    fillLevel: 82,
    volume: '4.10L'
  },
  {
    id: 8,
    date: new Date('2024-01-10T15:45:00'),
    action: 'Emptied',
    binName: 'Metal Waste',
    binId: 4,
    fillLevel: 89,
    volume: '4.45L'
  },
  {
    id: 9,
    date: new Date('2024-01-08T12:00:00'),
    action: 'Collected',
    binName: 'Organic Waste',
    binId: 1,
    fillLevel: 91,
    volume: '4.55L'
  },
  {
    id: 10,
    date: new Date('2024-01-05T10:15:00'),
    action: 'Emptied',
    binName: 'Plastic Waste',
    binId: 2,
    fillLevel: 87,
    volume: '4.35L'
  }
];

export const initialBinData = [
  {
    id: 1,
    name: 'Organic Waste',
    fillLevel: 85,
    volume: '4.25L',
    status: 'warning',
    lastEmptied: '2 hours ago',
    wasteType: 'Organic',
    color: 'bg-green-500',
  },
  {
    id: 2,
    name: 'Plastic Waste',
    fillLevel: 95,
    volume: '4.75L',
    status: 'critical',
    lastEmptied: '4 hours ago',
    wasteType: 'Plastic',
    color: 'bg-blue-500',
  },
  {
    id: 3,
    name: 'Paper Waste',
    fillLevel: 60,
    volume: '3.0L',
    status: 'normal',
    lastEmptied: '1 hour ago',
    wasteType: 'Paper',
    color: 'bg-yellow-500',
  },
  {
    id: 4,
    name: 'Metal Waste',
    fillLevel: 78,
    volume: '3.9L',
    status: 'warning',
    lastEmptied: '3 hours ago',
    wasteType: 'Metal',
    color: 'bg-gray-500',
  },
];

export type BinData = typeof initialBinData[0];

// Fill level trend data structure
export interface FillLevelDataPoint {
  time: string;
  level: number;
  timestamp: number;
}

// Daily waste tracking
export interface DailyWasteData {
  total: number;
  lastReset: number; // timestamp
  accumulatedToday: number;
}

interface BinDataContextType {
  binData: BinData[];
  setBinData: (data: BinData[]) => void;
  binThresholds: Record<number, number>;
  setBinThresholds: (thresholds: Record<number, number>) => void;
  alertsConfigured: Record<number, boolean>;
  setAlertsConfigured: (alerts: Record<number, boolean>) => void;
  scheduledCollections: Record<number, number>;
  setScheduledCollections: (collections: Record<number, number>) => void;
  updateHistoryData: (newEntry: any) => void;
  getHistoryData: () => typeof historyData;
  fillLevelTrend: FillLevelDataPoint[];
  dailyWasteData: DailyWasteData;
  emptyBin: (binId: number) => void;
  emptyAllBins: () => void;
  systemOnline: boolean;
  updateFillLevelTrend: () => void;
  resetBinData: () => void;
}

const BinDataContext = createContext<BinDataContextType | undefined>(undefined);

// Generate initial fill level trend data
const generateInitialFillLevelTrend = (): FillLevelDataPoint[] => {
  const now = Date.now();
  const hoursBack = 8;
  const data: FillLevelDataPoint[] = [];
  
  for (let i = hoursBack; i >= 0; i--) {
    const timestamp = now - (i * 60 * 60 * 1000); // Each hour back
    const date = new Date(timestamp);
    const hour = date.getHours();
    const timeStr = hour === 0 ? '12AM' : hour <= 12 ? `${hour}AM` : `${hour - 12}PM`;
    
    // Simulate realistic fill progression
    const baseLevel = Math.max(0, 20 + (hoursBack - i) * 12);
    const level = Math.min(95, baseLevel + Math.random() * 10);
    
    data.push({
      time: timeStr,
      level: Math.round(level),
      timestamp
    });
  }
  
  return data;
};

export const BinDataProvider = ({ children }: { children: ReactNode }) => {
  const [binData, setBinData] = useState(initialBinData);
  const [binThresholds, setBinThresholds] = useState<Record<number, number>>({
    1: 85,
    2: 90,
    3: 80,
    4: 85,
  });
  const [alertsConfigured, setAlertsConfigured] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: false,
    4: false,
  });
  const [scheduledCollections, setScheduledCollections] = useState<Record<number, number>>({});
  const [fillLevelTrend, setFillLevelTrend] = useState<FillLevelDataPoint[]>(generateInitialFillLevelTrend());
  const [dailyWasteData, setDailyWasteData] = useState<DailyWasteData>({
    total: 156.8, // Cumulative total from all days
    lastReset: Date.now() - (Math.random() * 12 * 60 * 60 * 1000), // Random time today
    accumulatedToday: 15.4 // Today's accumulation
  });
  const [systemOnline, setSystemOnline] = useState(true);

  // Check for 24-hour reset
  useEffect(() => {
    const checkDailyReset = () => {
      const now = Date.now();
      const timeSinceReset = now - dailyWasteData.lastReset;
      const twentyFourHours = 24 * 60 * 60 * 1000;
      
      if (timeSinceReset >= twentyFourHours) {
        setDailyWasteData(prev => ({
          ...prev,
          lastReset: now,
          accumulatedToday: 0
        }));
      }
    };

    const interval = setInterval(checkDailyReset, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [dailyWasteData.lastReset]);

  // Update fill level trend periodically
  useEffect(() => {
    const updateTrend = () => {
      const now = Date.now();
      const currentHour = new Date(now).getHours();
      const timeStr = currentHour === 0 ? '12AM' : currentHour <= 12 ? `${currentHour}AM` : `${currentHour - 12}PM`;
      
      // Calculate current average fill level
      const currentLevel = Math.round(
        binData.reduce((sum, bin) => sum + bin.fillLevel, 0) / binData.length
      );

      setFillLevelTrend(prev => {
        const newTrend = [...prev];
        const lastEntry = newTrend[newTrend.length - 1];
        
        // If enough time has passed since last entry, add new one
        if (now - lastEntry.timestamp > 30 * 60 * 1000) { // 30 minutes
          newTrend.push({
            time: timeStr,
            level: currentLevel,
            timestamp: now
          });
          
          // Keep only last 24 data points
          if (newTrend.length > 24) {
            newTrend.shift();
          }
        } else {
          // Update the last entry
          newTrend[newTrend.length - 1] = {
            time: timeStr,
            level: currentLevel,
            timestamp: now
          };
        }
        
        return newTrend;
      });
    };

    const interval = setInterval(updateTrend, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [binData]);

  const updateFillLevelTrend = () => {
    const now = Date.now();
    const currentHour = new Date(now).getHours();
    const timeStr = currentHour === 0 ? '12AM' : currentHour <= 12 ? `${currentHour}AM` : `${currentHour - 12}PM`;
    
    // Calculate current average fill level
    const currentLevel = Math.round(
      binData.reduce((sum, bin) => sum + bin.fillLevel, 0) / binData.length
    );

    setFillLevelTrend(prev => {
      const newTrend = [...prev];
      newTrend.push({
        time: timeStr,
        level: currentLevel,
        timestamp: now
      });
      
      // Keep only last 24 data points
      if (newTrend.length > 24) {
        newTrend.shift();
      }
      
      return newTrend;
    });
  };

  const emptyBin = (binId: number) => {
    const binToEmpty = binData.find(bin => bin.id === binId);
    if (!binToEmpty) return;

    const volume = parseFloat(binToEmpty.volume.replace('L', ''));
    
    // Update daily waste data
    setDailyWasteData(prev => ({
      total: prev.total + volume,
      lastReset: prev.lastReset,
      accumulatedToday: prev.accumulatedToday + volume
    }));

    // Reset the bin
    setBinData(prev => prev.map(bin => 
      bin.id === binId 
        ? { 
            ...bin, 
            fillLevel: 0, 
            volume: '0.0L', 
            status: 'normal', 
            lastEmptied: 'Just now' 
          }
        : bin
    ));

    // Add to history
    const historyEntry = {
      id: Date.now(),
      date: new Date(),
      action: 'Emptied',
      binName: binToEmpty.name,
      binId: binId,
      fillLevel: binToEmpty.fillLevel,
      volume: binToEmpty.volume
    };
    updateHistoryData(historyEntry);
    
    // Update trend to show the dip
    updateFillLevelTrend();
  };

  const emptyAllBins = () => {
    const totalVolume = binData.reduce((sum, bin) => {
      return sum + parseFloat(bin.volume.replace('L', ''));
    }, 0);

    // Update daily waste data
    setDailyWasteData(prev => ({
      total: prev.total + totalVolume,
      lastReset: prev.lastReset,
      accumulatedToday: prev.accumulatedToday + totalVolume
    }));

    // Add history entries for each bin
    binData.forEach(bin => {
      if (bin.fillLevel > 0) {
        const historyEntry = {
          id: Date.now() + bin.id,
          date: new Date(),
          action: 'Emptied',
          binName: bin.name,
          binId: bin.id,
          fillLevel: bin.fillLevel,
          volume: bin.volume
        };
        updateHistoryData(historyEntry);
      }
    });

    // Reset all bins
    setBinData(prev => prev.map(bin => ({
      ...bin,
      fillLevel: 0,
      volume: '0.0L',
      status: 'normal',
      lastEmptied: 'Just now'
    })));

    // Update trend to show the major dip
    updateFillLevelTrend();
  };

  const updateHistoryData = (newEntry: any) => {
    historyData = [newEntry, ...historyData];
  };

  const getHistoryData = () => historyData;

  const resetBinData = () => {
    // Reset all state to initial values
    setBinData(initialBinData);
    setBinThresholds({
      1: 85,
      2: 90,
      3: 80,
      4: 85,
    });
    setAlertsConfigured({
      1: false,
      2: false,
      3: false,
      4: false,
    });
    setScheduledCollections({});
    setFillLevelTrend(generateInitialFillLevelTrend());
    setDailyWasteData({
      total: 156.8, // Cumulative total from all days
      lastReset: Date.now() - (Math.random() * 12 * 60 * 60 * 1000), // Random time today
      accumulatedToday: 15.4 // Today's accumulation
    });
    setSystemOnline(true);
    
    // Reset history data to initial state
    historyData = [
      {
        id: 1,
        date: new Date('2024-01-15T10:30:00'),
        action: 'Emptied',
        binName: 'Organic Waste',
        binId: 1,
        fillLevel: 95,
        volume: '4.75L'
      },
      {
        id: 2,
        date: new Date('2024-01-15T10:32:00'),
        action: 'Emptied',
        binName: 'Plastic Waste',
        binId: 2,
        fillLevel: 88,
        volume: '4.40L'
      },
      {
        id: 3,
        date: new Date('2024-01-14T16:45:00'),
        action: 'Collected',
        binName: 'Paper Waste',
        binId: 3,
        fillLevel: 85,
        volume: '4.25L'
      },
      {
        id: 4,
        date: new Date('2024-01-14T09:15:00'),
        action: 'Emptied',
        binName: 'Metal Waste',
        binId: 4,
        fillLevel: 92,
        volume: '4.60L'
      },
      {
        id: 5,
        date: new Date('2024-01-13T14:20:00'),
        action: 'Collected',
        binName: 'Organic Waste',
        binId: 1,
        fillLevel: 78,
        volume: '3.90L'
      },
      {
        id: 6,
        date: new Date('2024-01-12T11:10:00'),
        action: 'Emptied',
        binName: 'Plastic Waste',
        binId: 2,
        fillLevel: 96,
        volume: '4.80L'
      },
      {
        id: 7,
        date: new Date('2024-01-11T08:30:00'),
        action: 'Collected',
        binName: 'Paper Waste',
        binId: 3,
        fillLevel: 82,
        volume: '4.10L'
      },
      {
        id: 8,
        date: new Date('2024-01-10T15:45:00'),
        action: 'Emptied',
        binName: 'Metal Waste',
        binId: 4,
        fillLevel: 89,
        volume: '4.45L'
      },
      {
        id: 9,
        date: new Date('2024-01-08T12:00:00'),
        action: 'Collected',
        binName: 'Organic Waste',
        binId: 1,
        fillLevel: 91,
        volume: '4.55L'
      },
      {
        id: 10,
        date: new Date('2024-01-05T10:15:00'),
        action: 'Emptied',
        binName: 'Plastic Waste',
        binId: 2,
        fillLevel: 87,
        volume: '4.35L'
      }
    ];
  };

  return (
    <BinDataContext.Provider
      value={{
        binData,
        setBinData,
        binThresholds,
        setBinThresholds,
        alertsConfigured,
        setAlertsConfigured,
        scheduledCollections,
        setScheduledCollections,
        updateHistoryData,
        getHistoryData,
        fillLevelTrend,
        dailyWasteData,
        emptyBin,
        emptyAllBins,
        systemOnline,
        updateFillLevelTrend,
        resetBinData,
      }}
    >
      {children}
    </BinDataContext.Provider>
  );
};

export const useBinData = () => {
  const context = useContext(BinDataContext);
  if (context === undefined) {
    throw new Error('useBinData must be used within a BinDataProvider');
  }
  return context;
};