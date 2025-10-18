import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { MapPin, Wifi, Satellite, RefreshCw, Navigation } from 'lucide-react';
import { useTranslation } from './translation-context';
import mapImage from 'figma:asset/4ecabd601eb44efbda837b5d8bd551b08faf1f08.png';

export function LocationTracker() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('2 minutes ago');

  const locationData = {
    latitude: 19.073025,
    longitude: 72.900528,
    address: t('address'),
    accuracy: '±3m',
    lastUpdate: lastUpdate,
    gpsStatus: 'connected',
    wifiStatus: 'connected',
    signalStrength: 85,
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLastUpdate('just now');
    }, 3500); // 3.5 seconds loading time
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('binLocation')}</h1>
          <p className="text-muted-foreground">{t('gpsWifiLocationMonitoring')}</p>
        </div>
        <Button onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Refreshing...' : t('refreshLocation')}
        </Button>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('gpsStatus')}</CardTitle>
            <Satellite className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{t('connected')}</div>
            <p className="text-xs text-muted-foreground">{t('signalStrengthStrong')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('wifiStatus')}</CardTitle>
            <Wifi className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Connected</div>
            <p className="text-xs text-muted-foreground">{t('networkName')}: KJSCE_SmartBin</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Location Accuracy</CardTitle>
            <Navigation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">±3m</div>
            <p className="text-xs text-muted-foreground">High precision mode</p>
          </CardContent>
        </Card>
      </div>

      {/* Current Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Current Location
            {isLoading && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-auto"></div>}
          </CardTitle>
          <CardDescription>Real-time position data from GPS and WiFi triangulation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Coordinates</label>
                  <Skeleton className="h-7 w-48" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-20" />
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Loading Map */}
              <div className="relative rounded-lg overflow-hidden h-48 border bg-muted flex items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground">Updating location...</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Coordinates</label>
                  <div className="text-lg font-mono">
                    {locationData.latitude}°N, {locationData.longitude}°E
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Address</label>
                  <div className="text-base">{locationData.address}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-center capitalize">{locationData.lastUpdate}</Badge>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              
              {/* Interactive Map */}
              <div className="relative rounded-lg overflow-hidden h-48 border">
                <iframe
                  src={`https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3771.123456789012!2d72.900528!3d19.073025!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7c8c4b8d4e4f9%3A0x1234567890abcdef!2sK.%20J.%20Somaiya%20College%20of%20Engineering!5e0!3m2!1sen!2sin!4v1234567890123!5m2!1sen!2sin`}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="KJ Somaiya College of Engineering Location"
                ></iframe>
                
                {/* Location Pin Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="bg-red-500 text-white p-2 rounded-full shadow-lg animate-pulse">
                    <MapPin className="h-4 w-4" />
                  </div>
                </div>
                
                {/* Click to Open in Maps */}
                <Button 
                  className="absolute bottom-2 right-2 h-8 px-3 text-xs"
                  variant="secondary"
                  onClick={() => window.open(`https://www.google.com/maps?q=${locationData.latitude},${locationData.longitude}`, '_blank')}
                >
                  Open in Maps
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Location History */}
      <Card>
        <CardHeader>
          <CardTitle>Location History</CardTitle>
          <CardDescription>Recent position updates and movements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: '2 minutes ago', status: 'Stationary', accuracy: '±3m' },
              { time: '15 minutes ago', status: 'Moved 5m east', accuracy: '±4m' },
              { time: '1 hour ago', status: 'Stationary', accuracy: '±2m' },
              { time: '2 hours ago', status: 'Position updated', accuracy: '±3m' },
              { time: '4 hours ago', status: 'WiFi reconnected', accuracy: '±5m' },
            ].map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">{entry.status}</p>
                    <p className="text-sm text-muted-foreground">{entry.time}</p>
                  </div>
                </div>
                <Badge variant="outline">{entry.accuracy}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>GPS Details</CardTitle>
            <CardDescription>Satellite positioning information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Satellites Connected</span>
              <span className="font-medium">12/15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Signal Quality</span>
              <span className="font-medium">Excellent</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Update Frequency</span>
              <span className="font-medium">Every 30s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Altitude</span>
              <span className="font-medium">216m</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>WiFi Details</CardTitle>
            <CardDescription>Network connectivity information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Network Name</span>
              <span className="font-medium">KJSCE_SmartBin</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Signal Strength</span>
              <span className="font-medium">-45 dBm (Strong)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Connection Type</span>
              <span className="font-medium">802.11n</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">IP Address</span>
              <span className="font-medium font-mono">192.168.1.101</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}