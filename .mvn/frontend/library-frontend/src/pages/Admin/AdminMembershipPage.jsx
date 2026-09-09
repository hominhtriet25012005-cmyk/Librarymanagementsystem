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
  Tab,
  Tabs,
  TextField,
} from "@mui/material";
import { Add, Autorenew, Cancel, CardMembership, Edit, HourglassBottom } from "@mui/icons-material";
import { adminMembershipApi, getApiErrorMessage } from "../../api";
import { formatDate, formatDateTime, formatMoney } from "../../utils/locale";

const EMPTY_PAGE = { content: [], pageNumber: 0, totalPages: 0, totalElements: 0 };
const EMPTY_STATS = { totalSubscriptions: 0, activeSubscriptions: 0, pendingSubscriptions: 0, expiredSubscriptions: 0, cancelledSubscriptions: 0 };
const EMPTY_FILTERS = { searchTerm: "", planId: "", status: "", sort: "createdAt:DESC" };
const EMPTY_PLAN = { planCode: "", name: "", description: "", durationDays: "30", price: "", currency: "INR", maxBooksAllowed: "2", maxDaysPerBook: "14", displayOrder: "0", isActive: true, isFeatured: false, badgeText: "", adminNotes: "" };

function subscriptionStatus(subscription) {
  if (subscription.cancelledAt) return "CANCELLED";
  if (subscription.isExpired) return "EXPIRED";
  if (subscription.isValid) return "ACTIVE";
  return "PENDING";
}

const STATUS_META = {
  ACTIVE: { label: "Đang hoạt động", color: "success" },
  PENDING: { label: "Chờ thanh toán", color: "warning" },
  EXPIRED: { label: "Đã hết hạn", color: "default" },
  CANCELLED: { label: "Đã hủy", color: "error" },
};

function formFromPlan(plan) {
  return {
    planCode: plan.planCode || "", name: plan.name || "", description: plan.description || "",
    durationDays: String(plan.durationDays ?? 30), price: String(plan.price ?? ""), currency: plan.currency || "INR",
    maxBooksAllowed: String(plan.maxBooksAllowed ?? 2), maxDaysPerBook: String(plan.maxDaysPerBook ?? 14),
    displayOrder: String(plan.displayOrder ?? 0), isActive: plan.isActive !== false, isFeatured: plan.isFeatured === true,
    badgeText: plan.badgeText || "", adminNotes: plan.adminNotes || "",
  };
}

function validatePlan(form) {
  const errors = {};
  if (!form.planCode.trim()) errors.planCode = "Vui lòng nhập mã gói.";
  if (!/^[A-Za-z0-9_-]+$/.test(form.planCode.trim())) errors.planCode = "Mã gói chỉ gồm chữ, số, gạch ngang và gạch dưới.";
  if (!form.name.trim()) errors.name = "Vui lòng nhập tên gói.";
  for (const field of ["durationDays", "price", "maxBooksAllowed", "maxDaysPerBook"]) {
    if (!/^\d+$/.test(String(form[field])) || Number(form[field]) <= 0) errors[field] = "Giá trị phải là số nguyên lớn hơn 0.";
  }
  if (!/^[A-Za-z]{3}$/.test(form.currency.trim())) errors.currency = "Mã tiền tệ phải có 3 chữ cái.";
  if (!/^-?\d+$/.test(String(form.displayOrder))) errors.displayOrder = "Thứ tự phải là số nguyên.";
  if (form.description.length > 500) errors.description = "Mô tả không được vượt quá 500 ký tự.";
  if (form.badgeText.length > 255) errors.badgeText = "Nhãn không được vượt quá 255 ký tự.";
  if (form.adminNotes.length > 255) errors.adminNotes = "Ghi chú không được vượt quá 255 ký tự.";
  return errors;
}

function planPayload(form) {
  return {
    planCode: form.planCode.trim().toUpperCase(), name: form.name.trim(), description: form.description.trim() || null,
    durationDays: Number(form.durationDays), price: Number(form.price), currency: form.currency.trim().toUpperCase(),
    maxBooksAllowed: Number(form.maxBooksAllowed), maxDaysPerBook: Number(form.maxDaysPerBook), displayOrder: Number(form.displayOrder),
    isActive: form.isActive, isFeatured: form.isFeatured, badgeText: form.badgeText.trim() || null, adminNotes: form.adminNotes.trim() || null,
  };
}

