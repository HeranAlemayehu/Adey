import { useEffect, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { toast } from 'sonner';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  contact_type: string;
}

interface MonitoringConfig {
  kickCountMin: number;
  kickCountMax: number;
  enabled: boolean;
}

export const useEmergencyMonitoring = (
  kickCount: number,
  contacts: EmergencyContact[],
  config: MonitoringConfig = { kickCountMin: 10, kickCountMax: 50, enabled: true }
) => {
  const lastAlertTime = useRef<number>(0);
  const ALERT_COOLDOWN = 5 * 60 * 1000; // 5 minutes between alerts

  useEffect(() => {
    const checkAndAlert = async () => {
      if (!config.enabled || contacts.length === 0) return;

      const now = Date.now();
      const timeSinceLastAlert = now - lastAlertTime.current;

      // Check if kick count is outside safe range
      const isAbnormal = kickCount < config.kickCountMin || kickCount > config.kickCountMax;
      
      if (isAbnormal && timeSinceLastAlert > ALERT_COOLDOWN) {
        lastAlertTime.current = now;
        
        const alertType = kickCount < config.kickCountMin ? 'LOW' : 'HIGH';
        const message = `Kick count is ${alertType}: ${kickCount}. Contact: ${contacts[0].name}`;

        // Request notification permissions
        try {
          const permission = await LocalNotifications.requestPermissions();
          
          if (permission.display === 'granted') {
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: '⚠️ Emergency Alert',
                  body: message,
                  id: Math.floor(Math.random() * 10000),
                  schedule: { at: new Date(Date.now() + 1000) },
                  sound: 'default',
                  attachments: [],
                  actionTypeId: '',
                  extra: null,
                }
              ]
            });
          }
        } catch (error) {
          console.error('Notification error:', error);
        }

        // Show toast notification
        toast.error(`Abnormal kick count detected: ${kickCount}`, {
          description: `Calling ${contacts[0].name}...`,
          duration: 10000,
        });

        // Initiate phone call to first emergency contact
        const primaryContact = contacts[0];
        if (primaryContact?.phone) {
          // Use tel: protocol to initiate call
          window.location.href = `tel:${primaryContact.phone}`;
        }
      }
    };

    checkAndAlert();
  }, [kickCount, contacts, config]);
};
