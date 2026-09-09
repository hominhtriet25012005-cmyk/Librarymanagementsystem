import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, CircularProgress, Tab, Tabs } from "@mui/material";
import { Link } from "react-router-dom";
import { booksApi, finesApi, getApiErrorMessage, loansApi, reservationsApi, subscriptionsApi } from "../../api";
import StatsCard from "./StatsCard";
import { statsConfig } from "./StatsConfig";
import CurrentLoans from "./CurrentLoans";
import Reservation from "./Reservation";
import ReadingHistory from "./ReadingHistory";
import Recommendation from "./Recommendation";

const EMPTY_DATA = { loans: [], reservations: [], fines: [], recommendations: [], subscription: null };
const ACTIVE_LOAN_STATUSES = new Set(["CHECKED_OUT", "OVERDUE"]);
const ACTIVE_RESERVATION_STATUSES = new Set(["PENDING", "AVAILABLE"]);
const OPEN_FINE_STATUSES = new Set(["PENDING", "PARTIALLY_PAID"]);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partialError, setPartialError] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      loansApi.getAllMine(),
      reservationsApi.getAllMine({ sortBy: "reservedAt", sortDirection: "DESC" }),
      finesApi.getMine(),
      booksApi.search({ activeOnly: true, availableOnly: true, page: 0, size: 4, sortBy: "createdAt", sortDirection: "DESC" }),
      subscriptionsApi.getActive(),
    ]).then((results) => {
      if (!active) return;
      const value = (index, fallback) => results[index].status === "fulfilled" ? results[index].value : fallback;
      const failed = results.filter((result) => result.status === "rejected");
      setData({
        loans: value(0, []),
        reservations: value(1, []),
        fines: value(2, []),
        recommendations: value(3, { content: [] }).content || [],
        subscription: value(4, null),
      });
      setPartialError(failed.length > 0 && failed.length < results.length);
      if (failed.length === results.length) {
        setError(getApiErrorMessage(failed[0].reason, "Không tải được dữ liệu tổng quan."));
      } else {
        setError("");
      }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);

  const currentYear = new Date().getFullYear();
  const activeLoans = useMemo(() => data.loans.filter((loan) => ACTIVE_LOAN_STATUSES.has(loan.status)), [data.loans]);
  const activeReservations = useMemo(() => data.reservations.filter((item) => ACTIVE_RESERVATION_STATUSES.has(item.status)), [data.reservations]);
  const readingHistory = useMemo(() => data.loans.filter((loan) => loan.status === "RETURNED"), [data.loans]);
  const readThisYear = useMemo(() => readingHistory.filter((loan) => Number(String(loan.returnDate || "").slice(0, 4)) === currentYear), [currentYear, readingHistory]);
  const openFines = useMemo(() => data.fines.filter((fine) => OPEN_FINE_STATUSES.has(fine.status)), [data.fines]);
  const stateData = statsConfig({ activeLoans, activeReservations, readThisYear, openFines });

  return <section aria-labelledby="dashboard-title" className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4 py-8 sm:px-6 lg:px-8">
    <header className="mb-8">
      <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Không gian bạn đọc</p>
      <h1 id="dashboard-title" className="mt-2 text-4xl font-bold text-slate-900">Trang tổng quan</h1>
      <p className="mt-2 text-lg text-slate-600">Dữ liệu mới nhất về hoạt động thư viện của bạn.</p>
    </header>

    {loading ? <div className="flex min-h-80 items-center justify-center"><CircularProgress aria-label="Đang tải tổng quan" /></div>
      : error ? <Alert severity="error" action={<Button onClick={() => { setLoading(true); setError(""); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>
        : <>
          {partialError && <Alert severity="warning" className="mb-5" action={<Button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Tải lại</Button>}>Một phần dữ liệu chưa tải được. Các mục còn lại vẫn đang hiển thị bình thường.</Alert>}
          <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stateData.map((item) => <StatsCard key={item.id} {...item} />)}
          </div>

          <div className="mb-8 rounded-2xl border border-indigo-100 bg-white p-6 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Gói thành viên</p><h2 className="mt-1 text-xl font-bold text-slate-900">{data.subscription ? data.subscription.planName : "Chưa có gói đang hoạt động"}</h2><p className="mt-1 text-slate-600">{data.subscription ? `Hiệu lực đến ${new Date(`${data.subscription.endDate}T00:00:00`).toLocaleDateString("vi-VN")} · Tối đa ${data.subscription.maxBooksAllowed} sách` : "Đăng ký gói để sử dụng quyền mượn và gia hạn sách."}</p></div>
              <Button component={Link} to="/subscriptions" variant={data.subscription ? "outlined" : "contained"}>{data.subscription ? "Xem quyền lợi" : "Xem gói thành viên"}</Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border bg-white shadow-md">
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}><Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} aria-label="Thông tin đọc sách" variant="scrollable" scrollButtons="auto"><Tab label={`Đang mượn (${activeLoans.length})`} /><Tab label={`Đặt trước (${activeReservations.length})`} /><Tab label={`Lịch sử đọc (${readingHistory.length})`} /><Tab label="Sách mới" /></Tabs></Box>
            {activeTab === 0 && <CurrentLoans loans={activeLoans} />}
            {activeTab === 1 && <Reservation reservations={activeReservations} />}
            {activeTab === 2 && <ReadingHistory loans={readingHistory} />}
            {activeTab === 3 && <Recommendation books={data.recommendations} />}
          </div>
        </>}
  </section>;
}