function MetricCard({ label, value, tone }) {
  return <Card className="p-5"><p className="text-sm text-slate-500">{label}</p><p className={`mt-2 text-3xl font-bold ${tone}`}>{value}</p></Card>;
}

export default function AdminMembershipPage() {
  const [tab, setTab] = useState(0);
  const [plans, setPlans] = useState([]);
  const [data, setData] = useState(EMPTY_PAGE);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [editor, setEditor] = useState(undefined);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN);
  const [formErrors, setFormErrors] = useState({});
  const [hideTarget, setHideTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    adminMembershipApi.getPlans().then((items) => { if (active) setPlans(items); })
      .catch((requestError) => { if (active) setError(getApiErrorMessage(requestError, "Không tải được danh sách gói thành viên.")); });
    return () => { active = false; };
  }, [revision]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      const [sortBy, sortDirection] = filters.sort.split(":");
      Promise.all([
        adminMembershipApi.searchSubscriptions({ ...filters, planId: filters.planId || undefined, status: filters.status || undefined, searchTerm: filters.searchTerm.trim() || undefined, sort: undefined, sortBy, sortDirection, page, size: 10 }),
        adminMembershipApi.getStats(),
      ]).then(([pageData, statsData]) => { if (active) { setData(pageData); setStats(statsData); } })
        .catch((requestError) => { if (active) { setData(EMPTY_PAGE); setError(getApiErrorMessage(requestError, "Không tải được danh sách đăng ký.")); } })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [filters, page, revision]);

  function reload(message) {
    if (message) setNotice({ severity: "success", text: message });
    setLoading(true); setError(""); setRevision((value) => value + 1);
  }

  function openPlan(plan) {
    setEditor(plan || null); setPlanForm(plan ? formFromPlan(plan) : EMPTY_PLAN); setFormErrors({});
  }

  async function savePlan(event) {
    event.preventDefault();
    const errors = validatePlan(planForm); setFormErrors(errors);
    if (Object.keys(errors).length || submitting.current) return;
    submitting.current = true; setBusy(true);
    try {
      if (editor) await adminMembershipApi.updatePlan(editor.id, planPayload(planForm));
      else await adminMembershipApi.createPlan(planPayload(planForm));
      setEditor(undefined); reload(editor ? "Đã cập nhật gói thành viên." : "Đã tạo gói thành viên.");
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể lưu gói thành viên.") });
    } finally { submitting.current = false; setBusy(false); }
  }

  async function hidePlan() {
    if (!hideTarget || submitting.current) return;
    submitting.current = true; setBusy(true);
    try { await adminMembershipApi.hidePlan(hideTarget.id); setHideTarget(null); reload("Đã ẩn gói thành viên khỏi danh sách đăng ký."); }
    catch (requestError) { setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể ẩn gói thành viên.") }); }
    finally { submitting.current = false; setBusy(false); }
  }

  async function cancelSubscription(event) {
    event.preventDefault();
    if (!cancelTarget || submitting.current) return;
    submitting.current = true; setBusy(true);
    try { await adminMembershipApi.cancel(cancelTarget.id, cancelReason.trim() || "Quản trị viên hủy"); setCancelTarget(null); setCancelReason(""); reload("Đã hủy đăng ký thành viên."); }
    catch (requestError) { setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể hủy đăng ký.") }); }
    finally { submitting.current = false; setBusy(false); }
  }

  async function deactivateExpired() {
    if (submitting.current) return;
    submitting.current = true; setBusy(true);
    try { await adminMembershipApi.deactivateExpired(); reload("Đã cập nhật các đăng ký hết hạn."); }
    catch (requestError) { setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể cập nhật đăng ký hết hạn.") }); }
    finally { submitting.current = false; setBusy(false); }
  }

  function updateFilter(name, value) {
    setLoading(true); setError(""); setFilters((current) => ({ ...current, [name]: value })); setPage(0);
  }

  return <section aria-labelledby="admin-membership-title" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Thành viên thư viện</p><h1 id="admin-membership-title" className="mt-2 text-4xl font-bold text-slate-900">Quản lý gói và đăng ký</h1><p className="mt-2 text-lg text-slate-600">Thiết lập quyền lợi, theo dõi thời hạn và xử lý đăng ký.</p></div>{tab === 0 ? <Button variant="contained" startIcon={<Add />} onClick={() => openPlan(null)}>Tạo gói mới</Button> : <Button variant="outlined" startIcon={<Autorenew />} disabled={busy} onClick={deactivateExpired}>Cập nhật gói hết hạn</Button>}</div>
    {notice && <Alert severity={notice.severity} className="mb-5" onClose={() => setNotice(null)}>{notice.text}</Alert>}
    <Card className="mb-6"><Tabs value={tab} onChange={(_, value) => setTab(value)} aria-label="Nội dung quản lý thành viên"><Tab label={`Gói thành viên (${plans.length})`} /><Tab label={`Đăng ký (${stats.totalSubscriptions})`} /></Tabs></Card>

    {tab === 0 && <div>{error && <Alert severity="error" className="mb-5">{error}</Alert>}<div className="grid gap-5 xl:grid-cols-2">{plans.map((plan) => <Card key={plan.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap gap-2"><Chip size="small" label={plan.planCode} /><Chip size="small" color={plan.isActive ? "success" : "default"} label={plan.isActive ? "Đang mở" : "Đã ẩn"} />{plan.isFeatured && <Chip size="small" color="secondary" label={plan.badgeText || "Nổi bật"} />}</div><h2 className="mt-3 text-xl font-bold">{plan.name}</h2><p className="mt-1 text-sm text-slate-600">{plan.description || "Chưa có mô tả."}</p></div><p className="text-xl font-bold text-indigo-700">{formatMoney(plan.price, plan.currency || "INR")}</p></div><dl className="mt-5 grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-4"><div><dt className="text-slate-500">Thời hạn</dt><dd className="font-semibold">{plan.durationDays} ngày</dd></div><div><dt className="text-slate-500">Số sách</dt><dd className="font-semibold">{plan.maxBooksAllowed}</dd></div><div><dt className="text-slate-500">Ngày/sách</dt><dd className="font-semibold">{plan.maxDaysPerBook}</dd></div><div><dt className="text-slate-500">Thứ tự</dt><dd className="font-semibold">{plan.displayOrder}</dd></div></dl>{plan.adminNotes && <p className="mt-3 text-xs text-slate-500">Ghi chú: {plan.adminNotes}</p>}<div className="mt-4 flex justify-end gap-2"><Button startIcon={<Edit />} onClick={() => openPlan(plan)}>Chỉnh sửa</Button>{plan.isActive && <Button color="error" onClick={() => setHideTarget(plan)}>Ẩn gói</Button>}</div></Card>)}{plans.length === 0 && !error && <Alert severity="info">Chưa có gói thành viên. Hãy tạo gói đầu tiên.</Alert>}</div></div>}

    {tab === 1 && <div><div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><MetricCard label="Tổng đăng ký" value={stats.totalSubscriptions} tone="text-slate-900" /><MetricCard label="Đang hoạt động" value={stats.activeSubscriptions} tone="text-emerald-700" /><MetricCard label="Chờ thanh toán" value={stats.pendingSubscriptions} tone="text-amber-700" /><MetricCard label="Đã hết hạn" value={stats.expiredSubscriptions} tone="text-slate-600" /><MetricCard label="Đã hủy" value={stats.cancelledSubscriptions} tone="text-rose-700" /></div><Card className="mb-5 p-4"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><TextField label="Tìm kiếm" value={filters.searchTerm} placeholder="Bạn đọc, email hoặc tên gói" onChange={(event) => updateFilter("searchTerm", event.target.value)} /><FormControl><InputLabel>Gói thành viên</InputLabel><Select label="Gói thành viên" value={filters.planId} onChange={(event) => updateFilter("planId", event.target.value)}><MenuItem value="">Tất cả</MenuItem>{plans.map((plan) => <MenuItem key={plan.id} value={plan.id}>{plan.name}</MenuItem>)}</Select></FormControl><FormControl><InputLabel>Trạng thái</InputLabel><Select label="Trạng thái" value={filters.status} onChange={(event) => updateFilter("status", event.target.value)}><MenuItem value="">Tất cả</MenuItem>{Object.entries(STATUS_META).map(([value, meta]) => <MenuItem key={value} value={value}>{meta.label}</MenuItem>)}</Select></FormControl><FormControl><InputLabel>Sắp xếp</InputLabel><Select label="Sắp xếp" value={filters.sort} onChange={(event) => updateFilter("sort", event.target.value)}><MenuItem value="createdAt:DESC">Mới đăng ký trước</MenuItem><MenuItem value="createdAt:ASC">Cũ nhất trước</MenuItem><MenuItem value="endDate:ASC">Sắp hết hạn trước</MenuItem><MenuItem value="price:DESC">Giá cao trước</MenuItem></Select></FormControl></div><div className="mt-3 flex justify-end"><Button onClick={() => { setLoading(true); setError(""); setFilters(EMPTY_FILTERS); setPage(0); }}>Xóa bộ lọc</Button></div></Card>
      {loading ? <div className="flex min-h-64 items-center justify-center"><CircularProgress aria-label="Đang tải đăng ký" /></div> : error ? <Alert severity="error" action={<Button onClick={() => reload()}>Thử lại</Button>}>{error}</Alert> : data.content.length === 0 ? <Alert severity="info">Không có đăng ký phù hợp.</Alert> : <><div className="overflow-x-auto rounded-xl border bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-indigo-50"><tr><th className="px-4 py-3">Bạn đọc</th><th className="px-4 py-3">Gói</th><th className="px-4 py-3">Thời hạn</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Đăng ký</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{data.content.map((item) => { const status = subscriptionStatus(item); const meta = STATUS_META[status]; return <tr key={item.id}><td className="px-4 py-4"><p className="font-semibold">{item.userName}</p><p className="text-xs text-slate-500">{item.userEmail}</p></td><td className="px-4 py-4"><p>{item.planName}</p><p className="text-xs text-slate-500">{item.planCode} · {formatMoney(item.price, item.currency || "INR")}</p></td><td className="px-4 py-4"><p>{formatDate(item.startDate)} – {formatDate(item.endDate)}</p><p className="text-xs text-slate-500">{item.maxBooksAllowed} sách, {item.maxDaysPerBook} ngày/sách</p></td><td className="px-4 py-4"><Chip size="small" color={meta.color} label={meta.label} />{item.cancellationReason && <p className="mt-1 max-w-44 text-xs text-slate-500">{item.cancellationReason}</p>}</td><td className="px-4 py-4">{formatDateTime(item.createdAt)}</td><td className="px-4 py-4 text-right">{["ACTIVE", "PENDING"].includes(status) && <Button size="small" color="error" startIcon={<Cancel />} onClick={() => { setCancelTarget(item); setCancelReason(""); }}>Hủy</Button>}{status === "EXPIRED" && <HourglassBottom color="disabled" />}{status === "CANCELLED" && <CardMembership color="disabled" />}</td></tr>; })}</tbody></table></div>{data.totalPages > 1 && <Pagination className="mt-6 flex justify-center" page={data.pageNumber + 1} count={data.totalPages} onChange={(_, value) => { setLoading(true); setPage(value - 1); }} />}</>}
    </div>}

    <Dialog open={editor !== undefined} onClose={() => { if (!busy) setEditor(undefined); }} fullWidth maxWidth="md"><DialogTitle>{editor ? "Cập nhật gói thành viên" : "Tạo gói thành viên"}</DialogTitle><DialogContent><form id="plan-form" onSubmit={savePlan} className="grid gap-4 pt-2 sm:grid-cols-2"><TextField required disabled={!!editor} label="Mã gói" value={planForm.planCode} error={!!formErrors.planCode} helperText={formErrors.planCode || (editor ? "Mã gói được giữ cố định sau khi tạo." : "Ví dụ: STANDARD_90")} onChange={(event) => setPlanForm((current) => ({ ...current, planCode: event.target.value }))} /><TextField required label="Tên gói" value={planForm.name} error={!!formErrors.name} helperText={formErrors.name} onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value }))} /><TextField className="sm:col-span-2" label="Mô tả" multiline minRows={2} value={planForm.description} error={!!formErrors.description} helperText={formErrors.description} onChange={(event) => setPlanForm((current) => ({ ...current, description: event.target.value }))} /><TextField required type="number" label="Thời hạn (ngày)" value={planForm.durationDays} error={!!formErrors.durationDays} helperText={formErrors.durationDays} onChange={(event) => setPlanForm((current) => ({ ...current, durationDays: event.target.value }))} /><TextField required type="number" label="Giá gói" value={planForm.price} error={!!formErrors.price} helperText={formErrors.price} onChange={(event) => setPlanForm((current) => ({ ...current, price: event.target.value }))} /><TextField required label="Mã tiền tệ" value={planForm.currency} error={!!formErrors.currency} helperText={formErrors.currency || "Ví dụ: INR"} onChange={(event) => setPlanForm((current) => ({ ...current, currency: event.target.value }))} /><TextField required type="number" label="Thứ tự hiển thị" value={planForm.displayOrder} error={!!formErrors.displayOrder} helperText={formErrors.displayOrder} onChange={(event) => setPlanForm((current) => ({ ...current, displayOrder: event.target.value }))} /><TextField required type="number" label="Số sách tối đa" value={planForm.maxBooksAllowed} error={!!formErrors.maxBooksAllowed} helperText={formErrors.maxBooksAllowed} onChange={(event) => setPlanForm((current) => ({ ...current, maxBooksAllowed: event.target.value }))} /><TextField required type="number" label="Số ngày tối đa mỗi sách" value={planForm.maxDaysPerBook} error={!!formErrors.maxDaysPerBook} helperText={formErrors.maxDaysPerBook} onChange={(event) => setPlanForm((current) => ({ ...current, maxDaysPerBook: event.target.value }))} /><TextField label="Nhãn nổi bật" value={planForm.badgeText} error={!!formErrors.badgeText} helperText={formErrors.badgeText} onChange={(event) => setPlanForm((current) => ({ ...current, badgeText: event.target.value }))} /><TextField label="Ghi chú quản trị" value={planForm.adminNotes} error={!!formErrors.adminNotes} helperText={formErrors.adminNotes} onChange={(event) => setPlanForm((current) => ({ ...current, adminNotes: event.target.value }))} /><div className="flex flex-wrap gap-4 sm:col-span-2"><FormControlLabel control={<Switch checked={planForm.isActive} onChange={(event) => setPlanForm((current) => ({ ...current, isActive: event.target.checked }))} />} label="Cho phép đăng ký" /><FormControlLabel control={<Switch checked={planForm.isFeatured} onChange={(event) => setPlanForm((current) => ({ ...current, isFeatured: event.target.checked }))} />} label="Đánh dấu nổi bật" /></div></form></DialogContent><DialogActions><Button disabled={busy} onClick={() => setEditor(undefined)}>Hủy</Button><Button type="submit" form="plan-form" variant="contained" disabled={busy}>{busy ? "Đang lưu..." : "Lưu gói"}</Button></DialogActions></Dialog>
    <Dialog open={!!hideTarget} onClose={() => { if (!busy) setHideTarget(null); }} fullWidth maxWidth="xs"><DialogTitle>Ẩn gói thành viên</DialogTitle><DialogContent>Ẩn “{hideTarget?.name}” khỏi danh sách đăng ký? Các đăng ký đã tạo vẫn được giữ nguyên.</DialogContent><DialogActions><Button disabled={busy} onClick={() => setHideTarget(null)}>Quay lại</Button><Button disabled={busy} color="error" variant="contained" onClick={hidePlan}>Ẩn gói</Button></DialogActions></Dialog>
    <Dialog open={!!cancelTarget} onClose={() => { if (!busy) setCancelTarget(null); }} fullWidth maxWidth="sm"><DialogTitle>Hủy đăng ký thành viên</DialogTitle><DialogContent><form id="admin-cancel-subscription" onSubmit={cancelSubscription} className="grid gap-4 pt-2"><Alert severity="warning">Bạn đang hủy gói “{cancelTarget?.planName}” của {cancelTarget?.userName}.</Alert><TextField required label="Lý do hủy" multiline minRows={3} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></form></DialogContent><DialogActions><Button disabled={busy} onClick={() => setCancelTarget(null)}>Quay lại</Button><Button type="submit" form="admin-cancel-subscription" color="error" variant="contained" disabled={busy || !cancelReason.trim()}>{busy ? "Đang hủy..." : "Xác nhận hủy"}</Button></DialogActions></Dialog>
  </section>;
}
