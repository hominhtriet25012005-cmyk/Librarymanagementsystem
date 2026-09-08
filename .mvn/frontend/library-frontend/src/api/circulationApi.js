import httpClient from "./httpClient";

// Đọc hết các trang đang hoạt động để không bỏ sót phiếu ở trang sau.
async function readAll(path, params) {
  const items = [];
  let page = 0;
  let totalPages;
  do {
    const { data } = await httpClient.get(path, { params: { ...params, page, size: 100 } });
    items.push(...data.content);
    totalPages = data.totalPages;
    page += 1;
  } while (page < totalPages);
  return items;
}

export const circulationApi = {
  async activeSubscription() {
    try {
      const { data } = await httpClient.get("/api/subscriptions/user/active");
      return data;
    } catch (error) {
      // Backend hiện dùng HTTP 400 cho trường hợp chưa có gói, không dùng 404.
      if (error.response?.status === 400 && error.response.data?.message === "Không tìm thấy gói thành viên đang hoạt động") return null;
      throw error;
    }
  },
  async activeLoans() {
    const pages = await Promise.all(["CHECKED_OUT", "OVERDUE"].map((status) =>
      readAll("/api/book-loans/my", { status })));
    return pages.flat();
  },
  activeReservations() {
    return readAll("/api/reservations/my", { activeOnly: true });
  },
  async checkout(payload) {
    const { data } = await httpClient.post("/api/book-loans/checkout", payload);
    return data;
  },
  async reserve(payload) {
    const { data } = await httpClient.post("/api/reservations", payload);
    return data;
  },
};
