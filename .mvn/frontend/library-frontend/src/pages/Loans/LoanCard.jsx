import { Autorenew, CalendarToday, MenuBook, Payment, Person } from "@mui/icons-material";
import { Button, Card, CardContent, Chip } from "@mui/material";
import { Link } from "react-router-dom";
import { formatDate, formatMoney, statusLabel } from "../../utils/locale";

export default function LoanCard({ loan, onRenew, renewalBlocked = false }) {
  const canRenew = loan.status === "CHECKED_OUT" && !loan.isOverdue && !loan.returnDate && Number(loan.renewalCount) < Number(loan.maxRenewals);
  const color = loan.status === "OVERDUE" ? "error" : loan.status === "RETURNED" ? "success" : "primary";
  return <Card><CardContent sx={{ p: 3 }}>
    <div className="flex flex-col gap-5 md:flex-row">
      <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">{loan.bookCoverImage ? <img src={loan.bookCoverImage} alt={`Bìa ${loan.bookTitle}`} className="h-full w-full object-cover" /> : <MenuBook className="text-white" sx={{ fontSize: 40 }} />}</div>
      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="break-words text-xl font-semibold">{loan.bookTitle}</h2><Chip size="small" color={color} label={statusLabel(loan.status)} /></div><p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Person fontSize="small" />{loan.bookAuthor || "Chưa cập nhật tác giả"}</p><p className="mt-1 text-sm text-slate-500">ISBN: {loan.bookIsbn}</p></div>
      <dl className="grid min-w-64 grid-cols-2 gap-3 text-sm"><div><dt className="text-slate-500">Ngày mượn</dt><dd className="mt-1 flex items-center gap-1 font-medium"><CalendarToday fontSize="inherit" />{formatDate(loan.checkoutDate)}</dd></div><div><dt className="text-slate-500">Hạn trả</dt><dd className="mt-1 font-medium">{formatDate(loan.dueDate)}</dd></div>{loan.returnDate && <div><dt className="text-slate-500">Ngày trả</dt><dd className="mt-1 font-medium">{formatDate(loan.returnDate)}</dd></div>}<div><dt className="text-slate-500">Số lần gia hạn</dt><dd className="mt-1 font-medium">{loan.renewalCount ?? 0}/{loan.maxRenewals ?? 0}</dd></div></dl>
    </div>
    {loan.notes && <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Ghi chú: {loan.notes}</p>}
    <div className="mt-5 flex flex-wrap justify-end gap-2"><Button component={Link} to={`/books/${loan.bookId}`} variant="outlined">Xem sách</Button>{loan.fineAmount > 0 && !loan.finePaid && <Button component={Link} to="/my-fines" color="error" startIcon={<Payment />}>Xem tiền phạt {formatMoney(loan.fineAmount)}</Button>}{canRenew && <Button variant="contained" startIcon={<Autorenew />} disabled={!onRenew || renewalBlocked} onClick={() => onRenew?.(loan)}>Gia hạn</Button>}</div>
  </CardContent></Card>;
}
