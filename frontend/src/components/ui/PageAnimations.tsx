// src/components/ui/PageAnimations.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface PageHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ children, className = '' }) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: -20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`mb-8 ${className}`}
    >
      {children}
    </motion.div>
  );
};

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const PageContent: React.FC<PageContentProps> = ({ 
  children, 
  className = '', 
  delay = 0.1 
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0 }}
      animate={prefersReducedMotion ? {} : { opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface PageCardProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const PageCard: React.FC<PageCardProps> = ({ 
  children, 
  className = '', 
  delay = 0 
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface PageListProps {
  children: React.ReactNode[];
  className?: string;
  stagger?: number;
}

export const PageList: React.FC<PageListProps> = ({ 
  children, 
  className = '', 
  stagger = 0.05 
}) => {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = prefersReducedMotion ? {} : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = prefersReducedMotion ? {} : {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {children.map((child, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

interface TabContentProps {
  children: React.ReactNode;
  tabKey: string;
  className?: string;
}

export const TabContent: React.FC<TabContentProps> = ({ 
  children, 
  tabKey, 
  className = '' 
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      key={tabKey}
      initial={prefersReducedMotion ? {} : { opacity: 0, x: 20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Hook pour créer des animations de grille uniformes
export const useGridAnimation = (itemCount: number, delay: number = 0.05) => {
  const prefersReducedMotion = useReducedMotion();

  return {
    container: prefersReducedMotion ? {} : {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: delay,
          delayChildren: 0.1
        }
      }
    },
    item: prefersReducedMotion ? {} : {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.3
        }
      }
    }
  };
};

export default PageHeader;