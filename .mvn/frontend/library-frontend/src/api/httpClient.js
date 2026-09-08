import axios from "axios";
import { getAccessToken, invalidateToken, isTokenExpired } from "../auth/session";
export { ACCESS_TOKEN_KEY, getAccessToken, setAccessToken } from "../auth/session";

const httpClient = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || "http://localhost:8080").replace(/\/$/, ""),
  timeout: 15000,
});

// Các API đăng nhập/khôi phục mật khẩu không gửi JWT cũ.
httpClient.interceptors.request.use((config) => {
  const token = config.skipAuth ? null : getAccessToken();
  if (token && isTokenExpired(token)) invalidateToken(token);
  else if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.sessionToken = token;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) invalidateToken(error.config?.sessionToken);
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error, fallback = "Không thể hoàn tất yêu cầu. Vui lòng thử lại.") {
  if (error?.userMessage) return error.userMessage;
  if (error?.code === "ECONNABORTED") return "Máy chủ phản hồi quá lâu. Vui lòng thử lại.";
  if (!error?.response) return "Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối và thử lại.";
  const status = error.response.status;
  if (status >= 500) return "Hệ thống tạm thời gặp sự cố. Vui lòng thử lại sau.";
  if (status === 401) return "Phiên đăng nhập không còn hợp lệ. Vui lòng đăng nhập lại.";
  if (status === 403) return "Bạn không có quyền thực hiện thao tác này.";
  const message = error.response.data?.message;
  // Loại bỏ tên trường kỹ thuật đứng trước thông báo kiểm tra dữ liệu.
  if (typeof message === "string" && /[À-ỹ]/.test(message)) {
    return message.replace(/^(email|password|fullName|phone|token):\s*/i, "");
  }
  return fallback;
}
export default httpClient;
