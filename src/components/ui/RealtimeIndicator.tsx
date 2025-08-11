import React, { memo } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface RealtimeIndicatorProps {
  isConnected: boolean;
  status?: ConnectionStatus;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onReconnect?: () => void;
}

export const RealtimeIndicator: React.FC<RealtimeIndicatorProps> = memo(({ 
  isConnected, 
  status,
  className = '',
  showText = true,
  size = 'md',
  onReconnect
}) => {
  // Determine actual status
  const actualStatus: ConnectionStatus = status || (isConnected ? 'connected' : 'disconnected');
  
  // Size configurations
  const sizeConfig = {
    sm: { icon: 'w-3 h-3', text: 'text-xs' },
    md: { icon: 'w-4 h-4', text: 'text-xs' },
    lg: { icon: 'w-5 h-5', text: 'text-sm' }
  };

  const { icon: iconSize, text: textSize } = sizeConfig[size];

  // Status configurations
  const statusConfig = {
    connected: {
      icon: Wifi,
      color: 'text-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      label: 'Live',
      pulse: false
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      label: 'Offline',
      pulse: false
    },
    connecting: {
      icon: RefreshCw,
      color: 'text-yellow-500',
      textColor: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      label: 'Connecting',
      pulse: true
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
      label: 'Error',
      pulse: false
    }
  };

  const config = statusConfig[actualStatus];
  const IconComponent = config.icon;

  return (
    <div 
      className={`flex items-center space-x-1 ${className}`}
      title={`Realtime status: ${config.label}`}
    >
      <div className={`relative ${config.bgColor} rounded-full p-1`}>
        <IconComponent 
          className={`${iconSize} ${config.color} ${
            config.pulse ? 'animate-spin' : ''
          } ${actualStatus === 'connected' ? 'animate-pulse' : ''}`}
        />
        
        {/* Connection dot indicator */}
        {actualStatus === 'connected' && (
          <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        )}
      </div>
      
      {showText && (
        <span className={`${textSize} ${config.textColor} font-medium`}>
          {config.label}
        </span>
      )}
      
      {/* Reconnect button for error/offline states */}
      {onReconnect && (actualStatus === 'disconnected' || actualStatus === 'error') && (
        <button
          onClick={onReconnect}
          className={`${textSize} ${config.textColor} hover:${config.textColor.replace('600', '800')} font-medium underline ml-1`}
          title="Click to reconnect"
        >
          Retry
        </button>
      )}
    </div>
  );
});

RealtimeIndicator.displayName = 'RealtimeIndicator';

export default RealtimeIndicator;