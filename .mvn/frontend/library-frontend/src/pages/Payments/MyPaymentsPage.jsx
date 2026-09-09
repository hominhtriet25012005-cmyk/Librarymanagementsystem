import { useEffect, useState } from "react";
import { Alert, Button, Card, Chip, CircularProgress, Pagination } from "@mui/material";
import { getApiErrorMessage, paymentsApi } from "../../api";
import { formatDateTime, formatMoney } from "../../utils/locale";
import VietQrPaymentCard from "../../components/payments/VietQrPaymentCard";

const EMPTY_PAGE = { content: [], number: 0, totalPages: 0, totalElements: 0 };
const STATUS = {
  PENDING: { label: "Chờ chuyển khoản", color: "warning" },
  PROCESSING: { label: "Chờ đối soát", color: "info" },
  SUCCESS: { label: "Đã thanh toán", color: "success" },
  FAILED: { label: "Đã từ chối", color: "error" },
  CANCELLED: { label: "Đã hủy", color: "default" },
  REFUNDED: { label: "Đã hoàn tiền", color: "secondary" },
};

export default function MyPaymentsPage() {
  const [data, setData] = useState(EMPTY_PAGE);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [actionBusyId, setActionBusyId] = useState(null);

  useEffect(() => {
    let active = true;
    paymentsApi.getMine({ page, size: 10 })
      .then((result) => { if (active) setData(result); })
      .catch((requestError) => { if (active) setError(getApiErrorMessage(requestError, "Không tải được lịch sử thanh toán.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, revision]);

  async function openInstructions(paymentId) {
    setActionBusyId(paymentId);
    setError("");
    try {
      setSelectedPayment(await paymentsApi.getInstructions(paymentId));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Không tải được thông tin chuyển khoản."));
    } finally {
      setActionBusyId(null);
    }
  }

  return <section aria-labelledby="payments-title" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <header className="mb-8"><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Tài chính</p><h1 id="payments-title" className="mt-2 text-4xl font-bold text-slate-900">Lịch sử thanh toán</h1><p className="mt-2 text-lg text-slate-600">Theo dõi giao dịch VietQR cho gói thành viên và tiền phạt.</p></header>
    <Alert severity="info" className="mb-5">“Chờ đối soát” nghĩa là quản trị viên đang kiểm tra giao dịch trên tài khoản ngân hàng.</Alert>
    <VietQrPaymentCard payment={selectedPayment} onSubmitted={() => { setSelectedPayment(null); setLoading(true); setRevision((value) => value + 1); }} />
    {loading ? <div className="flex min-h-72 items-center justify-center"><CircularProgress aria-label="Đang tải lịch sử thanh toán" /></div>
      : error ? <Alert severity="error" action={<Button onClick={() => { setLoading(true); setError(""); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>
        : data.content.length === 0 ? <Alert severity="info">Bạn chưa có giao dịch thanh toán nào.</Alert>
          : <div className="grid gap-4">{data.content.map((payment) => { const status = STATUS[payment.status] || { label: payment.status, color: "default" }; return <Card key={payment.id} className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-slate-500">{payment.paymentType === "MEMBERSHIP" ? "Gói thành viên" : "Tiền phạt"} · Giao dịch #{payment.id}</p><h2 className="mt-1 font-semibold">{payment.description || payment.transactionId}</h2></div><Chip label={status.label} color={status.color} /></div><dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-slate-500">Số tiền</dt><dd className="font-bold">{formatMoney(payment.amount, payment.currency || "VND")}</dd></div><div><dt className="text-slate-500">Nội dung chuyển khoản</dt><dd className="font-mono font-semibold">{payment.transactionId}</dd></div><div><dt className="text-slate-500">Ngày tạo</dt><dd>{formatDateTime(payment.createdAt)}</dd></div><div><dt className="text-slate-500">Ngày gửi đối soát</dt><dd>{formatDateTime(payment.submittedAt)}</dd></div></dl>{payment.payerReference && <p className="mt-3 text-sm text-slate-600">Mã bạn cung cấp: <strong>{payment.payerReference}</strong></p>}{payment.failureReason && <Alert severity="error" className="mt-4">Lý do từ chối: {payment.failureReason}</Alert>}{payment.status === "PENDING" && <Button className="mt-4" variant="outlined" disabled={actionBusyId === payment.id} onClick={() => openInstructions(payment.id)}>{actionBusyId === payment.id ? "Đang tải..." : "Mở lại mã VietQR"}</Button>}</Card>; })}</div>}
    {data.totalPages > 1 && <Pagination className="mt-6 flex justify-center" page={(data.number ?? data.pageNumber ?? 0) + 1} count={data.totalPages} onChange={(_, value) => { setLoading(true); setPage(value - 1); }} />}
  </section>;
}
