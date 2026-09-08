import { useState } from "react";
import { MenuBook } from "@mui/icons-material";

export default function BookCover({ book, className = "" }) {
  const [failedUrl, setFailedUrl] = useState(null);
  return <div className={`flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 ${className}`}>
    {book.coverImageUrl && failedUrl !== book.coverImageUrl
      ? <img src={book.coverImageUrl} alt={`Bìa sách ${book.title}`} className="h-full w-full object-contain" onError={() => setFailedUrl(book.coverImageUrl)} />
      : <div className="p-6 text-center text-indigo-700"><MenuBook sx={{ fontSize: 64 }} /><p className="mt-3 text-sm">Chưa có ảnh bìa</p></div>}
  </div>;
}
