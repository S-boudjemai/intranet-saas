// src/components/ui/Loading.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface LoadingProps {
  type?: 'spinner' | 'dots' | 'skeleton' | 'pulse';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const Loading: React.FC<LoadingProps> = ({ 
  type = 'spinner', 
  size = 'md', 
  text,
  className = '' 
}) => {
  const prefersReducedMotion = useReducedMotion();

  const sizes = {
    sm: { spinner: 'h-4 w-4', text: 'text-xs' },
    md: { spinner: 'h-6 w-6', text: 'text-sm' },
    lg: { spinner: 'h-8 w-8', text: 'text-base' }
  };

  const SpinnerLoader = () => (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg 
        className={`animate-spin ${sizes[size].spinner}`} 
        fill="none" 
        viewBox="0 0 24 24"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && <span className={`${sizes[size].text} text-muted-foreground`}>{text}</span>}
    </div>
  );

  const DotsLoader = () => (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className={`bg-primary rounded-full ${size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-2 w-2' : 'h-3 w-3'}`}
          animate={prefersReducedMotion ? {} : {
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
      {text && <span className={`ml-2 ${sizes[size].text} text-muted-foreground`}>{text}</span>}
    </div>
  );

  const PulseLoader = () => (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className={`bg-primary rounded-full ${sizes[size].spinner} animate-pulse-gentle`} />
      {text && <span className={`${sizes[size].text} text-muted-foreground animate-pulse`}>{text}</span>}
    </div>
  );

  switch (type) {
    case 'dots':
      return <DotsLoader />;
    case 'pulse':
      return <PulseLoader />;
    case 'skeleton':
      return <SkeletonLoader />;
    default:
      return <SpinnerLoader />;
  }
};

// Composant Skeleton séparé pour plus de flexibilité
export const SkeletonLoader: React.FC<{ 
  className?: string;
  lines?: number;
  avatar?: boolean;
}> = ({ 
  className = '', 
  lines = 3, 
  avatar = false 
}) => (
  <div className={`animate-pulse space-y-3 ${className}`}>
    {avatar && (
      <div className="flex items-center space-x-3">
        <div className="rounded-full bg-muted h-10 w-10" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
    )}
    
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i}
          className={`h-4 bg-muted rounded ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`} 
        />
      ))}
    </div>
  </div>
);

// Composants de skeleton spécialisés
export const CardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-card border border-border rounded-xl p-4 animate-pulse ${className}`}>
    <div className="space-y-3">
      <div className="h-4 bg-muted rounded w-1/2" />
      <div className="space-y-2">
        <div className="h-3 bg-muted rounded" />
        <div className="h-3 bg-muted rounded w-5/6" />
      </div>
      <div className="flex justify-between">
        <div className="h-8 bg-muted rounded w-20" />
        <div className="h-8 bg-muted rounded w-16" />
      </div>
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ 
  items?: number;
  className?: string;
}> = ({ 
  items = 5, 
  className = '' 
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <SkeletonLoader key={i} lines={2} avatar />
    ))}
  </div>
);

export const TableSkeleton: React.FC<{ 
  rows?: number;
  cols?: number;
  className?: string;
}> = ({ 
  rows = 5, 
  cols = 4, 
  className = '' 
}) => (
  <div className={`animate-pulse ${className}`}>
    {/* Header */}
    <div className="flex space-x-4 mb-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-1 h-4 bg-muted rounded" />
      ))}
    </div>
    
    {/* Rows */}
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="flex-1 h-4 bg-muted rounded" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export default Loading;