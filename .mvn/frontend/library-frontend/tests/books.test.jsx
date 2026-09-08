import { render, screen, waitFor, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, expect, it } from "vitest";
import { AxiosError } from "axios";
import BookDetail from "../src/pages/Books/BookDetail";
import BookCard from "../src/pages/Books/BookCard";
import AuthProvider from "../src/auth/AuthProvider";
import httpClient from "../src/api/httpClient";
import { circulationApi } from "../src/api/circulationApi";
import { ACCESS_TOKEN_KEY } from "../src/auth/session";

const book = { id: 42, title: "Dế Mèn phiêu lưu ký", author: "Tô Hoài", isbn: "9786040000001", active: true, availableCopies: 2, totalCopies: 3, language: "vi", publicationDate: "2024-05-15" };
const plan = { id: 1, planName: "Bạn đọc", isActive: true, isValid: true, maxDaysPerBook: 7, maxBooksAllowed: 3 };
const originalAdapter = httpClient.defaults.adapter;
afterEach(() => { httpClient.defaults.adapter = originalAdapter; });
const pageOf = (items = []) => ({ content: items, totalPages: 1, pageNumber: 0 });
const fail = (config, status, message) => { throw new AxiosError(message, "ERR_BAD_REQUEST", config, null, { config, status, data: { message } }); };

function LoginDestination() {
  return <p>Đăng nhập rồi về {useLocation().state?.from}</p>;
}

function mount({ guest = false, data = book, subscription = plan, loans = [], reservations = [], path = "/books/42", intercept } = {}) {
  const calls = [];
  if (!guest) localStorage.setItem(ACCESS_TOKEN_KEY, `a.${btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 }))}.c`);
  httpClient.defaults.adapter = async (config) => {
    calls.push(config);
    const custom = intercept ? await intercept(config) : undefined;
    let result = custom;
    if (custom === undefined) {
      if (config.url === "/api/user/profile") result = { id: 1, role: "ROLE_USER", fullName: "Bạn đọc" };
      else if (config.url.startsWith("/api/books/")) result = data;
      else if (config.url === "/api/subscriptions/user/active") {
        if (!subscription) return fail(config, 400, "Không tìm thấy gói thành viên đang hoạt động");
        result = subscription;
      }
      else if (config.url === "/api/book-loans/my") result = pageOf(loans.filter((loan) => loan.status === config.params.status));
      else if (config.url === "/api/reservations/my") result = pageOf(reservations);
      else if (config.url === "/api/wishlist/my-wishlist") result = pageOf([]);
      else if (config.url === "/api/reviews/book/42") result = pageOf([]);
      else if (config.url === "/api/book-loans/checkout") result = { id: 501, bookId: 42, dueDate: "2026-12-20" };
      else if (config.url === "/api/reservations") result = { id: 601, bookId: 42, queuePosition: 2 };
      else throw new Error(`API chưa được mô phỏng: ${config.url}`);
    }
    return { config, status: 200, statusText: "OK", headers: {}, data: result };
  };
  render(<MemoryRouter initialEntries={[path]}><AuthProvider><Routes>
    <Route path="/books/:id" element={<BookDetail />} />
    <Route path="/login" element={<LoginDestination />} />
  </Routes></AuthProvider></MemoryRouter>);
  return calls;
}

it("thẻ sách mở đúng địa chỉ chi tiết", () => {
  render(<MemoryRouter><BookCard book={book} /></MemoryRouter>);
  expect(screen.getByRole("link", { name: "Xem chi tiết" }).getAttribute("href")).toBe("/books/42");
});

it("khách xem thông tin tiếng Việt và đăng nhập giữ lại địa chỉ sách", async () => {
  const calls = mount({ guest: true });
  await screen.findByRole("heading", { name: book.title });
  expect(screen.getByText("Tiếng Việt")).toBeTruthy();
  expect(screen.getByText("15/5/2024")).toBeTruthy();
  expect(screen.getByText("Chưa có ảnh bìa")).toBeTruthy();
  await userEvent.setup().click(await screen.findByRole("link", { name: "Đăng nhập" }));
  expect(await screen.findByText("Đăng nhập rồi về /books/42")).toBeTruthy();
  expect(calls.some((call) => call.url.includes("/my"))).toBe(false);
});

