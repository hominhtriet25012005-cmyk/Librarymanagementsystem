import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Switch,
  TextField,
} from "@mui/material";
import { Add, Edit, Search, VisibilityOff } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { booksApi, genresApi, getApiErrorMessage } from "../../api";

const EMPTY_PAGE = { content: [], pageNumber: 0, totalPages: 0, totalElements: 0 };
const EMPTY_FORM = {
  isbn: "", title: "", author: "", genreId: "", publisher: "", publicationDate: "",
  language: "", pages: "", price: "", totalCopies: "1", availableCopies: "1",
  description: "", coverImageUrl: "", active: true,
};

function formFromBook(book) {
  return {
    isbn: book.isbn || "", title: book.title || "", author: book.author || "", genreId: book.genreId || "",
    publisher: book.publisher || "", publicationDate: book.publicationDate || "", language: book.language || "",
    pages: book.pages ?? "", price: book.price ?? "", totalCopies: book.totalCopies ?? "0",
    availableCopies: book.availableCopies ?? "0", description: book.description || "", coverImageUrl: book.coverImageUrl || "",
    active: book.active !== false,
  };
}

function validate(form) {
  const errors = {};
  if (!form.isbn.trim()) errors.isbn = "Vui lòng nhập ISBN.";
  if (!form.title.trim()) errors.title = "Vui lòng nhập tên sách.";
  if (!form.author.trim()) errors.author = "Vui lòng nhập tác giả.";
  if (!form.genreId) errors.genreId = "Vui lòng chọn thể loại.";
  if (!/^\d+$/.test(String(form.totalCopies)) || Number(form.totalCopies) < 0) errors.totalCopies = "Tổng số bản phải là số không âm.";
  if (!/^\d+$/.test(String(form.availableCopies)) || Number(form.availableCopies) < 0) errors.availableCopies = "Số bản có sẵn phải là số không âm.";
  if (!errors.totalCopies && !errors.availableCopies && Number(form.availableCopies) > Number(form.totalCopies)) {
    errors.availableCopies = "Số bản có sẵn không được vượt quá tổng số bản.";
  }
  if (form.pages !== "" && (!/^\d+$/.test(String(form.pages)) || Number(form.pages) < 1)) errors.pages = "Số trang phải từ 1 trở lên.";
  if (form.price !== "" && (!/^\d+(\.\d{1,2})?$/.test(String(form.price)) || Number(form.price) < 0)) errors.price = "Giá sách phải là số không âm.";
  if (form.description.length > 2000) errors.description = "Mô tả không được vượt quá 2.000 ký tự.";
  if (form.coverImageUrl.length > 500) errors.coverImageUrl = "URL ảnh không được vượt quá 500 ký tự.";
  return errors;
}

function payloadFromForm(form) {
  return {
    isbn: form.isbn.trim(), title: form.title.trim(), author: form.author.trim(), genreId: Number(form.genreId),
    publisher: form.publisher.trim() || null, publicationDate: form.publicationDate || null, language: form.language.trim() || null,
    pages: form.pages === "" ? null : Number(form.pages), price: form.price === "" ? null : Number(form.price),
    totalCopies: Number(form.totalCopies), availableCopies: Number(form.availableCopies), description: form.description.trim() || null,
    coverImageUrl: form.coverImageUrl.trim() || null, active: form.active,
  };
}

