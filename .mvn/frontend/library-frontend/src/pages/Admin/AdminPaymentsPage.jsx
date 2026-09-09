import { useEffect, useState } from "react";
import { Alert, Button, Card, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Pagination, Select, TextField } from "@mui/material";
import { CheckCircle, HighlightOff } from "@mui/icons-material";
import { adminPaymentsApi, getApiErrorMessage } from "../../api";
import { formatDateTime, formatMoney } from "../../utils/locale";

const EMPTY_PAGE = { content: [], number: 0, totalPages: 0, totalElements: 0 };
const STATUS_OPTIONS = [["", "Tất cả trạng thái"], ["PENDING", "Chờ chuyển khoản"], ["PROCESSING", "Chờ đối soát"], ["SUCCESS", "Thành công"], ["FAILED", "Đã từ chối"]];
const TYPE_OPTIONS = [["", "Tất cả loại"], ["MEMBERSHIP", "Gói thành viên"], ["FINE", "Tiền phạt"]];
const STATUS_META = {
  PENDING: ["Chờ chuyển khoản", "warning"], PROCESSING: ["Chờ đối soát", "info"], SUCCESS: ["Thành công", "success"], FAILED: ["Đã từ chối", "error"], CANCELLED: ["Đã hủy", "default"], REFUNDED: ["Đã hoàn tiền", "secondary"],
};

