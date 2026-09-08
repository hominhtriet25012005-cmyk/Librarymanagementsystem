import { expect, it } from "vitest";
import { isTokenExpired, safeReturnPath } from "../src/auth/session";
import { formatDate, statusLabel } from "../src/utils/locale";

it("JWT lỗi định dạng hoặc thiếu exp đều không có hiệu lực", () => {
  expect(isTokenExpired("bad")).toBe(true);
  expect(isTokenExpired("a." + btoa("{}") + ".c")).toBe(true);
});
it("không chuyển hướng đến website bên ngoài hoặc quay vòng trang đăng nhập", () => {
  for (const path of ["https://evil.test", "//evil.test", "/\\evil.test", "/login", "/signup?next=x"]) {
    expect(safeReturnPath(path)).toBe("/");
  }
  expect(safeReturnPath("/my-loans?page=2")).toBe("/my-loans?page=2");
});
it("trạng thái và ngày tháng hiển thị tiếng Việt", () => {
  expect(statusLabel("CHECKED_OUT")).toBe("Đang mượn");
  expect(statusLabel("FULFILLED")).toBe("Đã nhận");
  expect(statusLabel("unknown")).toBe("Chưa xác định");
  expect(formatDate(null)).toBe("Chưa có");
  expect(formatDate("2026-09-08T12:00:00")).toBe("8/9/2026");
});
