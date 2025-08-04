// src/components/ui/Badge.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'secondary';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ 
  variant = 'default', 
  size = 'md', 
  children, 
  className = '' 
}) => {
  const prefersReducedMotion = useReducedMotion();
  const baseClasses = 'inline-flex items-center font-medium transition-all duration-200';
  
  const variants = {
    default: 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20',
    success: 'bg-success/10 text-success border border-success/20 hover:bg-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20 hover:bg-warning/20',
    error: 'bg-error/10 text-error border border-error/20 hover:bg-error/20',
    info: 'bg-info/10 text-info border border-info/20 hover:bg-info/20',
    secondary: 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs rounded-lg',
    md: 'px-3 py-1 text-sm rounded-xl'
  };

  const animation = prefersReducedMotion ? {} : {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { type: "spring", stiffness: 300, damping: 25 }
  };
  
  return (
    <motion.span 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...animation}
    >
      {children}
    </motion.span>
  );
};

export default Badge;