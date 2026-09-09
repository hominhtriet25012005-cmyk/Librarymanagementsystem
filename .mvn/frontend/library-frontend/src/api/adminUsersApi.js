import httpClient from "./httpClient";

export const adminUsersApi = {
  async search(params = {}) {
    const { data } = await httpClient.get("/api/user/admin", { params });
    return data;
  },

  async getStats() {
    const { data } = await httpClient.get("/api/user/admin/stats");
    return data;
  },

  async updateAccess(userId, payload) {
    const { data } = await httpClient.put(`/api/user/admin/${userId}`, payload);
    return data;
  },
};
