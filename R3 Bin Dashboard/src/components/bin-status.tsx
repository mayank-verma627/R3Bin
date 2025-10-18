import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Trash2, AlertTriangle, CheckCircle, Clock, Settings, History, Filter, Database, Wifi, RefreshCw } from 'lucide-react';
import { toast } from "sonner@2.0.3";
import { useBinData, BinData } from './bin-data-context';
import { useTranslation } from './translation-context';
import { supabase } from './supabase';

// TypeScript interface for BinStatus table data
interface BinStatusRecord {
  id: number;
  created_at: string;
  BinId: string;
  BinVersion: string;
  BinStatus: string;
  SubBin1: number;
  SubBin2: number;
  SubBin3: number;
  SubBin4: number;
  ErrorCodes: string | null;
  User_id: string;
  Total_fill_level: number;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'critical':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    default:
      return <CheckCircle className="h-4 w-4 text-green-500" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'critical':
      return <Badge variant="destructive">Critical</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>;
    default:
      return <Badge className="bg-green-500 hover:bg-green-600">Normal</Badge>;
  }
};

export function BinStatus() {
  const { t } = useTranslation();
  const {
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
    emptyBin,
    emptyAllBins
  } = useBinData();

  // NEW STATE FOR SUPABASE BINSTATUS DATA
  const [binStatusRecords, setBinStatusRecords] = useState<BinStatusRecord[]>([]);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [lastDatabaseUpdate, setLastDatabaseUpdate] = useState<Date | null>(null);
  const [isLoadingBinStatus, setIsLoadingBinStatus] = useState(false);

  const [isThresholdDialogOpen, setIsThresholdDialogOpen] = useState(false);
  const [selectedBin, setSelectedBin] = useState<BinData | null>(null);
  const [thresholdPercentage, setThresholdPercentage] = useState(80);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [tempAlertSettings, setTempAlertSettings] = useState<Record<number, boolean>>({});
  const [isConfirmScheduleDialogOpen, setIsConfirmScheduleDialogOpen] = useState(false);
  const [scheduleHours, setScheduleHours] = useState(24);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('24h');
  const [isEmptyConfirmDialogOpen, setIsEmptyConfirmDialogOpen] = useState(false);
  const [binToEmpty, setBinToEmpty] = useState<BinData | null>(null);
  const [showEmptySuccessMessage, setShowEmptySuccessMessage] = useState(false);
  const [emptySuccessMessage, setEmptySuccessMessage] = useState('');
  const [isEmptyAllConfirmDialogOpen, setIsEmptyAllConfirmDialogOpen] = useState(false);

  // NEW: Fetch BinStatus data from Supabase
  const fetchBinStatusData = async () => {
    setIsLoadingBinStatus(true);
    try {
      const { data, error } = await supabase
        .from('BinStatus')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching BinStatus:', error);
        toast.error('Failed to load BinStatus data');
      } else if (data) {
        setBinStatusRecords(data);
        setLastDatabaseUpdate(new Date());
      }
    } catch (err) {
      console.error('Exception fetching BinStatus:', err);
    } finally {
      setIsLoadingBinStatus(false);
    }
  };

  // NEW: Setup real-time subscription for BinStatus table
  useEffect(() => {
    fetchBinStatusData();

    const channel = supabase
      .channel('binstatus_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'BinStatus'
        },
        (payload) => {
          console.log('Real-time BinStatus update:', payload);
          setLastDatabaseUpdate(new Date());

          if (payload.eventType === 'INSERT') {
            setBinStatusRecords(prev => [payload.new as BinStatusRecord, ...prev.slice(0, 19)]);
          } else if (payload.eventType === 'UPDATE') {
            setBinStatusRecords(prev =>
              prev.map(record =>
                record.id === (payload.new as BinStatusRecord).id ? payload.new as BinStatusRecord : record
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setBinStatusRecords(prev => prev.filter(record => record.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setIsRealTimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // NEW: Get status badge based on BinStatus value
  const getBinStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('normal')) {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    } else if (statusLower.includes('full') || statusLower.includes('critical')) {
      return <Badge variant="destructive">Full</Badge>;
    } else if (statusLower.includes('warning')) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Warning</Badge>;
    } else if (statusLower.includes('maintenance')) {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Maintenance</Badge>;
    } else if (statusLower.includes('error')) {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  // NEW: Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // NEW: Get fill level color
  const getFillLevelColor = (level: number) => {
    if (level >= 90) return 'text-red-600 font-bold';
    if (level >= 75) return 'text-yellow-600 font-semibold';
    if (level >= 50) return 'text-blue-600';
    return 'text-green-600';
  };

  // Translation-aware status badge function
  const getTranslatedStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">{t('critical')}</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">{t('warning')}</Badge>;
      default:
        return <Badge className="bg-green-500 hover:bg-green-600">{t('normal')}</Badge>;
    }
  };

  const handleSetThreshold = (bin: typeof binData[0]) => {
    setSelectedBin(bin);
    setThresholdPercentage(binThresholds[bin.id] || 80);
    setIsThresholdDialogOpen(true);
  };

  const handleSaveThreshold = () => {
    if (selectedBin) {
      setBinThresholds(prev => ({
        ...prev,
        [selectedBin.id]: thresholdPercentage
      }));
      setAlertsConfigured(prev => ({
        ...prev,
        [selectedBin.id]: true
      }));
    }
    setIsThresholdDialogOpen(false);
  };

  const handleOpenAlertDialog = () => {
    setTempAlertSettings({ ...alertsConfigured });
    setIsAlertDialogOpen(true);
  };

  const handleSaveAlertSettings = () => {
    setAlertsConfigured(tempAlertSettings);
    setIsAlertDialogOpen(false);
    toast("Alert settings updated successfully");
  };

  const handleToggleBinAlert = (binId: number, enabled: boolean) => {
    setTempAlertSettings(prev => ({
      ...prev,
      [binId]: enabled
    }));
  };

  const handleSelectAllToggle = (enabled: boolean) => {
    const newSettings: Record<number, boolean> = {};
    binData.forEach(bin => {
      newSettings[bin.id] = enabled;
    });
    setTempAlertSettings(newSettings);
  };

  const isAllSelected = tempAlertSettings && Object.values(tempAlertSettings).every(enabled => enabled);
  const isNoneSelected = tempAlertSettings && Object.values(tempAlertSettings).every(enabled => !enabled);

  const handleScheduleCollection = () => {
    const hasScheduledCollection = Object.keys(scheduledCollections).length > 0;
    
    if (hasScheduledCollection) {
      setIsConfirmScheduleDialogOpen(true);
    } else {
      setIsScheduleDialogOpen(true);
    }
  };

  const handleSaveSchedule = () => {
    const newSchedule: Record<number, number> = {};
    binData.forEach(bin => {
      newSchedule[bin.id] = scheduleHours;
    });
    setScheduledCollections(newSchedule);
    setIsScheduleDialogOpen(false);
  };

  const handleConfirmScheduleChange = (shouldChange: boolean) => {
    if (shouldChange) {
      setIsConfirmScheduleDialogOpen(false);
      setIsScheduleDialogOpen(true);
    } else {
      setIsConfirmScheduleDialogOpen(false);
    }
  };

  const handleViewHistory = () => {
    setIsHistoryDialogOpen(true);
  };

  const getFilteredHistory = () => {
    const now = new Date();
    let cutoffDate = new Date();
    const historyData = getHistoryData();

    switch (historyFilter) {
      case '24h':
        cutoffDate.setHours(now.getHours() - 24);
        break;
      case '1w':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '15d':
        cutoffDate.setDate(now.getDate() - 15);
        break;
      case '1m':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      default:
        cutoffDate.setHours(now.getHours() - 24);
    }

    return historyData
      .filter(item => item.date >= cutoffDate)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionBadge = (action: string) => {
    return action === 'Emptied' ? (
      <Badge className="bg-blue-500 hover:bg-blue-600">{t('emptied')}</Badge>
    ) : (
      <Badge className="bg-green-500 hover:bg-green-600">{t('collected')}</Badge>
    );
  };

  const getBinStatusValue = (fillLevel: number) => {
    if (fillLevel >= 90) return 'critical';
    if (fillLevel >= 75) return 'warning';
    return 'normal';
  };

  const calculateVolume = (fillLevel: number) => {
    return ((fillLevel / 100) * 5).toFixed(2) + 'L';
  };

  const getBinsNeedingAttention = () => {
    const critical = binData.filter(bin => bin.status === 'critical').length;
    const warning = binData.filter(bin => bin.status === 'warning').length;
    const total = critical + warning;
    return { total, critical, warning };
  };

  const getNextScheduledEmpty = () => {
    const criticalBins = binData.filter(bin => bin.status === 'critical');
    const warningBins = binData.filter(bin => bin.status === 'warning');
    
    if (criticalBins.length > 0) {
      const mostCritical = criticalBins.reduce((prev, current) => 
        (prev.fillLevel > current.fillLevel) ? prev : current
      );
      return {
        timeframe: '15min',
        message: `${mostCritical.name} critical`,
        status: 'critical'
      };
    } else if (warningBins.length > 0) {
      const mostWarning = warningBins.reduce((prev, current) => 
        (prev.fillLevel > current.fillLevel) ? prev : current
      );
      return {
        timeframe: '2hrs',
        message: `${mostWarning.name} needs attention`,
        status: 'warning'
      };
    } else {
      return {
        timeframe: 'None',
        message: 'All bins normal',
        status: 'normal'
      };
    }
  };

  const handleEmptyBin = (bin: typeof binData[0]) => {
    setBinToEmpty(bin);
    setIsEmptyConfirmDialogOpen(true);
  };

  const handleConfirmEmpty = () => {
    if (!binToEmpty) return;

    emptyBin(binToEmpty.id);

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    setEmptySuccessMessage(`${binToEmpty.name} emptied at ${timeString} at ${binToEmpty.fillLevel}% capacity`);
    setShowEmptySuccessMessage(true);
    setIsEmptyConfirmDialogOpen(false);

    setTimeout(() => {
      setShowEmptySuccessMessage(false);
    }, 5000);

    setBinToEmpty(null);
  };

  const handleCancelEmpty = () => {
    setIsEmptyConfirmDialogOpen(false);
    setBinToEmpty(null);
  };

  const handleEmptyAllBins = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    const binsWithWaste = binData.filter(bin => bin.fillLevel > 0);
    
    if (binsWithWaste.length > 0) {
      emptyAllBins();

      const binNames = binsWithWaste.map(bin => bin.name).join(', ');
      setEmptySuccessMessage(`All bins (${binNames}) emptied at ${timeString}`);
      setShowEmptySuccessMessage(true);

      setTimeout(() => {
        setShowEmptySuccessMessage(false);
      }, 7000);
    } else {
      setEmptySuccessMessage(`All bins are already empty`);
      setShowEmptySuccessMessage(true);
      setTimeout(() => {
        setShowEmptySuccessMessage(false);
      }, 3000);
    }

    setIsEmptyAllConfirmDialogOpen(false);
  };

  const handleCancelEmptyAll = () => {
    setIsEmptyAllConfirmDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[24px]">Bin Status Monitor</h1>
          <p className="text-muted-foreground text-[15px] pr-[9px] py-[0px] mr-[11px] my-[0px] text-left">Real-time monitoring of all 4 sub-bins</p>
        </div>
        <Button onClick={() => setIsEmptyAllConfirmDialogOpen(true)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Empty All Bins
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bins Needing Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getBinsNeedingAttention().total}</div>
            <p className="text-xs text-muted-foreground">
              {getBinsNeedingAttention().critical > 0 && `${getBinsNeedingAttention().critical} critical`}
              {getBinsNeedingAttention().critical > 0 && getBinsNeedingAttention().warning > 0 && ', '}
              {getBinsNeedingAttention().warning > 0 && `${getBinsNeedingAttention().warning} warning`}
              {getBinsNeedingAttention().total === 0 && 'All bins normal'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity Used</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((binData.reduce((sum, bin) => sum + parseFloat(bin.volume.replace('L', '')), 0) / 20) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {binData.reduce((sum, bin) => sum + parseFloat(bin.volume.replace('L', '')), 0).toFixed(1)}L of 20L total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Scheduled Empty</CardTitle>
            <Clock className={`h-4 w-4 ${
              getNextScheduledEmpty().status === 'critical' ? 'text-red-500' :
              getNextScheduledEmpty().status === 'warning' ? 'text-yellow-500' :
              'text-green-500'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getNextScheduledEmpty().timeframe}</div>
            <p className="text-xs text-muted-foreground">{getNextScheduledEmpty().message}</p>
          </CardContent>
        </Card>
      </div>

      {/* Individual Bin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {binData.map((bin) => (
          <Card key={bin.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${bin.color}`}></div>
                  <div>
                    <CardTitle className="text-lg">{bin.name}</CardTitle>
                    <CardDescription>Bin #{bin.id} • Capacity: 5L</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(bin.status)}
                  {getTranslatedStatusBadge(bin.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Fill Level</span>
                  <span className="font-medium">{bin.fillLevel}%</span>
                </div>
                <Progress value={bin.fillLevel} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{bin.volume}</span>
                  <span>5.0L</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Last Emptied</p>
                  <p className="text-sm font-medium">{bin.lastEmptied}</p>
                </div>
                <Button 
                  variant={bin.fillLevel >= 90 || (alertsConfigured[bin.id] && bin.fillLevel >= binThresholds[bin.id]) ? 'destructive' : 'outline'} 
                  size="sm"
                  onClick={() => bin.fillLevel >= 90 || (alertsConfigured[bin.id] && bin.fillLevel >= binThresholds[bin.id]) ? handleEmptyBin(bin) : handleSetThreshold(bin)}
                >
                  {bin.fillLevel >= 90 || (alertsConfigured[bin.id] && bin.fillLevel >= binThresholds[bin.id])
                    ? 'Empty Now' 
                    : alertsConfigured[bin.id] 
                      ? 'Alert Set' 
                      : 'Set Alert'
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your waste collection schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={handleScheduleCollection}
            >
              <div className="text-left">
                <div className="font-medium">Schedule Collection</div>
                <div className="text-sm text-muted-foreground">Set automatic emptying times</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={handleViewHistory}
            >
              <div className="text-left">
                <div className="font-medium">View History</div>
                <div className="text-sm text-muted-foreground">Check past collection data</div>
              </div>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto p-4"
              onClick={handleOpenAlertDialog}
            >
              <div className="text-left">
                <div className="font-medium">Set Alerts</div>
                <div className="text-sm text-muted-foreground">Configure notification thresholds</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ============================== */}
      {/* NEW: SUPABASE BINSTATUS TABLE */}
      {/* ============================== */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl">Live BinStatus Database</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  Real-time data from Supabase BinStatus table
                  {isRealTimeConnected && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Wifi className="h-3 w-3 animate-pulse" />
                      <span className="text-xs font-semibold">LIVE</span>
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchBinStatusData}
              disabled={isLoadingBinStatus}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingBinStatus ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {lastDatabaseUpdate && (
            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Last updated: <strong>{lastDatabaseUpdate.toLocaleString()}</strong>
              </span>
              <Badge variant={isRealTimeConnected ? "default" : "secondary"}>
                {isRealTimeConnected ? 'Real-time Active' : 'Polling'}
              </Badge>
            </div>
          )}

          {/* Desktop Table View */}
          <div className="hidden md:block border rounded-lg overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Bin ID</TableHead>
                    <TableHead className="text-xs font-semibold">Version</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-center">SubBin 1</TableHead>
                    <TableHead className="text-xs font-semibold text-center">SubBin 2</TableHead>
                    <TableHead className="text-xs font-semibold text-center">SubBin 3</TableHead>
                    <TableHead className="text-xs font-semibold text-center">SubBin 4</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Total Fill</TableHead>
                    <TableHead className="text-xs font-semibold">User ID</TableHead>
                    <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {binStatusRecords.length > 0 ? (
                    binStatusRecords.map((record) => (
                      <TableRow key={record.id} className="hover:bg-muted/50">
                        <TableCell className="font-mono text-sm">{record.BinId}</TableCell>
                        <TableCell className="text-sm">{record.BinVersion}</TableCell>
                        <TableCell>{getBinStatusBadge(record.BinStatus)}</TableCell>
                        <TableCell className={`text-center font-semibold ${getFillLevelColor(record.SubBin1)}`}>
                          {record.SubBin1}%
                        </TableCell>
                        <TableCell className={`text-center font-semibold ${getFillLevelColor(record.SubBin2)}`}>
                          {record.SubBin2}%
                        </TableCell>
                        <TableCell className={`text-center font-semibold ${getFillLevelColor(record.SubBin3)}`}>
                          {record.SubBin3}%
                        </TableCell>
                        <TableCell className={`text-center font-semibold ${getFillLevelColor(record.SubBin4)}`}>
                          {record.SubBin4}%
                        </TableCell>
                        <TableCell className={`text-center font-bold ${getFillLevelColor(record.Total_fill_level)}`}>
                          {record.Total_fill_level}%
                        </TableCell>
                        <TableCell className="font-mono text-xs">{record.User_id}</TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatTimestamp(record.created_at)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8">
                        <div className="flex flex-col items-center gap-3">
                          <Database className="h-12 w-12 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {isLoadingBinStatus ? 'Loading BinStatus data...' : 'No BinStatus records found'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4 max-h-[500px] overflow-y-auto">
            {binStatusRecords.length > 0 ? (
              binStatusRecords.map((record) => (
                <Card key={record.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono">{record.BinId}</Badge>
                        <span className="text-xs text-muted-foreground">v{record.BinVersion}</span>
                      </div>
                      {getBinStatusBadge(record.BinStatus)}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">SubBin 1</p>
                        <p className={`text-lg font-bold ${getFillLevelColor(record.SubBin1)}`}>
                          {record.SubBin1}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">SubBin 2</p>
                        <p className={`text-lg font-bold ${getFillLevelColor(record.SubBin2)}`}>
                          {record.SubBin2}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">SubBin 3</p>
                        <p className={`text-lg font-bold ${getFillLevelColor(record.SubBin3)}`}>
                          {record.SubBin3}%
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">SubBin 4</p>
                        <p className={`text-lg font-bold ${getFillLevelColor(record.SubBin4)}`}>
                          {record.SubBin4}%
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total Fill Level</span>
                        <span className={`text-xl font-bold ${getFillLevelColor(record.Total_fill_level)}`}>
                          {record.Total_fill_level}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">User ID</span>
                        <span className="text-xs font-mono">{record.User_id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Timestamp</span>
                        <span className="text-xs">{formatTimestamp(record.created_at)}</span>
                      </div>
                      {record.ErrorCodes && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Error Codes</span>
                          <Badge variant="destructive" className="text-xs">{record.ErrorCodes}</Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {isLoadingBinStatus ? 'Loading BinStatus data...' : 'No BinStatus records found'}
                </p>
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {binStatusRecords.length > 0 && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">{binStatusRecords.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Fill Level</p>
                  <p className="text-2xl font-bold">
                    {Math.round(binStatusRecords.reduce((sum, r) => sum + r.Total_fill_level, 0) / binStatusRecords.length)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Critical Bins</p>
                  <p className="text-2xl font-bold text-red-600">
                    {binStatusRecords.filter(r => r.Total_fill_level >= 90).length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active Bins</p>
                  <p className="text-2xl font-bold text-green-600">
                    {binStatusRecords.filter(r => r.BinStatus.toLowerCase().includes('active')).length}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ALL EXISTING DIALOGS BELOW - UNCHANGED */}

      {/* Threshold Setting Dialog */}
      <Dialog open={isThresholdDialogOpen} onOpenChange={setIsThresholdDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Settings className="h-4 w-4 sm:h-5 sm:w-5" />
              Set Notification Threshold
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedBin && (
                <>
                  Configure when you want to be notified to empty <strong>{selectedBin.name}</strong> (Bin #{selectedBin.id}).
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label>Notification Percentage</Label>
              <div className="space-y-3">
                <Slider
                  value={[thresholdPercentage]}
                  onValueChange={(value) => setThresholdPercentage(value[0])}
                  max={100}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>50%</span>
                  <span className="font-medium text-foreground">{thresholdPercentage}%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold-input">Or enter exact percentage</Label>
              <Input
                id="threshold-input"
                type="number"
                min="50"
                max="100"
                value={thresholdPercentage}
                onChange={(e) => setThresholdPercentage(Math.min(100, Math.max(50, parseInt(e.target.value) || 50)))}
                className="w-full"
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                You will receive a notification when {selectedBin?.name} reaches <strong>{thresholdPercentage}%</strong> capacity 
                ({((thresholdPercentage / 100) * 5).toFixed(2)}L out of 5L).
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsThresholdDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveThreshold}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Save Threshold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Collection Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
              Schedule Collection
            </DialogTitle>
            <DialogDescription className="text-sm">
              Set how often you want to be reminded to empty your bins.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="schedule-hours">Collection Interval (hours)</Label>
              <Input
                id="schedule-hours"
                type="number"
                min="1"
                max="168"
                value={scheduleHours}
                onChange={(e) => setScheduleHours(Math.min(168, Math.max(1, parseInt(e.target.value) || 24)))}
                className="w-full"
                placeholder="24"
              />
              <p className="text-xs text-muted-foreground">
                Enter a value between 1-168 hours (1 hour to 1 week)
              </p>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                You will receive a notification every <strong>{scheduleHours} hours</strong> to empty your bins.
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsScheduleDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveSchedule}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Set Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Schedule Change Dialog */}
      <Dialog open={isConfirmScheduleDialogOpen} onOpenChange={setIsConfirmScheduleDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              Schedule Already Set
            </DialogTitle>
            <DialogDescription className="text-sm">
              You already have a collection schedule configured. Do you wish to change it?
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Current schedule: Every <strong>{Object.values(scheduledCollections)[0] || 24} hours</strong>
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => handleConfirmScheduleChange(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              No, Keep Current
            </Button>
            <Button 
              onClick={() => handleConfirmScheduleChange(true)}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Yes, Change It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-base sm:text-lg">
              <History className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="truncate">Waste Collection History</span>
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              View your past waste collection and emptying activities
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3.5">
              <div className="flex items-center gap-1.5 px-1 sm:px-3 py-0">
                <Filter className="h-4 w-4" />
                <Label className="text-sm">Filter by:</Label>
              </div>
              <Select value={historyFilter} onValueChange={setHistoryFilter}>
                <SelectTrigger className="w-full sm:w-[185px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="1w">Last 1 Week</SelectItem>
                  <SelectItem value="15d">Last 15 Days</SelectItem>
                  <SelectItem value="1m">Last 1 Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="hidden sm:block border rounded-lg max-h-[370px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[12px] py-2.5 text-center">Date & Time</TableHead>
                    <TableHead className="text-[12px] py-2.5 text-center">Action</TableHead>
                    <TableHead className="text-[12px] py-2.5 text-center">Bin</TableHead>
                    <TableHead className="text-[12px] py-2.5 text-left">Fill Level</TableHead>
                    <TableHead className="text-[12px] py-2.5 text-center">Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredHistory().length > 0 ? (
                    getFilteredHistory().map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-[13px] py-2.5 px-2">{formatDate(item.date)}</TableCell>
                        <TableCell className="py-2.5 px-2">{getActionBadge(item.action)}</TableCell>
                        <TableCell className="py-2.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px]">{item.binName}</span>
                            <span className="text-[12px] text-muted-foreground">#{item.binId}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2.5 text-center px-2">
                          <span className="text-[13px]">{item.fillLevel}%</span>
                        </TableCell>
                        <TableCell className="text-[13px] py-2.5 px-2">{item.volume}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-7">
                        <div className="flex flex-col items-center gap-1.5">
                          <History className="h-7 w-7 text-muted-foreground" />
                          <p className="text-muted-foreground text-[13px]">No history found for the selected period</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="sm:hidden space-y-3 max-h-[370px] overflow-y-auto">
              {getFilteredHistory().length > 0 ? (
                getFilteredHistory().map((item) => (
                  <div key={item.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                      {getActionBadge(item.action)}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium">{item.binName}</span>
                        <span className="text-xs text-muted-foreground ml-1">#{item.binId}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{item.fillLevel}%</span>
                        <span className="text-sm font-medium">{item.volume}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <History className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">No history found for the selected period</p>
                </div>
              )}
            </div>

            {getFilteredHistory().length > 0 && (
              <div className="bg-muted rounded-lg px-3 py-2.5">
                <p className="text-[13px] text-muted-foreground">
                  Showing <strong>{getFilteredHistory().length}</strong> entries for the selected period.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button 
              onClick={() => setIsHistoryDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty Confirmation Dialog */}
      <Dialog open={isEmptyConfirmDialogOpen} onOpenChange={setIsEmptyConfirmDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              Empty Bin Confirmation
            </DialogTitle>
            <DialogDescription className="text-sm">
              {binToEmpty && (
                <>
                  <strong>{binToEmpty.name}</strong> is <strong>{binToEmpty.fillLevel}%</strong> full. 
                  Are you sure you want to empty this bin now?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={handleCancelEmpty}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              No
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmEmpty}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Empty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Empty All Bins Confirmation Dialog */}
      <Dialog open={isEmptyAllConfirmDialogOpen} onOpenChange={setIsEmptyAllConfirmDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
              Empty All Bins Confirmation
            </DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to empty all 4 bins? This action will reset all bins to 0% capacity and add entries to your collection history.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Current bins with waste: <strong>{binData.filter(bin => bin.fillLevel > 0).length}</strong> out of 4
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={handleCancelEmptyAll}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              No, Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleEmptyAllBins}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              Yes, Empty All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Configuration Dialog */}
      <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure Alerts & Notifications
            </DialogTitle>
            <DialogDescription>
              Enable or disable alerts and notifications for each bin. When disabled, you won't receive any alerts for that bin even if it becomes full.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <Label className="font-medium">Select All</Label>
                <p className="text-sm text-muted-foreground">
                  Toggle alerts for all bins at once
                </p>
              </div>
              <Switch
                checked={isAllSelected || false}
                onCheckedChange={handleSelectAllToggle}
              />
            </div>

            <div className="space-y-3">
              <Label className="font-medium">Individual Bin Settings</Label>
              {binData.map((bin) => (
                <div key={bin.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${bin.color}`}></div>
                    <div className="space-y-1">
                      <div className="font-medium">Bin #{bin.id}</div>
                      <div className="text-sm text-muted-foreground">{bin.name}</div>
                    </div>
                  </div>
                  <Switch
                    checked={tempAlertSettings[bin.id] || false}
                    onCheckedChange={(checked) => handleToggleBinAlert(bin.id, checked)}
                  />
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAlertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAlertSettings}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Message Toast */}
      {showEmptySuccessMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 max-w-md">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{emptySuccessMessage}</span>
        </div>
      )}
    </div>
  );
}