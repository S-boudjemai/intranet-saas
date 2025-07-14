// src/components/RoleBadge.tsx
import React from 'react';
import Badge from './ui/Badge';

interface RoleBadgeProps {
  role: 'admin' | 'manager' | 'viewer';
}

const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          variant: 'error' as const,
          label: 'Admin'
        };
      case 'manager':
        return {
          variant: 'info' as const,
          label: 'Manager'
        };
      case 'viewer':
        return {
          variant: 'secondary' as const,
          label: 'Viewer'
        };
      default:
        return {
          variant: 'default' as const,
          label: role
        };
    }
  };

  const config = getRoleConfig(role);

  return (
    <Badge variant={config.variant} size="sm">
      {config.label}
    </Badge>
  );
};

export default RoleBadge;