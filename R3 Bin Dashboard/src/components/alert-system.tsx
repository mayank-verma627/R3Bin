import { useEffect, useState } from 'react';
import { toast } from "sonner@2.0.3";
import { useBinData } from './bin-data-context';
import { useSettings } from './settings-context';
import { useTranslation } from './translation-context';
import { AlertTriangle, Trash2, Clock } from 'lucide-react';

export function AlertSystem() {
  const { binData, binThresholds, alertsConfigured } = useBinData();
  const { notifications } = useSettings();
  const { t } = useTranslation();
  const [lastAlertTimes, setLastAlertTimes] = useState<Record<number, number>>({});
  const [hasShownInitialAlerts, setHasShownInitialAlerts] = useState(false);

  useEffect(() => {
    // Don't show alerts immediately on mount, wait a bit for the app to load
    const initialDelay = setTimeout(() => {
      setHasShownInitialAlerts(true);
      checkAndShowAlerts();
    }, 2000);

    return () => clearTimeout(initialDelay);
  }, []);

  useEffect(() => {
    if (!hasShownInitialAlerts) return;
    
    // Check for alerts whenever bin data changes
    checkAndShowAlerts();
  }, [binData, binThresholds, alertsConfigured, notifications, hasShownInitialAlerts]);

  const checkAndShowAlerts = () => {
    const now = Date.now();
    const ALERT_COOLDOWN = 10 * 60 * 1000; // 10 minutes cooldown between same alert

    binData.forEach(bin => {
      if (!notifications.binFull && !notifications.systemAlerts) return;

      const lastAlertTime = lastAlertTimes[bin.id] || 0;
      const timeSinceLastAlert = now - lastAlertTime;

      // Skip if alert was shown recently
      if (timeSinceLastAlert < ALERT_COOLDOWN) return;

      // Critical level alert (90% or above)
      if (bin.fillLevel >= 90) {
        showCriticalAlert(bin);
        setLastAlertTimes(prev => ({ ...prev, [bin.id]: now }));
      }
      // Threshold-based alert (if configured and reached)
      else if (alertsConfigured[bin.id] && bin.fillLevel >= binThresholds[bin.id]) {
        showThresholdAlert(bin);
        setLastAlertTimes(prev => ({ ...prev, [bin.id]: now }));
      }
      // Warning level alert (75-89%)
      else if (bin.fillLevel >= 75 && bin.fillLevel < 90) {
        showWarningAlert(bin);
        setLastAlertTimes(prev => ({ ...prev, [bin.id]: now }));
      }
    });

    // System-wide alerts
    checkSystemAlerts();
  };

  const showCriticalAlert = (bin: typeof binData[0]) => {
    toast.error(
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">{t('criticalBinAlert', { binName: bin.name })}</div>
          <div className="text-sm opacity-90">
            {t('criticalBinMessage', { fillLevel: bin.fillLevel, volume: bin.volume })}
          </div>
        </div>
      </div>,
      {
        duration: 8000,
        action: {
          label: t('emptyNow'),
          onClick: () => {
            // You could add a callback here to trigger empty bin dialog
            console.log(`Emergency empty for ${bin.name}`);
          },
        },
      }
    );
  };

  const showThresholdAlert = (bin: typeof binData[0]) => {
    toast.warning(
      <div className="flex items-start gap-3">
        <Trash2 className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Threshold Reached: {bin.name}</div>
          <div className="text-sm opacity-90">
            {bin.fillLevel}% full - Your set threshold of {binThresholds[bin.id]}% has been reached
          </div>
        </div>
      </div>,
      {
        duration: 6000,
      }
    );
  };

  const showWarningAlert = (bin: typeof binData[0]) => {
    toast.warning(
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold">Warning: {bin.name}</div>
          <div className="text-sm opacity-90">
            {bin.fillLevel}% full ({bin.volume}) - Consider emptying soon
          </div>
        </div>
      </div>,
      {
        duration: 5000,
      }
    );
  };

  const checkSystemAlerts = () => {
    if (!notifications.systemAlerts) return;

    const criticalBins = binData.filter(bin => bin.fillLevel >= 90);
    const warningBins = binData.filter(bin => bin.fillLevel >= 75 && bin.fillLevel < 90);
    
    // Show system-wide alert if multiple bins need attention
    if (criticalBins.length > 1) {
      const lastSystemAlert = lastAlertTimes['system-critical'] || 0;
      const timeSinceLastSystemAlert = Date.now() - lastSystemAlert;
      
      if (timeSinceLastSystemAlert > 15 * 60 * 1000) { // 15 minutes cooldown
        toast.error(
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">Multiple Critical Bins!</div>
              <div className="text-sm opacity-90">
                {criticalBins.length} bins need immediate attention
              </div>
            </div>
          </div>,
          {
            duration: 10000,
            action: {
              label: "View Status",
              onClick: () => {
                // Could trigger navigation to bin status page
                console.log("Navigate to bin status");
              },
            },
          }
        );
        setLastAlertTimes(prev => ({ ...prev, 'system-critical': Date.now() }));
      }
    }

    // Collection reminder based on time
    if (notifications.collectionReminder) {
      const binsNeedingCollection = binData.filter(bin => 
        bin.lastEmptied.includes('hours') && 
        parseInt(bin.lastEmptied.split(' ')[0]) >= 6
      );

      if (binsNeedingCollection.length > 0) {
        const lastCollectionReminder = lastAlertTimes['collection-reminder'] || 0;
        const timeSinceLastReminder = Date.now() - lastCollectionReminder;
        
        if (timeSinceLastReminder > 2 * 60 * 60 * 1000) { // 2 hours cooldown
          toast.info(
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Collection Reminder</div>
                <div className="text-sm opacity-90">
                  {binsNeedingCollection.length} bins haven't been emptied in 6+ hours
                </div>
              </div>
            </div>,
            {
              duration: 6000,
            }
          );
          setLastAlertTimes(prev => ({ ...prev, 'collection-reminder': Date.now() }));
        }
      }
    }
  };

  // This component doesn't render anything visible
  return null;
}