import { useEffect, useRef, useState } from "react";
import { Alert, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Pagination, Tab, Tabs } from "@mui/material";
import { getApiErrorMessage, reservationsApi } from "../../api";
import MyReservationCard from "./MyReservationCard";
import { tabs } from "./tabs";

const EMPTY_PAGE = { content: [], pageNumber: 0, totalElements: 0, totalPages: 0 };

export default function MyReservations() {
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(0);
  const [data, setData] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [uncertainIds, setUncertainIds] = useState(() => new Set());
  const submitting = useRef(false);
  const status = tabs[tab].value;

  useEffect(() => {
    let active = true;
    reservationsApi.getMine({ status, page, size: 9, sortBy: "reservedAt", sortDirection: "DESC" })
      .then((result) => { if (active) { setData(result); setUncertainIds(new Set()); } })
      .catch((e) => { if (active) { setData(EMPTY_PAGE); setError(getApiErrorMessage(e, "Không tải được danh sách đặt trước.")); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, revision, status]);

  async function cancelReservation() {
    if (!selected || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    try {
      await reservationsApi.cancel(selected.id);
      setSelected(null);
      setNotice({ severity: "success", text: `Đã hủy đặt trước sách “${selected.bookTitle}”.` });
      setLoading(true); setRevision((value) => value + 1);
    } catch (e) {
      setSelected(null);
      const uncertain = !e.response || e.response.status >= 500;
      if (uncertain) setUncertainIds((current) => new Set(current).add(selected.id));
      setNotice({ severity: uncertain ? "warning" : "error", text: uncertain
        ? "Chưa xác nhận được kết quả hủy. Hãy tải lại danh sách trước khi thao tác tiếp."
        : getApiErrorMessage(e, "Không thể hủy đặt trước.") });
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return <section aria-labelledby="reservations-title" className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
    <header className="mb-8"><h1 id="reservations-title" className="text-4xl font-bold text-slate-900">Sách đã đặt trước</h1><p className="mt-2 text-lg text-slate-600">Theo dõi hàng chờ, hạn nhận sách và hủy yêu cầu còn hiệu lực.</p></header>
    {notice && <Alert severity={notice.severity} className="mb-4" action={notice.severity === "warning" ? <Button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Tải lại</Button> : undefined}>{notice.text}</Alert>}
    <Card className="mb-6"><Tabs value={tab} onChange={(_, value) => { setLoading(true); setError(""); setTab(value); setPage(0); setNotice(null); }} aria-label="Trạng thái đặt trước" variant="scrollable" scrollButtons="auto">{tabs.map((item) => <Tab key={item.label} label={item.label} />)}</Tabs></Card>
    {loading ? <p role="status" className="py-10 text-center">Đang tải danh sách đặt trước...</p>
      : error ? <Alert severity="error" action={<Button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>
        : data.content.length === 0 ? <Alert severity="info">Không có đặt trước ở trạng thái này.</Alert>
          : <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">{data.content.map((item) => <MyReservationCard key={item.id} reservation={item} onCancel={setSelected} cancelBlocked={uncertainIds.has(item.id)} />)}</div>}
    {data.totalPages > 1 && <Pagination className="mt-8 flex justify-center" page={data.pageNumber + 1} count={data.totalPages} onChange={(_, value) => { setLoading(true); setPage(value - 1); }} />}
    <Dialog open={!!selected} onClose={() => { if (!busy) setSelected(null); }} fullWidth maxWidth="xs"><DialogTitle>Xác nhận hủy đặt trước</DialogTitle><DialogContent>Bạn muốn hủy đặt trước sách “{selected?.bookTitle}”?</DialogContent><DialogActions><Button disabled={busy} onClick={() => setSelected(null)}>Giữ lại</Button><Button color="error" variant="contained" disabled={busy} onClick={cancelReservation}>{busy ? "Đang hủy..." : "Hủy đặt trước"}</Button></DialogActions></Dialog>
  </section>;
}
