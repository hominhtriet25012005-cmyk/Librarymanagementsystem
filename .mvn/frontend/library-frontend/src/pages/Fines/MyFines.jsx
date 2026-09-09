import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import { getApiErrorMessage, finesApi } from "../../api";
import { fineStatusLabel, fineTypeLabel, formatDateTime, formatMoney } from "../../utils/locale";
import VietQrPaymentCard from "../../components/payments/VietQrPaymentCard";

const statuses = [["", "Tất cả trạng thái"], ["PENDING", "Chưa thanh toán"], ["PARTIALLY_PAID", "Đã trả một phần"], ["PAID", "Đã thanh toán"], ["WAIVED", "Đã miễn"]];
const types = [["", "Tất cả loại phạt"], ["OVERDUE", "Quá hạn"], ["DAMAGE", "Làm hỏng sách"], ["LOSS", "Làm mất sách"], ["PROCESSING", "Phí xử lý"]];

export default function MyFines() {
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [payment, setPayment] = useState(null);
  const [uncertainIds, setUncertainIds] = useState(() => new Set());
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    finesApi.getMine({ status, type }).then((result) => { if (active) setFines(result); })
      .catch((e) => { if (active) { setFines([]); setError(getApiErrorMessage(e, "Không tải được danh sách tiền phạt.")); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision, status, type]);

  const outstanding = fines.reduce((sum, fine) => sum + Number(fine.amountOutstanding || 0), 0);

  async function createPayment() {
    if (!selected || submitting.current) return;
    submitting.current = true; setBusy(true); setNotice(null);
    try {
      const result = await finesApi.createPayment(selected.id);
      if (result.gateway !== "VIETQR" || !result.qrImageUrl) {
        throw Object.assign(new Error("Invalid VietQR response"), { userMessage: "Máy chủ không trả về thông tin VietQR hợp lệ." });
      }
      setPayment(result);
      setSelected(null);
      setNotice({ severity: "success", text: "Đã tạo giao dịch. Hãy quét mã VietQR và chuyển đúng nội dung." });
    } catch (e) {
      setSelected(null);
      const uncertain = !e.userMessage && (!e.response || e.response.status >= 500);
      if (uncertain) setUncertainIds((current) => new Set(current).add(selected.id));
      setNotice({ severity: uncertain ? "warning" : "error", text: uncertain
        ? "Chưa xác nhận được việc tạo giao dịch. Để tránh tạo trùng, vui lòng kiểm tra lại sau hoặc liên hệ thủ thư."
        : getApiErrorMessage(e, "Không tạo được giao dịch thanh toán.") });
    } finally { submitting.current = false; setBusy(false); }
  }

  return <section aria-labelledby="fines-title" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <header className="mb-8"><h1 id="fines-title" className="text-4xl font-bold text-slate-900">Tiền phạt của tôi</h1><p className="mt-2 text-lg text-slate-600">Theo dõi số tiền còn lại và thanh toán bằng quét mã VietQR.</p></header>
    <Alert severity="info" className="mb-5">Đơn vị thanh toán là đồng Việt Nam. Giao dịch sẽ được quản trị viên đối soát trước khi ghi nhận đã thanh toán.</Alert>
    {notice && <Alert severity={notice.severity} className="mb-5">{notice.text}</Alert>}
    <VietQrPaymentCard payment={payment} onSubmitted={() => { setPayment(null); setNotice({ severity: "success", text: "Đã gửi yêu cầu đối soát thanh toán." }); setLoading(true); setRevision((value) => value + 1); }} />
    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]"><FormControl><InputLabel>Trạng thái</InputLabel><Select value={status} label="Trạng thái" onChange={(e) => { setLoading(true); setError(""); setStatus(e.target.value); }}>{statuses.map(([value, label]) => <MenuItem key={label} value={value}>{label}</MenuItem>)}</Select></FormControl><FormControl><InputLabel>Loại phạt</InputLabel><Select value={type} label="Loại phạt" onChange={(e) => { setLoading(true); setError(""); setType(e.target.value); }}>{types.map(([value, label]) => <MenuItem key={label} value={value}>{label}</MenuItem>)}</Select></FormControl><Card className="px-5 py-3"><p className="text-xs text-slate-500">Còn phải trả</p><p className="text-xl font-bold text-red-700">{formatMoney(outstanding)}</p></Card></div>
    {loading ? <p role="status" className="py-10 text-center">Đang tải tiền phạt...</p>
      : error ? <Alert severity="error" action={<Button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>
        : fines.length === 0 ? <Alert severity="success">Không có khoản phạt phù hợp với bộ lọc.</Alert>
          : <div className="grid gap-5 lg:grid-cols-2">{fines.map((fine) => <article key={fine.id} className="rounded-xl border bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm text-slate-500">Khoản phạt #{fine.id}</p><h2 className="text-lg font-semibold">{fine.bookTitle || `Phiếu mượn #${fine.bookLoanId}`}</h2></div><Chip label={fineStatusLabel(fine.status)} color={fine.status === "PAID" || fine.status === "WAIVED" ? "success" : "warning"} /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Loại phạt</dt><dd className="font-medium">{fineTypeLabel(fine.type)}</dd></div><div><dt className="text-slate-500">Ngày tạo</dt><dd className="font-medium">{formatDateTime(fine.createdAt)}</dd></div><div><dt className="text-slate-500">Tổng tiền</dt><dd className="font-medium">{formatMoney(fine.amount)}</dd></div><div><dt className="text-slate-500">Còn phải trả</dt><dd className="font-bold text-red-700">{formatMoney(fine.amountOutstanding)}</dd></div></dl>{fine.reason && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">Lý do: {fine.reason}</p>} {["PENDING", "PARTIALLY_PAID"].includes(fine.status) && Number(fine.amountOutstanding) > 0 && <div className="mt-4 text-right"><Button variant="contained" disabled={uncertainIds.has(fine.id)} onClick={() => { setSelected(fine); setPayment(null); }}>Thanh toán</Button></div>}</article>)}</div>}
    <Dialog open={!!selected} onClose={() => { if (!busy) setSelected(null); }} fullWidth maxWidth="xs"><DialogTitle>Xác nhận thanh toán VietQR</DialogTitle><DialogContent>Bạn muốn tạo giao dịch VietQR cho khoản phạt #{selected?.id}, số tiền {formatMoney(selected?.amountOutstanding, "VND")}?</DialogContent><DialogActions><Button disabled={busy} onClick={() => setSelected(null)}>Quay lại</Button><Button disabled={busy} variant="contained" onClick={createPayment}>{busy ? "Đang tạo..." : "Hiện mã QR"}</Button></DialogActions></Dialog>
  </section>;
}
