import { Alert, Button } from "@mui/material";
import { Link } from "react-router-dom";
import { formatDate } from "../../utils/locale";

export default function ReadingHistory({ loans }) {
  return <div className="p-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold text-slate-900">Lịch sử sách đã trả</h2><Button component={Link} to="/my-loans">Xem lịch sử đầy đủ</Button></div>
    {loans.length === 0 ? <Alert severity="info">Bạn chưa có sách nào được ghi nhận đã trả.</Alert> : <div className="divide-y rounded-xl border">{loans.slice(0, 6).map((loan) => <article key={loan.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><h3 className="font-semibold text-slate-900">{loan.bookTitle}</h3><p className="text-sm text-slate-600">{loan.bookAuthor || loan.bookIsbn}</p></div><div className="text-right text-sm"><p className="text-slate-500">Ngày trả</p><p className="font-medium">{formatDate(loan.returnDate)}</p></div></article>)}</div>}
  </div>;
}
