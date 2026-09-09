import httpClient from "./httpClient";
import { adminLoansApi } from "./adminLoansApi";

export const adminFinesApi = {
  async search(params = {}) {
    const { data } = await httpClient.get("/api/fines", { params });
    return data;
  },

  async create(payload) {
    const { data } = await httpClient.post("/api/fines", payload);
    return data;
  },

  async waive(payload) {
    const { data } = await httpClient.post("/api/fines/waive", payload);
    return data;
  },

  getUsers: adminLoansApi.getUsers,
};
