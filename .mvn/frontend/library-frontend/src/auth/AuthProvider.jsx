import { useCallback, useEffect, useRef, useState } from "react";
import { authApi } from "../api/authApi";
import { getApiErrorMessage } from "../api/httpClient";
import { AuthContext } from "./AuthContext";
import {
  ACCESS_TOKEN_KEY, SESSION_EVENT, getAccessToken, invalidateToken,
  isTokenExpired, setAccessToken, tokenExpiresAt,
} from "./session";

export default function AuthProvider({ children }) {
  const [state, setState] = useState({ status: "loading", user: null, error: "" });
  const [notice, setNotice] = useState("");
  const revision = useRef(0);

  const restore = useCallback(async () => {
    const request = ++revision.current;
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      if (token) invalidateToken(token);
      setState({ status: "guest", user: null, error: "" });
      return;
    }
    setState({ status: "loading", user: null, error: "" });
    try {
      const profile = await authApi.profile();
      if (request !== revision.current || getAccessToken() !== token) return;
      if (isTokenExpired(token)) { invalidateToken(token); return; }
      if (!profile?.id || !["ROLE_USER", "ROLE_ADMIN"].includes(profile.role)) {
        invalidateToken(token);
        return;
      }
      // Chỉ lưu hồ sơ cần hiển thị, không lưu mật khẩu hoặc suy quyền từ JWT.
      const { id, fullName, email, phone, role, lastLogin } = profile;
      setState({ status: "authenticated", user: { id, fullName, email, phone, role, lastLogin }, error: "" });
    } catch (error) {
      if (request !== revision.current || getAccessToken() !== token) return;
      if ([401, 403].includes(error.response?.status)) invalidateToken(token);
      else setState({ status: "error", user: null, error: getApiErrorMessage(error) });
    }
  }, []);

  useEffect(() => {
    const onSession = (event) => {
      setNotice(event.detail?.reason === "expired" ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." : "");
      void restore();
    };
    const onStorage = (event) => {
      if (event.key === ACCESS_TOKEN_KEY || event.key === null) void restore();
    };
    const onFocus = () => {
      const token = getAccessToken();
      if (token && isTokenExpired(token)) invalidateToken(token);
    };
    window.addEventListener(SESSION_EVENT, onSession);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    // Đồng bộ phiên lưu ngoài React; không phát sinh cập nhật sau khi tháo component.
    let mounted = true;
    queueMicrotask(() => { if (mounted) void restore(); });
    return () => {
      mounted = false;
      // Hủy hiệu lực của mọi phản hồi hồ sơ đang chờ.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      revision.current++;
      window.removeEventListener(SESSION_EVENT, onSession);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [restore]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    // Giới hạn timer và kiểm tra lại cả khi trình duyệt tạm ngưng tab.
    let timer;
    const schedule = () => {
      const remaining = tokenExpiresAt(token) - Date.now();
      if (remaining <= 0) invalidateToken(token);
      else timer = window.setTimeout(schedule, Math.min(remaining, 2147483647));
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [state]);

  const authenticate = async (mode, payload) => {
    const request = ++revision.current;
    const data = await authApi[mode](payload);
    if (request !== revision.current) throw { userMessage: "Phiên đã thay đổi. Vui lòng thử lại." };
    if (!data?.jwt || isTokenExpired(data.jwt)) throw { userMessage: "Máy chủ trả về phiên không hợp lệ. Vui lòng thử lại." };
    setAccessToken(data.jwt);
  };

  const logout = () => {
    revision.current++;
    setAccessToken(null);
  };

  return <AuthContext.Provider value={{
    ...state, notice, clearNotice: () => setNotice(""),
    login: (payload) => authenticate("login", payload),
    signup: (payload) => authenticate("signup", payload),
    logout, retry: restore, isAdmin: state.user?.role === "ROLE_ADMIN",
  }}>{children}</AuthContext.Provider>;
}
