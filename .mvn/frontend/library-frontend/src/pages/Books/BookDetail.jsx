import { useEffect, useState } from "react";
import { Alert, Button, Chip } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { booksApi, getApiErrorMessage } from "../../api";
import { useAuth } from "../../auth/AuthContext";
import { SessionStatus } from "../../auth/RouteGuards";
import { formatDate } from "../../utils/locale";
import BookCover from "./BookCover";
import BookActions from "./BookActions";
import BookReviews from "./BookReviews";
import WishlistButton from "./WishlistButton";

export default function BookDetail() {
  const { id } = useParams();
  // Đổi sách sẽ tạo màn hình mới, không giữ phiếu hay hộp xác nhận của sách trước.
  return <DetailContent key={id} id={id} />;
}

function DetailContent({ id }) {
  const { status, user } = useAuth();
  const [book, setBook] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const validId = /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));

  useEffect(() => {
    let active = true;
    if (!validId) return;
    booksApi.getById(id).then((data) => {
      if (active) { setBook(data); setError(""); }
    }).catch((e) => {
      if (active) setError(getApiErrorMessage(e, "Không tìm thấy sách hoặc sách không còn được hiển thị."));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, validId, revision]);

  function refresh() { setRevision((value) => value + 1); }

  return <section className="mx-auto max-w-6xl p-4 sm:p-8" aria-label="Chi tiết sách">
    <Button component={Link} to="/books">← Về kho sách</Button>
    {!validId ? <Alert severity="error" className="mt-4">Đường dẫn sách không hợp lệ.</Alert>
      : <>
        {loading && <p role="status" className="py-10">Đang tải thông tin sách...</p>}
        {error && <Alert severity="error" className="my-4" action={<Button color="inherit" onClick={refresh}>Thử lại</Button>}>{error}</Alert>}
        {book && <><div className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
          <BookCover book={book} className="h-96 rounded-2xl border border-indigo-100" />
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-2">
              {book.genreName && <Chip label={book.genreName} variant="outlined" />}
              <Chip color={book.active && book.availableCopies > 0 ? "success" : "default"}
                label={!book.active ? "Ngừng cho mượn" : book.availableCopies > 0 ? "Còn bản sách" : "Tạm hết sách"} />
            </div>
            <h1 className="break-words text-3xl font-bold text-slate-900">{book.title}</h1>
            <p className="mt-2 text-lg text-slate-600">Tác giả: {book.author || "Chưa cập nhật"}</p>
            <dl className="my-6 grid grid-cols-1 gap-4 rounded-xl bg-slate-50 p-5 sm:grid-cols-2">
              {[["ISBN", book.isbn], ["Nhà xuất bản", book.publisher], ["Ngày xuất bản", formatDate(book.publicationDate)],
                ["Ngôn ngữ", ({ en: "Tiếng Anh", vi: "Tiếng Việt", English: "Tiếng Anh", Vietnamese: "Tiếng Việt" })[book.language] || book.language],
                ["Số trang", book.pages], ["Số bản có sẵn / tổng số", `${book.availableCopies ?? 0} / ${book.totalCopies ?? 0}`]].map(([label, value]) =>
                <div key={label}><dt className="text-sm text-slate-500">{label}</dt><dd className="mt-1 font-medium">{value || "Chưa cập nhật"}</dd></div>)}
            </dl>
            <h2 className="text-xl font-semibold">Giới thiệu sách</h2>
            <p className="mb-8 mt-3 whitespace-pre-wrap break-words leading-relaxed text-slate-600">{book.description || "Chưa có nội dung giới thiệu cho cuốn sách này."}</p>
            {status === "authenticated" && <WishlistButton key={`wishlist-${user.id}`} bookId={book.id} />}
            {status === "loading" || status === "error" ? <SessionStatus />
              : status === "guest" ? <Alert severity="info" action={<Button component={Link} to="/login" state={{ from: `/books/${id}` }}>Đăng nhập</Button>}>Đăng nhập để mượn sách hoặc đặt trước.</Alert>
                : <BookActions key={user.id} book={book} onRefresh={refresh} />}
          </div>
        </div><BookReviews bookId={book.id} authStatus={status} user={user} /></>}
      </>}
  </section>;
}
