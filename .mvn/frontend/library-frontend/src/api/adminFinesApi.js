import httpClient from "./httpClient";
import { adminLoansApi } from "./adminLoansApi";

async function getAllLoans() {
  const query = { page: 0, size: 100, sortBy: "createdAt", sortDirection: "DESC" };
  const firstPage = await adminLoansApi.search(query);
  if (!firstPage?.totalPages || firstPage.totalPages <= 1) return firstPage?.content || [];

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      adminLoansApi.search({ ...query, page: index + 1 }),
    ),
  );
  return [firstPage, ...remainingPages].flatMap((page) => page.content || []);
}

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
  getLoans: getAllLoans,
};
