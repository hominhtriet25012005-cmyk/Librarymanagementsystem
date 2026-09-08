import httpClient from "./httpClient";

export const adminApi = {
  async getDashboard() {
    const requests = [
      httpClient.get("/api/books/stats"),
      httpClient.get("/api/genres/count"),
      httpClient.get("/api/user/list"),
      httpClient.post("/api/book-loans/search", { page: 0, size: 6, sortBy: "createdAt", sortDirection: "DESC" }),
      httpClient.post("/api/book-loans/search", { status: "OVERDUE", page: 0, size: 1 }),
      httpClient.get("/api/reservations", { params: { activeOnly: true, page: 0, size: 1 } }),
      httpClient.get("/api/fines", { params: { status: "PENDING", page: 0, size: 1 } }),
    ];
    const results = await Promise.allSettled(requests);
    const dataAt = (index, fallback) => results[index].status === "fulfilled" ? results[index].value.data : fallback;

    return {
      bookStats: dataAt(0, { totalActiveBooks: 0, totalAvailableBooks: 0 }),
      genreCount: Number(dataAt(1, 0)) || 0,
      users: dataAt(2, []),
      recentLoans: dataAt(3, { content: [], totalElements: 0 }),
      overdueLoans: dataAt(4, { totalElements: 0 }),
      reservations: dataAt(5, { totalElements: 0 }),
      fines: dataAt(6, { totalElements: 0 }),
      hasPartialError: results.some((result) => result.status === "rejected"),
    };
  },
};