it("ảnh hỏng chuyển sang bìa dự phòng", async () => {
  mount({ guest: true, data: { ...book, coverImageUrl: "https://example.test/missing.jpg" } });
  fireEvent.error(await screen.findByRole("img"));
  expect(screen.getByText("Chưa có ảnh bìa")).toBeTruthy();
});

it("địa chỉ sách không hợp lệ không gọi API sách", async () => {
  const calls = mount({ guest: true, path: "/books/abc" });
  expect(await screen.findByText("Đường dẫn sách không hợp lệ.")).toBeTruthy();
  expect(calls.some((call) => call.url.startsWith("/api/books/"))).toBe(false);
});

it("hiển thị lỗi sách không tồn tại và cho thử lại", async () => {
  let failed = true;
  mount({ guest: true, intercept: (config) => {
    if (config.url.startsWith("/api/books/") && failed) return fail(config, 400, "Không tìm thấy sách");
  } });
  await screen.findByText("Không tìm thấy sách");
  failed = false;
  await userEvent.setup().click(screen.getByRole("button", { name: "Thử lại" }));
  expect(await screen.findByRole("heading", { name: book.title })).toBeTruthy();
});

it("mượn có xác nhận, kiểm tra số ngày, gửi đúng dữ liệu và làm mới sách", async () => {
  const calls = mount();
  const ui = userEvent.setup();
  const days = await screen.findByRole("spinbutton", { name: "Số ngày mượn" });
  expect(days.value).toBe("7");
  await ui.clear(days);
  await ui.type(days, "8");
  expect(screen.getByRole("button", { name: "Mượn sách" }).disabled).toBe(true);
  await ui.clear(days);
  await ui.type(days, "3");
  await ui.type(screen.getByRole("textbox", { name: "Ghi chú (không bắt buộc)" }), " Đọc tại nhà ");
  await ui.click(screen.getByRole("button", { name: "Mượn sách" }));
  expect(calls.filter((call) => call.method === "post")).toHaveLength(0);
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xác nhận" }));
  expect(await screen.findByText(/Mượn sách thành công. Mã phiếu: 501/)).toBeTruthy();
  const writes = calls.filter((call) => call.method === "post");
  expect(writes).toHaveLength(1);
  expect(JSON.parse(writes[0].data)).toEqual({ bookId: 42, checkoutDays: 3, notes: "Đọc tại nhà" });
  expect(writes[0].headers.Authorization).toMatch(/^Bearer /);
  await waitFor(() => expect(calls.filter((call) => call.url === "/api/books/42").length).toBe(2));
  expect(screen.queryByRole("button", { name: "Mượn sách" })).toBeNull();
});

it("đóng xác nhận không tạo phiếu", async () => {
  const calls = mount();
  const ui = userEvent.setup();
  await ui.click(await screen.findByRole("button", { name: "Mượn sách" }));
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Quay lại" }));
  expect(calls.filter((call) => call.method === "post")).toHaveLength(0);
});

