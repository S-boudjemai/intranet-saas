// src/components/ui/PageTransition.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ 
  children, 
  className = '' 
}) => {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const pageVariants = prefersReducedMotion ? {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 }
  } : {
    initial: {
      opacity: 0,
      y: 10
    },
    in: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    out: {
      opacity: 0,
      transition: {
        duration: 0.15,
        ease: "easeIn"
      }
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className={`w-full ${className}`}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Composant pour les transitions de contenu dans une page
export const ContentTransition: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ 
  children, 
  delay = 0, 
  className = '' 
}) => {
  const prefersReducedMotion = useReducedMotion();

  const variants = prefersReducedMotion ? {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  } : {
    hidden: { 
      opacity: 0, 
      y: 30 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay
      }
    }
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={variants}
    >
      {children}
    </motion.div>
  );
};

// Composant pour animer les listes
export const ListTransition: React.FC<{
  children: React.ReactNode[];
  className?: string;
  stagger?: number;
}> = ({ 
  children, 
  className = '', 
  stagger = 0.1 
}) => {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = prefersReducedMotion ? {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  } : {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = prefersReducedMotion ? {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  } : {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
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

// Composant pour les transitions de tabs
export const TabTransition: React.FC<{
  children: React.ReactNode;
  tabKey: string;
  className?: string;
}> = ({ 
  children, 
  tabKey, 
  className = '' 
}) => {
  const prefersReducedMotion = useReducedMotion();

  const variants = prefersReducedMotion ? {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 }
  } : {
    initial: {
      opacity: 0,
      x: 10
    },
    in: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        duration: 0.3
      }
    },
    out: {
      opacity: 0,
      x: -10,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={tabKey}
        className={className}
        initial="initial"
        animate="in"
        exit="out"
        variants={variants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Hook pour les animations d'entrée séquentielles
export const useStaggeredAnimation = (delay: number = 0.1) => {
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
      hidden: { 
        opacity: 0, 
        y: 20 
      },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: {
          type: "spring",
          stiffness: 300,
          damping: 25
        }
      }
    }
  };
};

export default PageTransition;