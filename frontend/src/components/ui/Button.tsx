// src/components/ui/Button.tsx
import React from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', loading = false, icon, children, disabled, ...props }, ref) => {
    const prefersReducedMotion = useReducedMotion();
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-primary shadow-lg hover:shadow-xl active:scale-95',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 focus-visible:ring-secondary shadow-md hover:shadow-lg active:scale-95',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive shadow-lg hover:shadow-xl active:scale-95',
      outline: 'border border-border bg-card hover:bg-accent hover:border-accent focus-visible:ring-primary shadow-sm hover:shadow-md active:scale-95',
      ghost: 'hover:bg-accent hover:text-accent-foreground focus-visible:ring-primary active:scale-95'
    };
    
    const sizes = {
      sm: 'h-8 px-3 text-xs rounded-xl',
      md: 'h-10 px-4 text-sm rounded-xl',
      lg: 'h-12 px-6 text-base rounded-xl'
    };
    
    const LoadingSpinner = () => (
      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    );
    
    const buttonClasses = `${
      baseClasses
    } ${
      variants[variant]
    } ${
      sizes[size]
    } ${
      prefersReducedMotion ? '' : 'hover:scale-105 transform'
    } ${
      className
    }`;

    return (
      <button
        className={buttonClasses}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && icon && <span className="mr-2">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;