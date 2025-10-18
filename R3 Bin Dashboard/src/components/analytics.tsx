import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Download, TrendingUp, TrendingDown, X } from 'lucide-react';
import { useTranslation } from './translation-context';
import { toast } from 'sonner@2.0.3';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Data sets for different time periods
const analyticsData = {
  '7days': {
    kpi: {
      totalCollection: '68.6L',
      dailyAverage: '9.8L',
      efficiency: '94%',
      peakTime: '6-8PM',
      changePercent: '+15%',
      changeColor: 'text-green-600'
    },
    chartData: [
      { period: 'Mon', organic: 3.2, plastic: 2.1, paper: 1.8, metal: 0.9, total: 8.0 },
      { period: 'Tue', organic: 3.8, plastic: 2.3, paper: 2.2, metal: 1.1, total: 9.4 },
      { period: 'Wed', organic: 4.1, plastic: 1.9, paper: 2.0, metal: 0.8, total: 8.8 },
      { period: 'Thu', organic: 3.5, plastic: 2.7, paper: 1.6, metal: 1.3, total: 9.1 },
      { period: 'Fri', organic: 4.3, plastic: 3.1, paper: 2.4, metal: 1.2, total: 11.0 },
      { period: 'Sat', organic: 5.0, plastic: 2.8, paper: 3.2, metal: 1.0, total: 12.0 },
      { period: 'Sun', organic: 4.2, plastic: 2.4, paper: 2.8, metal: 0.9, total: 10.3 },
    ],
    trendsData: [
      { period: 'Week 1', volume: 180, collections: 45 },
      { period: 'Week 2', volume: 165, collections: 42 },
      { period: 'Week 3', volume: 195, collections: 48 },
      { period: 'Week 4', volume: 210, collections: 52 },
      { period: 'Week 5', volume: 225, collections: 55 },
      { period: 'Week 6', volume: 240, collections: 58 },
    ],
    usagePattern: [
      { hour: '6AM', activity: 15 },
      { hour: '9AM', activity: 45 },
      { hour: '12PM', activity: 78 },
      { hour: '3PM', activity: 62 },
      { hour: '6PM', activity: 85 },
      { hour: '9PM', activity: 40 },
      { hour: '12AM', activity: 10 },
    ],
    wasteDistribution: [
      { name: 'Organic', value: 45, color: '#10b981' },
      { name: 'Plastic', value: 25, color: '#3b82f6' },
      { name: 'Paper', value: 20, color: '#f59e0b' },
      { name: 'Metal', value: 10, color: '#ef4444' },
    ]
  },
  '30days': {
    kpi: {
      totalCollection: '285.4L',
      dailyAverage: '9.5L',
      efficiency: '92%',
      peakTime: '7-9PM',
      changePercent: '+8%',
      changeColor: 'text-green-600'
    },
    chartData: [
      { period: 'Week 1', organic: 25.6, plastic: 16.8, paper: 14.2, metal: 7.1, total: 63.7 },
      { period: 'Week 2', organic: 28.3, plastic: 18.2, paper: 15.8, metal: 8.2, total: 70.5 },
      { period: 'Week 3', organic: 31.2, plastic: 19.5, paper: 16.3, metal: 7.8, total: 74.8 },
      { period: 'Week 4', organic: 29.8, plastic: 17.9, paper: 15.1, metal: 8.5, total: 71.3 },
    ],
    trendsData: [
      { period: 'Jan', volume: 680, collections: 180 },
      { period: 'Feb', volume: 720, collections: 195 },
      { period: 'Mar', volume: 785, collections: 210 },
      { period: 'Apr', volume: 820, collections: 225 },
      { period: 'May', volume: 865, collections: 240 },
      { period: 'Jun', volume: 895, collections: 255 },
    ],
    usagePattern: [
      { hour: '6AM', activity: 45 },
      { hour: '9AM', activity: 125 },
      { hour: '12PM', activity: 210 },
      { hour: '3PM', activity: 165 },
      { hour: '6PM', activity: 235 },
      { hour: '9PM', activity: 145 },
      { hour: '12AM', activity: 35 },
    ],
    wasteDistribution: [
      { name: 'Organic', value: 42, color: '#10b981' },
      { name: 'Plastic', value: 28, color: '#3b82f6' },
      { name: 'Paper', value: 22, color: '#f59e0b' },
      { name: 'Metal', value: 8, color: '#ef4444' },
    ]
  },
  '3months': {
    kpi: {
      totalCollection: '2,456L',
      dailyAverage: '27.3L',
      efficiency: '89%',
      peakTime: '6-8PM',
      changePercent: '+12%',
      changeColor: 'text-green-600'
    },
    chartData: [
      { period: 'Month 1', organic: 285.6, plastic: 192.4, paper: 156.8, metal: 82.3, total: 717.1 },
      { period: 'Month 2', organic: 312.8, plastic: 208.7, paper: 178.2, metal: 89.6, total: 789.3 },
      { period: 'Month 3', organic: 338.2, plastic: 225.1, paper: 189.4, metal: 95.8, total: 848.5 },
    ],
    trendsData: [
      { period: 'Q1 2023', volume: 2180, collections: 680 },
      { period: 'Q2 2023', volume: 2340, collections: 725 },
      { period: 'Q3 2023', volume: 2520, collections: 780 },
      { period: 'Q4 2023', volume: 2650, collections: 825 },
      { period: 'Q1 2024', volume: 2780, collections: 875 },
      { period: 'Q2 2024', volume: 2920, collections: 920 },
    ],
    usagePattern: [
      { hour: '6AM', activity: 125 },
      { hour: '9AM', activity: 385 },
      { hour: '12PM', activity: 645 },
      { hour: '3PM', activity: 520 },
      { hour: '6PM', activity: 725 },
      { hour: '9PM', activity: 425 },
      { hour: '12AM', activity: 85 },
    ],
    wasteDistribution: [
      { name: 'Organic', value: 40, color: '#10b981' },
      { name: 'Plastic', value: 30, color: '#3b82f6' },
      { name: 'Paper', value: 22, color: '#f59e0b' },
      { name: 'Metal', value: 8, color: '#ef4444' },
    ]
  },
  'year': {
    kpi: {
      totalCollection: '12,450L',
      dailyAverage: '34.1L',
      efficiency: '91%',
      peakTime: '7-9PM',
      changePercent: '+18%',
      changeColor: 'text-green-600'
    },
    chartData: [
      { period: 'Q1', organic: 1125.6, plastic: 785.4, paper: 642.8, metal: 325.2, total: 2879.0 },
      { period: 'Q2', organic: 1234.8, plastic: 845.7, paper: 698.2, metal: 356.3, total: 3135.0 },
      { period: 'Q3', organic: 1356.2, plastic: 925.1, paper: 754.4, metal: 389.8, total: 3425.5 },
      { period: 'Q4', organic: 1485.2, plastic: 1015.1, paper: 825.4, metal: 425.8, total: 3751.5 },
    ],
    trendsData: [
      { period: '2019', volume: 8540, collections: 2680 },
      { period: '2020', volume: 9240, collections: 2925 },
      { period: '2021', volume: 10120, collections: 3180 },
      { period: '2022', volume: 10850, collections: 3425 },
      { period: '2023', volume: 11650, collections: 3675 },
      { period: '2024', volume: 12450, collections: 3920 },
    ],
    usagePattern: [
      { hour: '6AM', activity: 485 },
      { hour: '9AM', activity: 1425 },
      { hour: '12PM', activity: 2385 },
      { hour: '3PM', activity: 1925 },
      { hour: '6PM', activity: 2685 },
      { hour: '9PM', activity: 1585 },
      { hour: '12AM', activity: 285 },
    ],
    wasteDistribution: [
      { name: 'Organic', value: 38, color: '#10b981' },
      { name: 'Plastic', value: 32, color: '#3b82f6' },
      { name: 'Paper', value: 22, color: '#f59e0b' },
      { name: 'Metal', value: 8, color: '#ef4444' },
    ]
  }
};

