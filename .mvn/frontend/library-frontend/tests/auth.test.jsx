import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import AuthProvider from "../src/auth/AuthProvider";
import { useAuth } from "../src/auth/AuthContext";
import { AdminRoute, GuestRoute, ProtectedRoute } from "../src/auth/RouteGuards";
import AuthPage from "../src/pages/Auth/AuthPage";
import httpClient from "../src/api/httpClient";
import { ACCESS_TOKEN_KEY, getAccessToken, setAccessToken } from "../src/auth/session";

const user = { id: 1, fullName: "Nguyễn An", email: "an@example.test", phone: "", role: "ROLE_USER" };
const jwt = (seconds = 3600, extra = {}) => `header.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds, ...extra }))}.signature`;
let handler;
const calls = [];
const response = (config, data) => ({ config, data, status: 200, statusText: "OK", headers: {} });
const reject = (config, status, message) => { throw new AxiosError("Thất bại", "ERR_BAD_RESPONSE", config, null, { config, data: { message }, status }); };

function PrivatePage() {
  const { user: current, logout } = useAuth();
  const location = useLocation();
  return <><p>Hồ sơ: {current.fullName}</p><p>{location.pathname + location.search}</p><button onClick={logout}>Đăng xuất</button></>;
}
function Harness({ path = "/login" }) {
  return <MemoryRouter initialEntries={[path]}><AuthProvider><Routes>
    <Route element={<GuestRoute />}>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
    </Route>
    <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
    <Route path="/reset-password" element={<AuthPage mode="reset" />} />
    <Route path="/forbidden" element={<p>Không đủ quyền</p>} />
    <Route element={<ProtectedRoute />}>
      <Route path="/" element={<PrivatePage />} />
      <Route path="/my-loans" element={<PrivatePage />} />
      <Route element={<AdminRoute />}><Route path="/admin" element={<p>Trang quản trị</p>} /></Route>
    </Route>
  </Routes></AuthProvider></MemoryRouter>;
}

beforeEach(() => {
  localStorage.clear();
  calls.length = 0;
  handler = (config) => config.url === "/api/user/profile" ? response(config, user) : response(config, {});
  httpClient.defaults.adapter = async (config) => {
    calls.push(config);
    return handler(config);
  };
});
afterEach(() => vi.useRealTimers());

const login = async (ui) => {
  await ui.type(await screen.findByLabelText("Email"), user.email);
  await ui.type(screen.getByLabelText("Mật khẩu", { exact: true }), "password123");
  await ui.click(screen.getByRole("button", { name: "Đăng nhập", exact: true }));
};

