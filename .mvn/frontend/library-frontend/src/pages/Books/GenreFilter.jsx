import React from "react";
import {
    RadioButtonChecked as RadioButtonCheckedIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
} from "@mui/icons-material";
import { FormControl, FormControlLabel, Radio, RadioGroup } from "@mui/material";

const GenreFilter = ({ genres = [], selectedGenreId, onGenreSelect }) => {
    return (
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Thể loại</h3>
                {selectedGenreId && (
                    <button
                        type="button"
                        onClick={() => onGenreSelect(null)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                        Xóa lọc
                    </button>
                )}
            </div>

            {/* All Genres Option */}
            <div
                className={`flex items-center space-x-2 py-2 px-3 mb-2 rounded-lg cursor-pointer transition-all duration-200 ${!selectedGenreId
                    ? "bg-indigo-50 text-indigo-700 font-semibold"
                    : "hover:bg-gray-50 text-gray-700"
                    }`}
                onClick={() => onGenreSelect(null)}
            >
                {!selectedGenreId ? (
                    <RadioButtonCheckedIcon sx={{ fontSize: 16, color: "#4F46E5" }} />
                ) : (
                    <RadioButtonUncheckedIcon sx={{ fontSize: 16 }} />
                )}
                <span className="text-sm">Tất cả thể loại</span>
            </div>
            
            {/* Genre List */}
            <div className="space-y-1 pl-5 max-h-96 overflow-y-auto custom-scrollbar">
                <FormControl>
                    <RadioGroup
                        aria-label="Lọc theo thể loại"
                        value={selectedGenreId ?? ""}
                        name="radio-buttons-group"
                        onChange={(event) => onGenreSelect(Number(event.target.value))}
                    >
                        {genres.map((genre) => (
                            <FormControlLabel
                                key={genre.id}
                                value={genre.id}
                                control={<Radio />}
                                label={genre.name}
                            />
                        ))}
                    </RadioGroup>
                </FormControl>

            </div>
        </div>
    );
};

export default GenreFilter;
