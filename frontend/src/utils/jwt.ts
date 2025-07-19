// src/utils/jwt.ts

export interface JwtPayload {
  sub: number;
  tenant_id: number | null;
  role: "admin" | "manager" | "viewer";
  restaurant_id?: number;
}

export function parseJwt<T = any>(token: string): T | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload) as T;
  } catch (error) {
    // Invalid token error
    return null;
  }
}
