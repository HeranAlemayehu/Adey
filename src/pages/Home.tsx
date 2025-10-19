import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Calendar as CalendarIcon, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useBluetooth } from '@/hooks/useBluetooth';
import { useEmergencyMonitoring } from '@/hooks/useEmergencyMonitoring';
import PregnancyHeader from '@/components/PregnancyHeader';
import BluetoothStatus from '@/components/BluetoothStatus';
import ReadingCard from '@/components/ReadingCard';
import DailyNoteInput from '@/components/DailyNoteInput';
import Layout from '@/components/Layout';

const Home = () => {
  const navigate = useNavigate();
  const [pregnancyInfo, setPregnancyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  
  const {
    isConnected,
    isScanning,
    deviceName,
    discoveredDevices,
    currentReading,
    initializeBluetooth,
    scanForDevices,
    connectToDevice,
    disconnect,
    readData,
  } = useBluetooth();

  // Monitor kick count and trigger emergency alerts
  useEmergencyMonitoring(currentReading.kickCount, emergencyContacts, {
    kickCountMin: 10,
    kickCountMax: 50,
    enabled: monitoringEnabled && isConnected,
  });

  useEffect(() => {
    checkAuth();
    loadPregnancyInfo();
    loadEmergencyContacts();
    initializeBluetooth();
  }, []);

  // Poll for readings when connected
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        readData();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, readData]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const loadPregnancyInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('pregnancy_info')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading pregnancy info:', error);
        return;
      }

      if (data) {
        setPregnancyInfo(data);
      } else {
        // If no pregnancy info, redirect to setup
        navigate('/setup');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmergencyContacts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', user.id)
        .order('contact_type', { ascending: true });

      if (data) {
        setEmergencyContacts(data);
      }

      // Load monitoring settings
      const { data: settingsData } = await supabase
        .from('user_settings')
        .select('emergency_monitoring_enabled')
        .eq('user_id', user.id)
        .single();

      if (settingsData) {
        setMonitoringEnabled(settingsData.emergency_monitoring_enabled ?? true);
      }
    } catch (error) {
      console.error('Error loading emergency contacts:', error);
    }
  };

  const handleSaveNote = async (note: string, mood: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('daily_notes')
        .upsert({
          user_id: user.id,
          date: today,
          notes: note,
          mood: mood,
        }, {
          onConflict: 'user_id,date'
        });

      if (error) throw error;

      toast.success('Note saved successfully!');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    }
  };

  const handleScan = async () => {
    const initialized = await initializeBluetooth();
    if (initialized) {
      await scanForDevices();
      toast.info('Scanning for devices...');
    } else {
      toast.error('Failed to initialize Bluetooth');
    }
  };

  const handleDeviceSelect = async (deviceId: string, deviceName: string) => {
    const connected = await connectToDevice(deviceId, deviceName);
    if (connected) {
      toast.success(`Connected to ${deviceName}`);
    } else {
      toast.error('Failed to connect to device');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-pulse text-primary">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!pregnancyInfo) {
    return null;
  }

  return (
    <Layout>
      <PregnancyHeader
        pregnancyStartDate={new Date(pregnancyInfo.pregnancy_start_date)}
        dueDate={new Date(pregnancyInfo.due_date)}
      />

      <BluetoothStatus
        isConnected={isConnected}
        isScanning={isScanning}
        deviceName={deviceName}
        discoveredDevices={discoveredDevices}
        onScan={handleScan}
        onDisconnect={disconnect}
        onDeviceSelect={handleDeviceSelect}
      />

      <div className="my-6">
        <h2 className="text-xl font-bold text-foreground mb-4">Current Readings</h2>
        <ReadingCard
          icon={<Activity className="w-5 h-5" />}
          label="Kick Count"
          value={currentReading.kickCount}
          unit="kicks"
        />
      </div>

      <DailyNoteInput onSave={handleSaveNote} />

    </Layout>
  );
};

export default Home;
