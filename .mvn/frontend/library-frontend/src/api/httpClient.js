import axios from "axios";

const DEFAULT_API_URL = "http://localhost:8080";
export const ACCESS_TOKEN_KEY = "library_access_token";

const baseURL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL).replace(/\/$/, "");

/**
 * Axios client dùng chung cho toàn bộ frontend.
 * Mọi service chỉ khai báo đường dẫn tương đối, ví dụ: /api/books.
 */
const httpClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);

export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getAccessToken()) {
      setAccessToken(null);
      window.dispatchEvent(new CustomEvent("auth:unauthorized"));
    }

    return Promise.reject(error);
  },
);

/** Chuyển lỗi Axios/backend thành câu thông báo có thể hiển thị cho người dùng. */
export const getApiErrorMessage = (error, fallback = "Không thể kết nối đến máy chủ") => {
  const data = error.response?.data;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (data?.message) {
    return data.message;
  }

  if (data && typeof data === "object") {
    const validationMessage = Object.values(data).find(
      (value) => typeof value === "string" && value.trim(),
    );
    if (validationMessage) {
      return validationMessage;
    }
  }

  if (error.code === "ECONNABORTED") {
    return "Máy chủ phản hồi quá lâu. Vui lòng thử lại.";
  }

  if (!error.response) {
    return "Không kết nối được backend tại địa chỉ đã cấu hình.";
  }

  return fallback;
};

export default httpClient;
