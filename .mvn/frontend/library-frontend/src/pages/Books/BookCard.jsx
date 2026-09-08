import { Button, Chip } from '@mui/material';
import { Person } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import BookCover from './BookCover';

const BookCard = ({ book }) => {
    return (
        <article className='group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'>
            <Link to={`/books/${book.id}`} aria-label={`Xem chi tiết ${book.title}`}><BookCover book={book} className="h-64" /></Link>

            {/* Thông tin tóm tắt của sách. */}

            <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    <Link to={`/books/${book.id}`}>{book.title}</Link>
                </h3>

                <div className="flex items-center space-x-2 text-gray-600 mb-3">
                    <Person sx={{ fontSize: 16 }} />
                    <span className="text-sm line-clamp-1">{book.author}</span>
                </div>

                {/* Mã sách và số bản còn sẵn. */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>ISBN: {book.isbn}</span>
                    <span>{book.availableCopies}/{book.totalCopies} bản</span>
                </div>

                {/* Xem trước nội dung giới thiệu. */}
                {book.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {book.description}
                    </p>
                )}

                <Chip
                    color={book.availableCopies > 0 ? "success" : "default"}
                    label={book.availableCopies > 0 ? "Còn sách" : "Tạm hết"}
                    size="small"
                    variant="outlined"
                />
                <Button component={Link} to={`/books/${book.id}`} fullWidth sx={{ mt: 2 }}>Xem chi tiết</Button>
            </div>
        </article>
    )
}

export default BookCard
