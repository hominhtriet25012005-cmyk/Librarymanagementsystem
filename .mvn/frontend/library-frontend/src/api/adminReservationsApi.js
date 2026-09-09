import httpClient from "./httpClient";
import { adminLoansApi } from "./adminLoansApi";

export const adminReservationsApi = {
  async search(params = {}) {
    const { data } = await httpClient.get("/api/reservations", { params });
    return data;
  },

  async createForUser(userId, payload) {
    const { data } = await httpClient.post(`/api/reservations/user/${userId}`, payload);
    return data;
  },

  async cancel(reservationId) {
    const { data } = await httpClient.delete(`/api/reservations/${reservationId}`);
    return data;
  },

  async fulfill(reservationId) {
    const { data } = await httpClient.post(`/api/reservations/${reservationId}/fulfill`);
    return data;
  },

  async expire() {
    const { data } = await httpClient.post("/api/reservations/admin/expire");
    return data;
  },

  getUsers: adminLoansApi.getUsers,
  getBooks: adminLoansApi.getBooks,
};
