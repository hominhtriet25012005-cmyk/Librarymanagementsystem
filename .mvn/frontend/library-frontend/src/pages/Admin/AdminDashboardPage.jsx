import { useEffect, useState } from "react";
import { Alert, Button, Card, Chip, CircularProgress } from "@mui/material";
import {
  AutoStories,
  CardMembership,
  Category,
  EventBusy,
  Group,
  MenuBook,
  ReceiptLong,
} from "@mui/icons-material";
import { Link } from "react-router-dom";
import { adminApi, getApiErrorMessage } from "../../api";

const STATUS_LABELS = {
  CHECKED_OUT: "Đang mượn",
  RETURNED: "Đã trả",
  OVERDUE: "Quá hạn",
  LOST: "Bị mất",
  DAMAGED: "Hư hỏng",
};

const STATUS_COLORS = {
  CHECKED_OUT: "primary",
  RETURNED: "success",
  OVERDUE: "error",
  LOST: "warning",
  DAMAGED: "warning",
};

function MetricCard({ icon, label, value, hint, color }) {
  return <Card className="p-5">
    <div className="flex items-start justify-between gap-4">
      <div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p><p className="mt-2 text-xs text-slate-500">{hint}</p></div>
      <div className={`rounded-xl p-3 ${color}`}>{icon}</div>
    </div>
  </Card>;
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    adminApi.getDashboard()
      .then((result) => { if (active) setDashboard(result); })
      .catch((requestError) => { if (active) setError(getApiErrorMessage(requestError, "Không tải được số liệu quản trị.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);

  if (loading) return <div className="flex min-h-96 items-center justify-center"><CircularProgress aria-label="Đang tải tổng quan quản trị" /></div>;
  if (error) return <section className="p-8"><Alert severity="error" action={<Button onClick={() => { setLoading(true); setError(""); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert></section>;

  const metrics = [
    { label: "Sách đang hoạt động", value: dashboard.bookStats.totalActiveBooks, hint: "Đầu sách trong kho", icon: <MenuBook className="text-indigo-700" />, color: "bg-indigo-100" },
    { label: "Sách còn có thể mượn", value: dashboard.bookStats.totalAvailableBooks, hint: "Đầu sách còn ít nhất một bản", icon: <AutoStories className="text-emerald-700" />, color: "bg-emerald-100" },
    { label: "Thể loại", value: dashboard.genreCount, hint: "Danh mục đang hoạt động", icon: <Category className="text-violet-700" />, color: "bg-violet-100" },
    { label: "Người dùng", value: dashboard.userStats.totalUsers, hint: "Tài khoản trong hệ thống", icon: <Group className="text-sky-700" />, color: "bg-sky-100" },
    { label: "Phiếu đang quá hạn", value: dashboard.overdueLoans.totalElements, hint: "Cần được xử lý", icon: <EventBusy className="text-rose-700" />, color: "bg-rose-100" },
    { label: "Tiền phạt chưa xử lý", value: dashboard.fines.totalElements, hint: "Khoản phạt đang chờ", icon: <ReceiptLong className="text-amber-700" />, color: "bg-amber-100" },
    { label: "Thành viên đang hoạt động", value: dashboard.subscriptionStats.activeSubscriptions, hint: "Đăng ký còn hiệu lực", icon: <CardMembership className="text-teal-700" />, color: "bg-teal-100" },
  ];

  return <section aria-labelledby="admin-dashboard-title" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Trung tâm điều hành</p><h1 id="admin-dashboard-title" className="mt-2 text-4xl font-bold text-slate-900">Tổng quan quản trị</h1><p className="mt-2 text-lg text-slate-600">Theo dõi nhanh dữ liệu và hoạt động của thư viện.</p></div>
      <div className="flex gap-2"><Button component={Link} to="/admin/genres">Quản lý thể loại</Button><Button component={Link} to="/admin/books" variant="contained">Quản lý sách</Button></div>
    </div>

    {dashboard.hasPartialError && <Alert severity="warning" className="mb-5">Một vài chỉ số chưa tải được. Bạn có thể bấm tải lại sau khi kiểm tra backend.</Alert>}

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}</div>

    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <Card className="overflow-hidden xl:col-span-2">
        <div className="flex items-center justify-between border-b px-5 py-4"><div><h2 className="text-xl font-bold text-slate-900">Phiếu mượn gần đây</h2><p className="mt-1 text-sm text-slate-500">Tổng cộng {dashboard.recentLoans.totalElements ?? 0} phiếu mượn</p></div></div>
        {(dashboard.recentLoans.content || []).length === 0 ? <div className="p-8 text-center text-slate-500">Chưa có phiếu mượn nào.</div> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3">Sách</th><th className="px-5 py-3">Bạn đọc</th><th className="px-5 py-3">Ngày mượn</th><th className="px-5 py-3">Trạng thái</th></tr></thead><tbody className="divide-y">{dashboard.recentLoans.content.map((loan) => <tr key={loan.id}><td className="px-5 py-4"><p className="font-semibold text-slate-900">{loan.bookTitle}</p><p className="mt-1 text-xs text-slate-500">{loan.bookIsbn}</p></td><td className="px-5 py-4"><p>{loan.userName}</p><p className="mt-1 text-xs text-slate-500">{loan.userEmail}</p></td><td className="px-5 py-4 text-slate-600">{loan.checkoutDate || "—"}</td><td className="px-5 py-4"><Chip size="small" color={STATUS_COLORS[loan.status] || "default"} label={STATUS_LABELS[loan.status] || loan.status} /></td></tr>)}</tbody></table></div>}
      </Card>

      <Card className="p-5">
        <h2 className="text-xl font-bold text-slate-900">Công việc nhanh</h2>
        <p className="mt-1 text-sm text-slate-500">Các bước cần thiết để bắt đầu vận hành.</p>
        <div className="mt-5 grid gap-3">
          <Button component={Link} to="/admin/genres" variant="outlined" fullWidth>Tạo thể loại</Button>
          <Button component={Link} to="/admin/books" variant="outlined" fullWidth>Thêm sách mới</Button>
          <Button component={Link} to="/admin/reservations" variant="outlined" fullWidth>Xử lý hàng chờ đặt trước</Button>
          <Button component={Link} to="/admin/fines" variant="outlined" fullWidth>Xử lý tiền phạt</Button>
          <Button component={Link} to="/admin/users" variant="outlined" fullWidth>Quản lý người dùng</Button>
          <Button component={Link} to="/admin/subscriptions" variant="outlined" fullWidth>Quản lý thành viên</Button>
          <div className="rounded-lg bg-indigo-50 p-4 text-sm text-indigo-900"><p className="font-semibold">Đặt trước đang hoạt động</p><p className="mt-1 text-2xl font-bold">{dashboard.reservations.totalElements ?? 0}</p></div>
        </div>
      </Card>
    </div>
  </section>;
}
