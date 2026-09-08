import { useEffect, useRef, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { circulationApi } from "../../api/circulationApi";
import { getApiErrorMessage } from "../../api";
import { formatDate } from "../../utils/locale";

export default function BookActions({ book, onRefresh }) {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [revision, setRevision] = useState(0);
  const [days, setDays] = useState("14");
  const [notes, setNotes] = useState("");
  const [dialog, setDialog] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState(null);
  const [held, setHeld] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const submitting = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    let active = true;
    mounted.current = true;
    Promise.all([circulationApi.activeSubscription(), circulationApi.activeLoans(), circulationApi.activeReservations()])
      .then(([subscription, loans, reservations]) => {
        if (!active) return;
        setAccount({ subscription, loans, reservations });
        setDays(String(Math.min(14, subscription?.maxDaysPerBook || 14)));
        setLoadError("");
        setUncertain(false);
      }).catch((e) => { if (active) setLoadError(getApiErrorMessage(e)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; mounted.current = false; };
  }, [revision]);

  function reload() {
    setLoading(true);
    setRevision((value) => value + 1);
    onRefresh();
  }

  const loan = account?.loans.find((item) => item.bookId === book.id);
  const reservation = account?.reservations.find((item) => item.bookId === book.id);
  const subscription = account?.subscription;
  const reserving = book.availableCopies <= 0 || held;
  const maxDays = subscription?.maxDaysPerBook || 0;
  const daysValid = /^\d+$/.test(days) && Number(days) >= 1 && Number(days) <= maxDays;
  // Ngày trả của API là ngày lịch, đối chiếu theo ngày local thay vì đổi sang UTC.
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const overdue = account?.loans.some((item) => item.status === "OVERDUE" || item.isOverdue || (item.dueDate && item.dueDate < today));
  let blocked = "";
  if (!book.active) blocked = "Sách này đang ngừng cho mượn và đặt trước.";
  else if (loan) blocked = `Bạn đang mượn cuốn sách này. Hạn trả: ${formatDate(loan.dueDate)}.`;
  else if (reservation) blocked = reservation.status === "AVAILABLE"
    ? `Sách đã được giữ cho bạn. Vui lòng liên hệ thủ thư để nhận trước ${formatDate(reservation.availableUntil)}.`
    : `Bạn đã đặt trước cuốn sách này${reservation.queuePosition ? `, vị trí hàng chờ: ${reservation.queuePosition}` : ""}.`;
  else if (reserving && account?.reservations.length >= 5) blocked = "Bạn đã có 5 đặt trước đang hoạt động. Vui lòng hoàn tất hoặc hủy đặt trước trước khi tạo thêm.";
  else if (!reserving && (!subscription || !subscription.isActive || !subscription.isValid)) blocked = "Bạn cần gói thành viên còn hiệu lực để mượn sách. Vui lòng liên hệ thủ thư để đăng ký hoặc gia hạn.";
  else if (!reserving && overdue) blocked = "Vui lòng trả sách quá hạn trước khi mượn thêm.";
  else if (!reserving && account?.loans.length >= subscription?.maxBooksAllowed) blocked = "Bạn đã mượn đủ số sách tối đa của gói thành viên.";

  async function submit() {
    if (submitting.current || blocked || loading || loadError || uncertain || receipt || (!reserving && !daysValid)) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const payload = { bookId: book.id, notes: notes.trim() || undefined };
      const data = reserving ? await circulationApi.reserve(payload)
        : await circulationApi.checkout({ ...payload, checkoutDays: Number(days) });
      if (!mounted.current) return;
      // Chỉ báo thành công khi nhận được phiếu do máy chủ trả về.
      setReceipt({ ...data, kind: reserving ? "reservation" : "loan" });
      setDialog(false);
      onRefresh();
    } catch (e) {
      if (!mounted.current) return;
      setDialog(false);
      setError(getApiErrorMessage(e));
      if (e.response?.data?.message === "Các bản sách còn lại đang được giữ cho người đã đặt chỗ") setHeld(true);
      // Mất phản hồi không đồng nghĩa với thao tác thất bại: kiểm tra phiếu trước khi gửi lại.
      if (!e.response || e.response.status >= 500) setUncertain(true);
      onRefresh();
    } finally {
      submitting.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  return <section className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm" aria-label="Mượn và đặt trước sách">
    <h2 className="mb-4 text-xl font-semibold">Mượn và đặt trước</h2>
    {loading ? <p role="status">Đang kiểm tra phiếu và gói thành viên...</p>
      : loadError ? <Alert severity="error" action={<Button onClick={reload}>Thử lại</Button>}>{loadError}</Alert>
        : receipt ? <Alert severity="success">
          {receipt.kind === "loan" ? `Mượn sách thành công. Mã phiếu: ${receipt.id}. Hạn trả: ${formatDate(receipt.dueDate)}.`
            : `Đặt trước thành công. Mã đặt trước: ${receipt.id}. Vị trí hàng chờ: ${receipt.queuePosition ?? "Đang cập nhật"}.`}
        </Alert> : <>
          {error && <Alert severity="error" className="mb-4">{error}</Alert>}
          {uncertain ? <Alert severity="warning" action={<Button onClick={reload}>Kiểm tra lại</Button>}>Chưa xác nhận được kết quả. Hãy kiểm tra lại phiếu trước khi gửi thêm yêu cầu.</Alert>
            : blocked ? <Alert severity="info">{blocked}</Alert>
              : <>
                <p className="mb-4 text-sm text-slate-600">{reserving
                  ? "Bạn sẽ được thêm vào hàng chờ. Đặt trước chưa phải là phiếu mượn; khi có sách, hãy nhận sách theo thông báo của thư viện."
                  : `Gói ${subscription.planName}: tối đa ${maxDays} ngày/cuốn. Đang mượn ${account.loans.length}/${subscription.maxBooksAllowed} cuốn.`}</p>
                <div className="grid gap-4">
                  {!reserving && <TextField label="Số ngày mượn" type="number" value={days} onChange={(event) => setDays(event.target.value)}
                    error={!daysValid} helperText={`Nhập số nguyên từ 1 đến ${maxDays} ngày.`} slotProps={{ htmlInput: { min: 1, max: maxDays, step: 1 } }} />}
                  <TextField label="Ghi chú (không bắt buộc)" multiline minRows={2} value={notes} onChange={(event) => setNotes(event.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} />
                  <Button variant="contained" disabled={busy || (!reserving && !daysValid)} onClick={() => setDialog(true)}>{reserving ? "Đặt trước sách" : "Mượn sách"}</Button>
                </div>
                <p className="mt-3 text-xs text-slate-500">Số bản có thể thay đổi. Thư viện sẽ kiểm tra lại tình trạng sách khi bạn xác nhận.</p>
              </>}
        </>}
    <Dialog open={dialog} onClose={() => { if (!busy) setDialog(false); }} fullWidth maxWidth="xs" aria-labelledby="confirm-book-action">
      <DialogTitle id="confirm-book-action">{reserving ? "Xác nhận đặt trước" : "Xác nhận mượn sách"}</DialogTitle>
      <DialogContent><p>{book.title}</p><p className="mt-3">{reserving ? "Thêm cuốn sách này vào hàng chờ của bạn?" : `Bạn muốn mượn cuốn sách này trong ${days} ngày?`}</p></DialogContent>
      <DialogActions><Button disabled={busy} onClick={() => setDialog(false)}>Quay lại</Button><Button variant="contained" disabled={busy} onClick={submit}>{busy ? "Đang xử lý..." : "Xác nhận"}</Button></DialogActions>
    </Dialog>
  </section>;
}