describe("Phiên đăng nhập và phân quyền", () => {
  it("chuyển khách đến đăng nhập, giữ đường dẫn và khôi phục bằng hồ sơ thật", async () => {
    const token = jwt();
    handler = (config) => response(config, config.url === "/auth/login" ? { jwt: token } : user);
    render(<Harness path="/my-loans?page=2" />);
    await login(userEvent.setup());
    expect(await screen.findByText("/my-loans?page=2")).toBeTruthy();
    expect(screen.getByText("Hồ sơ: Nguyễn An")).toBeTruthy();
    expect(calls.find((c) => c.url === "/auth/login").headers.Authorization).toBeUndefined();
    expect(calls.find((c) => c.url === "/api/user/profile").headers.Authorization).toBe(`Bearer ${token}`);
  });

  it("khôi phục hồ sơ sau khi tải lại trang", async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, jwt());
    render(<Harness path="/my-loans" />);
    expect(await screen.findByText("Hồ sơ: Nguyễn An")).toBeTruthy();
  });

  it("không tin quyền admin ghi trong payload JWT của bạn đọc", async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, jwt(3600, { authorities: "ROLE_ADMIN" }));
    render(<Harness path="/admin" />);
    expect(await screen.findByText("Không đủ quyền")).toBeTruthy();
  });

  it("cho phép quản trị viên vào khu vực quản trị", async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, jwt());
    handler = (config) => response(config, { ...user, role: "ROLE_ADMIN" });
    render(<Harness path="/admin" />);
    expect(await screen.findByText("Trang quản trị")).toBeTruthy();
  });

  it("bỏ JWT hết hạn trước khi gửi hồ sơ", async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, jwt(-10));
    render(<Harness path="/my-loans" />);
    expect(await screen.findByRole("heading", { name: "Chào mừng bạn trở lại" })).toBeTruthy();
    expect(getAccessToken()).toBeNull();
    expect(calls.length).toBe(0);
  });

  it("tự đăng xuất khi tới hạn JWT dù không có yêu cầu API", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout"] });
    localStorage.setItem(ACCESS_TOKEN_KEY, jwt(60));
    render(<Harness path="/my-loans" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(0); });
    expect(screen.getByText("Hồ sơ: Nguyễn An")).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(61000); });
    expect(screen.getByRole("heading", { name: "Chào mừng bạn trở lại" })).toBeTruthy();
    expect(getAccessToken()).toBeNull();
  });

  it("401 xóa phiên, 403 của API nghiệp vụ không xóa phiên", async () => {
    const token = jwt();
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    render(<Harness path="/my-loans" />);
    await screen.findByText("Hồ sơ: Nguyễn An");
    handler = (config) => reject(config, 403, "Không có quyền");
    await act(async () => { await httpClient.get("/api/payments").catch(() => {}); });
    expect(getAccessToken()).toBe(token);
    handler = (config) => reject(config, 401, "Phiên hết hạn");
    await act(async () => { await httpClient.get("/api/user/profile").catch(() => {}); });
    expect(await screen.findByRole("heading", { name: "Chào mừng bạn trở lại" })).toBeTruthy();
    expect(getAccessToken()).toBeNull();
  });

  it("phản hồi 401 cũ không xóa phiên mới", async () => {
    const old = jwt(300);
    const current = jwt(400);
    localStorage.setItem(ACCESS_TOKEN_KEY, old);
    let rejectRequest;
    handler = (config) => new Promise((_, fail) => {
      rejectRequest = () => fail(new AxiosError("Hết hạn", "ERR_BAD_RESPONSE", config, null, { status: 401, data: {} }));
    });
    const pending = httpClient.get("/api/user/profile").catch(() => {});
    await waitFor(() => expect(rejectRequest).toBeTypeOf("function"));
    localStorage.setItem(ACCESS_TOKEN_KEY, current);
    rejectRequest();
    await pending;
    expect(getAccessToken()).toBe(current);
  });

  it("mất mạng khi khôi phục cho phép thử lại, không cấp quyền từ dữ liệu cũ", async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, jwt());
    handler = () => { throw new AxiosError("Mất mạng"); };
    render(<Harness path="/my-loans" />);
    await screen.findByRole("button", { name: "Thử lại" });
    expect(screen.queryByText("Hồ sơ: Nguyễn An")).toBeNull();
    expect(getAccessToken()).toBeTruthy();
    handler = (config) => response(config, user);
    await userEvent.setup().click(screen.getByRole("button", { name: "Thử lại" }));
    expect(await screen.findByText("Hồ sơ: Nguyễn An")).toBeTruthy();
  });

  it("đăng xuất ở tab khác xóa thông tin trong tab hiện tại", async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, jwt());
    render(<Harness path="/my-loans" />);
    await screen.findByText("Hồ sơ: Nguyễn An");
    act(() => {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      window.dispatchEvent(new StorageEvent("storage", { key: ACCESS_TOKEN_KEY, newValue: null }));
    });
    expect(await screen.findByRole("heading", { name: "Chào mừng bạn trở lại" })).toBeTruthy();
  });

  it("hồ sơ trả về muộn không khôi phục phiên đã đăng xuất", async () => {
    localStorage.setItem(ACCESS_TOKEN_KEY, jwt());
    let finish;
    handler = (config) => new Promise((resolve) => { finish = () => resolve(response(config, user)); });
    render(<Harness path="/my-loans" />);
    await waitFor(() => expect(finish).toBeTypeOf("function"));
    await act(async () => { setAccessToken(null); finish(); });
    expect(await screen.findByRole("heading", { name: "Chào mừng bạn trở lại" })).toBeTruthy();
    expect(screen.queryByText("Hồ sơ: Nguyễn An")).toBeNull();
  });
});

