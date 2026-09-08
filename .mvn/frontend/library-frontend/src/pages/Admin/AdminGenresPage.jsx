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
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";
import { Add, Category, Edit, ToggleOff, ToggleOn } from "@mui/icons-material";
import { genresApi, getApiErrorMessage } from "../../api";

const EMPTY_FORM = {
  code: "",
  name: "",
  description: "",
  displayOrder: "0",
  parentGenreId: "",
  active: true,
};

function formFromGenre(genre) {
  return {
    code: genre.code || "",
    name: genre.name || "",
    description: genre.description || "",
    displayOrder: String(genre.displayOrder ?? 0),
    parentGenreId: genre.parentGenreId || "",
    active: genre.active !== false,
  };
}

function validate(form) {
  const errors = {};
  if (!form.code.trim()) errors.code = "Vui lòng nhập mã thể loại.";
  else if (!/^[A-Za-z0-9_-]+$/.test(form.code.trim())) errors.code = "Mã chỉ gồm chữ, số, dấu gạch ngang hoặc gạch dưới.";
  else if (form.code.trim().length > 50) errors.code = "Mã không được vượt quá 50 ký tự.";
  if (!form.name.trim()) errors.name = "Vui lòng nhập tên thể loại.";
  else if (form.name.trim().length > 100) errors.name = "Tên không được vượt quá 100 ký tự.";
  if (form.description.length > 500) errors.description = "Mô tả không được vượt quá 500 ký tự.";
  if (!/^\d+$/.test(String(form.displayOrder))) errors.displayOrder = "Thứ tự phải là số nguyên không âm.";
  return errors;
}

function payloadFromForm(form) {
  return {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    description: form.description.trim() || null,
    displayOrder: Number(form.displayOrder),
    parentGenreId: form.parentGenreId ? Number(form.parentGenreId) : null,
    active: form.active,
  };
}

