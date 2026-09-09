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
  Pagination,
  TextField,
} from "@mui/material";
import { AutoAwesome, CalendarMonth, Check, LibraryBooks } from "@mui/icons-material";
import { getApiErrorMessage, subscriptionsApi } from "../../api";
import { formatDate, formatDateTime, formatMoney } from "../../utils/locale";
import VietQrPaymentCard from "../../components/payments/VietQrPaymentCard";

const EMPTY_PAGE = { content: [], pageNumber: 0, totalPages: 0, totalElements: 0 };

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

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState([]);
  const [history, setHistory] = useState(EMPTY_PAGE);
  const [current, setCurrent] = useState({ active: null, pending: null });
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [payment, setPayment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      subscriptionsApi.getPlans(),
      subscriptionsApi.getMine({ page, size: 8 }),
      subscriptionsApi.getActive(),
      subscriptionsApi.getPending(),
    ])
      .then(([planItems, historyPage, activeSubscriptionResult, pendingSubscriptionResult]) => {
        if (!active) return;
        setPlans(planItems);
        setHistory(historyPage);
        setCurrent({ active: activeSubscriptionResult, pending: pendingSubscriptionResult });
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, "Không tải được thông tin gói thành viên."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, revision]);

  const activeSubscription = current.active;
  const pendingSubscription = current.pending;

  async function subscribe() {
    if (!selectedPlan || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const result = await subscriptionsApi.subscribe({ planId: selectedPlan.id, autoRenew: false });
      if (result.gateway !== "VIETQR" || !result.qrImageUrl) {
        throw Object.assign(new Error("Invalid VietQR response"), {
          userMessage: "Máy chủ không trả về thông tin VietQR hợp lệ.",
        });
      }
      setPayment(result);
      setSelectedPlan(null);
      setNotice({ severity: "success", text: "Đã tạo đăng ký chờ. Hãy quét mã VietQR để thanh toán." });
      setRevision((value) => value + 1);
    } catch (requestError) {
      setSelectedPlan(null);
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể tạo đăng ký thành viên.") });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  async function cancelSubscription(event) {
    event.preventDefault();
    if (!cancelTarget || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      await subscriptionsApi.cancel(cancelTarget.id, cancelReason.trim() || undefined);
      setCancelTarget(null);
      setCancelReason("");
      setPayment(null);
      setNotice({ severity: "success", text: "Đã hủy đăng ký thành viên." });
      setLoading(true);
      setRevision((value) => value + 1);
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể hủy đăng ký.") });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return <section aria-labelledby="subscriptions-title" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <header className="mb-8"><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Quyền lợi bạn đọc</p><h1 id="subscriptions-title" className="mt-2 text-4xl font-bold text-slate-900">Gói thành viên</h1><p className="mt-2 text-lg text-slate-600">Chọn hạn mức mượn phù hợp và theo dõi lịch sử đăng ký của bạn.</p></header>

    <Alert severity="info" className="mb-5">Quét mã VietQR để chuyển khoản. Gói chỉ hoạt động sau khi quản trị viên xác nhận đã nhận tiền.</Alert>
    {notice && <Alert severity={notice.severity} className="mb-5" onClose={() => setNotice(null)}>{notice.text}</Alert>}
    <VietQrPaymentCard payment={payment} onSubmitted={() => { setPayment(null); setNotice({ severity: "success", text: "Đã gửi yêu cầu đối soát. Gói sẽ hoạt động sau khi quản trị viên xác nhận." }); setLoading(true); setRevision((value) => value + 1); }} />

    {loading ? <div className="flex min-h-80 items-center justify-center"><CircularProgress aria-label="Đang tải gói thành viên" /></div>
      : error ? <Alert severity="error" action={<Button onClick={() => { setLoading(true); setError(""); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>
        : <>
          {activeSubscription && <Card className="mb-7 overflow-hidden border border-emerald-200"><div className="bg-emerald-50 p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold uppercase text-emerald-700">Gói đang sử dụng</p><h2 className="mt-1 text-2xl font-bold">{activeSubscription.planName}</h2></div><Chip color="success" label={`${activeSubscription.daysRemaining} ngày còn lại`} /></div><div className="mt-4 grid gap-3 text-sm sm:grid-cols-3"><p><strong>{activeSubscription.maxBooksAllowed}</strong> sách cùng lúc</p><p><strong>{activeSubscription.maxDaysPerBook}</strong> ngày mỗi sách</p><p>Hết hạn <strong>{formatDate(activeSubscription.endDate)}</strong></p></div><Button className="mt-4" color="error" onClick={() => setCancelTarget(activeSubscription)}>Hủy gói</Button></div></Card>}
          {pendingSubscription && <Alert severity="warning" className="mb-7" action={<Button color="inherit" onClick={() => setCancelTarget(pendingSubscription)}>Hủy đăng ký chờ</Button>}>Bạn có đăng ký “{pendingSubscription.planName}” đang chờ thanh toán. Hãy hoàn tất liên kết đã tạo hoặc hủy để chọn lại.</Alert>}

          {plans.length === 0 && <Alert severity="info" className="mb-7">Hiện chưa có gói thành viên nào đang mở đăng ký.</Alert>}

          <div className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">{plans.map((plan) => <Card key={plan.id} className={`relative flex flex-col p-6 ${plan.isFeatured ? "border-2 border-indigo-500" : "border"}`}>
            {plan.isFeatured && <Chip icon={<AutoAwesome />} label={plan.badgeText || "Được đề xuất"} color="secondary" className="absolute right-4 top-4" />}
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{plan.planCode}</p><h2 className="mt-2 text-2xl font-bold text-slate-900">{plan.name}</h2><p className="mt-3 min-h-12 text-slate-600">{plan.description || "Gói thành viên dành cho bạn đọc thư viện."}</p><p className="mt-5 text-3xl font-bold">{formatMoney(plan.price, plan.currency || "VND")}</p><p className="text-sm text-slate-500">cho {plan.durationDays} ngày</p>
            <div className="my-5 grid gap-3 text-sm"><p className="flex items-center gap-2"><LibraryBooks color="primary" fontSize="small" /> Mượn tối đa {plan.maxBooksAllowed} sách cùng lúc</p><p className="flex items-center gap-2"><CalendarMonth color="primary" fontSize="small" /> Mỗi sách tối đa {plan.maxDaysPerBook} ngày</p><p className="flex items-center gap-2"><Check color="success" fontSize="small" /> Gói có hiệu lực {plan.durationDays} ngày</p></div>
            <Button className="mt-auto" variant={plan.isFeatured ? "contained" : "outlined"} disabled={!!activeSubscription || !!pendingSubscription} onClick={() => setSelectedPlan(plan)}>{activeSubscription ? "Bạn đang có gói" : pendingSubscription ? "Đang chờ thanh toán" : "Chọn gói này"}</Button>
          </Card>)}</div>

          <Card className="overflow-hidden"><div className="border-b p-5"><h2 className="text-xl font-bold">Lịch sử đăng ký</h2><p className="mt-1 text-sm text-slate-500">Tổng cộng {history.totalElements} đăng ký.</p></div>{history.content.length === 0 ? <p className="p-8 text-center text-slate-500">Bạn chưa đăng ký gói thành viên nào.</p> : <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="px-5 py-3">Gói</th><th className="px-5 py-3">Thời hạn</th><th className="px-5 py-3">Quyền lợi</th><th className="px-5 py-3">Trạng thái</th><th className="px-5 py-3">Ngày tạo</th></tr></thead><tbody className="divide-y">{history.content.map((item) => { const meta = STATUS_META[subscriptionStatus(item)]; return <tr key={item.id}><td className="px-5 py-4"><p className="font-semibold">{item.planName}</p><p className="text-xs text-slate-500">{item.planCode} · {formatMoney(item.price, item.currency || "VND")}</p></td><td className="px-5 py-4">{formatDate(item.startDate)} – {formatDate(item.endDate)}</td><td className="px-5 py-4">{item.maxBooksAllowed} sách · {item.maxDaysPerBook} ngày</td><td className="px-5 py-4"><Chip size="small" color={meta.color} label={meta.label} />{item.cancellationReason && <p className="mt-1 max-w-48 text-xs text-slate-500">{item.cancellationReason}</p>}</td><td className="px-5 py-4">{formatDateTime(item.createdAt)}</td></tr>; })}</tbody></table></div>}</Card>
          {history.totalPages > 1 && <Pagination className="mt-6 flex justify-center" page={history.pageNumber + 1} count={history.totalPages} onChange={(_, value) => { setLoading(true); setPage(value - 1); }} />}
        </>}

    <Dialog open={!!selectedPlan} onClose={() => { if (!busy) setSelectedPlan(null); }} fullWidth maxWidth="xs"><DialogTitle>Xác nhận chọn gói</DialogTitle><DialogContent>{selectedPlan && <div className="pt-1"><p>Bạn muốn đăng ký <strong>{selectedPlan.name}</strong> trong {selectedPlan.durationDays} ngày?</p><p className="mt-3 text-xl font-bold">{formatMoney(selectedPlan.price, selectedPlan.currency || "VND")}</p><Alert severity="info" className="mt-4">Hệ thống sẽ hiện mã VietQR. Gói chỉ hoạt động sau khi quản trị viên đối soát giao dịch.</Alert></div>}</DialogContent><DialogActions><Button disabled={busy} onClick={() => setSelectedPlan(null)}>Quay lại</Button><Button disabled={busy} variant="contained" onClick={subscribe}>{busy ? "Đang tạo..." : "Hiện mã VietQR"}</Button></DialogActions></Dialog>

    <Dialog open={!!cancelTarget} onClose={() => { if (!busy) setCancelTarget(null); }} fullWidth maxWidth="sm"><DialogTitle>Hủy đăng ký thành viên</DialogTitle><DialogContent><form id="cancel-subscription-form" onSubmit={cancelSubscription} className="grid gap-4 pt-2"><Alert severity="warning">Sau khi hủy, quyền lợi của gói “{cancelTarget?.planName}” sẽ ngừng hoạt động.</Alert><TextField label="Lý do hủy" multiline minRows={3} value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} /></form></DialogContent><DialogActions><Button disabled={busy} onClick={() => setCancelTarget(null)}>Quay lại</Button><Button type="submit" form="cancel-subscription-form" color="error" variant="contained" disabled={busy}>{busy ? "Đang hủy..." : "Xác nhận hủy"}</Button></DialogActions></Dialog>
  </section>;
}
