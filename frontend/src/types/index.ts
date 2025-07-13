// src/types.ts

// --- INTERFACES DE BASE ---

export interface RestaurantInfo {
  id: number;
  name: string;
}

export interface TagType {
  id: string;
  name: string;
}

export interface CommentType {
  id: string;
  author_id: number;
  message: string;
  created_at: string;
}

// --- INTERFACES PRINCIPALES ---

export interface DocumentType {
  id: string;
  name: string;
  url: string;
  tenant_id: string;
  is_deleted: boolean;
  tags?: TagType[];
}

export interface TicketType {
  id: string;
  title: string;
  description?: string;
  status: "non_traitee" | "en_cours" | "traitee";
  tenant_id: string;
  created_at: string;
  updated_at: string;
  comments: CommentType[];
  restaurant?: RestaurantInfo;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

// --- INTERFACE POUR LES INVITATIONS (AJOUTÉE) ---

export interface InviteType {
  id: number;
  invite_email: string;
  expires_at: string;
  used_at: string | null;
}
