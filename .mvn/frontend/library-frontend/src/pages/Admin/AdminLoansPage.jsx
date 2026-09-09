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
import { Add, Autorenew, CheckCircle, EventBusy, LibraryBooks, Sync } from "@mui/icons-material";
import { adminLoansApi, getApiErrorMessage } from "../../api";

const EMPTY_PAGE = { content: [], pageNumber: 0, totalPages: 0, totalElements: 0 };
const EMPTY_FILTERS = {
  userId: "",
  bookId: "",
  status: "",
  overdueOnly: false,
  unpaidFinesOnly: false,
  startDate: "",
  endDate: "",
  sort: "createdAt:DESC",
};
const EMPTY_CHECKOUT = { userId: "", bookId: "", checkoutDays: "14", notes: "" };

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
const ACTIVE_STATUSES = new Set(["CHECKED_OUT", "OVERDUE"]);

function countByStatus(items, status) {
  return items.filter((loan) => loan.status === status).length;
}

export default function AdminLoansPage() {
  const [data, setData] = useState(EMPTY_PAGE);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [availableBooks, setAvailableBooks] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [revision, setRevision] = useState(0);
  const [optionsRevision, setOptionsRevision] = useState(0);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState(EMPTY_CHECKOUT);
  const [checkinForm, setCheckinForm] = useState(null);
  const [renewForm, setRenewForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([adminLoansApi.getUsers(), adminLoansApi.getBooks(), adminLoansApi.getAvailableBooks()])
      .then(([userItems, bookItems, availableBookItems]) => {
        if (!active) return;
        setUsers(userItems.filter((user) => user.role === "ROLE_USER"));
        setBooks(bookItems);
        setAvailableBooks(availableBookItems);
      })
      .catch((requestError) => {
        if (active) setNotice({ severity: "warning", text: getApiErrorMessage(requestError, "Không tải được người dùng hoặc sách để tạo phiếu mượn.") });
      })
      .finally(() => { if (active) setOptionsLoading(false); });
    return () => { active = false; };
  }, [optionsRevision]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const [sortBy, sortDirection] = filters.sort.split(":");
      adminLoansApi.search({
        userId: filters.userId ? Number(filters.userId) : null,
        bookId: filters.bookId ? Number(filters.bookId) : null,
        status: filters.status || null,
        overdueOnly: filters.overdueOnly,
        unpaidFinesOnly: filters.unpaidFinesOnly,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        page,
        size: 10,
        sortBy,
        sortDirection,
      })
        .then((result) => { if (active) setData(result); })
        .catch((requestError) => {
          if (active) {
            setData(EMPTY_PAGE);
            setError(getApiErrorMessage(requestError, "Không tải được danh sách phiếu mượn."));
          }
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

  async function submitCheckout(event) {
    event.preventDefault();
    if (!checkoutForm.userId || !checkoutForm.bookId || Number(checkoutForm.checkoutDays) < 1 || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      await adminLoansApi.checkoutForUser(Number(checkoutForm.userId), {
        bookId: Number(checkoutForm.bookId),
        checkoutDays: Number(checkoutForm.checkoutDays),
        notes: checkoutForm.notes.trim() || null,
      });
      setCheckoutOpen(false);
      setCheckoutForm(EMPTY_CHECKOUT);
      setOptionsLoading(true);
      setOptionsRevision((value) => value + 1);
      reload("Đã tạo phiếu mượn cho bạn đọc.");
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể tạo phiếu mượn.") });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  async function submitCheckin(event) {
    event.preventDefault();
    if (!checkinForm || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      await adminLoansApi.checkin({
        bookLoanId: checkinForm.loan.id,
        condition: checkinForm.condition,
        notes: checkinForm.notes.trim() || null,
      });
      setCheckinForm(null);
      setOptionsLoading(true);
      setOptionsRevision((value) => value + 1);
      reload("Đã ghi nhận trả sách.");
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể ghi nhận trả sách.") });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  async function submitRenew(event) {
    event.preventDefault();
    if (!renewForm || Number(renewForm.extensionDays) < 1 || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      await adminLoansApi.renew({
        bookLoanId: renewForm.loan.id,
        extensionDays: Number(renewForm.extensionDays),
        notes: renewForm.notes.trim() || null,
      });
      setRenewForm(null);
      reload("Đã gia hạn phiếu mượn.");
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể gia hạn phiếu mượn.") });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  async function updateOverdue() {
    if (submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      const response = await adminLoansApi.updateOverdue();
      reload(response.message || "Đã cập nhật các phiếu mượn quá hạn.");
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể cập nhật phiếu quá hạn.") });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return <section aria-labelledby="admin-loans-title" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Lưu thông sách</p><h1 id="admin-loans-title" className="mt-2 text-4xl font-bold text-slate-900">Quản lý mượn và trả</h1><p className="mt-2 text-lg text-slate-600">Tạo phiếu mượn, nhận sách trả, gia hạn và theo dõi quá hạn.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outlined" startIcon={<Sync />} onClick={updateOverdue} disabled={saving}>Cập nhật quá hạn</Button><Button variant="contained" startIcon={<Add />} onClick={() => { setCheckoutForm(EMPTY_CHECKOUT); setCheckoutOpen(true); }} disabled={optionsLoading}>Tạo phiếu mượn</Button></div>
    </div>

    {notice && <Alert severity={notice.severity} className="mb-5" onClose={() => setNotice(null)}>{notice.text}</Alert>}
    <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="p-5"><p className="text-sm text-slate-500">Tổng kết quả</p><p className="mt-2 text-3xl font-bold">{data.totalElements}</p></Card>
      <Card className="p-5"><p className="text-sm text-slate-500">Đang mượn trên trang</p><p className="mt-2 text-3xl font-bold text-indigo-600">{countByStatus(data.content, "CHECKED_OUT")}</p></Card>
      <Card className="p-5"><p className="text-sm text-slate-500">Quá hạn trên trang</p><p className="mt-2 text-3xl font-bold text-rose-600">{countByStatus(data.content, "OVERDUE")}</p></Card>
      <Card className="p-5"><p className="text-sm text-slate-500">Đã trả trên trang</p><p className="mt-2 text-3xl font-bold text-emerald-600">{countByStatus(data.content, "RETURNED")}</p></Card>
    </div>

    <Card className="mb-5 p-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <FormControl><InputLabel id="loan-user-filter-label">Bạn đọc</InputLabel><Select labelId="loan-user-filter-label" label="Bạn đọc" value={filters.userId} onChange={(event) => updateFilter("userId", event.target.value)}><MenuItem value="">Tất cả</MenuItem>{users.map((user) => <MenuItem key={user.id} value={user.id}>{user.fullName} — {user.email}</MenuItem>)}</Select></FormControl>
        <FormControl><InputLabel id="loan-book-filter-label">Sách</InputLabel><Select labelId="loan-book-filter-label" label="Sách" value={filters.bookId} onChange={(event) => updateFilter("bookId", event.target.value)}><MenuItem value="">Tất cả</MenuItem>{books.map((book) => <MenuItem key={book.id} value={book.id}>{book.title}</MenuItem>)}</Select></FormControl>
        <FormControl><InputLabel id="loan-status-filter-label">Trạng thái</InputLabel><Select labelId="loan-status-filter-label" label="Trạng thái" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><MenuItem value="">Tất cả</MenuItem>{Object.entries(STATUS_LABELS).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</Select></FormControl>
        <FormControl><InputLabel id="loan-sort-label">Sắp xếp</InputLabel><Select labelId="loan-sort-label" label="Sắp xếp" value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}><MenuItem value="createdAt:DESC">Mới tạo trước</MenuItem><MenuItem value="dueDate:ASC">Sắp đến hạn trước</MenuItem><MenuItem value="checkoutDate:DESC">Mượn gần đây</MenuItem><MenuItem value="status:ASC">Theo trạng thái</MenuItem></Select></FormControl>
        <TextField label="Mượn từ ngày" type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <TextField label="Đến ngày" type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        <FormControlLabel control={<Switch checked={filters.overdueOnly} onChange={(event) => updateFilter("overdueOnly", event.target.checked)} />} label="Chỉ phiếu quá hạn" />
        <FormControlLabel control={<Switch checked={filters.unpaidFinesOnly} onChange={(event) => updateFilter("unpaidFinesOnly", event.target.checked)} />} label="Có tiền phạt chưa trả" />
      </div>
      <div className="mt-3 flex justify-end"><Button onClick={() => { setLoading(true); setError(""); setFilters(EMPTY_FILTERS); setPage(0); }}>Xóa bộ lọc</Button></div>
    </Card>

    {loading ? <div className="flex min-h-64 items-center justify-center"><CircularProgress aria-label="Đang tải phiếu mượn" /></div>
      : error ? <Alert severity="error" action={<Button onClick={() => reload()}>Thử lại</Button>}>{error}</Alert>
        : data.content.length === 0 ? <Alert severity="info">Chưa có phiếu mượn phù hợp.</Alert>
          : <>
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-indigo-50 text-slate-700"><tr><th className="px-4 py-3">Sách</th><th className="px-4 py-3">Bạn đọc</th><th className="px-4 py-3">Thời hạn</th><th className="px-4 py-3">Gia hạn</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{data.content.map((loan) => <tr key={loan.id} className="align-top">
              <td className="px-4 py-4"><div className="flex min-w-60 gap-3">{loan.bookCoverImage ? <img src={loan.bookCoverImage} alt={`Bìa ${loan.bookTitle}`} className="h-14 w-10 rounded object-cover" /> : <div className="flex h-14 w-10 items-center justify-center rounded bg-indigo-100"><LibraryBooks className="text-indigo-600" /></div>}<div><p className="text-xs font-semibold text-indigo-600">Phiếu #{loan.id}</p><p className="font-semibold text-slate-900">{loan.bookTitle}</p><p className="mt-1 text-xs text-slate-500">{loan.bookIsbn}</p></div></div></td>
              <td className="px-4 py-4"><p>{loan.userName}</p><p className="mt-1 text-xs text-slate-500">{loan.userEmail}</p></td>
              <td className="px-4 py-4"><p>Mượn: {loan.checkoutDate || "—"}</p><p className="mt-1">Hạn trả: <span className={loan.status === "OVERDUE" ? "font-semibold text-rose-600" : "font-semibold"}>{loan.dueDate || "—"}</span></p>{loan.returnDate && <p className="mt-1 text-xs text-emerald-600">Đã trả: {loan.returnDate}</p>}</td>
              <td className="px-4 py-4">{loan.renewalCount ?? 0}/{loan.maxRenewals ?? 0}</td>
              <td className="px-4 py-4"><Chip size="small" color={STATUS_COLORS[loan.status] || "default"} label={STATUS_LABELS[loan.status] || loan.status} />{Number(loan.fineAmount) > 0 && <p className="mt-2 text-xs text-rose-600">Phạt còn lại: {loan.fineAmount}</p>}</td>
              <td className="px-4 py-4"><div className="flex min-w-48 justify-end gap-1">{ACTIVE_STATUSES.has(loan.status) && <Button size="small" color="success" startIcon={<CheckCircle />} onClick={() => setCheckinForm({ loan, condition: "RETURNED", notes: "" })}>Nhận trả</Button>}{loan.status === "CHECKED_OUT" && <Button size="small" startIcon={<Autorenew />} onClick={() => setRenewForm({ loan, extensionDays: "14", notes: "" })}>Gia hạn</Button>}{loan.status === "OVERDUE" && <EventBusy color="error" />}</div></td>
            </tr>)}</tbody></table></div>
            {data.totalPages > 1 && <Pagination className="mt-6 flex justify-center" page={data.pageNumber + 1} count={data.totalPages} onChange={(_, value) => { setLoading(true); setPage(value - 1); }} />}
          </>}

    <Dialog open={checkoutOpen} onClose={() => { if (!saving) setCheckoutOpen(false); }} fullWidth maxWidth="sm"><DialogTitle>Tạo phiếu mượn</DialogTitle><DialogContent><form id="checkout-form" onSubmit={submitCheckout} className="grid gap-4 pt-2">
      <FormControl required><InputLabel id="checkout-user-label">Bạn đọc</InputLabel><Select labelId="checkout-user-label" label="Bạn đọc" value={checkoutForm.userId} onChange={(event) => setCheckoutForm((current) => ({ ...current, userId: event.target.value }))}>{users.map((user) => <MenuItem key={user.id} value={user.id}>{user.fullName} — {user.email}</MenuItem>)}</Select></FormControl>
      <FormControl required><InputLabel id="checkout-book-label">Sách còn sẵn</InputLabel><Select labelId="checkout-book-label" label="Sách còn sẵn" value={checkoutForm.bookId} onChange={(event) => setCheckoutForm((current) => ({ ...current, bookId: event.target.value }))}>{availableBooks.map((book) => <MenuItem key={book.id} value={book.id}>{book.title} ({book.availableCopies}/{book.totalCopies})</MenuItem>)}</Select></FormControl>
      <TextField required label="Số ngày mượn" type="number" value={checkoutForm.checkoutDays} onChange={(event) => setCheckoutForm((current) => ({ ...current, checkoutDays: event.target.value }))} slotProps={{ htmlInput: { min: 1 } }} />
      <TextField label="Ghi chú" multiline minRows={3} value={checkoutForm.notes} onChange={(event) => setCheckoutForm((current) => ({ ...current, notes: event.target.value }))} />
      <Alert severity="info">Bạn đọc phải có gói thành viên đang hoạt động và chưa vượt hạn mức mượn.</Alert>
    </form></DialogContent><DialogActions><Button disabled={saving} onClick={() => setCheckoutOpen(false)}>Hủy</Button><Button type="submit" form="checkout-form" variant="contained" disabled={saving || !checkoutForm.userId || !checkoutForm.bookId}>{saving ? "Đang tạo..." : "Tạo phiếu"}</Button></DialogActions></Dialog>

    <Dialog open={!!checkinForm} onClose={() => { if (!saving) setCheckinForm(null); }} fullWidth maxWidth="sm"><DialogTitle>Ghi nhận trả sách</DialogTitle><DialogContent>{checkinForm && <form id="checkin-form" onSubmit={submitCheckin} className="grid gap-4 pt-2"><Alert severity="info">Phiếu #{checkinForm.loan.id} — {checkinForm.loan.bookTitle}</Alert><FormControl><InputLabel id="checkin-condition-label">Tình trạng sách</InputLabel><Select labelId="checkin-condition-label" label="Tình trạng sách" value={checkinForm.condition} onChange={(event) => setCheckinForm((current) => ({ ...current, condition: event.target.value }))}><MenuItem value="RETURNED">Trả bình thường</MenuItem><MenuItem value="DAMAGED">Sách hư hỏng</MenuItem><MenuItem value="LOST">Sách bị mất</MenuItem></Select></FormControl><TextField label="Ghi chú khi trả" multiline minRows={3} value={checkinForm.notes} onChange={(event) => setCheckinForm((current) => ({ ...current, notes: event.target.value }))} /></form>}</DialogContent><DialogActions><Button disabled={saving} onClick={() => setCheckinForm(null)}>Hủy</Button><Button type="submit" form="checkin-form" color="success" variant="contained" disabled={saving}>{saving ? "Đang lưu..." : "Xác nhận trả"}</Button></DialogActions></Dialog>

    <Dialog open={!!renewForm} onClose={() => { if (!saving) setRenewForm(null); }} fullWidth maxWidth="sm"><DialogTitle>Gia hạn phiếu mượn</DialogTitle><DialogContent>{renewForm && <form id="renew-form" onSubmit={submitRenew} className="grid gap-4 pt-2"><Alert severity="info">Hạn hiện tại: {renewForm.loan.dueDate}. Đã gia hạn {renewForm.loan.renewalCount ?? 0}/{renewForm.loan.maxRenewals ?? 0} lần.</Alert><TextField required label="Số ngày gia hạn" type="number" value={renewForm.extensionDays} onChange={(event) => setRenewForm((current) => ({ ...current, extensionDays: event.target.value }))} slotProps={{ htmlInput: { min: 1 } }} /><TextField label="Ghi chú" multiline minRows={3} value={renewForm.notes} onChange={(event) => setRenewForm((current) => ({ ...current, notes: event.target.value }))} /></form>}</DialogContent><DialogActions><Button disabled={saving} onClick={() => setRenewForm(null)}>Hủy</Button><Button type="submit" form="renew-form" variant="contained" disabled={saving}>{saving ? "Đang lưu..." : "Gia hạn"}</Button></DialogActions></Dialog>
  </section>;
}