export function Analytics() {
  const { t } = useTranslation();
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  
  // Get current data based on selected period
  const currentData = analyticsData[selectedPeriod as keyof typeof analyticsData];
  
  // Helper function to get chart titles based on period
  const getChartTitle = () => {
    switch (selectedPeriod) {
      case '7days': return 'Weekly Waste Collection by Type';
      case '30days': return 'Monthly Waste Collection by Type';
      case '3months': return 'Quarterly Waste Collection by Type';
      case 'year': return 'Annual Waste Collection by Type';
      default: return 'Waste Collection by Type';
    }
  };

  const getTrendsTitle = () => {
    switch (selectedPeriod) {
      case '7days': return '6-Week Volume Trends';
      case '30days': return '6-Month Volume Trends';
      case '3months': return 'Quarterly Volume Trends';
      case 'year': return 'Annual Volume Trends';
      default: return 'Volume Trends';
    }
  };

  const handleDownloadPdf = () => {
    setShowPdfDialog(false);
    toast.success('PDF downloaded successfully');
  };

  const handleCancelPdf = () => {
    setShowPdfDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('analytics')}</h1>
          <p className="text-muted-foreground">{t('comprehensiveWasteInsights')}</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">{t('last7Days')}</SelectItem>
              <SelectItem value="30days">{t('last30Days')}</SelectItem>
              <SelectItem value="3months">{t('last90Days')}</SelectItem>
              <SelectItem value="year">{t('thisYear')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setShowPdfDialog(true)}>
            <Download className="h-4 w-4 mr-2" />
            {t('exportData')}
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedPeriod === '7days' ? t('weeklyCollection') : 
               selectedPeriod === '30days' ? t('monthlyCollection') :
               selectedPeriod === '3months' ? t('quarterlyCollection') : t('annualCollection')}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.kpi.totalCollection}</div>
            <p className={`text-xs ${currentData.kpi.changeColor}`}>{currentData.kpi.changePercent} {t('fromLastPeriod')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dailyAverage')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.kpi.dailyAverage}</div>
            <p className="text-xs text-muted-foreground">{t('perDayThisPeriod')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('efficiencyRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.kpi.efficiency}</div>
            <p className="text-xs text-green-600">+2% improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('peakUsageTime')}</CardTitle>
            <Badge variant="outline" className="text-xs">{currentData.kpi.peakTime.split('-')[0]}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentData.kpi.peakTime}</div>
            <p className="text-xs text-muted-foreground">Highest activity period</p>
          </CardContent>
        </Card>
      </div>

      {/* Dynamic Waste Collection Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{getChartTitle()}</CardTitle>
          <CardDescription>Breakdown of waste collection by category (Liters)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={currentData.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="organic" stackId="1" stroke="#10b981" fill="#10b981" />
              <Area type="monotone" dataKey="plastic" stackId="1" stroke="#3b82f6" fill="#3b82f6" />
              <Area type="monotone" dataKey="paper" stackId="1" stroke="#f59e0b" fill="#f59e0b" />
              <Area type="monotone" dataKey="metal" stackId="1" stroke="#ef4444" fill="#ef4444" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{getTrendsTitle()}</CardTitle>
            <CardDescription>Historical waste collection volume trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={currentData.trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="volume" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hourly Usage Patterns</CardTitle>
            <CardDescription>Today's waste disposal activity throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { hour: '6AM', activity: 15 },
                { hour: '9AM', activity: 45 },
                { hour: '12PM', activity: 78 },
                { hour: '3PM', activity: 62 },
                { hour: '6PM', activity: 85 },
                { hour: '9PM', activity: 40 },
                { hour: '12AM', activity: 10 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="activity" 
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Waste Distribution and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Waste Type Distribution</CardTitle>
            <CardDescription>
              {selectedPeriod === '7days' ? 'Current week breakdown by waste category' :
               selectedPeriod === '30days' ? 'Current month breakdown by waste category' :
               selectedPeriod === '3months' ? 'Current quarter breakdown by waste category' :
               'Current year breakdown by waste category'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={currentData.wasteDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {currentData.wasteDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>Key indicators and trends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Collection Efficiency</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
                <span className="text-sm font-medium">94%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Bin Utilization</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
                <span className="text-sm font-medium">87%</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Sorting Accuracy</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-muted rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '91%' }}></div>
                </div>
                <span className="text-sm font-medium">91%</span>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Collections This Month</span>
                <span className="font-medium">158</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average Response Time</span>
                <span className="font-medium">12 minutes</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">System Uptime</span>
                <span className="font-medium text-green-600">99.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PDF Export Dialog */}
      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              PDF Export Preview
            </DialogTitle>
            <DialogDescription className="text-sm">
              Preview of your analytics report. This will be exported as a PDF document.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 bg-white text-black p-4 rounded-lg text-sm">
            {/* PDF Header - Compact */}
            <div className="text-center border-b pb-3">
              <h1 className="text-lg font-bold text-black">R3 Bin Analytics Report</h1>
              <p className="text-xs text-gray-600 mt-1">
                {selectedPeriod === '7days' ? 'Weekly Report' :
                 selectedPeriod === '30days' ? 'Monthly Report' :
                 selectedPeriod === '3months' ? 'Quarterly Report' : 'Annual Report'}
              </p>
              <p className="text-xs text-gray-500">Generated: {new Date().toLocaleDateString()}</p>
            </div>

            {/* KPI Summary - Compact Grid */}
            <div>
              <h2 className="text-base font-semibold text-black mb-2">Key Metrics</h2>
              <div className="grid grid-cols-2 gap-2">
                <div className="border rounded p-2">
                  <div className="text-xs text-gray-600">Total Collection</div>
                  <div className="text-sm font-bold text-black">{currentData.kpi.totalCollection}</div>
                </div>
                <div className="border rounded p-2">
                  <div className="text-xs text-gray-600">Daily Average</div>
                  <div className="text-sm font-bold text-black">{currentData.kpi.dailyAverage}</div>
                </div>
                <div className="border rounded p-2">
                  <div className="text-xs text-gray-600">Efficiency Rate</div>
                  <div className="text-sm font-bold text-black">{currentData.kpi.efficiency}</div>
                </div>
                <div className="border rounded p-2">
                  <div className="text-xs text-gray-600">Peak Usage</div>
                  <div className="text-sm font-bold text-black">{currentData.kpi.peakTime}</div>
                </div>
              </div>
            </div>

            {/* Waste Distribution - Compact */}
            <div>
              <h2 className="text-base font-semibold text-black mb-2">Waste Distribution</h2>
              <div className="grid grid-cols-2 gap-2">
                {currentData.wasteDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div>
                      <div className="text-xs text-gray-600">{item.name}</div>
                      <div className="text-sm font-semibold text-black">{item.value}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Summary - Simple List */}
            <div>
              <h2 className="text-base font-semibold text-black mb-2">Performance Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1 border-b text-xs">
                  <span className="text-black">Collection Efficiency</span>
                  <span className="font-semibold text-black">94%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b text-xs">
                  <span className="text-black">Bin Utilization</span>
                  <span className="font-semibold text-black">87%</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b text-xs">
                  <span className="text-black">Monthly Collections</span>
                  <span className="font-semibold text-black">158</span>
                </div>
                <div className="flex justify-between items-center py-1 text-xs">
                  <span className="text-black">System Uptime</span>
                  <span className="font-semibold text-green-600">99.8%</span>
                </div>
              </div>
            </div>

            {/* Note */}
            <div className="text-center pt-2 border-t">
              <p className="text-xs text-gray-500">
                Complete detailed data will be included in the downloaded PDF
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleCancelPdf}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDownloadPdf}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}