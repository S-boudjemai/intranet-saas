// src/types/jwt-decode.d.ts
declare module "jwt-decode" {
  /**
   * Décode un JWT et renvoie le payload typé
   */
  export default function jwt_decode<T = any>(token: string): T;
}
