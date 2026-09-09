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
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  TextField,
} from "@mui/material";
import { Add, Gavel, ReceiptLong } from "@mui/icons-material";
import { adminFinesApi, getApiErrorMessage } from "../../api";
import { fineStatusLabel, fineTypeLabel, formatDateTime, formatMoney } from "../../utils/locale";

const EMPTY_PAGE = { content: [], pageNumber: 0, totalPages: 0, totalElements: 0 };
const EMPTY_FILTERS = { userId: "", status: "", type: "" };
const EMPTY_FORM = { bookLoanId: "", type: "PROCESSING", amount: "", reason: "", notes: "" };
const STATUSES = ["PENDING", "PARTIALLY_PAID", "PAID", "WAIVED"];
const TYPES = ["OVERDUE", "DAMAGE", "LOSS", "PROCESSING"];
const OPEN_STATUSES = new Set(["PENDING", "PARTIALLY_PAID"]);
const STATUS_COLORS = { PENDING: "warning", PARTIALLY_PAID: "info", PAID: "success", WAIVED: "default" };
const LOAN_STATUS_LABELS = { CHECKED_OUT: "Đang mượn", RETURNED: "Đã trả", OVERDUE: "Quá hạn", LOST: "Bị mất", DAMAGED: "Hư hỏng" };

function total(items, field) {
  return items.reduce((sum, item) => sum + Number(item[field] || 0), 0);
}

