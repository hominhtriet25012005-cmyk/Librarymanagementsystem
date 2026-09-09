import httpClient from "./httpClient";

const compact = (params = {}) => Object.fromEntries(
  Object.entries(params).filter(([, value]) => value !== "" && value != null),
);

async function readEveryPage(path, params = {}) {
  const items = [];
  let page = 0;
  let totalPages = 1;
  do {
    const { data } = await httpClient.get(path, { params: { ...compact(params), page, size: 100 } });
    items.push(...(data.content || []));
    totalPages = Math.max(Number(data.totalPages) || 0, 1);
    page += 1;
  } while (page < totalPages);
  return items;
}

export const loansApi = {
  async getMine(params = {}) {
    const { data } = await httpClient.get("/api/book-loans/my", { params: compact(params) });
    return data;
  },
  async getAllMine(status) {
    return readEveryPage("/api/book-loans/my", { status });
  },
  async renew(payload) {
    const { data } = await httpClient.post("/api/book-loans/renew", payload);
    return data;
  },
};

export const reservationsApi = {
  getAllMine(params = {}) { return readEveryPage("/api/reservations/my", params); },
  async getMine(params = {}) {
    const { data } = await httpClient.get("/api/reservations/my", { params: compact(params) });
    return data;
  },
  async cancel(id) {
    const { data } = await httpClient.delete(`/api/reservations/${id}`);
    return data;
  },
};

export const wishlistApi = {
  getAllMine() { return readEveryPage("/api/wishlist/my-wishlist"); },
  async getMine(params = {}) {
    const { data } = await httpClient.get("/api/wishlist/my-wishlist", { params: compact(params) });
    return data;
  },
  async add(bookId, notes) {
    const { data } = await httpClient.post(`/api/wishlist/add/${bookId}`, null, {
      params: compact({ notes: notes?.trim() }),
    });
    return data;
  },
  async remove(bookId) {
    const { data } = await httpClient.delete(`/api/wishlist/remove/${bookId}`);
    return data;
  },
};

export const reviewsApi = {
  getAllForBook(bookId) { return readEveryPage(`/api/reviews/book/${bookId}`); },
  async create(payload) {
    const { data } = await httpClient.post("/api/reviews", payload);
    return data;
  },
  async update(id, payload) {
    const { data } = await httpClient.put(`/api/reviews/${id}`, payload);
    return data;
  },
  async remove(id) {
    const { data } = await httpClient.delete(`/api/reviews/${id}`);
    return data;
  },
};

export const finesApi = {
  async getMine(params = {}) {
    const { data } = await httpClient.get("/api/fines/my", { params: compact(params) });
    return data;
  },
  async createPayment(fineId) {
    const { data } = await httpClient.post(`/api/fines/${fineId}/pay`);
    return data;
  },
};
