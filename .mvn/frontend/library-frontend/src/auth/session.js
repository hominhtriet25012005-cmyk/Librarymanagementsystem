export const ACCESS_TOKEN_KEY = "library_access_token";
export const SESSION_EVENT = "auth:session-changed";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

// Chỉ đọc thời hạn để điều khiển giao diện. Backend luôn xác minh chữ ký và quyền.
export function tokenExpiresAt(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return 0;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return Number.isFinite(payload.exp) && payload.exp > 0 ? payload.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

export const isTokenExpired = (token) => tokenExpiresAt(token) <= Date.now();

export function setAccessToken(token, reason = "") {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
  else localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.dispatchEvent(new CustomEvent(SESSION_EVENT, { detail: { reason } }));
}

// Không để phản hồi 401 của phiên cũ đăng xuất phiên vừa đăng nhập.
export function invalidateToken(token) {
  if (token && token === getAccessToken()) setAccessToken(null, "expired");
}

export function safeReturnPath(path, fallback = "/") {
  return typeof path === "string" && /^\/(?!\/)/.test(path)
    && !/[\\\\\r\n]/.test(path) && !/^\/(login|signup|forgot-password|reset-password)(\/|\?|$)/.test(path)
    ? path : fallback;
}
