import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Trash2, TrendingUp, MapPin, Users, Plus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { useBinData } from './bin-data-context';
import { useTranslation } from './translation-context';
import { useEffect, useState } from 'react';
import { supabase } from "./supabase";


// This data is now dynamically generated from the context

const wasteBreakdown = [
  { name: 'Organic', value: 45, color: '#10b981' },
  { name: 'Plastic', value: 25, color: '#3b82f6' },
  { name: 'Paper', value: 20, color: '#f59e0b' },
  { name: 'Metal', value: 10, color: '#ef4444' },
];

// This data is now dynamically generated from the context

export function Overview() {
  const { binData, fillLevelTrend, dailyWasteData, systemOnline, setBinData, updateFillLevelTrend } = useBinData();
  const { t } = useTranslation();
  const [supabaseData, setSupabaseData] = useState<any>(null);
  const [lastSupabaseUpdate, setLastSupabaseUpdate] = useState<string>("");
  const [firebaseData, setFirebaseData] = useState<any>(null);
  const [lastFirebaseUpdate, setLastFirebaseUpdate] = useState<string>("");

useEffect(() => {
  console.log("🔥 Setting up Supabase Realtime listener...");
  
  const channel = supabase
    .channel("custom-all-channel")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "testdata" },
      (payload) => {
        console.log("📩 Supabase payload received:", payload);
        console.log("Event type:", payload.eventType);
        console.log("New data:", payload.new);
        
        // ✅ Set the correct state variable
        setSupabaseData(payload.new);
        
        // ✅ Update timestamp
        const now = new Date();
        setLastSupabaseUpdate(now.toLocaleTimeString());
      }
    )
    .subscribe((status, err) => {
      console.log("🔌 Subscription status:", status);
      if (err) {
        console.error("❌ Subscription error:", err);
      }
      if (status === 'SUBSCRIBED') {
        console.log("✅ Successfully subscribed to testdata changes");
      }
    });

  return () => {
    console.log("🔥 Cleaning up Supabase listener");
    supabase.removeChannel(channel);
  };
}, []); // ✅ Empty dependency array
  
  // Function to simulate waste accumulation (for testing)
  const simulateWasteAddition = () => {
    setBinData(prev => prev.map(bin => {
      const randomIncrease = Math.floor(Math.random() * 15) + 5; // 5-20% increase
      const newLevel = Math.min(100, bin.fillLevel + randomIncrease);
      const newVolume = ((newLevel / 100) * 5).toFixed(2) + 'L';
      
      let status = 'normal';
      if (newLevel >= 95) status = 'critical';
      else if (newLevel >= 80) status = 'warning';
      
      return {
        ...bin,
        fillLevel: newLevel,
        volume: newVolume,
        status
      };
    }));
    updateFillLevelTrend();
  };

  // Calculate dynamic metrics from bin data
  const getCurrentWasteInBins = () => {
    return binData.reduce((total, bin) => {
      const volume = parseFloat(bin.volume.replace('L', ''));
      return total + volume;
    }, 0);
  };

  const getActiveBins = () => {
    // When system is online, all bins are active (4/4)
    // This indicates the system is functioning properly
    const active = systemOnline ? binData.length : 0;
    const needingAttention = binData.filter(bin => bin.status === 'critical' || bin.status === 'warning').length;
    return { active, total: binData.length, needingAttention };
  };

  const getAverageFillLevel = () => {
    const totalFillLevel = binData.reduce((total, bin) => total + bin.fillLevel, 0);
    return Math.round(totalFillLevel / binData.length);
  };

  const getDynamicBinUsageData = () => {
    return binData.map((bin, index) => ({
      bin: `Bin ${index + 1}`,
      usage: bin.fillLevel,
      name: bin.name
    }));
  };

  const getDynamicWasteBreakdown = () => {
    const colorMap: Record<string, string> = {
      'bg-green-500': '#10b981',
      'bg-blue-500': '#3b82f6',
      'bg-yellow-500': '#f59e0b',
      'bg-gray-500': '#6b7280'
    };
    
    return binData.map(bin => ({
      name: bin.wasteType,
      value: bin.fillLevel,
      color: colorMap[bin.color] || '#6b7280'
    }));
  };

  const getTotalWasteDisplay = () => {
    // Show today's accumulated waste
    return dailyWasteData.accumulatedToday;
  };

  const getDailyGrowthPercentage = () => {
    // Calculate percentage growth from yesterday (mock calculation)
    const currentTotal = dailyWasteData.accumulatedToday;
    const yesterdayAverage = 13.8; // Mock yesterday's total
    const growth = ((currentTotal - yesterdayAverage) / yesterdayAverage) * 100;
    return Math.round(growth);
  };

  const activeBinsInfo = getActiveBins();
  const averageFillLevel = getAverageFillLevel();
  const currentWasteInBins = getCurrentWasteInBins();
  const totalWasteToday = getTotalWasteDisplay();
  const dailyGrowth = getDailyGrowthPercentage();
  const wasteBreakdown = getDynamicWasteBreakdown();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{t('overview')}</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{t('realTimeMonitoring')}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-2 py-1 sm:px-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-green-500 text-xs sm:text-sm font-medium">{t('online').toLowerCase()}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">{t('totalWasteCollected')}</CardTitle>
    <Trash2 className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    {/* 🔥 LIVE DATA FROM FIREBASE */}
    <div className="text-xl sm:text-2xl font-bold">
      {supabaseData ? supabaseData.total_waste.toFixed(1) : totalWasteToday.toFixed(1)}L
    </div>
    
    {/* Show live indicator */}
    {supabaseData && (
  <div className="flex items-center gap-2 mt-1">
    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
    <span className="text-xs text-green-600 font-semibold">LIVE • {lastSupabaseUpdate}</span>
  </div>
)}
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className={`flex items-center gap-1 ${dailyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="h-3 w-3" />
                {dailyGrowth >= 0 ? '+' : ''}{dailyGrowth}% {t('fromYesterday')}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('activeBins')}</CardTitle>
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{activeBinsInfo.active}/{activeBinsInfo.total}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {activeBinsInfo.needingAttention > 0 
                ? `${activeBinsInfo.needingAttention} bin${activeBinsInfo.needingAttention > 1 ? 's' : ''} need${activeBinsInfo.needingAttention === 1 ? 's' : ''} attention`
                : 'All bins normal'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('averageFillLevel')}</CardTitle>
            <Progress value={averageFillLevel} className="w-8 h-2" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{averageFillLevel}%</div>
            <p className="text-xs sm:text-sm text-muted-foreground">{currentWasteInBins.toFixed(1)}L / 20L {t('capacity')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('locationStatus')}</CardTitle>
            <MapPin className={`h-4 w-4 ${systemOnline ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{systemOnline ? t('online') : t('offline')}</div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {systemOnline ? t('gpsWifiConnected') : t('connectionLost')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('fillLevelTrends')}</CardTitle>
            <CardDescription>{t('todayWasteAccumulation')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250} className="[&_.recharts-line-curve]:dark:!stroke-[#16a34a] [&_.recharts-dot]:dark:!fill-[#16a34a] [&_.recharts-dot]:dark:!stroke-[#16a34a] [&_.recharts-line-curve]:stroke-blue-500 [&_.recharts-dot]:fill-blue-500 [&_.recharts-dot]:stroke-blue-500">
              <LineChart data={fillLevelTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value) => [`${value}%`, 'Fill Level']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="level" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('wasteBreakdown')}</CardTitle>
            <CardDescription>{t('distributionByWasteType')}</CardDescription>
          </CardHeader>
          <CardContent>
            {wasteBreakdown.every(item => item.value === 0) ? (
              <div className="flex items-center justify-center h-[250px]">
                <div className="text-center">
                  <Trash2 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No waste collected</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={wasteBreakdown.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {wasteBreakdown.filter(item => item.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bin Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('individualBinUsage')}</CardTitle>
          <CardDescription>{t('currentFillLevelsEachBin')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250} className="[&_.recharts-rectangle]:dark:!fill-[#16a34a] [&_.recharts-rectangle]:fill-blue-500">
            <BarChart data={getDynamicBinUsageData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bin" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Fill Level']} />
              <Bar 
                dataKey="usage" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}