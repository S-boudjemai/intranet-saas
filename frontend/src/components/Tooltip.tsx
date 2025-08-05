import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  offset?: number;
  className?: string;
  disabled?: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  delay = 300,
  offset = 8,
  className = '',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let newPosition = position;

    // Vérifier si le tooltip dépasse les bords de l'écran
    const positions = {
      top: triggerRect.top - tooltipRect.height - offset < 0,
      bottom: triggerRect.bottom + tooltipRect.height + offset > viewport.height,
      left: triggerRect.left - tooltipRect.width - offset < 0,
      right: triggerRect.right + tooltipRect.width + offset > viewport.width
    };

    // Ajuster la position si nécessaire
    if (position === 'top' && positions.top) {
      newPosition = 'bottom';
    } else if (position === 'bottom' && positions.bottom) {
      newPosition = 'top';
    } else if (position === 'left' && positions.left) {
      newPosition = 'right';
    } else if (position === 'right' && positions.right) {
      newPosition = 'left';
    }

    setActualPosition(newPosition);
  };

  const showTooltip = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Calculer la position après que le tooltip soit rendu
      setTimeout(calculatePosition, 0);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const getTooltipStyles = () => {
    if (!triggerRef.current) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();
    
    const styles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      pointerEvents: 'none'
    };

    switch (actualPosition) {
      case 'top':
        styles.left = triggerRect.left + triggerRect.width / 2;
        styles.top = triggerRect.top - offset;
        styles.transform = 'translate(-50%, -100%)';
        break;
      case 'bottom':
        styles.left = triggerRect.left + triggerRect.width / 2;
        styles.top = triggerRect.bottom + offset;
        styles.transform = 'translate(-50%, 0)';
        break;
      case 'left':
        styles.left = triggerRect.left - offset;
        styles.top = triggerRect.top + triggerRect.height / 2;
        styles.transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        styles.left = triggerRect.right + offset;
        styles.top = triggerRect.top + triggerRect.height / 2;
        styles.transform = 'translate(0, -50%)';
        break;
    }

    return styles;
  };

  const getArrowStyles = () => {
    const arrowSize = 6;
    
    switch (actualPosition) {
      case 'top':
        return {
          bottom: -arrowSize,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize}px solid hsl(var(--popover))` // gray-800
        };
      case 'bottom':
        return {
          top: -arrowSize,
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid hsl(var(--popover))`
        };
      case 'left':
        return {
          right: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid hsl(var(--popover))`
        };
      case 'right':
        return {
          left: -arrowSize,
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid hsl(var(--popover))`
        };
      default:
        return {};
    }
  };

  const tooltipVariants = {
    hidden: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.8,
      y: actualPosition === 'top' ? 10 : actualPosition === 'bottom' ? -10 : 0,
      x: actualPosition === 'left' ? 10 : actualPosition === 'right' ? -10 : 0
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      x: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.2,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.8,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.15
      }
    }
  };

  // Cloner l'enfant pour ajouter les event handlers
  const clonedChild = React.cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      children.props.onMouseEnter?.(e);
      showTooltip();
    },
    onMouseLeave: (e: React.MouseEvent) => {
      children.props.onMouseLeave?.(e);
      hideTooltip();
    },
    onFocus: (e: React.FocusEvent) => {
      children.props.onFocus?.(e);
      showTooltip();
    },
    onBlur: (e: React.FocusEvent) => {
      children.props.onBlur?.(e);
      hideTooltip();
    }
  });

  return (
    <>
      {clonedChild}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            style={getTooltipStyles()}
            variants={tooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`
              bg-popover text-popover-foreground border border-border text-sm px-3 py-2 rounded-lg shadow-lg
              max-w-xs break-words relative
              ${className}
            `}
          >
            {content}
            
            {/* Flèche */}
            <div
              className="absolute"
              style={getArrowStyles()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Tooltip;