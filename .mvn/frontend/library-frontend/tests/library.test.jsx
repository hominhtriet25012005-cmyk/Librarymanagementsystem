import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it } from "vitest";
import httpClient from "../src/api/httpClient";
import MyLoans from "../src/pages/Loans/MyLoans";
import MyReservations from "../src/pages/Reservations/MyReservations";
import MyFines from "../src/pages/Fines/MyFines";
import WishlistPage from "../src/pages/Wishlist/WishlistPage";
import BookReviews from "../src/pages/Books/BookReviews";
import WishlistButton from "../src/pages/Books/WishlistButton";

const originalAdapter = httpClient.defaults.adapter;
afterEach(() => { httpClient.defaults.adapter = originalAdapter; });
const pageOf = (content, extra = {}) => ({ content, pageNumber: 0, totalPages: content.length ? 1 : 0, totalElements: content.length, ...extra });
const response = (config, data) => ({ config, data, status: 200, statusText: "OK", headers: {} });

it("tải phiếu thật, không cho bạn đọc tự trả và gửi đúng yêu cầu gia hạn", async () => {
  const calls = [];
  const loan = { id: 11, bookId: 42, bookTitle: "Dế Mèn", bookAuthor: "Tô Hoài", bookIsbn: "123", status: "CHECKED_OUT", checkoutDate: "2026-09-01", dueDate: "2026-09-10", renewalCount: 0, maxRenewals: 2, isOverdue: false };
  httpClient.defaults.adapter = async (config) => {
    calls.push(config);
    if (config.url === "/api/subscriptions/user/active") return response(config, { isValid: true, maxDaysPerBook: 7 });
    if (config.url === "/api/book-loans/renew") return response(config, { ...loan, dueDate: "2026-09-15", renewalCount: 1 });
    return response(config, pageOf([loan]));
  };
  render(<MemoryRouter><MyLoans /></MemoryRouter>);
  expect(await screen.findByText("Dế Mèn")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Trả sách/ })).toBeNull();
  const ui = userEvent.setup();
  await ui.click(screen.getByRole("button", { name: "Gia hạn" }));
  expect(screen.getByRole("spinbutton", { name: "Số ngày gia hạn" }).value).toBe("7");
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xác nhận gia hạn" }));
  expect(await screen.findByText(/Gia hạn thành công/)).toBeTruthy();
  const write = calls.find((call) => call.url === "/api/book-loans/renew");
  expect(JSON.parse(write.data)).toEqual({ bookLoanId: 11, extensionDays: 7 });
});

it("lọc phiếu mượn theo tab bằng tham số backend", async () => {
  const calls = [];
  httpClient.defaults.adapter = async (config) => { calls.push(config); return response(config, config.url.includes("subscriptions") ? null : pageOf([])); };
  render(<MemoryRouter><MyLoans /></MemoryRouter>);
  await screen.findByText("Không có phiếu mượn ở trạng thái này.");
  await userEvent.setup().click(screen.getByRole("tab", { name: "Đã trả" }));
  await screen.findByText("Không có phiếu mượn ở trạng thái này.");
  expect(calls.some((call) => call.url === "/api/book-loans/my" && call.params.status === "RETURNED")).toBe(true);
});

it("hủy đặt trước sau bước xác nhận", async () => {
  const calls = [];
  const reservation = { id: 21, bookId: 42, bookTitle: "Dế Mèn", status: "PENDING", reservedAt: "2026-09-08 10:30:00", canBeCancelled: true };
  httpClient.defaults.adapter = async (config) => { calls.push(config); return response(config, config.method === "delete" ? { ...reservation, status: "CANCELLED" } : pageOf([reservation])); };
  render(<MemoryRouter><MyReservations /></MemoryRouter>);
  const ui = userEvent.setup();
  await ui.click(await screen.findByRole("button", { name: "Hủy đặt trước" }));
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Hủy đặt trước" }));
  expect(await screen.findByText(/Đã hủy đặt trước sách/)).toBeTruthy();
  expect(calls.filter((call) => call.method === "delete").map((call) => call.url)).toEqual(["/api/reservations/21"]);
});

