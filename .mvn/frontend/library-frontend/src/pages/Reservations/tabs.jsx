import { AccessAlarm, Book, CheckCircle } from "@mui/icons-material";
import React from "react";

export const tabs = [
    { label: "Tất cả", icon: <Book className="w-5 h-5" /> },
    { label: "Đang chờ nhận", icon: <AccessAlarm className="w-5 h-5" /> },
    { label: "Đã kết thúc", icon: <CheckCircle className="w-5 h-5" /> },
];