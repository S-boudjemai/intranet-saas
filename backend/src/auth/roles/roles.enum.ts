// src/auth/roles.enum.ts
export enum Role {
  Admin = 'admin', // franchiseur
  Manager = 'manager', // franchisé qui peut uploader ou modérer certains contenus
  Viewer = 'viewer', // franchisé en lecture seule
}
