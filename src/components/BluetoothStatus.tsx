import { Bluetooth, BluetoothConnected, BluetoothSearching } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { BleDevice } from '@capacitor-community/bluetooth-le';

interface BluetoothStatusProps {
  isConnected: boolean;
  isScanning: boolean;
  deviceName: string | null;
  discoveredDevices: BleDevice[];
  onScan: () => void;
  onDisconnect: () => void;
  onDeviceSelect: (deviceId: string, deviceName: string) => void;
}

const BluetoothStatus = ({ 
  isConnected, 
  isScanning, 
  deviceName,
  discoveredDevices,
  onScan, 
  onDisconnect,
  onDeviceSelect 
}: BluetoothStatusProps) => {
  return (
    <>
      <div className={cn(
        "flex items-center justify-between p-4 rounded-3xl backdrop-blur-sm transition-all duration-300",
        isConnected 
          ? "bg-accent/30 border-2 border-accent" 
          : "bg-muted/50 border-2 border-border"
      )}>
        <div className="flex items-center gap-3">
          {isScanning ? (
            <BluetoothSearching className="w-6 h-6 text-primary animate-pulse" />
          ) : isConnected ? (
            <BluetoothConnected className="w-6 h-6 text-accent" />
          ) : (
            <Bluetooth className="w-6 h-6 text-muted-foreground" />
          )}
          <div>
            <p className="font-semibold text-foreground">
              {isScanning ? 'Scanning...' : isConnected ? `Connected to ${deviceName}` : 'Not Connected'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isConnected ? 'Fetal Tracker Device' : 'Tap to connect device'}
            </p>
          </div>
        </div>
        
        <Button
          onClick={isConnected ? onDisconnect : onScan}
          disabled={isScanning}
          variant={isConnected ? "destructive" : "default"}
          size="sm"
          className="rounded-full"
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </Button>
      </div>

      <Dialog open={isScanning && discoveredDevices.length > 0} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Available Devices</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {discoveredDevices.map((device) => (
              <Button
                key={device.deviceId}
                onClick={() => onDeviceSelect(device.deviceId, device.name || 'Unknown Device')}
                variant="outline"
                className="w-full justify-start text-left"
              >
                <Bluetooth className="w-4 h-4 mr-2" />
                {device.name || 'Unknown Device'}
              </Button>
            ))}
            {discoveredDevices.length === 0 && isScanning && (
              <p className="text-center text-muted-foreground py-4">
                Searching for devices...
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BluetoothStatus;
