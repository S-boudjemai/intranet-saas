// src/components/KpiCard.tsx
import { motion } from "framer-motion";

interface TrendData {
  percentage: number;
  isPositive: boolean;
}

interface KpiCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  index?: number;
  subtitle?: string;
  trend?: TrendData;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon, index = 0, subtitle, trend }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ 
      duration: 0.5, 
      delay: index * 0.1, 
      ease: "easeOut" 
    }}
    whileHover={{ 
      scale: 1.02,
      y: -4,
      transition: { type: "spring", stiffness: 300, damping: 20 }
    }}
    whileTap={{ scale: 0.98 }}
    className="
      bg-card
      border border-border
      rounded-2xl 
      p-6
      flex items-center 
      cursor-pointer
      group
      hover:shadow-lg
      dark:hover:shadow-lg
      dark:hover:shadow-primary/20
      transition-shadow
      duration-300
    "
    style={{
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
    }}
  >
    {icon && (
      <motion.div
        whileHover={{ 
          scale: 1.1,
          rotate: 5,
          transition: { type: "spring", stiffness: 400, damping: 17 }
        }}
        className="
          text-primary text-3xl 
          mr-5 p-3 
          bg-primary/10 
          rounded-xl
          transition-all duration-300
          group-hover:bg-primary/20
        "
      >
        {icon}
      </motion.div>
    )}
    <div>
      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.2 }}
        className="text-3xl font-bold text-foreground tracking-tight mt-1"
      >
        {value}
      </motion.p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1 font-medium">
          {subtitle}
        </p>
      )}
      {trend && trend.percentage > 0 && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${
          trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}>
          <span>{trend.isPositive ? '↗' : '↘'}</span>
          <span>{trend.percentage}% vs semaine précédente</span>
        </div>
      )}
    </div>
  </motion.div>
);

export default KpiCard;