export default function AdminPaymentsPage() {
  const [data, setData] = useState(EMPTY_PAGE);
  const [status, setStatus] = useState("PROCESSING");
  const [paymentType, setPaymentType] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [review, setReview] = useState(null);
  const [reviewValue, setReviewValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    adminPaymentsApi.getAll({ page, size: 15, status, paymentType, sortBy: "submittedAt", sortDir: "DESC" })
      .then((result) => { if (active) setData(result); })
      .catch((requestError) => { if (active) setError(getApiErrorMessage(requestError, "Không tải được danh sách thanh toán.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, paymentType, revision, status]);

  function changeFilter(setter, value) { setLoading(true); setError(""); setPage(0); setter(value); }

  async function submitReview(event) {
    event.preventDefault();
    if (!review || !reviewValue.trim()) return;
    setBusy(true);
    try {
      if (review.mode === "confirm") await adminPaymentsApi.confirm(review.payment.id, reviewValue);
      else await adminPaymentsApi.reject(review.payment.id, reviewValue);
      setNotice({ severity: "success", text: review.mode === "confirm" ? "Đã xác nhận thanh toán thành công." : "Đã từ chối giao dịch." });
      setReview(null); setReviewValue(""); setLoading(true); setRevision((value) => value + 1);
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể hoàn tất đối soát.") });
    } finally { setBusy(false); }
  }

  return <section aria-labelledby="admin-payments-title" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <header className="mb-7"><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Khu vực quản trị</p><h1 id="admin-payments-title" className="mt-2 text-4xl font-bold">Đối soát thanh toán</h1><p className="mt-2 text-lg text-slate-600">Kiểm tra giao dịch VietQR trước khi kích hoạt gói hoặc đóng khoản phạt.</p></header>
    <Alert severity="warning" className="mb-5">Chỉ bấm xác nhận sau khi đã thấy đúng số tiền và nội dung chuyển khoản trong ứng dụng MB.</Alert>
    {notice && <Alert severity={notice.severity} className="mb-5" onClose={() => setNotice(null)}>{notice.text}</Alert>}
    <Card className="mb-5 grid gap-4 p-4 sm:grid-cols-2"><FormControl><InputLabel>Trạng thái</InputLabel><Select label="Trạng thái" value={status} onChange={(event) => changeFilter(setStatus, event.target.value)}>{STATUS_OPTIONS.map(([value, label]) => <MenuItem key={label} value={value}>{label}</MenuItem>)}</Select></FormControl><FormControl><InputLabel>Loại thanh toán</InputLabel><Select label="Loại thanh toán" value={paymentType} onChange={(event) => changeFilter(setPaymentType, event.target.value)}>{TYPE_OPTIONS.map(([value, label]) => <MenuItem key={label} value={value}>{label}</MenuItem>)}</Select></FormControl></Card>
    {loading ? <div className="flex min-h-72 items-center justify-center"><CircularProgress aria-label="Đang tải giao dịch" /></div>
      : error ? <Alert severity="error" action={<Button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>
        : data.content.length === 0 ? <Alert severity="info">Không có giao dịch phù hợp.</Alert>
          : <div className="overflow-x-auto rounded-xl border bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-indigo-50"><tr><th className="px-4 py-3">Bạn đọc</th><th className="px-4 py-3">Nội dung</th><th className="px-4 py-3">Số tiền</th><th className="px-4 py-3">Đối chiếu</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{data.content.map((payment) => { const meta = STATUS_META[payment.status] || [payment.status, "default"]; return <tr key={payment.id}><td className="px-4 py-4"><p className="font-semibold">{payment.userName}</p><p className="text-xs text-slate-500">{payment.userEmail}</p></td><td className="px-4 py-4"><p>{payment.paymentType === "MEMBERSHIP" ? "Gói thành viên" : "Tiền phạt"}</p><code className="text-xs font-bold text-rose-700">{payment.transactionId}</code></td><td className="px-4 py-4 font-semibold">{formatMoney(payment.amount, payment.currency || "VND")}</td><td className="px-4 py-4"><p>{payment.payerReference || "Chưa cung cấp mã"}</p><p className="text-xs text-slate-500">Gửi: {formatDateTime(payment.submittedAt)}</p>{payment.gatewayPaymentId && <p className="text-xs">Ngân hàng: {payment.gatewayPaymentId}</p>}</td><td className="px-4 py-4"><Chip size="small" color={meta[1]} label={meta[0]} />{payment.failureReason && <p className="mt-1 max-w-52 text-xs text-red-600">{payment.failureReason}</p>}</td><td className="px-4 py-4 text-right">{payment.status === "PROCESSING" && <div className="flex justify-end gap-2"><Button size="small" color="success" startIcon={<CheckCircle />} onClick={() => { setReview({ mode: "confirm", payment }); setReviewValue(payment.payerReference || ""); }}>Xác nhận</Button><Button size="small" color="error" startIcon={<HighlightOff />} onClick={() => { setReview({ mode: "reject", payment }); setReviewValue(""); }}>Từ chối</Button></div>}</td></tr>; })}</tbody></table></div>}
    {data.totalPages > 1 && <Pagination className="mt-6 flex justify-center" page={(data.number ?? 0) + 1} count={data.totalPages} onChange={(_, value) => { setLoading(true); setPage(value - 1); }} />}
    <Dialog open={!!review} onClose={() => { if (!busy) setReview(null); }} fullWidth maxWidth="sm"><DialogTitle>{review?.mode === "confirm" ? "Xác nhận đã nhận tiền" : "Từ chối giao dịch"}</DialogTitle><DialogContent><form id="payment-review-form" onSubmit={submitReview} className="pt-2"><Alert severity={review?.mode === "confirm" ? "warning" : "info"} className="mb-4">Giao dịch {review?.payment.transactionId} · {formatMoney(review?.payment.amount, review?.payment.currency || "VND")}</Alert><TextField autoFocus required fullWidth multiline={review?.mode === "reject"} minRows={review?.mode === "reject" ? 3 : undefined} label={review?.mode === "confirm" ? "Mã giao dịch trên ngân hàng" : "Lý do từ chối"} value={reviewValue} onChange={(event) => setReviewValue(event.target.value)} slotProps={{ htmlInput: { maxLength: review?.mode === "confirm" ? 100 : 1000 } }} /></form></DialogContent><DialogActions><Button disabled={busy} onClick={() => setReview(null)}>Quay lại</Button><Button type="submit" form="payment-review-form" disabled={busy || !reviewValue.trim()} color={review?.mode === "confirm" ? "success" : "error"} variant="contained">{busy ? "Đang xử lý..." : review?.mode === "confirm" ? "Xác nhận thanh toán" : "Từ chối"}</Button></DialogActions></Dialog>
  </section>;
}
