import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Switch,
  TextField,
} from "@mui/material";
import { AdminPanelSettings, Badge, Edit, Group, MarkEmailRead, Search } from "@mui/icons-material";
import { adminUsersApi, getApiErrorMessage } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { formatDateTime } from "../../utils/locale";

const EMPTY_PAGE = { content: [], pageNumber: 0, totalPages: 0, totalElements: 0 };
const EMPTY_STATS = { totalUsers: 0, totalReaders: 0, totalAdmins: 0, totalVerified: 0, totalUnverified: 0 };
const EMPTY_FILTERS = { searchTerm: "", role: "", verified: "", sort: "createdAt:DESC" };

const roleLabel = (role) => role === "ROLE_ADMIN" ? "Quản trị viên" : "Bạn đọc";
const providerLabel = (provider) => provider === "GOOGLE" ? "Google" : "Tài khoản nội bộ";

function MetricCard({ icon, label, value, tone }) {
  return <Card className="p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-900">{value}</p></div><div className={`rounded-xl p-3 ${tone}`}>{icon}</div></div></Card>;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [data, setData] = useState(EMPTY_PAGE);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState({ role: "ROLE_USER", verified: false });
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    adminUsersApi.getStats()
      .then((result) => { if (active) setStats(result); })
      .catch((requestError) => {
        if (active) setNotice({ severity: "warning", text: getApiErrorMessage(requestError, "Không tải được thống kê tài khoản.") });
      });
    return () => { active = false; };
  }, [revision]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const [sortBy, sortDirection] = filters.sort.split(":");
      adminUsersApi.search({
        searchTerm: filters.searchTerm.trim() || undefined,
        role: filters.role || undefined,
        verified: filters.verified === "" ? undefined : filters.verified === "true",
        page,
        size: 10,
        sortBy,
        sortDirection,
      })
        .then((result) => { if (active) setData(result); })
        .catch((requestError) => {
          if (!active) return;
          setData(EMPTY_PAGE);
          setError(getApiErrorMessage(requestError, "Không tải được danh sách tài khoản."));
        })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [filters, page, revision]);

  function updateFilter(name, value) {
    setLoading(true);
    setError("");
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(0);
  }

  function openEditor(user) {
    setEditor(user);
    setForm({ role: user.role || "ROLE_USER", verified: user.verified === true });
  }

  async function saveAccess(event) {
    event.preventDefault();
    if (!editor || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      await adminUsersApi.updateAccess(editor.id, form);
      setEditor(null);
      setNotice({ severity: "success", text: "Đã cập nhật quyền và trạng thái tài khoản." });
      setLoading(true);
      setRevision((value) => value + 1);
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể cập nhật tài khoản.") });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  const isEditingSelf = editor?.id === currentUser?.id;

  return <section aria-labelledby="admin-users-title" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-8"><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Tài khoản hệ thống</p><h1 id="admin-users-title" className="mt-2 text-4xl font-bold text-slate-900">Quản lý người dùng</h1><p className="mt-2 text-lg text-slate-600">Tra cứu bạn đọc, quản trị viên và kiểm soát quyền truy cập.</p></div>

    {notice && <Alert severity={notice.severity} className="mb-5" onClose={() => setNotice(null)}>{notice.text}</Alert>}

    <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard label="Tất cả tài khoản" value={stats.totalUsers} icon={<Group className="text-indigo-700" />} tone="bg-indigo-100" />
      <MetricCard label="Bạn đọc" value={stats.totalReaders} icon={<Badge className="text-sky-700" />} tone="bg-sky-100" />
      <MetricCard label="Quản trị viên" value={stats.totalAdmins} icon={<AdminPanelSettings className="text-violet-700" />} tone="bg-violet-100" />
      <MetricCard label="Đã xác minh" value={stats.totalVerified} icon={<MarkEmailRead className="text-emerald-700" />} tone="bg-emerald-100" />
      <MetricCard label="Chưa xác minh" value={stats.totalUnverified} icon={<MarkEmailRead className="text-amber-700" />} tone="bg-amber-100" />
    </div>

    <Card className="mb-5 p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TextField label="Tìm kiếm" value={filters.searchTerm} onChange={(event) => updateFilter("searchTerm", event.target.value)} placeholder="Họ tên, email hoặc số điện thoại" slotProps={{ input: { startAdornment: <Search className="mr-2 text-slate-400" /> } }} />
        <FormControl><InputLabel id="user-role-filter">Vai trò</InputLabel><Select labelId="user-role-filter" label="Vai trò" value={filters.role} onChange={(event) => updateFilter("role", event.target.value)}><MenuItem value="">Tất cả</MenuItem><MenuItem value="ROLE_USER">Bạn đọc</MenuItem><MenuItem value="ROLE_ADMIN">Quản trị viên</MenuItem></Select></FormControl>
        <FormControl><InputLabel id="user-verified-filter">Xác minh</InputLabel><Select labelId="user-verified-filter" label="Xác minh" value={filters.verified} onChange={(event) => updateFilter("verified", event.target.value)}><MenuItem value="">Tất cả</MenuItem><MenuItem value="true">Đã xác minh</MenuItem><MenuItem value="false">Chưa xác minh</MenuItem></Select></FormControl>
        <FormControl><InputLabel id="user-sort-filter">Sắp xếp</InputLabel><Select labelId="user-sort-filter" label="Sắp xếp" value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}><MenuItem value="createdAt:DESC">Mới tạo trước</MenuItem><MenuItem value="createdAt:ASC">Cũ nhất trước</MenuItem><MenuItem value="fullName:ASC">Họ tên A–Z</MenuItem><MenuItem value="lastLogin:DESC">Đăng nhập gần nhất</MenuItem></Select></FormControl>
      </div>
      <div className="mt-3 flex justify-end"><Button onClick={() => { setLoading(true); setError(""); setFilters(EMPTY_FILTERS); setPage(0); }}>Xóa bộ lọc</Button></div>
    </Card>

    {loading ? <div className="flex min-h-64 items-center justify-center"><CircularProgress aria-label="Đang tải người dùng" /></div>
      : error ? <Alert severity="error" action={<Button onClick={() => { setLoading(true); setError(""); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>
        : data.content.length === 0 ? <Alert severity="info">Không có tài khoản phù hợp.</Alert>
          : <>
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-indigo-50 text-slate-700"><tr><th className="px-4 py-3">Người dùng</th><th className="px-4 py-3">Liên hệ</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Xác minh</th><th className="px-4 py-3">Hoạt động</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{data.content.map((user) => <tr key={user.id} className="align-top">
              <td className="px-4 py-4"><p className="font-semibold text-slate-900">{user.fullName}</p><p className="mt-1 text-xs text-slate-500">Mã tài khoản #{user.id}</p></td>
              <td className="px-4 py-4"><p className="break-all">{user.email}</p><p className="mt-1 text-xs text-slate-500">{user.phone || "Chưa có số điện thoại"}</p></td>
              <td className="px-4 py-4"><Chip size="small" color={user.role === "ROLE_ADMIN" ? "secondary" : "primary"} label={roleLabel(user.role)} /><p className="mt-2 text-xs text-slate-500">{providerLabel(user.authProvider)}</p></td>
              <td className="px-4 py-4"><Chip size="small" color={user.verified ? "success" : "warning"} label={user.verified ? "Đã xác minh" : "Chưa xác minh"} /></td>
              <td className="px-4 py-4"><p>Đăng nhập: {formatDateTime(user.lastLogin)}</p><p className="mt-1 text-xs text-slate-500">Tạo: {formatDateTime(user.createdAt)}</p></td>
              <td className="px-4 py-4 text-right"><Button size="small" startIcon={<Edit />} onClick={() => openEditor(user)}>Quản lý</Button></td>
            </tr>)}</tbody></table></div>
            {data.totalPages > 1 && <Pagination className="mt-6 flex justify-center" page={data.pageNumber + 1} count={data.totalPages} onChange={(_, value) => { setLoading(true); setPage(value - 1); }} />}
          </>}

    <Dialog open={!!editor} onClose={() => { if (!saving) setEditor(null); }} fullWidth maxWidth="sm"><DialogTitle>Quản lý tài khoản</DialogTitle><DialogContent>{editor && <form id="user-access-form" onSubmit={saveAccess} className="grid gap-4 pt-2">
      <div className="rounded-lg bg-slate-50 p-4"><p className="font-semibold text-slate-900">{editor.fullName}</p><p className="mt-1 break-all text-sm text-slate-600">{editor.email}</p><p className="mt-1 text-xs text-slate-500">Đăng ký qua {providerLabel(editor.authProvider)} · {formatDateTime(editor.createdAt)}</p></div>
      {isEditingSelf && <Alert severity="info">Đây là tài khoản bạn đang sử dụng. Vai trò quản trị được khóa để tránh làm mất quyền truy cập.</Alert>}
      <FormControl disabled={isEditingSelf}><InputLabel id="edit-user-role">Vai trò</InputLabel><Select labelId="edit-user-role" label="Vai trò" value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}><MenuItem value="ROLE_USER">Bạn đọc</MenuItem><MenuItem value="ROLE_ADMIN">Quản trị viên</MenuItem></Select></FormControl>
      <FormControlLabel control={<Switch checked={form.verified} onChange={(event) => setForm((current) => ({ ...current, verified: event.target.checked }))} />} label="Tài khoản đã được xác minh" />
      {editor.role !== form.role && <Alert severity="warning">Thay đổi vai trò sẽ có hiệu lực từ yêu cầu tiếp theo của tài khoản này. Người dùng nên đăng xuất và đăng nhập lại để giao diện cập nhật quyền.</Alert>}
    </form>}</DialogContent><DialogActions><Button disabled={saving} onClick={() => setEditor(null)}>Hủy</Button><Button type="submit" form="user-access-form" variant="contained" disabled={saving}>{saving ? "Đang lưu..." : "Lưu thay đổi"}</Button></DialogActions></Dialog>
  </section>;
}
