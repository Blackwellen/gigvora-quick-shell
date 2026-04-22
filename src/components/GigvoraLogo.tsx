import React from 'react';
import logoImage from '@/assets/gigvora-logo.png';

interface GigvoraLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-10',
};

export const GigvoraLogo: React.FC<GigvoraLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 shrink-0 ${className}`}>
      <img
        src={logoImage}
        alt="Gigvora"
        className={`${sizeMap[size]} w-auto object-contain`}
      />
    </div>
  );
};
