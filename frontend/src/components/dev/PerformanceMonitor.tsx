// src/components/dev/PerformanceMonitor.tsx
// SOFIANE : Composant de monitoring des performances cache en développement

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  total: number;
}

interface PerformanceMonitorProps {
  cacheStats: CacheStats;
  onClearCache?: () => void;
  className?: string;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  cacheStats,
  onClearCache,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 🎯 Évaluation de la performance
  const getPerformanceLevel = (hitRate: number) => {
    if (hitRate >= 80) return { level: 'excellent', color: 'green', icon: '🚀' };
    if (hitRate >= 60) return { level: 'good', color: 'blue', icon: '⚡' };
    if (hitRate >= 40) return { level: 'average', color: 'yellow', icon: '⚠️' };
    return { level: 'poor', color: 'red', icon: '🐌' };
  };

  const performance = getPerformanceLevel(cacheStats.hitRate);

  // Affichage uniquement en mode développement
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <motion.div
      className={`fixed top-4 right-4 z-50 ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="p-3 bg-background/95 backdrop-blur-sm border shadow-lg">
        <div className="flex items-center gap-3">
          {/* 📊 Indicateur principal */}
          <motion.div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-lg">{performance.icon}</span>
            <div className="text-sm">
              <div className="font-medium text-foreground">
                Cache: {Math.round(cacheStats.hitRate)}%
              </div>
              <div className="text-xs text-muted-foreground">
                {cacheStats.hits}/{cacheStats.total}
              </div>
            </div>
          </motion.div>

          {/* ✅ Badge de performance */}
          <Badge 
            variant={performance.color as any}
            className="text-xs"
          >
            {performance.level}
          </Badge>
        </div>

        {/* 📈 Détails étendus */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-border"
            >
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-muted-foreground">Entrées cache</div>
                  <div className="font-mono text-foreground">{cacheStats.size}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Succès</div>
                  <div className="font-mono text-green-600">{cacheStats.hits}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Échecs</div>
                  <div className="font-mono text-red-600">{cacheStats.misses}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-mono text-foreground">{cacheStats.total}</div>
                </div>
              </div>

              {/* 🧹 Actions */}
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onClearCache}
                  className="text-xs h-7"
                >
                  Clear Cache
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsExpanded(false)}
                  className="text-xs h-7"
                >
                  Fermer
                </Button>
              </div>

              {/* 💡 Conseils de performance */}
              {performance.level === 'poor' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-xs text-orange-700 dark:text-orange-300"
                >
                  💡 Cache peu efficace. Considérez augmenter le TTL ou optimiser les patterns d'accès.
                </motion.div>
              )}

              {performance.level === 'excellent' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs text-green-700 dark:text-green-300"
                >
                  🎉 Excellent! Cache très efficace, performances optimales.
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

export default PerformanceMonitor;