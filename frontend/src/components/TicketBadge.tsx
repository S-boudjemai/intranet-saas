// src/components/TicketBadge.tsx

import Badge from './ui/Badge';

interface TicketBadgeProps {
  status: 'non_traitee' | 'en_cours' | 'traitee';
}

const TicketBadge: React.FC<TicketBadgeProps> = ({ status }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'non_traitee':
        return {
          variant: 'error' as const,
          label: 'Non traitée'
        };
      case 'en_cours':
        return {
          variant: 'warning' as const,
          label: 'En cours'
        };
      case 'traitee':
        return {
          variant: 'success' as const,
          label: 'Traitée'
        };
      default:
        return {
          variant: 'default' as const,
          label: status
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
};

export default TicketBadge;