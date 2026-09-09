import { Alert, Button } from "@mui/material";
import { Link } from "react-router-dom";
import CurrentLoanCard from "./CurrentLoanCard";

export default function CurrentLoans({ loans }) {
  return <div className="p-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 className="text-2xl font-bold text-slate-900">Sách bạn đang mượn</h2><Button component={Link} to="/my-loans">Xem tất cả phiếu mượn</Button></div>
    {loans.length === 0 ? <Alert severity="info">Bạn chưa có sách đang mượn.</Alert> : <div className="space-y-4">{loans.slice(0, 4).map((loan) => <CurrentLoanCard loan={loan} key={loan.id} />)}</div>}
  </div>;
}
