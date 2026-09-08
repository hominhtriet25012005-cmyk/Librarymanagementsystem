import { useEffect, useRef, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Pagination } from "@mui/material";
import { getApiErrorMessage, wishlistApi } from "../../api";
import { formatDateTime } from "../../utils/locale";
import BookCover from "../Books/BookCover";
import { Link } from "react-router-dom";

const EMPTY_PAGE = { content: [], pageNumber: 0, totalPages: 0 };
export default function WishlistPage() {
  const [data, setData] = useState(EMPTY_PAGE);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);
  useEffect(() => {
    let active = true;
    wishlistApi.getMine({ page, size: 9 }).then((result) => { if (active) setData(result); })
      .catch((e) => { if (active) { setData(EMPTY_PAGE); setError(getApiErrorMessage(e, "Không tải được danh sách yêu thích.")); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, revision]);
  async function remove() {
    if (!selected || submitting.current) return;
    submitting.current = true; setBusy(true);
    try { await wishlistApi.remove(selected.book.id); setSelected(null); setNotice({ severity: "success", text: `Đã bỏ “${selected.book.title}” khỏi danh sách yêu thích.` }); setLoading(true); setRevision((value) => value + 1); }
    catch (e) { setSelected(null); setNotice({ severity: !e.response || e.response.status >= 500 ? "warning" : "error", text: getApiErrorMessage(e, "Không thể bỏ sách khỏi danh sách yêu thích.") }); }
    finally { submitting.current = false; setBusy(false); }
  }
  return <section aria-labelledby="wishlist-title" className="min-h-screen px-4 py-8 sm:px-6 lg:px-8"><header className="mb-8"><h1 id="wishlist-title" className="text-4xl font-bold text-slate-900">Sách yêu thích</h1><p className="mt-2 text-lg text-slate-600">Những cuốn sách bạn đã lưu để đọc sau.</p></header>{notice && <Alert severity={notice.severity} className="mb-5">{notice.text}</Alert>}
    {loading ? <p role="status" className="py-10 text-center">Đang tải sách yêu thích...</p> : error ? <Alert severity="error" action={<Button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert> : data.content.length === 0 ? <Alert severity="info">Danh sách yêu thích đang trống. Bạn có thể lưu sách từ trang chi tiết.</Alert> : <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{data.content.map((item) => <article key={item.id} className="overflow-hidden rounded-xl border bg-white shadow-sm"><BookCover book={item.book} className="h-56" /><div className="p-5"><h2 className="text-lg font-semibold">{item.book.title}</h2><p className="mt-1 text-sm text-slate-600">{item.book.author}</p>{item.notes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">Ghi chú: {item.notes}</p>}<p className="mt-3 text-xs text-slate-500">Đã lưu: {formatDateTime(item.addedAt)}</p><div className="mt-4 flex justify-end gap-2"><Button component={Link} to={`/books/${item.book.id}`} variant="outlined">Xem sách</Button><Button color="error" onClick={() => setSelected(item)}>Bỏ yêu thích</Button></div></div></article>)}</div>}
    {data.totalPages > 1 && <Pagination className="mt-8 flex justify-center" page={data.pageNumber + 1} count={data.totalPages} onChange={(_, value) => { setLoading(true); setPage(value - 1); }} />}
    <Dialog open={!!selected} onClose={() => { if (!busy) setSelected(null); }} fullWidth maxWidth="xs"><DialogTitle>Bỏ sách yêu thích</DialogTitle><DialogContent>Bạn muốn bỏ “{selected?.book.title}” khỏi danh sách?</DialogContent><DialogActions><Button disabled={busy} onClick={() => setSelected(null)}>Giữ lại</Button><Button color="error" variant="contained" disabled={busy} onClick={remove}>{busy ? "Đang xóa..." : "Bỏ yêu thích"}</Button></DialogActions></Dialog>
  </section>;
}