export default function AdminFinesPage() {
  const [data, setData] = useState(EMPTY_PAGE);
  const [users, setUsers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [revision, setRevision] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [waiveForm, setWaiveForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([adminFinesApi.getUsers(), adminFinesApi.getLoans()])
      .then(([items, loanItems]) => {
        if (!active) return;
        setUsers(items.filter((user) => user.role === "ROLE_USER"));
        setLoans(loanItems);
      })
      .catch((requestError) => {
        if (active) setNotice({ severity: "warning", text: getApiErrorMessage(requestError, "Không tải được bạn đọc hoặc phiếu mượn.") });
      })
      .finally(() => { if (active) setOptionsLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      adminFinesApi.search({
        userId: filters.userId || undefined,
        status: filters.status || undefined,
        type: filters.type || undefined,
        page,
        size: 10,
      })
        .then((result) => { if (active) setData(result); })
        .catch((requestError) => {
          if (!active) return;
          setData(EMPTY_PAGE);
          setError(getApiErrorMessage(requestError, "Không tải được danh sách tiền phạt."));
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

  async function createFine(event) {
    event.preventDefault();
    if (!form.bookLoanId || Number(form.amount) <= 0 || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    setCreateError("");
    try {
      await adminFinesApi.create({
        bookLoanId: Number(form.bookLoanId),
        type: form.type,
        amount: Number(form.amount),
        reason: form.reason.trim() || null,
        notes: form.notes.trim() || null,
      });
      setCreateOpen(false);
      setForm(EMPTY_FORM);
      reload("Đã tạo khoản phạt cho phiếu mượn.");
    } catch (requestError) {
      setCreateError(getApiErrorMessage(requestError, "Không thể tạo khoản phạt."));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  async function waiveFine(event) {
    event.preventDefault();
    if (!waiveForm?.reason.trim() || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      await adminFinesApi.waive({ fineId: waiveForm.fine.id, reason: waiveForm.reason.trim() });
      setWaiveForm(null);
      reload("Đã miễn phần tiền phạt còn lại cho bạn đọc.");
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể miễn khoản phạt.") });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  const outstandingOnPage = total(data.content, "amountOutstanding");
  const paidOnPage = total(data.content, "amountPaid");
  const waivedOnPage = data.content.filter((fine) => fine.status === "WAIVED").length;

  return <section aria-labelledby="admin-fines-title" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Tài chính thư viện</p><h1 id="admin-fines-title" className="mt-2 text-4xl font-bold text-slate-900">Quản lý tiền phạt</h1><p className="mt-2 text-lg text-slate-600">Theo dõi nghĩa vụ thanh toán, tạo và miễn khoản phạt.</p></div>
      <Button variant="contained" startIcon={<Add />} disabled={optionsLoading} onClick={() => { setForm(EMPTY_FORM); setCreateError(""); setCreateOpen(true); }}>Tạo khoản phạt</Button>
    </div>

    <Alert severity="info" className="mb-5">Đơn vị tiền là đồng Việt Nam. Giao dịch VietQR được xác nhận tại trang Đối soát thanh toán.</Alert>
    {notice && <Alert severity={notice.severity} className="mb-5" onClose={() => setNotice(null)}>{notice.text}</Alert>}

    <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="p-5"><p className="text-sm text-slate-500">Tổng kết quả</p><p className="mt-2 text-3xl font-bold">{data.totalElements}</p></Card>
      <Card className="p-5"><p className="text-sm text-slate-500">Còn phải thu trên trang</p><p className="mt-2 text-2xl font-bold text-rose-600">{formatMoney(outstandingOnPage)}</p></Card>
      <Card className="p-5"><p className="text-sm text-slate-500">Đã thu trên trang</p><p className="mt-2 text-2xl font-bold text-emerald-600">{formatMoney(paidOnPage)}</p></Card>
      <Card className="p-5"><p className="text-sm text-slate-500">Đã miễn trên trang</p><p className="mt-2 text-3xl font-bold text-slate-600">{waivedOnPage}</p></Card>
    </div>

    <Card className="mb-5 p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <FormControl><InputLabel id="fine-user-filter">Bạn đọc</InputLabel><Select labelId="fine-user-filter" label="Bạn đọc" value={filters.userId} onChange={(event) => updateFilter("userId", event.target.value)}><MenuItem value="">Tất cả</MenuItem>{users.map((user) => <MenuItem key={user.id} value={user.id}>{user.fullName} — {user.email}</MenuItem>)}</Select></FormControl>
        <FormControl><InputLabel id="fine-status-filter">Trạng thái</InputLabel><Select labelId="fine-status-filter" label="Trạng thái" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><MenuItem value="">Tất cả</MenuItem>{STATUSES.map((status) => <MenuItem key={status} value={status}>{fineStatusLabel(status)}</MenuItem>)}</Select></FormControl>
        <FormControl><InputLabel id="fine-type-filter">Loại phạt</InputLabel><Select labelId="fine-type-filter" label="Loại phạt" value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}><MenuItem value="">Tất cả</MenuItem>{TYPES.map((type) => <MenuItem key={type} value={type}>{fineTypeLabel(type)}</MenuItem>)}</Select></FormControl>
      </div>
      <div className="mt-3 flex justify-end"><Button onClick={() => { setLoading(true); setError(""); setFilters(EMPTY_FILTERS); setPage(0); }}>Xóa bộ lọc</Button></div>
    </Card>

    {loading ? <div className="flex min-h-64 items-center justify-center"><CircularProgress aria-label="Đang tải tiền phạt" /></div>
      : error ? <Alert severity="error" action={<Button onClick={() => reload()}>Thử lại</Button>}>{error}</Alert>
        : data.content.length === 0 ? <Alert severity="success">Không có khoản phạt phù hợp.</Alert>
          : <>
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-indigo-50 text-slate-700"><tr><th className="px-4 py-3">Khoản phạt</th><th className="px-4 py-3">Bạn đọc</th><th className="px-4 py-3">Phiếu mượn</th><th className="px-4 py-3">Số tiền</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{data.content.map((fine) => <tr key={fine.id} className="align-top">
              <td className="px-4 py-4"><div className="min-w-52"><p className="font-semibold text-slate-900">#{fine.id} · {fineTypeLabel(fine.type)}</p><p className="mt-1 text-xs text-slate-500">{fine.reason || "Chưa ghi lý do"}</p><p className="mt-1 text-xs text-slate-400">Tạo: {formatDateTime(fine.createdAt)}</p></div></td>
              <td className="px-4 py-4"><p>{fine.userName}</p><p className="mt-1 text-xs text-slate-500">{fine.userEmail}</p></td>
              <td className="px-4 py-4"><p>#{fine.bookLoanId}</p><p className="mt-1 max-w-48 text-xs text-slate-500">{fine.bookTitle || fine.bookIsbn}</p></td>
              <td className="px-4 py-4"><p>Tổng: <strong>{formatMoney(fine.amount)}</strong></p><p className="mt-1 text-xs text-emerald-700">Đã trả: {formatMoney(fine.amountPaid)}</p><p className="mt-1 text-xs font-semibold text-rose-700">Còn lại: {formatMoney(fine.amountOutstanding)}</p></td>
              <td className="px-4 py-4"><Chip size="small" color={STATUS_COLORS[fine.status] || "default"} label={fineStatusLabel(fine.status)} />{fine.transactionId && <p className="mt-2 max-w-40 break-all text-xs text-slate-500">Mã GD: {fine.transactionId}</p>}{fine.paidAt && <p className="mt-2 text-xs text-slate-500">Thanh toán: {formatDateTime(fine.paidAt)}</p>}{fine.status === "WAIVED" && <div className="mt-2 max-w-48 text-xs text-slate-500"><p>Miễn bởi: {fine.waivedByUserName || "Quản trị viên"}</p>{fine.waiverReason && <p>Lý do: {fine.waiverReason}</p>}</div>}</td>
              <td className="px-4 py-4"><div className="flex min-w-32 justify-end">{OPEN_STATUSES.has(fine.status) && <Button size="small" color="secondary" startIcon={<Gavel />} onClick={() => setWaiveForm({ fine, reason: "" })}>Miễn phạt</Button>}{!OPEN_STATUSES.has(fine.status) && <ReceiptLong color={fine.status === "PAID" ? "success" : "disabled"} />}</div></td>
            </tr>)}</tbody></table></div>
            {data.totalPages > 1 && <Pagination className="mt-6 flex justify-center" page={data.pageNumber + 1} count={data.totalPages} onChange={(_, value) => { setLoading(true); setPage(value - 1); }} />}
          </>}

    <Dialog open={createOpen} onClose={() => { if (!saving) setCreateOpen(false); }} fullWidth maxWidth="sm"><DialogTitle>Tạo khoản phạt</DialogTitle><DialogContent><form id="create-fine-form" onSubmit={createFine} className="grid gap-4 pt-2 sm:grid-cols-2">
      {createError && <Alert severity="error" className="sm:col-span-2">{createError}</Alert>}
      <FormControl required><InputLabel id="create-fine-loan">Phiếu mượn</InputLabel><Select labelId="create-fine-loan" label="Phiếu mượn" value={form.bookLoanId} onChange={(event) => { setCreateError(""); setForm((current) => ({ ...current, bookLoanId: event.target.value })); }}>{loans.length === 0 && <MenuItem disabled value="">Chưa có phiếu mượn</MenuItem>}{loans.map((loan) => <MenuItem key={loan.id} value={loan.id}>#{loan.id} — {loan.userName} — {loan.bookTitle} ({LOAN_STATUS_LABELS[loan.status] || loan.status})</MenuItem>)}</Select></FormControl>
      <FormControl required><InputLabel id="create-fine-type">Loại phạt</InputLabel><Select labelId="create-fine-type" label="Loại phạt" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>{TYPES.map((type) => <MenuItem key={type} value={type}>{fineTypeLabel(type)}</MenuItem>)}</Select></FormControl>
      <TextField required label="Số tiền phạt" type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} slotProps={{ htmlInput: { min: 1, step: 1 } }} helperText="Đơn vị VND" />
      <TextField label="Lý do" value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} />
      <TextField className="sm:col-span-2" label="Ghi chú" multiline minRows={3} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
      <Alert severity="info" className="sm:col-span-2">Mỗi phiếu mượn chỉ có một khoản phạt cho từng loại. Tiền phạt quá hạn thường được tạo tự động khi nhận trả sách.</Alert>
    </form></DialogContent><DialogActions><Button disabled={saving} onClick={() => setCreateOpen(false)}>Hủy</Button><Button type="submit" form="create-fine-form" variant="contained" disabled={saving || !form.bookLoanId || Number(form.amount) <= 0}>{saving ? "Đang tạo..." : "Tạo khoản phạt"}</Button></DialogActions></Dialog>

    <Dialog open={!!waiveForm} onClose={() => { if (!saving) setWaiveForm(null); }} fullWidth maxWidth="sm"><DialogTitle>Miễn khoản phạt</DialogTitle><DialogContent>{waiveForm && <form id="waive-fine-form" onSubmit={waiveFine} className="grid gap-4 pt-2"><Alert severity="warning">Bạn đang miễn số tiền còn lại {formatMoney(waiveForm.fine.amountOutstanding)} của khoản phạt #{waiveForm.fine.id} cho {waiveForm.fine.userName}.</Alert><TextField required autoFocus label="Lý do miễn phạt" multiline minRows={3} value={waiveForm.reason} onChange={(event) => setWaiveForm((current) => ({ ...current, reason: event.target.value }))} /></form>}</DialogContent><DialogActions><Button disabled={saving} onClick={() => setWaiveForm(null)}>Quay lại</Button><Button type="submit" form="waive-fine-form" variant="contained" color="secondary" disabled={saving || !waiveForm?.reason.trim()}>{saving ? "Đang lưu..." : "Xác nhận miễn"}</Button></DialogActions></Dialog>
  </section>;
}