it.each([
  [{ subscription: null }, /Bạn cần gói thành viên còn hiệu lực/],
  [{ data: { ...book, active: false } }, /Sách này đang ngừng cho mượn/],
  [{ loans: [{ bookId: 42, status: "CHECKED_OUT", dueDate: "2026-12-20" }] }, /Bạn đang mượn cuốn sách này/],
  [{ reservations: [{ bookId: 42, status: "PENDING", queuePosition: 3 }] }, /Bạn đã đặt trước cuốn sách này, vị trí hàng chờ: 3/],
  [{ reservations: [{ bookId: 42, status: "AVAILABLE", availableUntil: "2026-12-20T10:00:00" }] }, /Sách đã được giữ cho bạn/],
  [{ loans: [{ bookId: 99, status: "OVERDUE" }] }, /Vui lòng trả sách quá hạn/],
  [{ subscription: { ...plan, maxBooksAllowed: 1 }, loans: [{ bookId: 99, status: "CHECKED_OUT", dueDate: "2099-01-01" }] }, /Bạn đã mượn đủ số sách tối đa/],
])("ngăn thao tác không đủ điều kiện: %j", async (options, message) => {
  mount(options);
  expect(await screen.findByText(message)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Mượn sách" })).toBeNull();
});

it("hết sách vẫn đặt trước được khi chưa có gói, hiển thị vị trí hàng chờ", async () => {
  const calls = mount({ subscription: null, data: { ...book, availableCopies: 0 } });
  const ui = userEvent.setup();
  await ui.click(await screen.findByRole("button", { name: "Đặt trước sách" }));
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xác nhận" }));
  expect(await screen.findByText(/Đặt trước thành công. Mã đặt trước: 601. Vị trí hàng chờ: 2/)).toBeTruthy();
  expect(JSON.parse(calls.find((call) => call.method === "post").data)).toEqual({ bookId: 42 });
});

it("không đặt thêm khi đã có 5 đặt trước", async () => {
  mount({ data: { ...book, availableCopies: 0 }, reservations: Array.from({ length: 5 }, (_, id) => ({ bookId: id, status: "PENDING" })) });
  expect(await screen.findByText(/Bạn đã có 5 đặt trước đang hoạt động/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Đặt trước sách" })).toBeNull();
});

it("máy chủ báo các bản sách đang giữ chỗ thì chuyển sang đặt trước", async () => {
  mount({ intercept: (config) => {
    if (config.url === "/api/book-loans/checkout") return fail(config, 400, "Các bản sách còn lại đang được giữ cho người đã đặt chỗ");
  } });
  const ui = userEvent.setup();
  await ui.click(await screen.findByRole("button", { name: "Mượn sách" }));
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xác nhận" }));
  expect(await screen.findByRole("button", { name: "Đặt trước sách" })).toBeTruthy();
  expect(screen.queryByText(/Mượn sách thành công/)).toBeNull();
});

it("mất phản hồi phải kiểm tra phiếu, không gửi lại ngay gây trùng", async () => {
  let created = false;
  const calls = mount({ intercept: (config) => {
    if (config.url === "/api/book-loans/checkout") { created = true; throw new AxiosError("Network Error", "ERR_NETWORK", config); }
    if (created && config.url === "/api/book-loans/my" && config.params.status === "CHECKED_OUT") return pageOf([{ bookId: 42, status: "CHECKED_OUT", dueDate: "2026-12-20" }]);
  } });
  const ui = userEvent.setup();
  await ui.click(await screen.findByRole("button", { name: "Mượn sách" }));
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xác nhận" }));
  await ui.click(await screen.findByRole("button", { name: "Kiểm tra lại" }));
  expect(await screen.findByText(/Bạn đang mượn cuốn sách này/)).toBeTruthy();
  expect(calls.filter((call) => call.method === "post")).toHaveLength(1);
});

it("không gửi trùng khi nhấn xác nhận nhiều lần trong lúc đang chờ", async () => {
  let finish;
  const calls = mount({ intercept: (config) => config.url === "/api/book-loans/checkout"
    ? new Promise((resolve) => { finish = resolve; }) : undefined });
  const ui = userEvent.setup();
  await ui.click(await screen.findByRole("button", { name: "Mượn sách" }));
  await ui.dblClick(within(screen.getByRole("dialog")).getByRole("button", { name: "Xác nhận" }));
  expect(calls.filter((call) => call.method === "post")).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Đang xử lý..." }).disabled).toBe(true);
  finish({ id: 501, dueDate: "2026-12-20" });
  await screen.findByText(/Mượn sách thành công/);
});

it("lỗi tải gói không bị hiểu nhầm thành chưa đăng ký và cho thử lại", async () => {
  let offline = true;
  mount({ intercept: (config) => {
    if (offline && config.url === "/api/subscriptions/user/active") return fail(config, 500, "Internal error");
  } });
  expect(await screen.findByText("Hệ thống tạm thời gặp sự cố. Vui lòng thử lại sau.")).toBeTruthy();
  expect(screen.queryByText(/Bạn cần gói thành viên/)).toBeNull();
  offline = false;
  await userEvent.setup().click(screen.getByRole("button", { name: "Thử lại" }));
  expect(await screen.findByRole("button", { name: "Mượn sách" })).toBeTruthy();
});

it("đọc hết các trang phiếu đang hoạt động", async () => {
  const requested = [];
  httpClient.defaults.adapter = async (config) => {
    requested.push(config.params.page);
    return { config, status: 200, headers: {}, data: { content: [{ id: config.params.page }], totalPages: 2 } };
  };
  expect(await circulationApi.activeReservations()).toEqual([{ id: 0 }, { id: 1 }]);
  expect(requested).toEqual([0, 1]);
});
