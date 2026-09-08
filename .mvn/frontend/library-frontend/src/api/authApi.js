import httpClient from "./httpClient";

const publicRequest = { skipAuth: true };
export const authApi = {
  async signup(payload) {
    const { data } = await httpClient.post("/auth/signup", payload, publicRequest);
    return data;
  },
  async login(payload) {
    const { data } = await httpClient.post("/auth/login", payload, publicRequest);
    return data;
  },
  async profile() {
    const { data } = await httpClient.get("/api/user/profile");
    return data;
  },
  async forgotPassword(email) {
    const { data } = await httpClient.post("/auth/forgot-password", { email }, publicRequest);
    return data;
  },
  async resetPassword(token, password) {
    const { data } = await httpClient.post("/auth/reset-password", { token, password }, publicRequest);
    return data;
  },
};
