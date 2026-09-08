import { useEffect, useRef, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Pagination, Rating, TextField } from "@mui/material";
import { getApiErrorMessage, loansApi, reviewsApi } from "../../api";
import { formatDateTime } from "../../utils/locale";

const PAGE_SIZE = 5;
const blankForm = { rating: 5, title: "", reviewText: "" };

export default function BookReviews({ bookId, authStatus, user }) {
  const [reviews, setReviews] = useState([]);
  const [hasReturned, setHasReturned] = useState(false);
  const [eligibilityLoaded, setEligibilityLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    reviewsApi.getAllForBook(bookId).then((result) => { if (active) { setReviews(result); setPage(1); } })
      .catch((e) => { if (active) setError(getApiErrorMessage(e, "Không tải được đánh giá sách.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bookId, revision]);

  useEffect(() => {
    let active = true;
    if (authStatus !== "authenticated") return;
    loansApi.getAllMine("RETURNED").then((items) => {
      if (active) setHasReturned(items.some((loan) => loan.bookId === bookId));
    }).catch(() => { if (active) setHasReturned(false); })
      .finally(() => { if (active) setEligibilityLoaded(true); });
    return () => { active = false; };
  }, [authStatus, bookId, user?.id, revision]);

  const ownReview = reviews.find((review) => String(review.userId) === String(user?.id));
  const pageCount = Math.ceil(reviews.length / PAGE_SIZE);
  const visible = reviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const average = reviews.length ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length : 0;
  const valid = Number(form.rating) >= 1 && Number(form.rating) <= 5 && form.title.trim().length <= 200 && form.reviewText.trim().length >= 10 && form.reviewText.trim().length <= 2000;

  function openForm(review = null) {
    setEditing(review || null);
    setForm(review ? { rating: review.rating, title: review.title || "", reviewText: review.reviewText } : blankForm);
    setNotice(null);
  }
  async function save() {
    if (!valid || submitting.current) return;
    submitting.current = true; setBusy(true);
    const payload = { rating: Number(form.rating), title: form.title.trim() || undefined, reviewText: form.reviewText.trim() };
    try {
      if (editing?.id) await reviewsApi.update(editing.id, payload);
      else await reviewsApi.create({ bookId, ...payload });
      setEditing(undefined); setNotice({ severity: "success", text: editing?.id ? "Đã cập nhật đánh giá." : "Đã đăng đánh giá." }); setLoading(true); setRevision((value) => value + 1);
    } catch (e) { setNotice({ severity: "error", text: getApiErrorMessage(e, "Không thể lưu đánh giá.") }); }
    finally { submitting.current = false; setBusy(false); }
  }
  async function remove() {
    if (!deleting || submitting.current) return;
    submitting.current = true; setBusy(true);
    try { await reviewsApi.remove(deleting.id); setDeleting(null); setNotice({ severity: "success", text: "Đã xóa đánh giá." }); setLoading(true); setRevision((value) => value + 1); }
    catch (e) { setDeleting(null); setNotice({ severity: "error", text: getApiErrorMessage(e, "Không thể xóa đánh giá.") }); }
    finally { submitting.current = false; setBusy(false); }
  }

  return <section className="mt-10 border-t border-slate-200 pt-8" aria-labelledby="book-reviews-title">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 id="book-reviews-title" className="text-2xl font-bold">Đánh giá của bạn đọc</h2>{reviews.length > 0 && <div className="mt-2 flex items-center gap-2"><Rating value={average} precision={0.1} readOnly /><span className="text-sm text-slate-600">{average.toFixed(1)}/5 từ {reviews.length} đánh giá</span></div>}</div>
      {authStatus === "authenticated" && eligibilityLoaded && hasReturned && !ownReview && <Button variant="contained" onClick={() => openForm()}>Viết đánh giá</Button>}</div>
    {notice && <Alert severity={notice.severity} className="mt-5">{notice.text}</Alert>}
    {authStatus === "authenticated" && eligibilityLoaded && !hasReturned && !ownReview && <p className="mt-4 text-sm text-slate-500">Bạn có thể đánh giá sau khi đã mượn và trả cuốn sách này.</p>}
    {loading ? <p role="status" className="py-8">Đang tải đánh giá...</p> : error ? <Alert severity="error" className="mt-5" action={<Button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert> : reviews.length === 0 ? <Alert severity="info" className="mt-5">Chưa có đánh giá nào cho cuốn sách này.</Alert> : <div className="mt-6 space-y-4">{visible.map((review) => <article key={review.id} className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-semibold">{review.title || "Cảm nhận về cuốn sách"}</h3><p className="text-sm text-slate-500">{review.userName || "Bạn đọc"} · {formatDateTime(review.createdAt)}</p></div><Rating value={review.rating} readOnly size="small" /></div><p className="mt-4 whitespace-pre-wrap break-words text-slate-700">{review.reviewText}</p>{String(review.userId) === String(user?.id) && <div className="mt-4 flex justify-end gap-2"><Button onClick={() => openForm(review)}>Sửa</Button><Button color="error" onClick={() => setDeleting(review)}>Xóa</Button></div>}</article>)}</div>}
    {pageCount > 1 && <Pagination className="mt-6 flex justify-center" count={pageCount} page={page} onChange={(_, value) => setPage(value)} />}
    <Dialog open={editing !== undefined} onClose={() => { if (!busy) setEditing(undefined); }} fullWidth maxWidth="sm"><DialogTitle>{editing?.id ? "Sửa đánh giá" : "Viết đánh giá"}</DialogTitle><DialogContent><div className="mt-2 space-y-4"><div><p className="mb-1 text-sm">Điểm đánh giá</p><Rating value={Number(form.rating)} onChange={(_, value) => setForm((current) => ({ ...current, rating: value || 0 }))} getLabelText={(value) => `${value} sao`} /></div><TextField fullWidth label="Tiêu đề (không bắt buộc)" value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} error={form.title.length > 200} helperText={`${form.title.length}/200 ký tự`} /><TextField fullWidth multiline minRows={4} label="Nội dung đánh giá" value={form.reviewText} onChange={(e) => setForm((current) => ({ ...current, reviewText: e.target.value }))} error={form.reviewText.length > 0 && (form.reviewText.trim().length < 10 || form.reviewText.trim().length > 2000)} helperText={`${form.reviewText.trim().length}/2.000 ký tự, tối thiểu 10`} /></div></DialogContent><DialogActions><Button disabled={busy} onClick={() => setEditing(undefined)}>Hủy</Button><Button variant="contained" disabled={busy || !valid} onClick={save}>{busy ? "Đang lưu..." : "Lưu đánh giá"}</Button></DialogActions></Dialog>
    <Dialog open={!!deleting} onClose={() => { if (!busy) setDeleting(null); }} fullWidth maxWidth="xs"><DialogTitle>Xóa đánh giá</DialogTitle><DialogContent>Đánh giá sẽ bị xóa khỏi trang sách. Bạn vẫn có thể viết lại sau.</DialogContent><DialogActions><Button disabled={busy} onClick={() => setDeleting(null)}>Giữ lại</Button><Button color="error" variant="contained" disabled={busy} onClick={remove}>{busy ? "Đang xóa..." : "Xóa đánh giá"}</Button></DialogActions></Dialog>
  </section>;
}
