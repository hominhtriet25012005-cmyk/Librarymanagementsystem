import { useEffect, useRef, useState } from "react";
import { Favorite, FavoriteBorder } from "@mui/icons-material";
import { Alert, Button } from "@mui/material";
import { getApiErrorMessage, wishlistApi } from "../../api";

export default function WishlistButton({ bookId }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, setRevision] = useState(0);
  const busy = useRef(false);
  useEffect(() => {
    let active = true;
    wishlistApi.getAllMine().then((items) => { if (active) setItem(items.find((value) => value.book?.id === bookId) || null); })
      .catch((e) => { if (active) setError(getApiErrorMessage(e, "Không kiểm tra được danh sách yêu thích.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [bookId, revision]);
  async function toggle() {
    if (busy.current) return;
    busy.current = true; setLoading(true); setError(""); setNotice("");
    try {
      if (item) { await wishlistApi.remove(bookId); setItem(null); setNotice("Đã bỏ khỏi danh sách yêu thích."); }
      else { const created = await wishlistApi.add(bookId); setItem(created); setNotice("Đã thêm vào danh sách yêu thích."); }
    } catch (e) { setError(getApiErrorMessage(e, "Không thể cập nhật danh sách yêu thích.")); }
    finally { busy.current = false; setLoading(false); }
  }
  return <div className="mb-5 rounded-xl border border-pink-100 bg-pink-50 p-4">
    <Button variant={item ? "contained" : "outlined"} color="secondary" startIcon={item ? <Favorite /> : <FavoriteBorder />} disabled={loading || !!error} onClick={toggle}>{loading ? "Đang kiểm tra..." : item ? "Bỏ yêu thích" : "Thêm vào yêu thích"}</Button>
    {notice && <span role="status" className="ml-3 text-sm text-slate-700">{notice}</span>}
    {error && <Alert severity="error" className="mt-3" action={<Button onClick={() => { setLoading(true); setRevision((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>}
  </div>;
}
