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
};