it("danh sách yêu thích dùng dữ liệu sách lồng nhau và xóa sau xác nhận", async () => {
  const calls = [];
  const item = { id: 31, addedAt: "2026-09-08T09:00:00", notes: "Đọc cuối tuần", book: { id: 42, title: "Dế Mèn", author: "Tô Hoài" } };
  let items = [item];
  httpClient.defaults.adapter = async (config) => { calls.push(config); if (config.method === "delete") items = []; return response(config, config.method === "delete" ? { status: true } : pageOf(items)); };
  render(<MemoryRouter><WishlistPage /></MemoryRouter>);
  expect(await screen.findByText("Đọc cuối tuần", { exact: false })).toBeTruthy();
  const ui = userEvent.setup();
  await ui.click(screen.getByRole("button", { name: "Bỏ yêu thích" }));
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Bỏ yêu thích" }));
  expect(await screen.findByText(/Đã bỏ “Dế Mèn”/)).toBeTruthy();
  expect(calls.find((call) => call.method === "delete").url).toBe("/api/wishlist/remove/42");
});

it("thêm và bỏ yêu thích ngay tại trang sách", async () => {
  const calls = [];
  let items = [];
  httpClient.defaults.adapter = async (config) => {
    calls.push(config);
    if (config.method === "post") { const created = { id: 31, book: { id: 42 } }; items = [created]; return response(config, created); }
    if (config.method === "delete") { items = []; return response(config, { status: true }); }
    return response(config, pageOf(items));
  };
  render(<WishlistButton bookId={42} />);
  const ui = userEvent.setup();
  await ui.click(await screen.findByRole("button", { name: "Thêm vào yêu thích" }));
  expect(await screen.findByRole("button", { name: "Bỏ yêu thích" })).toBeTruthy();
  await ui.click(screen.getByRole("button", { name: "Bỏ yêu thích" }));
  expect(await screen.findByRole("button", { name: "Thêm vào yêu thích" })).toBeTruthy();
  expect(calls.filter((call) => call.method === "post").map((call) => call.url)).toEqual(["/api/wishlist/add/42"]);
  expect(calls.filter((call) => call.method === "delete").map((call) => call.url)).toEqual(["/api/wishlist/remove/42"]);
});

it("tạo liên kết phạt nhưng chỉ mở khi người dùng bấm liên kết HTTPS", async () => {
  const calls = [];
  const fine = { id: 41, bookLoanId: 11, bookTitle: "Dế Mèn", type: "OVERDUE", status: "PENDING", amount: 100, amountPaid: 0, amountOutstanding: 100, createdAt: "2026-09-08T09:00:00", reason: "Trả muộn" };
  httpClient.defaults.adapter = async (config) => { calls.push(config); return response(config, config.method === "post" ? { paymentId: 9, amount: 100, transactionId: "TXN_9", checkoutUrl: "https://rzp.io/i/demo" } : [fine]); };
  render(<MemoryRouter><MyFines /></MemoryRouter>);
  const ui = userEvent.setup();
  await ui.click(await screen.findByRole("button", { name: "Thanh toán" }));
  expect(calls.some((call) => call.method === "post")).toBe(false);
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Tạo liên kết" }));
  const link = await screen.findByRole("link", { name: "Tiếp tục đến Razorpay" });
  expect(link.getAttribute("href")).toBe("https://rzp.io/i/demo");
  expect(link.getAttribute("target")).toBe("_blank");
  expect(calls.filter((call) => call.method === "post")).toHaveLength(1);
});

it("không hiển thị liên kết thanh toán không an toàn", async () => {
  const fine = { id: 41, status: "PENDING", amount: 100, amountOutstanding: 100 };
  httpClient.defaults.adapter = async (config) => response(config, config.method === "post" ? { checkoutUrl: "javascript:alert(1)" } : [fine]);
  render(<MemoryRouter><MyFines /></MemoryRouter>);
  const ui = userEvent.setup();
  await ui.click(await screen.findByRole("button", { name: "Thanh toán" }));
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Tạo liên kết" }));
  expect(await screen.findByText("Máy chủ không trả về liên kết thanh toán HTTPS hợp lệ.")).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Tiếp tục đến Razorpay" })).toBeNull();
});

