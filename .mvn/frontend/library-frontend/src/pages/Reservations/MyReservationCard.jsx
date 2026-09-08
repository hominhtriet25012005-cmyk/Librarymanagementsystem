import { AccessAlarm, Book, CalendarMonth, CheckCircle, Close, HourglassBottom } from "@mui/icons-material";
import { Button, Chip, Divider } from "@mui/material";
import { Link } from "react-router-dom";
import { formatDateTime, statusLabel } from "../../utils/locale";

const icons = { PENDING: HourglassBottom, AVAILABLE: CalendarMonth, FULFILLED: CheckCircle, CANCELLED: Close, EXPIRED: AccessAlarm };

export default function MyReservationCard({ reservation, onCancel, cancelBlocked = false }) {
  const Icon = icons[reservation.status] || AccessAlarm;
  const canCancel = reservation.canBeCancelled ?? ["PENDING", "AVAILABLE"].includes(reservation.status);
  return <article className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-md">
    <div className="flex items-center justify-between bg-indigo-50 px-5 py-3"><Chip icon={<Icon />} label={statusLabel(reservation.status)} color={reservation.status === "AVAILABLE" ? "success" : "primary"} variant="outlined" />{reservation.queuePosition > 0 && <span className="text-sm font-medium">Vị trí chờ: {reservation.queuePosition}</span>}</div>
    <div className="p-5"><div className="flex items-start gap-3"><Book className="mt-1 text-indigo-600" /><div className="min-w-0"><h2 className="break-words text-lg font-semibold">{reservation.bookTitle}</h2><p className="mt-1 text-sm text-slate-600">{reservation.bookAuthor || `ISBN: ${reservation.bookIsbn || "Chưa cập nhật"}`}</p></div></div>
      <Divider sx={{ my: 2 }} /><dl className="space-y-3 text-sm"><div><dt className="text-slate-500">Ngày đặt</dt><dd className="font-medium">{formatDateTime(reservation.reservedAt)}</dd></div>{reservation.availableAt && <div><dt className="text-green-700">Sẵn sàng từ</dt><dd className="font-medium">{formatDateTime(reservation.availableAt)}</dd></div>}{reservation.availableUntil && <div><dt className="text-red-700">Hạn nhận</dt><dd className="font-medium">{formatDateTime(reservation.availableUntil)}</dd></div>}{reservation.fulfilledAt && <div><dt className="text-slate-500">Đã nhận</dt><dd className="font-medium">{formatDateTime(reservation.fulfilledAt)}</dd></div>}</dl>
      {reservation.notes && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">Ghi chú: {reservation.notes}</p>}
      <div className="mt-5 flex flex-wrap justify-end gap-2"><Button component={Link} to={`/books/${reservation.bookId}`} variant="outlined">Xem sách</Button>{canCancel && <Button color="error" disabled={cancelBlocked} onClick={() => onCancel(reservation)}>Hủy đặt trước</Button>}</div>
    </div>
  </article>;
}
