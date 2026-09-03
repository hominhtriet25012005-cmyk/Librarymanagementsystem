import React, { useState } from 'react';
import GenreFilter from './GenreFilter';
import { TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { Sort, Search } from '@mui/icons-material';

const genres = [
    {
        "active": true,
        "bookCount": 120,
        "code": "FICTION",
        "createdAt": "2025-10-10T10:40:08.725525",
        "description": "Genre that includes imaginative or invented stories, often exploring characters,",
        "displayOrder": 1,
        "id": 1,
        "name": "Fiction",
        "parentGenreId": null,
        "parentGenreName": null,
        "subGenres": null,
        "updatedAt": "2025-10-10T10:40:08.725525"
    },
    {
        "active": true,
        "bookCount": 85,
        "code": "NON_FICTION",
        "createdAt": "2025-10-10T10:41:15.112345",
        "description": "Genre based on real events, facts, and information, including biographies, history",
        "displayOrder": 2,
        "id": 2,
        "name": "Non-Fiction",
        "parentGenreId": null,
        "parentGenreName": null,
        "subGenres": null,
        "updatedAt": "2025-10-10T10:41:15.112345"
    },
    {
        "active": true,
        "bookCount": 60,
        "code": "SCI_FI",
        "createdAt": "2025-10-10T10:42:30.456789",
        "description": "Genre that explores futuristic concepts, advanced science, space exploration,",
        "displayOrder": 3,
        "id": 3,
        "name": "Science Fiction",
        "parentGenreId": null,
        "parentGenreName": null,
        "subGenres": null,
        "updatedAt": "2025-10-10T10:42:30.456789"
    },
    {
        "active": true,
        "bookCount": 45,
        "code": "FANTASY",
        "createdAt": "2025-10-10T10:43:50.987654",
        "description": "Genre that features magical elements, mythical creatures, and imaginary worlds.",
        "displayOrder": 4,
        "id": 4,
        "name": "Fantasy",
        "parentGenreId": null,
        "parentGenreName": null,
        "subGenres": null,
        "updatedAt": "2025-10-10T10:43:50.987654"
    },

    {
        "active": true,
        "bookCount": 30,
        "code": "MYSTERY",
        "createdAt": "2025-10-10T10:45:05.321987",
        "description": "Genre focused on solving crimes, uncovering secrets, and suspenseful investigations.",
        "displayOrder": 5,
        "id": 5,
        "name": "Mystery",
        "parentGenreId": null,
        "parentGenreName": null,
        "subGenres": null,
        "updatedAt": "2025-10-10T10:45:05.321987"
    }
];

const books = [
    {
        "active": true,
        "alreadyHaveLoan": null,
        "alreadyHaveReservation": null,
        "author": "Ashok Zarmariya",
        "availableCopies": 0,
        "coverImageUrl": "http://res.cloudinary.com/dxoqwusir/image/upload/v1761368804/pexels-bohlemedia-1105564_snb6s",
        "createdAt": "2025-10-25T10:37:00.576206",
        "description": "An advanced developer's handbook on building scalable, production-grade microservices using Sp",
        "genreCode": "PROGRAMMING",
        "genreId": 10,
        "genreName": "PROGRAMMING",
        "id": 9,
        "isbn": "978-1-4028-9462-6",
        "language": "English",
        "pages": 320,
        "price": 499,
        "publicationDate": "2024-06-25",
        "publisher": "Zosh Publications",
        "title": "Mastering Spring Boot and Microservices",
        "totalCopies": 2,
        "updatedAt": "2025-12-25T18:58:46.90341"
    },
    {
        "active": true,
        "alreadyHaveLoan": null,
        "alreadyHaveReservation": null,
        "author": "Robert C. Martin",
        "availableCopies": 3,
        "coverImageUrl": "http://res.cloudinary.com/dxoqwusir/image/upload/v1761368805/clean_code.jpg",
        "createdAt": "2025-10-20T09:20:15.123456",
        "description": "A practical guide to writing clean, maintainable, and efficient code for professional",
        "genreCode": "PROGRAMMING",
        "genreId": 10,
        "genreName": "PROGRAMMING",
        "id": 10,
        "isbn": "978-0-13-235088-4",
        "language": "English",
        "pages": 464,
        "price": 599,
        "publicationDate": "2008-08-01",
        "publisher": "Prentice Hall",
        "title": "Clean Code",
        "totalCopies": 5,
        "updatedAt": "2025-12-20T14:10:30.654321"
    },
    {
        "active": true,
        "alreadyHaveLoan": null,
        "alreadyHaveReservation": null,
        "author": "Joshua Bloch",
        "availableCopies": 1,
        "coverImageUrl": "http://res.cloudinary.com/dxoqwusir/image/upload/v1761368806/effective_java.jpg",
        "createdAt": "2025-10-18T11:05:45.789012",
        "description": "Best practices for the Java platform, covering language features, performance, and design",
        "genreCode": "PROGRAMMING",
        "genreId": 10,
        "genreName": "PROGRAMMING",
        "id": 11,
        "isbn": "978-0-13-468599-1",
        "language": "English",
        "pages": 416,
        "price": 699,
        "publicationDate": "2018-01-06",
        "publisher": "Addison-Wesley",
        "title": "Effective Java",
        "totalCopies": 2,
        "updatedAt": "2025-12-22T09:45:12.111222"
    },
    {
        "active": true,
        "alreadyHaveLoan": null,
        "alreadyHaveReservation": null,
        "author": "Martin Fowler",
        "availableCopies": 2,
        "coverImageUrl": "http://res.cloudinary.com/dxoqwusir/image/upload/v1761368807/refactoring.jpg",
        "createdAt": "2025-10-15T16:40:22.333444",
        "description": "A comprehensive guide to improving existing code through refactoring techniques.",
        "genreCode": "PROGRAMMING",
        "genreId": 10,
        "genreName": "PROGRAMMING",
        "id": 12,
        "isbn": "978-0-13-475759-9",
        "language": "English",
        "pages": 448,
        "price": 649,
        "publicationDate": "2018-11-20",
        "publisher": "Addison-Wesley",
        "title": "Refactoring",
        "totalCopies": 3,
        "updatedAt": "2025-12-23T12:30:55.999888"
    },
    {
        "active": true,
        "alreadyHaveLoan": null,
        "alreadyHaveReservation": null,
        "author": "Eric Evans",
        "availableCopies": 0,
        "coverImageUrl": "http://res.cloudinary.com/dxoqwusir/image/upload/v1761368808/domain_driven_design.jpg",
        "createdAt": "2025-10-12T08:15:10.555666",
        "description": "A foundational book on applying domain-driven design principles to complex software projects.",
        "genreCode": "PROGRAMMING",
        "genreId": 10,
        "genreName": "PROGRAMMING",
        "id": 13,
        "isbn": "978-0-321-12521-7",
        "language": "English",
        "pages": 560,
        "price": 799,
        "publicationDate": "2003-08-30",
        "publisher": "Addison-Wesley",
        "title": "Domain-Driven Design",
        "totalCopies": 1,
        "updatedAt": "2025-12-24T17:05:40.777666"
    }
]

const BookPage = () => {
    const [selectedGenreId, setSelectedGenreId] = React.useState(null);
    const [availabilityFilter, setAvailabilityFilter] = React.useState('');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('createdAt');
    const [sortDirection, setSortDirection] = React.useState('DESC');

    const handleGenreSelect = (event) => {
        const genreId = event.target.value;
        setSelectedGenreId(genreId);
    };

    console.log("Selected Genre ID:", selectedGenreId);

    const handleSortChange = (Value) => {
        const [field, direction] = Value.split('-');

        setSortBy(field);
        setSortDirection(direction.toUpperCase());
    }

    const getCurrentSortValue = () => {
        return `${sortBy}-${sortDirection.toLowerCase()}`;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 text-center">
                <div className="px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-4xl text-gray-900 mb-2">
                        <h1 className="font-bold">
                            Browse Our{" "}
                            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                Collection
                            </span>
                        </h1>
                        <p className="text-lg text-gray-600 mt-2">
                            Discover thousands of books across all genres
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Filter */}
                    <aside className="lg:w-72 space-y-6">
                        {/* Filter container */}
                        <div className="space-y-6">


                            {/* Genre Filter */}
                            <GenreFilter onGenreSelect={handleGenreSelect} genres={genres} />

                            {/* Availability Filter */}
                            <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                                    Availability
                                </h3>

                                <FormControl fullWidth>
                                    <InputLabel id="demo-simple-select-label">Availability</InputLabel>
                                    <Select
                                        value={availabilityFilter}
                                        onChange={(e) => setAvailabilityFilter(e.target.value)}
                                    >
                                        <MenuItem value={"ALL"}>All books</MenuItem>
                                        <MenuItem value={"AVAILABLE"}>Available Only</MenuItem>
                                        <MenuItem value={"CHECKED_OUT"}>Checked Out</MenuItem>
                                    </Select>
                                </FormControl>

                            </div>
                        </div>
                        {/* */}
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 space-y-6">

                        {/* Search and Sort */}
                        <div className="flex flex-col md:flex-row gap-4">

                            {/* Search Input */}
                            <div className="flex-1">
                                <TextField
                                    fullWidth
                                    placeholder="Search by title, author, or category..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon className="text-gray-400" />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon className="text-gray-400" />
                                            </InputAdornment>
                                        ),

                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '&:hover fieldset': {
                                                borderColor: '#4F46E5',
                                            },
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#4F46E5',
                                            },
                                        },
                                    }}
                                />
                            </div>

                            {/* Sort Dropdown */}
                            <div className="md:w-64">
                                <FormControl fullWidth>
                                    <InputLabel>Sort By</InputLabel>
                                    <Select
                                        value={getCurrentSortValue()}
                                        onChange={(e) => handleSortChange(e.target.value)}
                                        label="Sort By"
                                        startAdornment={
                                            <InputAdornment position="start">
                                                <Sort className="text-gray-400" />
                                            </InputAdornment>
                                        }
                                        sx={{
                                            '& .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#E5E7EB',
                                            },
                                            '&:hover .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#4F46E5',
                                            },
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#4F46E5',
                                            },
                                        }}
                                    >
                                        <MenuItem value="title-asc">Title (A-Z)</MenuItem>
                                        <MenuItem value="title-desc">Title (Z-A)</MenuItem>
                                        <MenuItem value="author-asc">Author (A-Z)</MenuItem>
                                        <MenuItem value="author-desc">Author (Z-A)</MenuItem>
                                        <MenuItem value="createdAt-desc">Newest First</MenuItem>
                                        <MenuItem value="createdAt-asc">Oldest First</MenuItem>
                                    </Select>
                                </FormControl>
                            </div>
                        </div>

                        {/* Book Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                            {books.map((book) => (<BookCard key={book.id} book={book} />))}

                        </div>

                    </main>
                </div>
            </div >
        </div >
    );
};

export default BookPage;