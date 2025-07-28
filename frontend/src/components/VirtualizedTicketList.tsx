import React, { useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import type { TicketType } from '../types';
import TicketItem from './TicketItem';

interface VirtualizedTicketListProps {
  tickets: TicketType[];
  isManager: boolean;
  onStatusChange: (id: string, status: TicketType["status"]) => void;
  onDeleteRequest: (ticket: TicketType) => void;
  onAddComment: (id: string, message: string) => void;
  onArchive?: (ticketId: string) => void;
  height?: number;
}

interface ItemData {
  tickets: TicketType[];
  isManager: boolean;
  onStatusChange: (id: string, status: TicketType["status"]) => void;
  onDeleteRequest: (ticket: TicketType) => void;
  onAddComment: (id: string, message: string) => void;
  onArchive?: (ticketId: string) => void;
}

const TicketItemRenderer = React.memo(({ index, style, data }: {
  index: number;
  style: React.CSSProperties;
  data: ItemData;
}) => {
  const ticket = data.tickets[index];
  
  return (
    <div style={style}>
      <div className="px-4 pb-4">
        <TicketItem
          ticket={ticket}
          isManager={data.isManager}
          onStatusChange={data.onStatusChange}
          onDeleteRequest={data.onDeleteRequest}
          onAddComment={data.onAddComment}
          onArchive={data.onArchive}
        />
      </div>
    </div>
  );
});

TicketItemRenderer.displayName = 'TicketItemRenderer';

/**
 * Liste virtualisée optimisée pour les performances avec de nombreux tickets
 * Utilise react-window pour ne rendre que les éléments visibles
 */
export default function VirtualizedTicketList({
  tickets,
  isManager,
  onStatusChange,
  onDeleteRequest,
  onAddComment,
  onArchive,
  height = 600
}: VirtualizedTicketListProps) {
  
  const itemData: ItemData = useMemo(() => ({
    tickets,
    isManager,
    onStatusChange,
    onDeleteRequest,
    onAddComment,
    onArchive
  }), [tickets, isManager, onStatusChange, onDeleteRequest, onAddComment, onArchive]);

  // Estimation dynamique de la hauteur des items
  const getItemSize = (index: number) => {
    // Hauteur de base + hauteur variable selon le contenu
    const baseHeight = 120;
    const ticket = tickets[index];
    const hasDescription = ticket.description ? 40 : 0;
    const hasAttachments = ticket.attachments?.length ? 60 : 0;
    const hasComments = ticket.comments?.length ? ticket.comments.length * 80 : 0;
    
    return baseHeight + hasDescription + hasAttachments + hasComments;
  };

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Aucun ticket à afficher</p>
      </div>
    );
  }

  // Pour moins de 10 tickets, pas besoin de virtualisation
  if (tickets.length < 10) {
    return (
      <div className="space-y-4">
        {tickets.map((ticket) => (
          <TicketItem
            key={ticket.id}
            ticket={ticket}
            isManager={isManager}
            onStatusChange={onStatusChange}
            onDeleteRequest={onDeleteRequest}
            onAddComment={onAddComment}
            onArchive={onArchive}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="tickets-list">
      <List
        height={height}
        itemCount={tickets.length}
        itemSize={getItemSize}
        itemData={itemData}
        overscanCount={2}
        style={{ contain: 'strict' }}
      >
        {TicketItemRenderer}
      </List>
    </div>
  );
}