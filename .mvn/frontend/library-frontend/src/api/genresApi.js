import httpClient from "./httpClient";

export const genresApi = {
  async getAll() {
    const { data } = await httpClient.get("/api/genres");
    return data;
  },

  async getById(genreId) {
    const { data } = await httpClient.get(`/api/genres/${genreId}`);
    return data;
  },

  async getTopLevel() {
    const { data } = await httpClient.get("/api/genres/top-level");
    return data;
  },

  async create(payload) {
    const { data } = await httpClient.post("/api/genres/create", payload);
    return data;
  },

  async update(genreId, payload) {
    const { data } = await httpClient.put(`/api/genres/${genreId}`, payload);
    return data;
  },

  async deactivate(genreId) {
    const { data } = await httpClient.delete(`/api/genres/${genreId}`);
    return data;
  },

  async getBookCount(genreId) {
    const { data } = await httpClient.get(`/api/genres/${genreId}/book-count`);
    return Number(data) || 0;
  },
};
