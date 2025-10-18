import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Database, Wifi, WifiOff, RefreshCw, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
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

export function DatabaseView() {
  const [binStatusRecords, setBinStatusRecords] = useState<BinStatusRecord[]>([]);
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [lastDatabaseUpdate, setLastDatabaseUpdate] = useState<Date | null>(null);
  const [isLoadingBinStatus, setIsLoadingBinStatus] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Fetch BinStatus data from Supabase
  const fetchBinStatusData = async () => {
    console.log('🔄 Fetching BinStatus data...');
    setIsLoadingBinStatus(true);
    try {
      const { data, error } = await supabase
        .from('BinStatus')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching BinStatus:', error);
        console.error('Error details:', error.message, error.details, error.hint);
      } else if (data) {
        console.log('✅ BinStatus data fetched:', data.length, 'records');
        console.log('First record:', data[0]);
        setBinStatusRecords(data);
        setLastDatabaseUpdate(new Date());
      } else {
        console.log('⚠️ No data returned from Supabase');
      }
    } catch (err) {
      console.error('💥 Exception fetching BinStatus:', err);
    } finally {
      setIsLoadingBinStatus(false);
    }
  };

  // Setup real-time subscription for BinStatus table
  useEffect(() => {
    console.log('🚀 DatabaseView: Component mounted, fetching initial data...');
    fetchBinStatusData();

    console.log('📡 Setting up real-time subscription...');
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
          console.log('🔔 Real-time BinStatus update:', payload);
          setLastDatabaseUpdate(new Date());

          if (payload.eventType === 'INSERT') {
            console.log('➕ INSERT event - adding new record');
            setBinStatusRecords(prev => [payload.new as BinStatusRecord, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            console.log('✏️ UPDATE event - updating record');
            setBinStatusRecords(prev =>
              prev.map(record =>
                record.id === (payload.new as BinStatusRecord).id ? payload.new as BinStatusRecord : record
              )
            );
          } else if (payload.eventType === 'DELETE') {
            console.log('🗑️ DELETE event - removing record');
            setBinStatusRecords(prev => prev.filter(record => record.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe((status) => {
        console.log('📊 Subscription status:', status);
        setIsRealTimeConnected(status === 'SUBSCRIBED');
      });

    return () => {
      console.log('🧹 Cleaning up subscription...');
      supabase.removeChannel(channel);
    };
  }, []);

  // Get status badge with color
  const getBinStatusBadge = (status: string) => {
    const statusUpper = status.toUpperCase();
    if (statusUpper === 'ACTIVE') {
      return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
    } else if (statusUpper === 'FULL') {
      return <Badge variant="destructive">Full</Badge>;
    } else if (statusUpper === 'INACTIVE') {
      return <Badge variant="secondary">Inactive</Badge>;
    } else if (statusUpper === 'MAINTENANCE') {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Maintenance</Badge>;
    } else if (statusUpper === 'ERROR') {
      return <Badge variant="destructive">Error</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  // Format timestamp
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

  // Get fill level color
  const getFillLevelColor = (level: number) => {
    if (level >= 90) return 'text-red-600 font-bold';
    if (level >= 75) return 'text-yellow-600 font-semibold';
    if (level >= 50) return 'text-blue-600';
    return 'text-green-600';
  };

  // Filter and sort records
  const getFilteredAndSortedRecords = () => {
    let filtered = binStatusRecords;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(record => 
        record.BinStatus.toUpperCase() === statusFilter.toUpperCase()
      );
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(record =>
        record.BinId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.User_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.BinVersion.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: any = a[sortColumn as keyof BinStatusRecord];
      let bValue: any = b[sortColumn as keyof BinStatusRecord];

      // Handle null values
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Convert to comparable values
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const filteredRecords = getFilteredAndSortedRecords();

  // Calculate statistics
  const stats = {
    total: binStatusRecords.length,
    active: binStatusRecords.filter(r => r.BinStatus.toUpperCase() === 'ACTIVE').length,
    full: binStatusRecords.filter(r => r.BinStatus.toUpperCase() === 'FULL').length,
    critical: binStatusRecords.filter(r => r.Total_fill_level >= 90).length,
    avgFill: binStatusRecords.length > 0 
      ? Math.round(binStatusRecords.reduce((sum, r) => sum + r.Total_fill_level, 0) / binStatusRecords.length)
      : 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            BinStatus Database
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time database monitoring • Live Supabase connection
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isRealTimeConnected ? (
            <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-2">
              <Wifi className="h-3 w-3 animate-pulse" />
              LIVE
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-2">
              <WifiOff className="h-3 w-3" />
              Offline
            </Badge>
          )}
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
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total Records</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Active Bins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{stats.full}</div>
            <p className="text-xs text-muted-foreground">Full Bins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">Critical (90%+)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.avgFill}%</div>
            <p className="text-xs text-muted-foreground">Avg Fill Level</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by Bin ID, User ID, or Version..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="FULL">Full</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="ERROR">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Last Update Info */}
      {lastDatabaseUpdate && (
        <div className="p-3 bg-muted rounded-lg flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Last updated: <strong>{lastDatabaseUpdate.toLocaleString()}</strong>
          </span>
          <span className="text-muted-foreground">
            Showing <strong>{filteredRecords.length}</strong> of <strong>{binStatusRecords.length}</strong> records
          </span>
        </div>
      )}

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-1">
                      ID
                      {sortColumn === 'id' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('BinId')}
                  >
                    <div className="flex items-center gap-1">
                      Bin ID
                      {sortColumn === 'BinId' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('BinStatus')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortColumn === 'BinStatus' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-center">SubBin 1</TableHead>
                  <TableHead className="text-center">SubBin 2</TableHead>
                  <TableHead className="text-center">SubBin 3</TableHead>
                  <TableHead className="text-center">SubBin 4</TableHead>
                  <TableHead 
                    className="text-center cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('Total_fill_level')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Total Fill
                      {sortColumn === 'Total_fill_level' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Error Codes</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      Timestamp
                      {sortColumn === 'created_at' && (
                        sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{record.id}</TableCell>
                      <TableCell className="font-mono text-sm font-semibold">{record.BinId}</TableCell>
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
                      <TableCell className={`text-center font-bold text-lg ${getFillLevelColor(record.Total_fill_level)}`}>
                        {record.Total_fill_level}%
                      </TableCell>
                      <TableCell>
                        {record.ErrorCodes ? (
                          <Badge variant="destructive" className="text-xs">{record.ErrorCodes}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{record.User_id}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(record.created_at)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Database className="h-16 w-16 text-muted-foreground" />
                        <p className="text-muted-foreground text-lg">
                          {isLoadingBinStatus ? 'Loading BinStatus data...' : 'No records found'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <Card key={record.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono font-semibold">{record.BinId}</Badge>
                    <span className="text-xs text-muted-foreground">v{record.BinVersion}</span>
                  </div>
                  {getBinStatusBadge(record.BinStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">SubBin 1</p>
                    <p className={`text-xl font-bold ${getFillLevelColor(record.SubBin1)}`}>
                      {record.SubBin1}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">SubBin 2</p>
                    <p className={`text-xl font-bold ${getFillLevelColor(record.SubBin2)}`}>
                      {record.SubBin2}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">SubBin 3</p>
                    <p className={`text-xl font-bold ${getFillLevelColor(record.SubBin3)}`}>
                      {record.SubBin3}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">SubBin 4</p>
                    <p className={`text-xl font-bold ${getFillLevelColor(record.SubBin4)}`}>
                      {record.SubBin4}%
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total Fill Level</span>
                    <span className={`text-2xl font-bold ${getFillLevelColor(record.Total_fill_level)}`}>
                      {record.Total_fill_level}%
                    </span>
                  </div>
                  {record.ErrorCodes && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Error Codes</span>
                      <Badge variant="destructive" className="text-xs">{record.ErrorCodes}</Badge>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">User ID</span>
                    <span className="text-xs font-mono">{record.User_id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Record ID</span>
                    <span className="text-xs font-mono">#{record.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Timestamp</span>
                    <span className="text-xs">{formatTimestamp(record.created_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {isLoadingBinStatus ? 'Loading BinStatus data...' : 'No records found'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}