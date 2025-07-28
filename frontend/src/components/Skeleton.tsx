import React from 'react';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  lines?: number; // Pour variant text
  animation?: boolean;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1,
  animation = true
}) => {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = animation && !prefersReducedMotion;

  const baseClasses = `
    ${shouldAnimate ? 'animate-pulse' : ''}
    bg-muted/60
    ${className}
  `;

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'rounded h-4';
      case 'circular':
        return 'rounded-full';
      case 'rectangular':
        return '';
      case 'rounded':
        return 'rounded-lg';
      default:
        return '';
    }
  };

  const getStyle = () => {
    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;
    return style;
  };

  // Pour les lignes de texte multiples
  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()}`}
            style={{
              ...getStyle(),
              width: index === lines - 1 ? '75%' : '100%' // Dernière ligne plus courte
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()}`}
      style={getStyle()}
    />
  );
};

// Composants pré-configurés pour les cas d'usage courants
export const TicketItemSkeleton: React.FC = () => (
  <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Skeleton variant="rounded" width={80} height={24} />
        <Skeleton variant="text" width={200} />
        <Skeleton variant="rounded" width={60} height={20} />
      </div>
      <Skeleton variant="text" width={100} />
    </div>
  </div>
);

export const DocumentCardSkeleton: React.FC = () => (
  <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
    <div className="flex items-center gap-3">
      <Skeleton variant="circular" width={40} height={40} />
      <div className="flex-1">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" />
      </div>
    </div>
    <Skeleton variant="text" lines={2} />
    <div className="flex gap-2">
      <Skeleton variant="rounded" width={60} height={20} />
      <Skeleton variant="rounded" width={80} height={20} />
    </div>
  </div>
);

export const KpiCardSkeleton: React.FC = () => (
  <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton variant="circular" width={48} height={48} />
      <Skeleton variant="text" width={60} />
    </div>
    <div>
      <Skeleton variant="text" width={120} height={32} />
      <Skeleton variant="text" width={100} />
    </div>
  </div>
);

export const AnnouncementCardSkeleton: React.FC = () => (
  <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div>
          <Skeleton variant="text" width={200} />
          <Skeleton variant="text" width={120} />
        </div>
      </div>
      <Skeleton variant="text" width={80} />
    </div>
    <div>
      <Skeleton variant="text" width="90%" height={24} />
      <Skeleton variant="text" lines={3} />
    </div>
    <div className="flex items-center gap-2">
      <Skeleton variant="rounded" width={60} height={20} />
      <Skeleton variant="rounded" width={80} height={20} />
    </div>
  </div>
);

export const DashboardSkeleton: React.FC = () => (
  <div className="container mx-auto p-6 space-y-6">
    {/* Header */}
    <div className="flex justify-between items-center">
      <Skeleton variant="text" width={200} height={32} />
      <Skeleton variant="rounded" width={120} height={40} />
    </div>

    {/* KPI Grid */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>

    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <Skeleton variant="text" width={150} height={24} className="mb-4" />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </div>
      <div className="bg-card border border-border rounded-2xl p-6">
        <Skeleton variant="text" width={150} height={24} className="mb-4" />
        <Skeleton variant="rectangular" width="100%" height={300} />
      </div>
    </div>
  </div>
);

export const DocumentGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {Array.from({ length: 8 }).map((_, i) => (
      <DocumentCardSkeleton key={i} />
    ))}
  </div>
);

export const AnnouncementFeedSkeleton: React.FC = () => (
  <div className="space-y-8">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="relative pl-12">
        {/* Timeline Line */}
        <div className="absolute left-4 top-1 h-full border-l-2 border-border"></div>
        {/* Timeline Dot */}
        <div className="absolute left-4 top-4 w-3 h-3 bg-muted rounded-full transform -translate-x-1/2" />
        {/* Announcement Card */}
        <AnnouncementCardSkeleton />
      </div>
    ))}
  </div>
);

export const UserListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Skeleton variant="circular" width={48} height={48} />
            <div className="space-y-2">
              <Skeleton variant="text" width={160} />
              <Skeleton variant="text" width={120} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton variant="rounded" width={80} height={32} />
            <Skeleton variant="rounded" width={32} height={32} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const AuditListSkeleton: React.FC = () => (
  <div className="space-y-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <Skeleton variant="text" width={200} />
            <Skeleton variant="text" width={140} />
          </div>
          <Skeleton variant="rounded" width={100} height={24} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center space-y-1">
            <Skeleton variant="text" width={40} height={24} className="mx-auto" />
            <Skeleton variant="text" width={60} />
          </div>
          <div className="text-center space-y-1">
            <Skeleton variant="text" width={40} height={24} className="mx-auto" />
            <Skeleton variant="text" width={80} />
          </div>
          <div className="text-center space-y-1">
            <Skeleton variant="text" width={40} height={24} className="mx-auto" />
            <Skeleton variant="text" width={70} />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const GlobalSearchSkeleton: React.FC = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="p-3 hover:bg-muted rounded-lg border border-border">
        <div className="flex items-center gap-3">
          <Skeleton variant="circular" width={32} height={32} />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="50%" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const ArchivesSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="flex gap-4 mb-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} variant="rounded" width={120} height={40} />
      ))}
    </div>
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton variant="text" width={180} />
              <Skeleton variant="text" width={120} />
            </div>
            <div className="flex gap-2">
              <Skeleton variant="rounded" width={32} height={32} />
              <Skeleton variant="rounded" width={32} height={32} />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const CategoryTreeSkeleton: React.FC = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-2 p-2">
        <Skeleton variant="circular" width={16} height={16} />
        <Skeleton variant="text" width={120} />
      </div>
    ))}
  </div>
);

export const ViewStatsSkeleton: React.FC = () => (
  <div className="flex items-center gap-2">
    <Skeleton variant="circular" width={20} height={20} />
    <Skeleton variant="text" width={60} />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} variant="text" width="80%" />
      ))}
    </div>
    
    {/* Rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" width={colIndex === 0 ? "60%" : "90%"} />
        ))}
      </div>
    ))}
  </div>
);

// Composant principal avec toutes les variantes
const SkeletonComponent = Object.assign(Skeleton, {
  TicketCard: TicketItemSkeleton,
  DocumentCard: DocumentCardSkeleton,
  DocumentGrid: DocumentGridSkeleton,
  KpiCard: KpiCardSkeleton,
  AnnouncementCard: AnnouncementCardSkeleton,
  AnnouncementFeed: AnnouncementFeedSkeleton,
  Dashboard: DashboardSkeleton,
  UserList: UserListSkeleton,
  AuditList: AuditListSkeleton,
  GlobalSearch: GlobalSearchSkeleton,
  Archives: ArchivesSkeleton,
  CategoryTree: CategoryTreeSkeleton,
  ViewStats: ViewStatsSkeleton,
  Table: TableSkeleton
});

export default SkeletonComponent;