describe("Biểu mẫu tài khoản", () => {
  it("hiển thị lỗi sai mật khẩu và cho phép gửi lại", async () => {
    handler = (config) => reject(config, 400, "Mật khẩu không đúng");
    render(<Harness />);
    await login(userEvent.setup());
    expect(await screen.findByRole("alert")).toHaveProperty("textContent", "Mật khẩu không đúng");
    expect(screen.getByRole("button", { name: "Đăng nhập", exact: true }).disabled).toBe(false);
    expect(getAccessToken()).toBeNull();
  });

  it("đăng ký kiểm tra xác nhận rồi chỉ gửi các trường backend nhận", async () => {
    handler = (config) => response(config, config.url === "/auth/signup" ? { jwt: jwt() } : user);
    render(<Harness path="/signup" />);
    const ui = userEvent.setup();
    await ui.type(await screen.findByLabelText("Họ và tên"), "Nguyễn An");
    await ui.type(screen.getByLabelText("Email"), user.email);
    await ui.type(screen.getByLabelText("Mật khẩu", { exact: true }), "password123");
    await ui.type(screen.getByLabelText("Xác nhận mật khẩu"), "khongkhop");
    await ui.click(screen.getByRole("button", { name: "Tạo tài khoản" }));
    expect(screen.getByText("Mật khẩu xác nhận chưa khớp.")).toBeTruthy();
    expect(calls.length).toBe(0);
    await ui.clear(screen.getByLabelText("Xác nhận mật khẩu"));
    await ui.type(screen.getByLabelText("Xác nhận mật khẩu"), "password123");
    await ui.click(screen.getByRole("button", { name: "Tạo tài khoản" }));
    await screen.findByText("Hồ sơ: Nguyễn An");
    const payload = JSON.parse(calls.find((c) => c.url === "/auth/signup").data);
    expect(payload).toEqual({ email: user.email, password: "password123", fullName: "Nguyễn An", phone: "" });
  });

  it("gửi yêu cầu quên mật khẩu bằng email và không kèm JWT", async () => {
    render(<Harness path="/forgot-password" />);
    const ui = userEvent.setup();
    await ui.type(screen.getByLabelText("Email"), user.email);
    await ui.click(screen.getByRole("button", { name: "Gửi đường dẫn" }));
    expect((await screen.findByRole("alert")).textContent).toContain("5 phút");
    const request = calls.find((c) => c.url === "/auth/forgot-password");
    expect(JSON.parse(request.data)).toEqual({ email: user.email });
    expect(request.headers.Authorization).toBeUndefined();
  });

  it("thiếu mã khôi phục không gửi yêu cầu đổi mật khẩu", () => {
    render(<Harness path="/reset-password" />);
    expect(screen.getByRole("alert").textContent).toContain("không có mã");
    expect(screen.queryByRole("button", { name: "Lưu mật khẩu mới" })).toBeNull();
  });

  it("đổi mật khẩu gửi đúng token/password và hiển thị kết quả tiếng Việt", async () => {
    render(<Harness path="/reset-password?token=reset-demo" />);
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: "newpassword" } });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu"), { target: { value: "newpassword" } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Lưu mật khẩu mới" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Đã đổi mật khẩu thành công");
    expect(JSON.parse(calls.find((c) => c.url === "/auth/reset-password").data))
      .toEqual({ token: "reset-demo", password: "newpassword" });
  });

  it("mã reset hết hạn hiển thị lỗi và đường dẫn yêu cầu mã mới", async () => {
    handler = (config) => reject(config, 400, "Mã đặt lại mật khẩu đã hết hạn");
    render(<Harness path="/reset-password?token=expired" />);
    fireEvent.change(screen.getByLabelText("Mật khẩu mới"), { target: { value: "newpassword" } });
    fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu"), { target: { value: "newpassword" } });
    await userEvent.setup().click(screen.getByRole("button", { name: "Lưu mật khẩu mới" }));
    expect((await screen.findByRole("alert")).textContent).toContain("hết hạn");
    expect(screen.getByRole("link", { name: "Yêu cầu đường dẫn mới" })).toBeTruthy();
  });
});
