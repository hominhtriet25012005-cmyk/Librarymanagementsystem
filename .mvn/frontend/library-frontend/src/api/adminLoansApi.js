import httpClient from "./httpClient";

async function getAllBookPages(params) {
  const { data: firstPage } = await httpClient.get("/api/books", {
    params: { ...params, page: 0, size: 100, sortBy: "title", sortDirection: "ASC" },
  });
  if (!firstPage?.totalPages || firstPage.totalPages <= 1) return firstPage?.content || [];

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      httpClient.get("/api/books", {
        params: { ...params, page: index + 1, size: 100, sortBy: "title", sortDirection: "ASC" },
      }),
    ),
  );
  return [firstPage, ...remainingPages.map((response) => response.data)]
    .flatMap((page) => page.content || []);
}

export const adminLoansApi = {
  async search(payload = {}) {
    const { data } = await httpClient.post("/api/book-loans/search", payload);
    return data;
  },

  async checkoutForUser(userId, payload) {
    const { data } = await httpClient.post(`/api/book-loans/checkout/user/${userId}`, payload);
    return data;
  },

  async checkin(payload) {
    const { data } = await httpClient.post("/api/book-loans/checkin", payload);
    return data;
  },

  async renew(payload) {
    const { data } = await httpClient.post("/api/book-loans/renew", payload);
    return data;
  },

  async updateOverdue() {
    const { data } = await httpClient.post("/api/book-loans/admin/update-overdue");
    return data;
  },

  async getUsers() {
    const { data } = await httpClient.get("/api/user/list");
    return data;
  },

  async getBooks() {
    return getAllBookPages({ activeOnly: false });
  },

  async getAvailableBooks() {
    return getAllBookPages({ activeOnly: true, availableOnly: true });
  },
};