export default function AdminBooksPage() {
  const [data, setData] = useState(EMPTY_PAGE);
  const [genres, setGenres] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [editor, setEditor] = useState(undefined);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    genresApi.getAll().then((result) => { if (active) setGenres(result.filter((genre) => genre.active !== false)); })
      .catch((requestError) => { if (active) setError(getApiErrorMessage(requestError, "Không tải được thể loại.")); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true); setError("");
      booksApi.search({ searchTerm: search.trim(), activeOnly: false, page, size: 10, sortBy: "createdAt", sortDirection: "DESC" })
        .then((result) => { if (active) setData(result); })
        .catch((requestError) => { if (active) { setData(EMPTY_PAGE); setError(getApiErrorMessage(requestError, "Không tải được danh sách sách.")); } })
        .finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [page, revision, search]);

  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  }

  function openCreate() {
    setEditor(null); setForm(EMPTY_FORM); setFormErrors({}); setNotice(null);
  }

  function openEdit(book) {
    setEditor(book); setForm(formFromBook(book)); setFormErrors({}); setNotice(null);
  }

  async function save(event) {
    event.preventDefault();
    const errors = validate(form);
    setFormErrors(errors);
    if (Object.keys(errors).length || submitting.current) return;
    submitting.current = true; setSaving(true); setNotice(null);
    try {
      if (editor?.id) await booksApi.updateAdmin(editor.id, payloadFromForm(form));
      else await booksApi.createAdmin(payloadFromForm(form));
      setEditor(undefined); setNotice({ severity: "success", text: editor?.id ? "Đã cập nhật thông tin sách." : "Đã tạo sách mới." });
      setLoading(true); setRevision((value) => value + 1); setPage(0);
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể lưu sách.") });
    } finally { submitting.current = false; setSaving(false); }
  }

  async function deactivate() {
    if (!deleting || submitting.current) return;
    submitting.current = true; setBusy(true);
    try {
      await booksApi.deactivateAdmin(deleting.id);
      setDeleting(null); setNotice({ severity: "success", text: `Đã ẩn sách “${deleting.title}”.` });
      setLoading(true); setRevision((value) => value + 1);
    } catch (requestError) {
      setDeleting(null); setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể ẩn sách.") });
    } finally { submitting.current = false; setBusy(false); }
  }

  return <section aria-labelledby="admin-books-title" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Khu vực quản trị</p><h1 id="admin-books-title" className="mt-2 text-4xl font-bold text-slate-900">Quản lý sách</h1><p className="mt-2 text-lg text-slate-600">Tạo, cập nhật và ẩn sách trong kho thư viện.</p></div>
      <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Tạo sách mới</Button>
    </div>
    {notice && <Alert severity={notice.severity} className="mb-5">{notice.text}</Alert>}
    <Card className="mb-5 p-4"><TextField fullWidth label="Tìm kiếm" placeholder="Tên sách, tác giả hoặc ISBN..." value={search} onChange={(event) => { setSearch(event.target.value); setPage(0); }} slotProps={{ input: { startAdornment: <Search className="mr-2 text-slate-400" /> } }} /></Card>
    {loading ? <div className="flex min-h-64 items-center justify-center"><CircularProgress aria-label="Đang tải danh sách sách" /></div> : error ? <Alert severity="error" action={<Button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert> : data.content.length === 0 ? <Alert severity="info">Chưa có sách phù hợp.</Alert> : <>
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="bg-indigo-50 text-slate-700"><tr><th className="px-4 py-3">Sách</th><th className="px-4 py-3">ISBN</th><th className="px-4 py-3">Thể loại</th><th className="px-4 py-3">Bản sách</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y">{data.content.map((book) => <tr key={book.id} className="align-top"><td className="px-4 py-4"><p className="font-semibold text-slate-900">{book.title}</p><p className="mt-1 text-slate-500">{book.author}</p></td><td className="px-4 py-4 text-slate-600">{book.isbn}</td><td className="px-4 py-4">{book.genreName || "Chưa phân loại"}</td><td className="px-4 py-4">{book.availableCopies ?? 0}/{book.totalCopies ?? 0}</td><td className="px-4 py-4"><Chip size="small" color={book.active === false ? "default" : "success"} label={book.active === false ? "Đã ẩn" : "Đang hoạt động"} /></td><td className="px-4 py-4"><div className="flex justify-end gap-1"><Button component={Link} to={`/books/${book.id}`} size="small">Xem</Button><Button size="small" startIcon={<Edit />} onClick={() => openEdit(book)}>Sửa</Button>{book.active !== false && <Button color="error" size="small" startIcon={<VisibilityOff />} onClick={() => setDeleting(book)}>Ẩn</Button>}</div></td></tr>)}</tbody></table></div>
      {data.totalPages > 1 && <Pagination className="mt-6 flex justify-center" page={data.pageNumber + 1} count={data.totalPages} onChange={(_, value) => { setLoading(true); setPage(value - 1); }} />}
    </>}
    <Dialog open={editor !== undefined} onClose={() => { if (!saving) setEditor(undefined); }} fullWidth maxWidth="md"><DialogTitle>{editor?.id ? "Cập nhật sách" : "Tạo sách mới"}</DialogTitle><DialogContent><form id="book-editor-form" onSubmit={save} className="grid gap-4 pt-2 sm:grid-cols-2">
      <TextField required label="ISBN" value={form.isbn} onChange={(event) => change("isbn", event.target.value)} error={!!formErrors.isbn} helperText={formErrors.isbn} />
      <TextField required label="Tên sách" value={form.title} onChange={(event) => change("title", event.target.value)} error={!!formErrors.title} helperText={formErrors.title} />
      <TextField required label="Tác giả" value={form.author} onChange={(event) => change("author", event.target.value)} error={!!formErrors.author} helperText={formErrors.author} />
      <FormControl required error={!!formErrors.genreId}><InputLabel id="book-genre-label">Thể loại</InputLabel><Select labelId="book-genre-label" label="Thể loại" value={form.genreId} onChange={(event) => change("genreId", event.target.value)}>{genres.map((genre) => <MenuItem key={genre.id} value={genre.id}>{genre.name}</MenuItem>)}</Select>{formErrors.genreId && <p className="mt-1 px-3 text-xs text-red-600">{formErrors.genreId}</p>}</FormControl>
      <TextField label="Nhà xuất bản" value={form.publisher} onChange={(event) => change("publisher", event.target.value)} />
      <TextField label="Ngày xuất bản" type="date" value={form.publicationDate} onChange={(event) => change("publicationDate", event.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField label="Ngôn ngữ" value={form.language} onChange={(event) => change("language", event.target.value)} />
      <TextField label="Số trang" type="number" value={form.pages} onChange={(event) => change("pages", event.target.value)} error={!!formErrors.pages} helperText={formErrors.pages} slotProps={{ htmlInput: { min: 1 } }} />
      <TextField label="Giá sách (INR)" type="number" value={form.price} onChange={(event) => change("price", event.target.value)} error={!!formErrors.price} helperText={formErrors.price} slotProps={{ htmlInput: { min: 0, step: "0.01" } }} />
      <TextField required label="Tổng số bản" type="number" value={form.totalCopies} onChange={(event) => change("totalCopies", event.target.value)} error={!!formErrors.totalCopies} helperText={formErrors.totalCopies} slotProps={{ htmlInput: { min: 0 } }} />
      <TextField required label="Số bản có sẵn" type="number" value={form.availableCopies} onChange={(event) => change("availableCopies", event.target.value)} error={!!formErrors.availableCopies} helperText={formErrors.availableCopies} slotProps={{ htmlInput: { min: 0 } }} />
      <TextField className="sm:col-span-2" label="URL ảnh bìa" value={form.coverImageUrl} onChange={(event) => change("coverImageUrl", event.target.value)} error={!!formErrors.coverImageUrl} helperText={formErrors.coverImageUrl} />
      <TextField className="sm:col-span-2" multiline minRows={3} label="Mô tả" value={form.description} onChange={(event) => change("description", event.target.value)} error={!!formErrors.description} helperText={formErrors.description || `${form.description.length}/2.000 ký tự`} />
      {editor?.id && <FormControlLabel className="sm:col-span-2" control={<Switch checked={form.active} onChange={(event) => change("active", event.target.checked)} />} label="Sách đang hoạt động" />}
    </form></DialogContent><DialogActions><Button disabled={saving} onClick={() => setEditor(undefined)}>Hủy</Button><Button type="submit" form="book-editor-form" variant="contained" disabled={saving}>{saving ? "Đang lưu..." : editor?.id ? "Lưu thay đổi" : "Tạo sách"}</Button></DialogActions></Dialog>
    <Dialog open={!!deleting} onClose={() => { if (!busy) setDeleting(null); }} fullWidth maxWidth="xs"><DialogTitle>Ẩn sách</DialogTitle><DialogContent>Sách “{deleting?.title}” sẽ không còn xuất hiện trong kho sách dành cho bạn đọc. Bạn có muốn tiếp tục?</DialogContent><DialogActions><Button disabled={busy} onClick={() => setDeleting(null)}>Giữ lại</Button><Button color="error" variant="contained" disabled={busy} onClick={deactivate}>{busy ? "Đang ẩn..." : "Ẩn sách"}</Button></DialogActions></Dialog>
  </section>;
}
