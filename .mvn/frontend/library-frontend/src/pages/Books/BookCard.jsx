import { Chip } from '@mui/material';
import { Person } from '@mui/icons-material';

const BookCard = ({ book }) => {
    return (
        <article className='group overflow-hidden rounded-xl border border-gray-100 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'>
            {/* Book Cover */}
            <div className="relative h-64 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
                <img
                    src={book.coverImageUrl || "https://cdn.pixabay.com/photo/2019/01/30/08/30/book-3964050_1280.jpg"}
                    alt={book.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>

            {/* Book Details */}

            <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {book.title}
                </h3>

                <div className="flex items-center space-x-2 text-gray-600 mb-3">
                    <Person sx={{ fontSize: 16 }} />
                    <span className="text-sm line-clamp-1">{book.author}</span>
                </div>

                {/* ISBN & Copies Info */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>ISBN: {book.isbn}</span>
                    <span>{book.availableCopies}/{book.totalCopies} bản</span>
                </div>

                {/* Description Preview */}
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
            </div>
        </article>
    )
}

export default BookCard
