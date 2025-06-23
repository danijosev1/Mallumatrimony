import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  className?: string;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = ({ 
  isConnected, 
  className = '' 
}) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {isConnected ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-xs text-green-600 font-medium">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-red-500" />
          <span className="text-xs text-red-600 font-medium">Offline</span>
        </>
      )}
    </div>
  );
};

export default RealtimeIndicator;