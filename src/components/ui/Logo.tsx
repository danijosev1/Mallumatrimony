import React from 'react';
import { HeartHandshake } from 'lucide-react';

interface LogoProps {
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ color = 'primary' }) => {
  return (
    <div className="flex items-center">
      <HeartHandshake 
        size={32} 
        className={color === 'white' ? 'text-white' : 'text-primary'} 
        strokeWidth={2} 
      />
    </div>
  );
};

export default Logo;