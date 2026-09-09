import { useState } from "react";
import { Alert, Button, Card, TextField } from "@mui/material";
import { ContentCopy, QrCode2 } from "@mui/icons-material";
import { getApiErrorMessage, paymentsApi } from "../../api";
import { formatMoney } from "../../utils/locale";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000").replace(/\/$/, "");

function resourceUrl(path) {
  if (!path) return "";
  try { return new URL(path, `${API_BASE_URL}/`).href; } catch { return ""; }
}

export default function VietQrPaymentCard({ payment, onSubmitted }) {
  const [payerReference, setPayerReference] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  if (!payment) return null;
  const qrImageUrl = resourceUrl(payment.qrImageUrl);

  async function copyTransferContent() {
    try {
      await navigator.clipboard.writeText(payment.transferContent || payment.transactionId);
      setNotice({ severity: "success", text: "Đã sao chép nội dung chuyển khoản." });
    } catch {
      setNotice({ severity: "warning", text: "Không thể tự sao chép. Hãy chọn và sao chép mã thủ công." });
    }
  }

  async function submitTransfer() {
    setBusy(true);
    setNotice(null);
    try {
      const result = await paymentsApi.submit(payment.paymentId, payerReference);
      setNotice({ severity: "success", text: "Đã gửi yêu cầu. Giao dịch đang chờ quản trị viên đối soát." });
      onSubmitted?.(result);
    } catch (error) {
      setNotice({ severity: "error", text: getApiErrorMessage(error, "Không thể gửi yêu cầu đối soát.") });
    } finally {
      setBusy(false);
    }
  }

  return <Card className="mb-6 overflow-hidden border border-indigo-200">
    <div className="grid gap-6 p-5 lg:grid-cols-[minmax(260px,380px)_1fr]">
      <div className="rounded-xl bg-sky-50 p-3 text-center">
        {qrImageUrl ? <img className="mx-auto max-h-[32rem] w-full rounded-lg object-contain" src={qrImageUrl} alt="Mã VietQR thanh toán vào tài khoản MB" />
          : <div className="flex min-h-72 items-center justify-center text-slate-500"><QrCode2 fontSize="large" /> Không tải được mã QR</div>}
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Thanh toán VietQR</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Quét mã bằng ứng dụng ngân hàng</h2>
        <Alert severity="warning" className="my-4">Hãy chuyển đúng số tiền và ghi đúng nội dung để quản trị viên đối chiếu.</Alert>
        <dl className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div><dt className="text-slate-500">Ngân hàng</dt><dd className="font-semibold">{payment.bankName}</dd></div>
          <div><dt className="text-slate-500">Số tài khoản</dt><dd className="font-semibold">{payment.accountNumber}</dd></div>
          <div><dt className="text-slate-500">Chủ tài khoản</dt><dd className="font-semibold">{payment.accountName}</dd></div>
          <div><dt className="text-slate-500">Số tiền</dt><dd className="font-bold text-indigo-700">{formatMoney(payment.amount, payment.currency || "VND")}</dd></div>
          <div className="sm:col-span-2"><dt className="text-slate-500">Nội dung chuyển khoản</dt><dd className="mt-1 flex flex-wrap items-center gap-2"><code className="rounded bg-white px-3 py-2 text-base font-bold text-rose-700">{payment.transferContent || payment.transactionId}</code><Button size="small" startIcon={<ContentCopy />} onClick={copyTransferContent}>Sao chép</Button></dd></div>
        </dl>
        <TextField className="mt-4" fullWidth label="Mã giao dịch ngân hàng (nếu có)" value={payerReference} onChange={(event) => setPayerReference(event.target.value)} helperText="Bạn có thể nhập mã tham chiếu trong ứng dụng ngân hàng để quản trị viên tra cứu nhanh hơn." slotProps={{ htmlInput: { maxLength: 100 } }} />
        {notice && <Alert className="mt-4" severity={notice.severity}>{notice.text}</Alert>}
        <Button className="mt-4" variant="contained" size="large" disabled={busy} onClick={submitTransfer}>{busy ? "Đang gửi..." : "Tôi đã chuyển khoản"}</Button>
        <p className="mt-3 text-xs text-slate-500">Nút này chỉ gửi yêu cầu đối soát. Hệ thống chỉ ghi nhận thành công sau khi quản trị viên xác nhận tiền đã vào tài khoản.</p>
      </div>
    </div>
  </Card>;
}
