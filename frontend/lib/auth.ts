import { AuthUser, UserRole } from "@/types/user";

export function decodeToken(token: string): AuthUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.userId || !payload.role) return null;
    return {
      userId: Number(payload.userId),
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  const userFromToken = decodeToken(token);
  if (!userFromToken) return null;

  // Retrieve any optional cached name/email
  const cachedMeta = localStorage.getItem("user_meta");
  if (cachedMeta) {
    try {
      const meta = JSON.parse(cachedMeta);
      return {
        ...userFromToken,
        name: meta.name || userFromToken.name,
        email: meta.email || userFromToken.email,
      };
    } catch {
      // ignore
    }
  }

  return userFromToken;
}

export function setStoredSession(token: string, meta?: { email?: string; name?: string }) {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
  if (meta) {
    localStorage.setItem("user_meta", JSON.stringify(meta));
  }
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user_meta");
}

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "AGENT":
      return "/agent";
    case "CUSTOMER":
    default:
      return "/user";
  }
}
