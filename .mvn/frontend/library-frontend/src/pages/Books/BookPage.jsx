import { Search, Sort } from "@mui/icons-material";
import {
  Alert,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { booksApi, genresApi, getApiErrorMessage } from "../../api";
import BookCard from "./BookCard";
import GenreFilter from "./GenreFilter";

const EMPTY_PAGE = {
  content: [],
  pageNumber: 0,
  pageSize: 9,
  totalElements: 0,
  totalPages: 0,
};

const BookPage = () => {
  const [genres, setGenres] = useState([]);
  const [bookPage, setBookPage] = useState(EMPTY_PAGE);
  const [selectedGenreId, setSelectedGenreId] = useState(null);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("DESC");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    genresApi
      .getAll()
      .then((data) => {
        if (active) setGenres(data);
      })
      .catch((requestError) => {
        if (active) setError(getApiErrorMessage(requestError, "Không tải được thể loại."));
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    // Đợi người dùng ngừng nhập một chút để không gọi API sau từng phím bấm.
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const data = await booksApi.search({
          searchTerm: searchTerm.trim(),
          genreId: selectedGenreId,
          availableOnly,
          activeOnly: true,
          page,
          size: EMPTY_PAGE.pageSize,
          sortBy,
          sortDirection,
        });

        if (active) setBookPage(data);
      } catch (requestError) {
        if (active) {
          setBookPage(EMPTY_PAGE);
          setError(getApiErrorMessage(requestError, "Không tải được danh sách sách."));
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [availableOnly, page, searchTerm, selectedGenreId, sortBy, sortDirection]);

  const handleGenreSelect = (genreId) => {
    setSelectedGenreId(genreId);
    setPage(0);
  };

  const handleSortChange = (value) => {
    const [field, direction] = value.split("-");
    setSortBy(field);
    setSortDirection(direction.toUpperCase());
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="border-b border-gray-200 bg-white text-center">
        <div className="px-4 py-8 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Khám phá <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">kho sách</span>
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Tìm kiếm sách theo tên, tác giả, ISBN hoặc thể loại
          </p>
        </div>
      </header>

      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <aside className="space-y-6 lg:w-72">
            <GenreFilter
              genres={genres}
              selectedGenreId={selectedGenreId}
              onGenreSelect={handleGenreSelect}
            />

            <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-md">
              <h3 className="mb-4 border-b border-gray-200 pb-3 text-lg font-bold text-gray-900">
                Tình trạng sách
              </h3>
              <FormControl fullWidth>
                <InputLabel id="availability-filter-label">Tình trạng</InputLabel>
                <Select
                  labelId="availability-filter-label"
                  label="Tình trạng"
                  value={availableOnly ? "AVAILABLE" : "ALL"}
                  onChange={(event) => {
                    setAvailableOnly(event.target.value === "AVAILABLE");
                    setPage(0);
                  }}
                >
                  <MenuItem value="ALL">Tất cả sách</MenuItem>
                  <MenuItem value="AVAILABLE">Chỉ sách còn bản sao</MenuItem>
                </Select>
              </FormControl>
            </div>
          </aside>

          <main className="flex-1 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row">
              <TextField
                fullWidth
                placeholder="Nhập tên sách, tác giả hoặc ISBN..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(0);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search className="text-gray-400" />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <FormControl className="md:w-64" sx={{ minWidth: { md: 256 } }}>
                <InputLabel id="book-sort-label">Sắp xếp</InputLabel>
                <Select
                  labelId="book-sort-label"
                  label="Sắp xếp"
                  value={`${sortBy}-${sortDirection.toLowerCase()}`}
                  onChange={(event) => handleSortChange(event.target.value)}
                  startAdornment={
                    <InputAdornment position="start">
                      <Sort className="text-gray-400" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="title-asc">Tên sách A–Z</MenuItem>
                  <MenuItem value="title-desc">Tên sách Z–A</MenuItem>
                  <MenuItem value="author-asc">Tác giả A–Z</MenuItem>
                  <MenuItem value="author-desc">Tác giả Z–A</MenuItem>
                  <MenuItem value="createdAt-desc">Mới thêm trước</MenuItem>
                  <MenuItem value="createdAt-asc">Cũ hơn trước</MenuItem>
                </Select>
              </FormControl>
            </div>

            {error && <Alert severity="error">{error}</Alert>}

            {loading ? (
              <div className="flex min-h-72 items-center justify-center">
                <CircularProgress aria-label="Đang tải danh sách sách" />
              </div>
            ) : bookPage.content.length === 0 ? (
              <Alert severity="info">Không tìm thấy sách phù hợp với bộ lọc.</Alert>
            ) : (
              <>
                <p className="text-sm text-slate-600">
                  Tìm thấy <strong>{bookPage.totalElements}</strong> cuốn sách
                </p>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {bookPage.content.map((book) => (
                    <BookCard key={book.id} book={book} />
                  ))}
                </div>

                {bookPage.totalPages > 1 && (
                  <div className="flex justify-center pt-4">
                    <Pagination
                      color="primary"
                      count={bookPage.totalPages}
                      page={bookPage.pageNumber + 1}
                      onChange={(_, nextPage) => setPage(nextPage - 1)}
                    />
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default BookPage;
