import { CapacitorConfig } from '@capacitor/core';

const config: CapacitorConfig = {
  appId: 'app.lovable.6f36d414fe6e4858b9611f28fc3a3a07',
  appName: 'Fetal Tracker',
  webDir: 'dist',
  server: {
    url: 'https://6f36d414-fe6e-4858-b961-1f28fc3a3a07.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: 'Scanning for devices...',
        cancel: 'Cancel',
        availableDevices: 'Available devices',
        noDeviceFound: 'No device found'
      }
    }
  }
};

export default config;
