// src/components/ui/Input.tsx
import React, { useState, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'filled' | 'outlined';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  variant = 'default',
  icon,
  iconPosition = 'left',
  loading = false,
  className = '',
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);
  const prefersReducedMotion = useReducedMotion();

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    onBlur?.(e);
  };

  const variants = {
    default: 'border border-border bg-background',
    filled: 'border-0 bg-muted',
    outlined: 'border-2 border-border bg-transparent'
  };

  const baseClasses = `
    w-full px-3 py-2 text-sm rounded-xl
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-primary/20
    disabled:opacity-50 disabled:cursor-not-allowed
    placeholder:text-muted-foreground
    ${variants[variant]}
    ${error ? 'border-destructive focus:ring-destructive/20' : ''}
    ${isFocused && !error ? 'border-primary shadow-lg shadow-primary/10' : ''}
    ${icon ? (iconPosition === 'left' ? 'pl-10' : 'pr-10') : ''}
    ${loading ? 'pr-10' : ''}
    ${className}
  `;

  const containerAnimation = prefersReducedMotion ? {} : {
    scale: isFocused ? 1.02 : 1,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  };

  const labelAnimation = prefersReducedMotion ? {} : {
    scale: isFocused || hasValue ? 0.85 : 1,
    y: isFocused || hasValue ? -24 : 0,
    color: isFocused ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
    transition: { type: "spring", stiffness: 300, damping: 25 }
  };

  return (
    <div className="space-y-1">
      <motion.div 
        className="relative"
        animate={containerAnimation}
      >
        {/* Label flottant */}
        {label && (
          <motion.label
            className={`
              absolute left-3 pointer-events-none origin-left
              transition-colors duration-200
              ${variant === 'filled' ? 'text-muted-foreground' : 'text-muted-foreground'}
              ${isFocused || hasValue ? 'text-xs' : 'text-sm'}
              ${isFocused || hasValue ? 'top-1' : 'top-2.5'}
            `}
            animate={labelAnimation}
          >
            {label}
          </motion.label>
        )}

        {/* Icône gauche */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          className={baseClasses}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {/* Icône droite ou loading */}
        {((icon && iconPosition === 'right') || loading) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {loading ? (
              <svg className="animate-spin h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
            ) : icon}
          </div>
        )}

        {/* Ligne de focus animée */}
        {!prefersReducedMotion && variant === 'outlined' && (
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: isFocused ? '100%' : 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        )}
      </motion.div>

      {/* Messages d'aide et d'erreur */}
      <AnimatePresence mode="wait">
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`text-xs px-1 ${
              error ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {error || helperText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

Input.displayName = 'Input';

// Composant TextArea similaire
export const TextArea = forwardRef<HTMLTextAreaElement, 
  Omit<InputProps, 'icon' | 'iconPosition' | 'loading'> & 
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({
  label,
  error,
  helperText,
  variant = 'default',
  className = '',
  onFocus,
  onBlur,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);
  const prefersReducedMotion = useReducedMotion();

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    onBlur?.(e);
  };

  const variants = {
    default: 'border border-border bg-background',
    filled: 'border-0 bg-muted',
    outlined: 'border-2 border-border bg-transparent'
  };

  const baseClasses = `
    w-full px-3 py-2 text-sm rounded-xl resize-none
    transition-all duration-300 ease-out
    focus:outline-none focus:ring-2 focus:ring-primary/20
    disabled:opacity-50 disabled:cursor-not-allowed
    placeholder:text-muted-foreground
    ${variants[variant]}
    ${error ? 'border-destructive focus:ring-destructive/20' : ''}
    ${isFocused && !error ? 'border-primary shadow-lg shadow-primary/10' : ''}
    ${className}
  `;

  const containerAnimation = prefersReducedMotion ? {} : {
    scale: isFocused ? 1.02 : 1,
    transition: { type: "spring", stiffness: 300, damping: 25 }
  };

  return (
    <div className="space-y-1">
      <motion.div 
        className="relative"
        animate={containerAnimation}
      >
        {label && (
          <motion.label
            className={`
              absolute left-3 pointer-events-none origin-left z-10
              transition-colors duration-200
              ${variant === 'filled' ? 'text-muted-foreground' : 'text-muted-foreground'}
              ${isFocused || hasValue ? 'text-xs top-1' : 'text-sm top-2.5'}
            `}
            animate={prefersReducedMotion ? {} : {
              scale: isFocused || hasValue ? 0.85 : 1,
              y: isFocused || hasValue ? -4 : 0,
              color: isFocused ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              transition: { type: "spring", stiffness: 300, damping: 25 }
            }}
          >
            {label}
          </motion.label>
        )}

        <textarea
          ref={ref}
          className={baseClasses}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rows={4}
          {...props}
        />
      </motion.div>

      <AnimatePresence mode="wait">
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={`text-xs px-1 ${
              error ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {error || helperText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

TextArea.displayName = 'TextArea';

export default Input;