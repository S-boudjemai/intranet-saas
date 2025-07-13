// src/components/KpiCard.tsx
import React from "react";

interface KpiCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, icon }) => (
  <div
    className="
      bg-card
      border border-border
      rounded-2xl 
      p-5 
      flex items-center 
      transition-all duration-300
      hover:border-primary/40 hover:bg-secondary
      group
    "
  >
    {icon && (
      <div
        className="
          text-primary text-3xl 
          mr-5 p-3 
          bg-primary/10 
          rounded-xl
          transition-all duration-300
          group-hover:scale-110 group-hover:rotate-6
        "
      >
        {icon}
      </div>
    )}
    <div>
      <p className="text-md text-muted-foreground font-medium">{title}</p>
      <p className="text-3xl font-bold text-card-foreground tracking-tight">
        {value}
      </p>
    </div>
  </div>
);

export default KpiCard;
