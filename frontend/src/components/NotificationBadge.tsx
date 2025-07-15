
interface NotificationBadgeProps {
  count: number;
  className?: string;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ count, className = '' }) => {
  if (count === 0) return null;

  return (
    <span 
      className={`
        inline-flex items-center justify-center 
        min-w-5 h-5 px-1
        text-xs font-bold text-white 
        bg-red-500 rounded-full
        ${className}
      `}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

export default NotificationBadge;