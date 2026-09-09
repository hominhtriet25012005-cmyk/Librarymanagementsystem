import { Alert, Button, Chip } from "@mui/material";
import { Link } from "react-router-dom";
import { formatDateTime, statusLabel } from "../../utils/locale";

export default function Reservation({ reservations }) {
  return <div className="p-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold text-slate-900">Sách đang đặt trước</h2><Button component={Link} to="/my-reservations">Quản lý đặt trước</Button></div>
    {reservations.length === 0 ? <Alert severity="info">Bạn chưa có yêu cầu đặt trước đang hoạt động.</Alert> : <div className="grid gap-4 md:grid-cols-2">{reservations.slice(0, 4).map((item) => <article key={item.id} className="rounded-xl border border-slate-200 p-5"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold text-slate-900">{item.bookTitle}</h3><p className="mt-1 text-sm text-slate-600">{item.bookAuthor || item.bookIsbn}</p></div><Chip size="small" color={item.status === "AVAILABLE" ? "success" : "primary"} label={statusLabel(item.status)} /></div><p className="mt-4 text-sm text-slate-500">Đặt lúc: {formatDateTime(item.reservedAt)}</p>{item.queuePosition > 0 && <p className="mt-1 text-sm">Vị trí hàng chờ: <strong>{item.queuePosition}</strong></p>}<Button component={Link} to={`/books/${item.bookId}`} sx={{ mt: 2 }}>Xem sách</Button></article>)}</div>}
  </div>;
}
