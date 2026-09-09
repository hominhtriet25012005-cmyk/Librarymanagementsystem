import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import HistoryIcon from "@mui/icons-material/History";
import ReceiptIcon from "@mui/icons-material/Receipt";
import { LibraryBooks } from "@mui/icons-material";

export const statsConfig = ({ activeLoans, activeReservations, readThisYear, openFines }) => [
  {
    id: "loans", title: "Đang mượn", subtitle: "Phiếu mượn còn hiệu lực", value: activeLoans.length,
    icon: <LibraryBooks sx={{ fontSize: 32, color: "#4F46E5" }} />, bgColor: "bg-indigo-100", textColor: "text-indigo-600",
  },
  {
    id: "reservations", title: "Đặt trước", subtitle: "Đang chờ hoặc sẵn sàng", value: activeReservations.length,
    icon: <EventAvailableIcon sx={{ fontSize: 32, color: "#9333EA" }} />, bgColor: "bg-purple-100", textColor: "text-purple-600",
  },
  {
    id: "read", title: "Sách đã đọc", subtitle: "Đã trả trong năm nay", value: readThisYear.length,
    icon: <HistoryIcon sx={{ fontSize: 32, color: "#10B981" }} />, bgColor: "bg-green-100", textColor: "text-green-600",
  },
  {
    id: "fines", title: "Khoản phạt", subtitle: "Chưa thanh toán hết", value: openFines.length,
    icon: <ReceiptIcon sx={{ fontSize: 32, color: "#F59E0B" }} />, bgColor: "bg-orange-100", textColor: "text-orange-600",
  },
];