it("khách xem được đánh giá mà không gọi lịch sử mượn", async () => {
  const calls = [];
  httpClient.defaults.adapter = async (config) => { calls.push(config); return response(config, pageOf([{ id: 1, userId: 2, userName: "Minh", bookId: 42, rating: 5, title: "Rất hay", reviewText: "Nội dung rất cuốn hút.", createdAt: "2026-09-08 08:00:00" }])); };
  render(<BookReviews bookId={42} authStatus="guest" user={null} />);
  expect(await screen.findByText("Nội dung rất cuốn hút.")).toBeTruthy();
  expect(calls.every((call) => call.url.startsWith("/api/reviews/"))).toBe(true);
  expect(screen.queryByRole("button", { name: "Viết đánh giá" })).toBeNull();
});

it("người đã trả sách viết đánh giá và frontend gửi đúng giới hạn", async () => {
  const calls = [];
  let reviews = [];
  httpClient.defaults.adapter = async (config) => {
    calls.push(config);
    if (config.url === "/api/book-loans/my") return response(config, pageOf([{ bookId: 42, status: "RETURNED" }]));
    if (config.method === "post") { reviews = [{ id: 1, userId: 7, userName: "Mai", bookId: 42, rating: 5, title: "Tuổi thơ", reviewText: "Một cuốn sách rất đáng đọc.", createdAt: "2026-09-08 08:00:00" }]; return response(config, reviews[0]); }
    return response(config, pageOf(reviews));
  };
  render(<BookReviews bookId={42} authStatus="authenticated" user={{ id: 7 }} />);
  const ui = userEvent.setup();
  await ui.click(await screen.findByRole("button", { name: "Viết đánh giá" }));
  await ui.type(screen.getByRole("textbox", { name: "Tiêu đề (không bắt buộc)" }), "Tuổi thơ");
  await ui.type(screen.getByRole("textbox", { name: "Nội dung đánh giá" }), "Một cuốn sách rất đáng đọc.");
  await ui.click(screen.getByRole("button", { name: "Lưu đánh giá" }));
  expect(await screen.findByText("Đã đăng đánh giá.")).toBeTruthy();
  const write = calls.find((call) => call.method === "post");
  expect(JSON.parse(write.data)).toEqual({ bookId: 42, rating: 5, title: "Tuổi thơ", reviewText: "Một cuốn sách rất đáng đọc." });
});

it("chủ đánh giá có thể sửa và xóa, người khác thì không", async () => {
  const calls = [];
  let reviews = [{ id: 5, userId: 7, userName: "Mai", bookId: 42, rating: 4, reviewText: "Bài đánh giá ban đầu.", createdAt: "2026-09-08 08:00:00" }, { id: 6, userId: 8, userName: "An", bookId: 42, rating: 5, reviewText: "Đánh giá của người khác.", createdAt: "2026-09-07 08:00:00" }];
  httpClient.defaults.adapter = async (config) => {
    calls.push(config);
    if (config.url === "/api/book-loans/my") return response(config, pageOf([{ bookId: 42 }]));
    if (config.method === "put") return response(config, reviews[0]);
    if (config.method === "delete") { reviews = reviews.slice(1); return response(config, { status: true }); }
    return response(config, pageOf(reviews));
  };
  render(<BookReviews bookId={42} authStatus="authenticated" user={{ id: 7 }} />);
  expect((await screen.findAllByRole("button", { name: "Sửa" })).length).toBe(1);
  expect(screen.getAllByRole("button", { name: "Xóa" })).toHaveLength(1);
  const ui = userEvent.setup();
  await ui.click(screen.getByRole("button", { name: "Xóa" }));
  await ui.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Xóa đánh giá" }));
  expect(await screen.findByText("Đã xóa đánh giá.")).toBeTruthy();
  expect(calls.find((call) => call.method === "delete").url).toBe("/api/reviews/5");
});
