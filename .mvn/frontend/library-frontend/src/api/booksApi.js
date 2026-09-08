import httpClient from "./httpClient";

const removeEmptyParams = (params) =>
  Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== "" && value != null),
  );

export const booksApi = {
  async search(params = {}) {
    const { data } = await httpClient.get("/api/books", {
      params: removeEmptyParams(params),
    });
    return data;
  },

  async getById(bookId) {
    const { data } = await httpClient.get(`/api/books/${bookId}`);
    return data;
  },

  async getStats() {
    const { data } = await httpClient.get("/api/books/stats");
    return data;
  },

  async createAdmin(payload) {
    const { data } = await httpClient.post("/api/books/admin", payload);
    return data;
  },

  async updateAdmin(bookId, payload) {
    const { data } = await httpClient.put(`/api/books/${bookId}`, payload);
    return data;
  },

  async deactivateAdmin(bookId) {
    const { data } = await httpClient.delete(`/api/books/${bookId}`);
    return data;
  },
};
