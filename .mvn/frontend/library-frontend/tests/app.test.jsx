import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it } from "vitest";
import App from "../src/App";
import AuthProvider from "../src/auth/AuthProvider";
import httpClient from "../src/api/httpClient";
import { ACCESS_TOKEN_KEY } from "../src/auth/session";

const profile = { id: 7, fullName: "Trần Mai", email: "mai@example.test", role: "ROLE_USER" };
function mount(path, role) {
  if (role) localStorage.setItem(ACCESS_TOKEN_KEY, `a.${btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 }))}.c`);
  httpClient.defaults.adapter = async (config) => ({
    config, status: 200, statusText: "OK", headers: {},
    data: config.url === "/api/user/profile" ? { ...profile, role }
      : config.url === "/api/genres" ? [] : { content: [], pageNumber: 0, totalPages: 0, totalElements: 0 },
  });
  return render(<MemoryRouter initialEntries={[path]}><AuthProvider><App /></AuthProvider></MemoryRouter>);
}
beforeEach(() => localStorage.clear());

it("khách xem kho sách công khai mà không phải đăng nhập", async () => {
  mount("/books");
  expect(await screen.findByText("Không tìm thấy sách phù hợp với bộ lọc.")).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Chào mừng bạn trở lại" })).toBeNull();
});
it("trang hồ sơ hiển thị tài khoản thật, menu đăng xuất hoạt động", async () => {
  mount("/profile", "ROLE_USER");
  expect(await screen.findByRole("heading", { name: "Hồ sơ cá nhân" })).toBeTruthy();
  expect(screen.getByText("mai@example.test")).toBeTruthy();
  expect(screen.queryByText("John Doe")).toBeNull();
  const ui = userEvent.setup();
  await ui.click(screen.getByRole("button", { name: "Mở menu tài khoản" }));
  await ui.click(await screen.findByRole("menuitem", { name: "Đăng xuất" }));
  expect(await screen.findByRole("heading", { name: "Chào mừng bạn trở lại" })).toBeTruthy();
});
it("admin đang đăng nhập được chuyển từ trang login đến khu vực quản trị", async () => {
  mount("/login", "ROLE_ADMIN");
  expect(await screen.findByRole("heading", { name: "Khu vực quản trị" })).toBeTruthy();
});
it("bạn đọc bị chặn khi nhập thẳng địa chỉ quản trị", async () => {
  mount("/admin", "ROLE_USER");
  expect(await screen.findByRole("heading", { name: "Bạn không có quyền truy cập" })).toBeTruthy();
});
it("tab phiếu mượn đã dịch và lọc theo trạng thái", async () => {
  mount("/my-loans", "ROLE_USER");
  await screen.findByRole("heading", { name: "Sách tôi đã mượn" });
  expect(screen.queryByText("My Borrowed Books")).toBeNull();
  await userEvent.setup().click(screen.getByRole("tab", { name: "Đã trả" }));
  await waitFor(() => expect(screen.queryByRole("button", { name: "Gia hạn sách" })).toBeNull());
});
it("thẻ đặt trước hiển thị nhãn tiếng Việt thay mã trạng thái", async () => {
  mount("/my-reservations", "ROLE_USER");
  await screen.findByRole("heading", { name: "Sách đã đặt trước" });
  expect(screen.getAllByText("Đang chờ").length).toBeGreaterThan(0);
  expect(screen.queryByText("PENDING")).toBeNull();
  expect(screen.queryByText("Total Reservation")).toBeNull();
});
