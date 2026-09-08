import { Alert, Button, CircularProgress } from "@mui/material";
import { Link, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { safeReturnPath } from "./session";

export function SessionStatus() {
  const { status, error, retry, logout } = useAuth();
  if (status === "error") return (
    <section className="mx-auto max-w-lg p-6">
      <Alert severity="error">{error}</Alert>
      <div className="mt-4 flex gap-3">
        <Button onClick={retry} variant="contained">Thử lại</Button>
        <Button onClick={logout}>Đăng xuất</Button>
      </div>
    </section>
  );
  return <div role="status" className="flex min-h-64 items-center justify-center gap-3">
    <CircularProgress size={24} /> Đang kiểm tra phiên đăng nhập...
  </div>;
}

export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "loading" || status === "error") return <SessionStatus />;
  if (status !== "authenticated") return <Navigate to="/login" replace state={{
    from: location.pathname + location.search + location.hash,
  }} />;
  return <Outlet />;
}

export function AdminRoute() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Outlet /> : <Navigate to="/forbidden" replace />;
}

export function GuestRoute() {
  const { status, isAdmin } = useAuth();
  const location = useLocation();
  if (status === "loading" || status === "error") return <SessionStatus />;
  if (status === "authenticated") {
    return <Navigate to={safeReturnPath(location.state?.from, isAdmin ? "/admin" : "/")} replace />;
  }
  return <Outlet />;
}

export function ForbiddenPage() {
  return <section className="p-8 text-center">
    <h1 className="text-3xl font-bold">Bạn không có quyền truy cập</h1>
    <p className="my-4">Trang này chỉ dành cho quản trị viên.</p>
    <Button component={Link} to="/" variant="contained">Về trang tổng quan</Button>
  </section>;
}
