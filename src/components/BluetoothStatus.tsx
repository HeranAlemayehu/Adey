import { Bluetooth, BluetoothConnected, BluetoothSearching } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BluetoothStatusProps {
  isConnected: boolean;
  isScanning: boolean;
  onScan: () => void;
  onDisconnect: () => void;
}

const BluetoothStatus = ({ isConnected, isScanning, onScan, onDisconnect }: BluetoothStatusProps) => {
  return (
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
            {isScanning ? 'Scanning...' : isConnected ? 'Connected' : 'Not Connected'}
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
  );
};

export default BluetoothStatus;