export default function AdminGenresPage() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState(undefined);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [revision, setRevision] = useState(0);
  const submitting = useRef(false);

  useEffect(() => {
    let active = true;
    genresApi.getAll()
      .then(async (items) => {
        const counts = await Promise.allSettled(items.map((genre) => genresApi.getBookCount(genre.id)));
        if (!active) return;
        setGenres(items
          .map((genre, index) => ({
            ...genre,
            bookCount: counts[index].status === "fulfilled" ? counts[index].value : 0,
          }))
          .sort((first, second) => (first.displayOrder ?? 0) - (second.displayOrder ?? 0)));
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, "Không tải được danh sách thể loại."));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [revision]);

  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const visibleGenres = genres.filter((genre) => !normalizedQuery
    || genre.name?.toLocaleLowerCase("vi").includes(normalizedQuery)
    || genre.code?.toLocaleLowerCase("vi").includes(normalizedQuery));

  function change(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: "" }));
  }

  function openCreate() {
    setEditor(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setNotice(null);
  }

  function openEdit(genre) {
    setEditor(genre);
    setForm(formFromGenre(genre));
    setFormErrors({});
    setNotice(null);
  }

  async function save(event) {
    event.preventDefault();
    const errors = validate(form);
    setFormErrors(errors);
    if (Object.keys(errors).length || submitting.current) return;
    submitting.current = true;
    setSaving(true);
    try {
      if (editor?.id) await genresApi.update(editor.id, payloadFromForm(form));
      else await genresApi.create(payloadFromForm(form));
      setEditor(undefined);
      setNotice({ severity: "success", text: editor?.id ? "Đã cập nhật thể loại." : "Đã tạo thể loại mới." });
      setLoading(true);
      setRevision((value) => value + 1);
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể lưu thể loại.") });
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  async function toggleStatus(genre) {
    if (submitting.current) return;
    submitting.current = true;
    setNotice(null);
    try {
      if (genre.active === false) {
        await genresApi.update(genre.id, { ...genre, active: true, subGenre: undefined, bookCount: undefined });
        setNotice({ severity: "success", text: `Đã kích hoạt thể loại “${genre.name}”.` });
      } else {
        await genresApi.deactivate(genre.id);
        setNotice({ severity: "success", text: `Đã ẩn thể loại “${genre.name}”.` });
      }
      setLoading(true);
      setRevision((value) => value + 1);
    } catch (requestError) {
      setNotice({ severity: "error", text: getApiErrorMessage(requestError, "Không thể thay đổi trạng thái thể loại.") });
    } finally {
      submitting.current = false;
    }
  }

  const parentOptions = genres.filter((genre) => genre.id !== editor?.id && genre.active !== false);

  return <section aria-labelledby="admin-genres-title" className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">Danh mục thư viện</p>
        <h1 id="admin-genres-title" className="mt-2 text-4xl font-bold text-slate-900">Quản lý thể loại</h1>
        <p className="mt-2 text-lg text-slate-600">Tổ chức sách theo nhóm và thể loại cha con.</p>
      </div>
      <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Tạo thể loại</Button>
    </div>

    {notice && <Alert severity={notice.severity} className="mb-5">{notice.text}</Alert>}
    <div className="mb-5 grid gap-4 sm:grid-cols-3">
      <Card className="p-5"><p className="text-sm text-slate-500">Tổng thể loại</p><p className="mt-2 text-3xl font-bold">{genres.length}</p></Card>
      <Card className="p-5"><p className="text-sm text-slate-500">Đang hoạt động</p><p className="mt-2 text-3xl font-bold text-emerald-600">{genres.filter((genre) => genre.active !== false).length}</p></Card>
      <Card className="p-5"><p className="text-sm text-slate-500">Đã ẩn</p><p className="mt-2 text-3xl font-bold text-slate-500">{genres.filter((genre) => genre.active === false).length}</p></Card>
    </div>

    <Card className="mb-5 p-4">
      <TextField fullWidth label="Tìm kiếm" placeholder="Tên hoặc mã thể loại..." value={query} onChange={(event) => setQuery(event.target.value)} />
    </Card>

    {loading ? <div className="flex min-h-64 items-center justify-center"><CircularProgress aria-label="Đang tải thể loại" /></div>
      : error ? <Alert severity="error" action={<Button onClick={() => { setLoading(true); setError(""); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>
        : visibleGenres.length === 0 ? <Alert severity="info">Chưa có thể loại phù hợp. Hãy tạo thể loại đầu tiên để bắt đầu nhập sách.</Alert>
          : <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-indigo-50 text-slate-700"><tr><th className="px-4 py-3">Thể loại</th><th className="px-4 py-3">Mã</th><th className="px-4 py-3">Thể loại cha</th><th className="px-4 py-3">Số sách</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead>
              <tbody className="divide-y">{visibleGenres.map((genre) => <tr key={genre.id}>
                <td className="px-4 py-4"><div className="flex items-start gap-3"><Category className="mt-0.5 text-indigo-500" /><div><p className="font-semibold text-slate-900">{genre.name}</p><p className="mt-1 max-w-md text-slate-500">{genre.description || "Chưa có mô tả"}</p></div></div></td>
                <td className="px-4 py-4 font-mono text-xs text-slate-600">{genre.code}</td>
                <td className="px-4 py-4 text-slate-600">{genre.parentGenreName || "Cấp cao nhất"}</td>
                <td className="px-4 py-4">{genre.bookCount ?? 0}</td>
                <td className="px-4 py-4"><Chip size="small" color={genre.active === false ? "default" : "success"} label={genre.active === false ? "Đã ẩn" : "Hoạt động"} /></td>
                <td className="px-4 py-4"><div className="flex justify-end gap-1"><Button size="small" startIcon={<Edit />} onClick={() => openEdit(genre)}>Sửa</Button><Button size="small" color={genre.active === false ? "success" : "warning"} startIcon={genre.active === false ? <ToggleOn /> : <ToggleOff />} onClick={() => toggleStatus(genre)}>{genre.active === false ? "Kích hoạt" : "Ẩn"}</Button></div></td>
              </tr>)}</tbody>
            </table>
          </div>}

    <Dialog open={editor !== undefined} onClose={() => { if (!saving) setEditor(undefined); }} fullWidth maxWidth="sm">
      <DialogTitle>{editor?.id ? "Cập nhật thể loại" : "Tạo thể loại mới"}</DialogTitle>
      <DialogContent><form id="genre-editor-form" onSubmit={save} className="grid gap-4 pt-2">
        <TextField required label="Mã thể loại" placeholder="Ví dụ: CONG_NGHE" value={form.code} onChange={(event) => change("code", event.target.value)} error={!!formErrors.code} helperText={formErrors.code || "Mã được tự động chuyển thành chữ in hoa."} />
        <TextField required label="Tên thể loại" value={form.name} onChange={(event) => change("name", event.target.value)} error={!!formErrors.name} helperText={formErrors.name} />
        <FormControl><InputLabel id="parent-genre-label">Thể loại cha</InputLabel><Select labelId="parent-genre-label" label="Thể loại cha" value={form.parentGenreId} onChange={(event) => change("parentGenreId", event.target.value)}><MenuItem value="">Không có</MenuItem>{parentOptions.map((genre) => <MenuItem key={genre.id} value={genre.id}>{genre.name}</MenuItem>)}</Select></FormControl>
        <TextField label="Thứ tự hiển thị" type="number" value={form.displayOrder} onChange={(event) => change("displayOrder", event.target.value)} error={!!formErrors.displayOrder} helperText={formErrors.displayOrder} slotProps={{ htmlInput: { min: 0 } }} />
        <TextField multiline minRows={3} label="Mô tả" value={form.description} onChange={(event) => change("description", event.target.value)} error={!!formErrors.description} helperText={formErrors.description || `${form.description.length}/500 ký tự`} />
      </form></DialogContent>
      <DialogActions><Button disabled={saving} onClick={() => setEditor(undefined)}>Hủy</Button><Button type="submit" form="genre-editor-form" variant="contained" disabled={saving}>{saving ? "Đang lưu..." : editor?.id ? "Lưu thay đổi" : "Tạo thể loại"}</Button></DialogActions>
    </Dialog>
  </section>;
}
