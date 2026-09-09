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
import { Add, Cancel, CheckCircle, HourglassBottom, NotificationsActive, Sync } from "@mui/icons-material";
import { adminReservationsApi, getApiErrorMessage } from "../../api";
import { formatDateTime, statusLabel } from "../../utils/locale";

const EMPTY_PAGE = { content: [], pageNumber: 0, totalPages: 0, totalElements: 0 };
const EMPTY_FILTERS = { userId: "", bookId: "", status: "", activeOnly: true, sort: "reservedAt:DESC" };
const EMPTY_FORM = { userId: "", bookId: "", notes: "" };
const STATUS_OPTIONS = ["PENDING", "AVAILABLE", "FULFILLED", "CANCELLED", "EXPIRED"];
const ACTIVE_STATUSES = new Set(["PENDING", "AVAILABLE"]);
const STATUS_COLORS = {
  PENDING: "warning",
  AVAILABLE: "success",
  FULFILLED: "primary",
  CANCELLED: "default",
  EXPIRED: "error",
};

function countStatus(items, status) {
  return items.filter((item) => item.status === status).length;
}

export default function AdminReservationsPage() {
  const [data, setData] = useState(EMPTY_PAGE);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [revision, setRevision] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmAction, setConfirmAction] = useState(null);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([adminReservationsApi.getUsers(), adminReservationsApi.getBooks()])
      .then(([userItems, bookItems]) => {
        if (!active) return;
        setUsers(userItems.filter((user) => user.role === "ROLE_USER"));
        setBooks(bookItems.filter((book) => book.active !== false));
      })
      .catch((requestError) => {
        if (active) setNotice({ severity: "warning", text: getApiErrorMessage(requestError, "Không tải được danh sách bạn đọc hoặc sách.") });
      })
      .finally(() => { if (active) setOptionsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const [sortBy, sortDirection] = filters.sort.split(":");
      adminReservationsApi.search({
        userId: filters.userId || undefined,
        bookId: filters.bookId || undefined,
        status: filters.status || undefined,
        activeOnly: filters.status ? false : filters.activeOnly,
        page,
        size: 10,
        sortBy,
        sortDirection,
      })
        .then((result) => { if (active) setData(result); })
        .catch((requestError) => {
          if (!active) return;
          setData(EMPTY_PAGE);
          setError(getApiErrorMessage(requestError, "Không tải được danh sách đặt trước."));
        })
        .finally(() => { if (active) setLoading(false); });
    }, 200);
    return () => { active = false; window.clearTimeout(timer); };
  }, [filters, page, revision]);

  function updateFilter(name, value) {
    setLoading(true);
    setError("");
    setFilters((current) => ({ ...current, [name]: value }));
    setPage(0);
  }

  function reload(message) {
    if (message) setNotice({ severity: "success", text: message });
    setLoading(true);
    setError("");
    setRevision((value) => value + 1);
  }

  async function createReservation(event) {
    event.preventDefault();
    if (!form.userId || !form.bookId || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      await adminReservationsApi.createForUser(Number(form.userId), {
        bookId: Number(form.bookId),
        notes: form.notes.trim() || null,
      });
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      reload("Đã thêm bạn đọc vào hàng chờ đặt trước.");
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể tạo đặt trước.") });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  async function runConfirmedAction() {
    if (!confirmAction || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      if (confirmAction.type === "fulfill") {
        await adminReservationsApi.fulfill(confirmAction.reservation.id);
        reload("Đã giao sách và tạo phiếu mượn cho bạn đọc.");
      } else {
        await adminReservationsApi.cancel(confirmAction.reservation.id);
        reload("Đã hủy yêu cầu đặt trước và cập nhật lại hàng chờ.");
      }
      setConfirmAction(null);
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể xử lý yêu cầu đặt trước.") });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  async function expireReservations() {
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      const response = await adminReservationsApi.expire();
      reload(response.message || "Đã cập nhật các đặt trước hết hạn.");
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể cập nhật đặt trước hết hạn.") });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return <section aria-labelledby="admin-reservations-title" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Hàng chờ thư viện</p><h1 id="admin-reservations-title" className="mt-2 text-4xl font-bold text-slate-900">Quản lý đặt trước</h1><p className="mt-2 text-lg text-slate-600">Theo dõi thứ tự chờ, giao sách và xử lý yêu cầu hết hạn.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outlined" startIcon={<Sync />} onClick={expireReservations} disabled={saving}>Cập nhật hết hạn</Button><Button variant="contained" startIcon={<Add />} disabled={optionsLoading} onClick={() => { setForm(EMPTY_FORM); setDialogOpen(true); }}>Tạo đặt trước</Button></div>
    </div>

    {notice && <Alert severity={notice.severity} className="mb-5" onClose={() => setNotice(null)}>{notice.text}</Alert>}

    <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="p-5"><p className="text-sm text-slate-500">Tổng kết quả</p><p className="mt-2 text-3xl font-bold">{data.totalElements}</p></Card>
      <Card className="p-5"><p className="text-sm text-slate-500">Đang chờ trên trang</p><p className="mt-2 text-3xl font-bold text-amber-600">{countStatus(data.content, "PENDING")}</p></Card>
      <Card className="p-5"><p className="text-sm text-slate-500">Sẵn sàng nhận trên trang</p><p className="mt-2 text-3xl font-bold text-emerald-600">{countStatus(data.content, "AVAILABLE")}</p></Card>
      <Card className="p-5"><p className="text-sm text-slate-500">Đã hoàn tất trên trang</p><p className="mt-2 text-3xl font-bold text-indigo-600">{countStatus(data.content, "FULFILLED")}</p></Card>
    </div>

    <Card className="mb-5 p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FormControl><InputLabel id="reservation-user-filter">Bạn đọc</InputLabel><Select labelId="reservation-user-filter" label="Bạn đọc" value={filters.userId} onChange={(event) => updateFilter("userId", event.target.value)}><MenuItem value="">Tất cả</MenuItem>{users.map((user) => <MenuItem key={user.id} value={user.id}>{user.fullName} — {user.email}</MenuItem>)}</Select></FormControl>
        <FormControl><InputLabel id="reservation-book-filter">Sách</InputLabel><Select labelId="reservation-book-filter" label="Sách" value={filters.bookId} onChange={(event) => updateFilter("bookId", event.target.value)}><MenuItem value="">Tất cả</MenuItem>{books.map((book) => <MenuItem key={book.id} value={book.id}>{book.title}</MenuItem>)}</Select></FormControl>
        <FormControl><InputLabel id="reservation-status-filter">Trạng thái</InputLabel><Select labelId="reservation-status-filter" label="Trạng thái" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><MenuItem value="">Tất cả</MenuItem>{STATUS_OPTIONS.map((status) => <MenuItem key={status} value={status}>{statusLabel(status)}</MenuItem>)}</Select></FormControl>
        <FormControl><InputLabel id="reservation-sort-filter">Sắp xếp</InputLabel><Select labelId="reservation-sort-filter" label="Sắp xếp" value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}><MenuItem value="reservedAt:DESC">Mới đặt trước</MenuItem><MenuItem value="queuePosition:ASC">Vị trí hàng chờ</MenuItem><MenuItem value="availableUntil:ASC">Sắp hết hạn nhận</MenuItem><MenuItem value="status:ASC">Theo trạng thái</MenuItem></Select></FormControl>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><FormControlLabel control={<Switch checked={filters.activeOnly} disabled={Boolean(filters.status)} onChange={(event) => updateFilter("activeOnly", event.target.checked)} />} label="Chỉ yêu cầu đang hoạt động" /><Button onClick={() => { setLoading(true); setError(""); setFilters(EMPTY_FILTERS); setPage(0); }}>Xóa bộ lọc</Button></div>
    </Card>

    {loading ? <div className="flex min-h-64 items-center justify-center"><CircularProgress aria-label="Đang tải đặt trước" /></div>
      : error ? <Alert severity="error" action={<Button onClick={() => reload()}>Thử lại</Button>}>{error}</Alert>
        : data.content.length === 0 ? <Alert severity="info">Chưa có yêu cầu đặt trước phù hợp.</Alert>
          : <>
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-indigo-50 text-slate-700"><tr><th className="px-4 py-3">Sách</th><th className="px-4 py-3">Bạn đọc</th><th className="px-4 py-3">Hàng chờ</th><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{data.content.map((reservation) => <tr key={reservation.id} className="align-top">
              <td className="px-4 py-4"><div className="min-w-56"><p className="font-semibold text-slate-900">{reservation.bookTitle}</p><p className="mt-1 text-xs text-slate-500">{reservation.bookAuthor || reservation.bookIsbn}</p></div></td>
              <td className="px-4 py-4"><p>{reservation.userName}</p><p className="mt-1 text-xs text-slate-500">{reservation.userEmail}</p></td>
              <td className="px-4 py-4">{reservation.queuePosition ? <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-amber-100 px-2 font-bold text-amber-800">#{reservation.queuePosition}</span> : "—"}</td>
              <td className="px-4 py-4"><p>Đặt: {formatDateTime(reservation.reservedAt)}</p>{reservation.availableUntil && <p className="mt-1 text-xs text-rose-600">Hạn nhận: {formatDateTime(reservation.availableUntil)}</p>}{reservation.status === "AVAILABLE" && reservation.hoursUntilExpiry != null && <p className="mt-1 text-xs font-semibold">Còn khoảng {reservation.hoursUntilExpiry} giờ</p>}</td>
              <td className="px-4 py-4"><Chip size="small" color={STATUS_COLORS[reservation.status] || "default"} label={statusLabel(reservation.status)} />{reservation.notificationSent && <p className="mt-2 flex items-center gap-1 text-xs text-emerald-700"><NotificationsActive fontSize="inherit" />Đã gửi thông báo</p>}</td>
              <td className="px-4 py-4"><div className="flex min-w-44 justify-end gap-1">{reservation.status === "AVAILABLE" && <Button size="small" color="success" startIcon={<CheckCircle />} onClick={() => setConfirmAction({ type: "fulfill", reservation })}>Giao sách</Button>}{ACTIVE_STATUSES.has(reservation.status) && <Button size="small" color="error" startIcon={<Cancel />} onClick={() => setConfirmAction({ type: "cancel", reservation })}>Hủy</Button>}{reservation.status === "PENDING" && <HourglassBottom color="warning" />}</div></td>
            </tr>)}</tbody></table></div>
            {data.totalPages > 1 && <Pagination className="mt-6 flex justify-center" page={data.pageNumber + 1} count={data.totalPages} onChange={(_, value) => { setLoading(true); setPage(value - 1); }} />}
          </>}

    <Dialog open={dialogOpen} onClose={() => { if (!saving) setDialogOpen(false); }} fullWidth maxWidth="sm"><DialogTitle>Tạo yêu cầu đặt trước</DialogTitle><DialogContent><form id="reservation-form" onSubmit={createReservation} className="grid gap-4 pt-2">
      <FormControl required><InputLabel id="reservation-user-input">Bạn đọc</InputLabel><Select labelId="reservation-user-input" label="Bạn đọc" value={form.userId} onChange={(event) => setForm((current) => ({ ...current, userId: event.target.value }))}>{users.map((user) => <MenuItem key={user.id} value={user.id}>{user.fullName} — {user.email}</MenuItem>)}</Select></FormControl>
      <FormControl required><InputLabel id="reservation-book-input">Sách cần đặt</InputLabel><Select labelId="reservation-book-input" label="Sách cần đặt" value={form.bookId} onChange={(event) => setForm((current) => ({ ...current, bookId: event.target.value }))}>{books.map((book) => <MenuItem key={book.id} value={book.id}>{book.title} — còn {book.availableCopies ?? 0} bản</MenuItem>)}</Select></FormControl>
      <TextField label="Ghi chú" multiline minRows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
      <Alert severity="info">Chỉ tạo đặt trước khi không còn bản sách trống. Hệ thống sẽ tự xếp bạn đọc vào cuối hàng chờ.</Alert>
    </form></DialogContent><DialogActions><Button disabled={saving} onClick={() => setDialogOpen(false)}>Hủy</Button><Button type="submit" form="reservation-form" variant="contained" disabled={saving || !form.userId || !form.bookId}>{saving ? "Đang tạo..." : "Tạo đặt trước"}</Button></DialogActions></Dialog>

    <Dialog open={!!confirmAction} onClose={() => { if (!saving) setConfirmAction(null); }} fullWidth maxWidth="xs"><DialogTitle>{confirmAction?.type === "fulfill" ? "Xác nhận giao sách" : "Xác nhận hủy đặt trước"}</DialogTitle><DialogContent>{confirmAction?.type === "fulfill" ? <>Giao sách “{confirmAction.reservation.bookTitle}” cho {confirmAction.reservation.userName}? Hệ thống sẽ tạo phiếu mượn ngay.</> : <>Hủy yêu cầu đặt trước sách “{confirmAction?.reservation.bookTitle}” của {confirmAction?.reservation.userName}? Hàng chờ sẽ được sắp xếp lại.</>}</DialogContent><DialogActions><Button disabled={saving} onClick={() => setConfirmAction(null)}>Quay lại</Button><Button variant="contained" color={confirmAction?.type === "fulfill" ? "success" : "error"} disabled={saving} onClick={runConfirmedAction}>{saving ? "Đang xử lý..." : confirmAction?.type === "fulfill" ? "Giao sách" : "Hủy yêu cầu"}</Button></DialogActions></Dialog>
  </section>;
}
