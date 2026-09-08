import { Button, Chip } from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { formatDate } from "../../utils/locale";
export default function ProfilePage() {
  const { user, isAdmin, logout } = useAuth();
  return <section className="mx-auto max-w-2xl rounded-2xl border bg-white p-6 sm:p-8">
    <h1 className="mb-2 text-3xl font-bold">Hồ sơ cá nhân</h1>
    <p className="mb-6 text-slate-600">Thông tin tài khoản đang đăng nhập.</p>
    <Chip label={isAdmin ? "Quản trị viên" : "Bạn đọc"} color="primary" />
    <dl className="my-6 grid gap-5 sm:grid-cols-2">
      {Object.entries({ "Họ và tên": user.fullName, "Email": user.email, "Số điện thoại": user.phone || "Chưa cập nhật",
        "Đăng nhập gần nhất": formatDate(user.lastLogin) }).map(([label, value]) =>
        <div key={label}><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold">{value}</dd></div>)}
    </dl>
    <div className="flex flex-wrap gap-3">
      <Button component={Link} to="/forgot-password" variant="outlined">Đặt lại mật khẩu</Button>
      <Button onClick={logout} color="error">Đăng xuất</Button>
    </div>
  </section>;
}
