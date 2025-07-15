// src/components/ui/Card.tsx


export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg' | 'none';
  hover?: boolean;
  border?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'md',
  hover = false,
  border = true,
  onClick
}) => {
  const baseClasses = 'bg-card text-card-foreground rounded-lg transition-all duration-200';
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };
  
  const shadows = {
    none: '',
    sm: 'shadow-custom-sm',
    md: 'shadow-custom',
    lg: 'shadow-custom-lg'
  };
  
  const borderClass = border ? 'border border-border' : '';
  const hoverClass = hover ? 'hover:shadow-custom-lg hover:-translate-y-0.5' : '';
  
  return (
    <div 
      className={`${baseClasses} ${paddings[padding]} ${shadows[shadow]} ${borderClass} ${hoverClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

// Sub-components
export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`mb-4 ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <h3 className={`text-lg font-semibold text-foreground ${className}`}>
    {children}
  </h3>
);

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <p className={`text-sm text-muted-foreground ${className}`}>
    {children}
  </p>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={className}>
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`mt-4 pt-4 border-t border-border ${className}`}>
    {children}
  </div>
);

export default Card;