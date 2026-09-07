import httpClient, { setAccessToken } from "./httpClient";

export const authApi = {
  async signup(payload) {
    const { data } = await httpClient.post("/auth/signup", payload);
    setAccessToken(data.jwt);
    return data;
  },

  async login(payload) {
    const { data } = await httpClient.post("/auth/login", payload);
    setAccessToken(data.jwt);
    return data;
  },

  async forgotPassword(email) {
    const { data } = await httpClient.post("/auth/forgot-password", { email });
    return data;
  },

  async resetPassword(token, password) {
    const { data } = await httpClient.post("/auth/reset-password", {
      token,
      password,
    });
    return data;
  },

  logout() {
    setAccessToken(null);
  },
};
