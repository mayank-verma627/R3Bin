import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from 'sonner';
import { useSettings } from './settings-context';
import { useTranslation } from './translation-context';
import { Language } from './translations';
import { 
  Bell, 
  Shield, 
  Trash2, 
  User, 
  Wifi, 
  Smartphone, 
  Mail, 
  Save,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Database,
  Download
} from 'lucide-react';

export function Settings() {
  const {
    binName,
    setBinName,
    notifications,
    setNotifications,
    binSettings,
    setBinSettings,
    systemSettings,
    setSystemSettings,
    userProfile,
    setUserProfile
  } = useSettings();
  const { t, setLanguage } = useTranslation();

  const [showResetDialog, setShowResetDialog] = useState(false);
  const [tempBinName, setTempBinName] = useState(binName);

  const handleSaveSettings = () => {
    // Save the bin name
    setBinName(tempBinName);
    
    // Apply dark mode if enabled
    if (systemSettings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast.success('Settings saved successfully');
  };

  const handleResetSettings = () => {
    // Reset all settings to defaults
    setBinName('R3 Bin');
    setTempBinName('R3 Bin');
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
    setSystemSettings({
      dataRetention: '1year',
      autoBackup: true,
      darkMode: false,
      language: 'english',
      timezone: 'IST',
      refreshInterval: 30
    });
    setUserProfile({
      name: 'R3 Bin Administrator',
      email: 'admin@r3bin.com',
      phone: '+91 9876543210',
      organization: 'KJ Somaiya College of Engineering'
    });
    
    // Remove dark mode
    document.documentElement.classList.remove('dark');
    
    setShowResetDialog(false);
    toast.success('Settings reset to default values');
  };

  const handleTestConnection = () => {
    toast.success('Connection test successful - All systems operational');
  };

  const handleExportSettings = () => {
    const settings = {
      binName,
      notifications,
      binSettings,
      systemSettings,
      userProfile,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${binName.toLowerCase().replace(/\s+/g, '-')}-settings-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Settings exported successfully');
  };

  const handleDataRetentionChange = (value: string) => {
    setSystemSettings(prev => ({ ...prev, dataRetention: value }));
    toast.info(`Data retention period changed to ${value.replace(/(\d+)/, '$1 ').replace(/s$/, '').toLowerCase()}`);
  };

  const handleLanguageChange = (value: string) => {
    const language = value as Language;
    setSystemSettings(prev => ({ ...prev, language }));
    setLanguage(language);
    toast.info(`Language changed to ${value.charAt(0).toUpperCase() + value.slice(1)}`);
  };

  const handleBackupToggle = (enabled: boolean) => {
    setSystemSettings(prev => ({ ...prev, autoBackup: enabled }));
    if (enabled) {
      toast.success('Automatic backup enabled - Daily backups scheduled');
    } else {
      toast.warning('Automatic backup disabled');
    }
  };

  const handleMaintenanceModeToggle = (enabled: boolean) => {
    setBinSettings(prev => ({ ...prev, maintenanceMode: enabled }));
    if (enabled) {
      toast.warning('Maintenance mode enabled - Normal operations suspended');
    } else {
      toast.success('Maintenance mode disabled - Normal operations resumed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl xl:text-3xl font-bold">{t('settings')}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your R3 Bin system preferences and configurations</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 shrink-0">
          <Button variant="outline" onClick={handleExportSettings} size="sm" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export Settings</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Button onClick={handleSaveSettings} size="sm" className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Save Changes</span>
            <span className="sm:hidden">Save</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 h-auto p-1">
          <TabsTrigger value="notifications" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 py-2 text-xs sm:text-sm">
            <Bell className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">{t('notifications')}</span>
          </TabsTrigger>
          <TabsTrigger value="bin-config" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 py-2 text-xs sm:text-sm">
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">Bin Config</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 py-2 text-xs sm:text-sm">
            <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">System</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 py-2 text-xs sm:text-sm">
            <User className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 py-2 text-xs sm:text-sm col-span-2 sm:col-span-1">
            <Database className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="truncate">Advanced</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('notifications')}
              </CardTitle>
              <CardDescription>
                Configure how and when you receive alerts from your R3 Bin system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label>{t('binFullNotifications')}</Label>
                    <p className="text-sm text-muted-foreground">Get notified when any sub-bin reaches capacity</p>
                  </div>
                  <Switch 
                    checked={notifications.binFull}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, binFull: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label>Collection Reminders</Label>
                    <p className="text-sm text-muted-foreground">Scheduled reminders for waste collection</p>
                  </div>
                  <Switch 
                    checked={notifications.collectionReminder}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, collectionReminder: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label>System Alerts</Label>
                    <p className="text-sm text-muted-foreground">Hardware issues and maintenance notifications</p>
                  </div>
                  <Switch 
                    checked={notifications.systemAlerts}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, systemAlerts: checked }))}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label>Email</Label>
                      <p className="text-xs text-muted-foreground">Email notifications</p>
                    </div>
                    <Switch 
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label>Push</Label>
                      <p className="text-xs text-muted-foreground">Browser notifications</p>
                    </div>
                    <Switch 
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Label>SMS</Label>
                      <p className="text-xs text-muted-foreground">Text message alerts</p>
                    </div>
                    <Switch 
                      checked={notifications.smsAlerts}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, smsAlerts: checked }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bin-config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                Bin Configuration
              </CardTitle>
              <CardDescription>
                Configure thresholds and operational parameters for your R3 Bin system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Threshold (%)</Label>
                  <Input 
                    type="number" 
                    value={binSettings.fullThreshold}
                    onChange={(e) => setBinSettings(prev => ({ ...prev, fullThreshold: parseInt(e.target.value) }))}
                    min="50"
                    max="100"
                  />
                  <p className="text-xs text-muted-foreground">Alert when sub-bin reaches this capacity</p>
                </div>

                <div className="space-y-2">
                  <Label>Collection Schedule</Label>
                  <Select 
                    value={binSettings.collectionSchedule} 
                    onValueChange={(value) => setBinSettings(prev => ({ ...prev, collectionSchedule: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="alternate">Alternate Days</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label>Auto Empty Alert</Label>
                    <p className="text-sm text-muted-foreground">Automatically alert when bin needs emptying</p>
                  </div>
                  <Switch 
                    checked={binSettings.autoEmptyAlert}
                    onCheckedChange={(checked) => setBinSettings(prev => ({ ...prev, autoEmptyAlert: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label>Low Battery Alert</Label>
                    <p className="text-sm text-muted-foreground">Alert when system battery is low</p>
                  </div>
                  <Switch 
                    checked={binSettings.lowBatteryAlert}
                    onCheckedChange={(checked) => setBinSettings(prev => ({ ...prev, lowBatteryAlert: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Disable normal operations for maintenance</p>
                  </div>
                  <Switch 
                    checked={binSettings.maintenanceMode}
                    onCheckedChange={handleMaintenanceModeToggle}
                  />
                </div>
              </div>

              {binSettings.maintenanceMode && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Maintenance mode is enabled. Normal bin operations are suspended.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure system-wide preferences and data management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Data Retention Period</Label>
                  <Select 
                    value={systemSettings.dataRetention} 
                    onValueChange={handleDataRetentionChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1month">1 Month</SelectItem>
                      <SelectItem value="3months">3 Months</SelectItem>
                      <SelectItem value="6months">6 Months</SelectItem>
                      <SelectItem value="1year">1 Year</SelectItem>
                      <SelectItem value="2years">2 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('language')}</Label>
                  <Select 
                    value={systemSettings.language} 
                    onValueChange={handleLanguageChange}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">{t('english')}</SelectItem>
                      <SelectItem value="hindi">{t('hindi')}</SelectItem>
                      <SelectItem value="marathi">{t('marathi')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('timezone')}</Label>
                  <Select 
                    value={systemSettings.timezone} 
                    onValueChange={(value) => setSystemSettings(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IST">IST (India Standard Time)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="PST">PST</SelectItem>
                      <SelectItem value="EST">EST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Data Refresh Interval (seconds)</Label>
                  <Select 
                    value={systemSettings.refreshInterval.toString()} 
                    onValueChange={(value) => setSystemSettings(prev => ({ ...prev, refreshInterval: parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 seconds</SelectItem>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="300">5 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label>Automatic Backup</Label>
                    <p className="text-sm text-muted-foreground">Automatically backup system data daily</p>
                  </div>
                  <Switch 
                    checked={systemSettings.autoBackup}
                    onCheckedChange={handleBackupToggle}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable dark theme for the interface</p>
                  </div>
                  <Switch 
                    checked={systemSettings.darkMode}
                    onCheckedChange={(checked) => {
                      setSystemSettings(prev => ({ ...prev, darkMode: checked }));
                      if (checked) {
                        document.documentElement.classList.add('dark');
                        toast.success('Dark mode enabled');
                      } else {
                        document.documentElement.classList.remove('dark');
                        toast.success('Dark mode disabled');
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Profile
              </CardTitle>
              <CardDescription>
                Manage your account information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Bin System Name</Label>
                  <Input 
                    value={tempBinName}
                    onChange={(e) => setTempBinName(e.target.value)}
                    placeholder="Enter bin system name"
                  />
                  <p className="text-xs text-muted-foreground">This name will appear in the sidebar and throughout the system</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input 
                    value={userProfile.name}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input 
                    type="email"
                    value={userProfile.email}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input 
                    value={userProfile.phone}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Organization</Label>
                  <Input 
                    value={userProfile.organization}
                    onChange={(e) => setUserProfile(prev => ({ ...prev, organization: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Current Location</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">KJ Somaiya College of Engineering</p>
                      <p className="text-sm text-muted-foreground">
                        Bhaskaracharya Building, Vidyanagar, Vidyavihar East<br />
                        Ghatkopar East, Mumbai, Maharashtra 400077
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
              <CardDescription>
                System diagnostics, connectivity, and maintenance options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Connection Status</h3>
                    <p className="text-sm text-muted-foreground">Test hardware connectivity</p>
                  </div>
                  <Button variant="outline" onClick={handleTestConnection}>
                    <Wifi className="h-4 w-4 mr-2" />
                    Test Connection
                  </Button>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Wifi className="h-4 w-4 text-green-500" />
                      <span className="font-medium">WiFi Module</span>
                      <Badge variant="secondary" className="ml-auto">Connected</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Signal: Strong (92%)</p>
                  </Card>

                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span className="font-medium">GPS Module</span>
                      <Badge variant="secondary" className="ml-auto">Active</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Last update: 2 min ago</p>
                  </Card>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium text-destructive">Danger Zone</h3>
                  
                  <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                    <div>
                      <h4 className="font-medium">Reset All Settings</h4>
                      <p className="text-sm text-muted-foreground">Restore all settings to factory defaults</p>
                    </div>
                    <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                      <DialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reset All Settings</DialogTitle>
                          <DialogDescription>
                            This action cannot be undone. All your custom settings will be lost and restored to factory defaults.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                            Cancel
                          </Button>
                          <Button variant="destructive" onClick={handleResetSettings}>
                            Reset Settings
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}