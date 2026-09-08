import { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Pagination, Tab, Tabs, TextField } from "@mui/material";
import { circulationApi } from "../../api/circulationApi";
import { getApiErrorMessage, loansApi } from "../../api";
import LoanCard from "./LoanCard";
import { tabs } from "./tabs";

const EMPTY_PAGE = { content: [], pageNumber: 0, totalElements: 0, totalPages: 0 };

export default function MyLoans() {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [data, setData] = useState(EMPTY_PAGE);
  const [subscription, setSubscription] = useState(null);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [revision, setRevision] = useState(0);
  const [selected, setSelected] = useState(null);
  const [days, setDays] = useState("14");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [uncertainIds, setUncertainIds] = useState(() => new Set());
  const submitting = useRef(false);
  const status = tabs[tab].value;

  useEffect(() => {
    let active = true;
    loansApi.getMine({ status, page, size: 10 }).then((result) => {
      if (active) { setData(result); setUncertainIds(new Set()); }
    }).catch((e) => {
      if (active) { setData(EMPTY_PAGE); setError(getApiErrorMessage(e, "Không tải được phiếu mượn.")); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, revision, status]);

  useEffect(() => {
    let active = true;
    circulationApi.activeSubscription().then((result) => {
      if (active) { setSubscription(result); setSubscriptionError(""); }
    }).catch((e) => { if (active) { setSubscription(null); setSubscriptionError(getApiErrorMessage(e, "Không kiểm tra được gói thành viên.")); } });
    return () => { active = false; };
  }, [revision]);

  function openRenewal(loan) {
    const limit = subscription?.maxDaysPerBook || 0;
    setSelected(loan);
    setDays(String(Math.min(14, limit || 14)));
    setNotes("");
    setNotice(null);
  }

  const maxDays = subscription?.maxDaysPerBook || 0;
  const hasRenewableLoan = data.content.some((loan) => loan.status === "CHECKED_OUT" && !loan.isOverdue && !loan.returnDate && Number(loan.renewalCount) < Number(loan.maxRenewals));
  const validDays = /^\d+$/.test(days) && Number(days) >= 1 && Number(days) <= maxDays;

  async function renew() {
    if (!selected || !validDays || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      const result = await loansApi.renew({ bookLoanId: selected.id, extensionDays: Number(days), notes: notes.trim() || undefined });
      setSelected(null);
      const dueDate = result.dueDate ? new Date(`${result.dueDate}T00:00:00`).toLocaleDateString("vi-VN") : "đang cập nhật";
      setNotice({ severity: "success", text: `Gia hạn thành công. Hạn trả mới: ${dueDate}.` });
      setLoading(true); setRevision((value) => value + 1);
    } catch (e) {
      setSelected(null);
      const uncertain = !e.response || e.response.status >= 500;
      if (uncertain) setUncertainIds((current) => new Set(current).add(selected.id));
      setNotice({ severity: uncertain ? "warning" : "error", text: uncertain
        ? "Chưa xác nhận được kết quả gia hạn. Hãy tải lại danh sách và kiểm tra hạn trả trước khi thử lại."
        : getApiErrorMessage(e, "Không thể gia hạn phiếu mượn.") });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return <section aria-labelledby="loans-title" className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8 sm:px-6 lg:px-8">
    <header className="mb-8"><h1 id="loans-title" className="text-4xl font-bold text-slate-900">Sách tôi đã mượn</h1><p className="mt-2 text-lg text-slate-600">Theo dõi hạn trả, lịch sử và gia hạn phiếu đang mượn.</p></header>
    {notice && <Alert severity={notice.severity} className="mb-4" action={notice.severity === "warning" ? <Button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Tải lại</Button> : undefined}>{notice.text}</Alert>}
    <Card className="mb-6"><Box sx={{ borderBottom: 1, borderColor: "divider" }}><Tabs value={tab} onChange={(_, value) => { setLoading(true); setError(""); setTab(value); setPage(0); setNotice(null); }} aria-label="Trạng thái phiếu mượn" variant="scrollable" scrollButtons="auto">{tabs.map((item) => <Tab key={item.label} label={item.label} />)}</Tabs></Box></Card>
    {!loading && hasRenewableLoan && !subscription && <Alert severity={subscriptionError ? "warning" : "info"} className="mb-4">{subscriptionError || "Bạn cần gói thành viên còn hiệu lực để gia hạn sách."}</Alert>}
    {loading ? <p role="status" className="py-10 text-center">Đang tải phiếu mượn...</p>
      : error ? <Alert severity="error" action={<Button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>
        : data.content.length === 0 ? <Alert severity="info">Không có phiếu mượn ở trạng thái này.</Alert>
          : <div className="space-y-4">{data.content.map((loan) => <LoanCard key={loan.id} loan={loan} onRenew={subscription ? openRenewal : null} renewalBlocked={uncertainIds.has(loan.id)} />)}</div>}
    {data.totalPages > 1 && <Pagination className="mt-8 flex justify-center" page={data.pageNumber + 1} count={data.totalPages} onChange={(_, value) => { setLoading(true); setPage(value - 1); }} />}
    <Dialog open={!!selected} onClose={() => { if (!busy) setSelected(null); }} fullWidth maxWidth="xs">
      <DialogTitle>Gia hạn sách</DialogTitle><DialogContent className="space-y-4"><p className="mb-4">{selected?.bookTitle}</p>
        <TextField fullWidth label="Số ngày gia hạn" type="number" value={days} onChange={(e) => setDays(e.target.value)} error={!validDays} helperText={`Nhập số nguyên từ 1 đến ${maxDays} ngày.`} slotProps={{ htmlInput: { min: 1, max: maxDays, step: 1 } }} />
        <TextField fullWidth multiline minRows={2} label="Ghi chú (không bắt buộc)" value={notes} onChange={(e) => setNotes(e.target.value)} slotProps={{ htmlInput: { maxLength: 500 } }} />
      </DialogContent><DialogActions><Button disabled={busy} onClick={() => setSelected(null)}>Quay lại</Button><Button variant="contained" disabled={busy || !validDays} onClick={renew}>{busy ? "Đang gia hạn..." : "Xác nhận gia hạn"}</Button></DialogActions>
    </Dialog>
  </section>;
}
