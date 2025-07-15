// src/components/ui/Badge.tsx


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
  const baseClasses = 'inline-flex items-center font-medium';
  
  const variants = {
    default: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    error: 'bg-error/10 text-error border border-error/20',
    info: 'bg-info/10 text-info border border-info/20',
    secondary: 'bg-muted text-muted-foreground border border-border'
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs rounded',
    md: 'px-3 py-1 text-sm rounded-md'
  };
  
  return (
    <span className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;