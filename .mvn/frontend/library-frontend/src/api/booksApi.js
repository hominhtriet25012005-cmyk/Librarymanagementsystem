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
};
