import { useState, useCallback } from 'react';
import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';

export interface DeviceReading {
  temperature: number;
  kickCount: number;
  heartbeat: number;
}

export const useBluetooth = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<BleDevice[]>([]);
  const [currentReading, setCurrentReading] = useState<DeviceReading>({
    temperature: 0,
    kickCount: 0,
    heartbeat: 0,
  });

  const initializeBluetooth = useCallback(async () => {
    try {
      await BleClient.initialize();
      return true;
    } catch (error) {
      console.error('Failed to initialize Bluetooth:', error);
      return false;
    }
  }, []);

  const scanForDevices = useCallback(async () => {
    setIsScanning(true);
    setDiscoveredDevices([]);
    const devices: BleDevice[] = [];
    
    try {
      await BleClient.requestLEScan(
        { services: [] },
        (result) => {
          // Add device if not already in the list and has a name
          if (result.device.name && !devices.find(d => d.deviceId === result.device.deviceId)) {
            devices.push(result.device);
            setDiscoveredDevices([...devices]);
          }
        }
      );

      // Stop scanning after 10 seconds
      setTimeout(async () => {
        await BleClient.stopLEScan();
        setIsScanning(false);
      }, 10000);
    } catch (error) {
      console.error('Scan failed:', error);
      setIsScanning(false);
    }
  }, []);

  const connectToDevice = useCallback(async (id: string, name: string) => {
    try {
      await BleClient.stopLEScan();
      setIsScanning(false);
      
      await BleClient.connect(id, () => {
        console.log('Device disconnected');
        setIsConnected(false);
        setDeviceId(null);
        setDeviceName(null);
      });
      setIsConnected(true);
      setDeviceId(id);
      setDeviceName(name);
      setDiscoveredDevices([]);
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      return false;
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (deviceId) {
      try {
        await BleClient.disconnect(deviceId);
        setIsConnected(false);
        setDeviceId(null);
        setDeviceName(null);
      } catch (error) {
        console.error('Disconnect failed:', error);
      }
    }
  }, [deviceId]);

  const readData = useCallback(async () => {
    if (!deviceId || !isConnected) return null;

    try {
      // These UUIDs should match your Arduino device's characteristics
      // This is a placeholder - update with actual UUIDs from your device
      const SERVICE_UUID = '0000180f-0000-1000-8000-00805f9b34fb';
      const TEMP_CHARACTERISTIC = '00002a19-0000-1000-8000-00805f9b34fb';
      const KICK_CHARACTERISTIC = '00002a1a-0000-1000-8000-00805f9b34fb';
      const HEART_CHARACTERISTIC = '00002a1b-0000-1000-8000-00805f9b34fb';

      // Read characteristics from the device
      // Note: You'll need to implement actual data parsing based on your Arduino's data format
      const reading: DeviceReading = {
        temperature: Math.random() * 2 + 36, // Placeholder
        kickCount: Math.floor(Math.random() * 10),
        heartbeat: Math.floor(Math.random() * 20 + 120),
      };

      setCurrentReading(reading);
      return reading;
    } catch (error) {
      console.error('Read failed:', error);
      return null;
    }
  }, [deviceId, isConnected]);

  return {
    isConnected,
    isScanning,
    deviceId,
    deviceName,
    discoveredDevices,
    currentReading,
    initializeBluetooth,
    scanForDevices,
    connectToDevice,
    disconnect,
    readData,
  };
};
