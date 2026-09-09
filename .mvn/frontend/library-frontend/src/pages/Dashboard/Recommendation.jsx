import { Alert, Button } from "@mui/material";
import { Link } from "react-router-dom";
import BookCard from "../Books/BookCard";

export default function Recommendation({ books }) {
  return <div className="p-6">
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold text-slate-900">Sách mới trong thư viện</h2><p className="mt-1 text-sm text-slate-600">Các đầu sách còn bản để mượn, xếp theo thời gian cập nhật.</p></div><Button component={Link} to="/books">Khám phá kho sách</Button></div>
    {books.length === 0 ? <Alert severity="info">Hiện chưa có sách khả dụng để giới thiệu.</Alert> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">{books.map((book) => <BookCard key={book.id} book={book} />)}</div>}
  </div>;
}
