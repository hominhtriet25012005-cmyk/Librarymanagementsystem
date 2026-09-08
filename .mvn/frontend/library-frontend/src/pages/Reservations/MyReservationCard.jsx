import { formatDate, statusLabel } from "../../utils/locale";
import {
    AccessAlarm,
    Book,
    CalendarMonth,
    CheckCircle,
    Close,
    HourglassBottom,
    Notifications
}
    from "@mui/icons-material";
import { Divider } from "@mui/material";
import { getStatusColor } from "./getStatusColor";

const MyReservationCard = ({ reservation }) => {

    const statusColors = getStatusColor(reservation.status);
    //    const timeRemaining=getTimeRemaining(reservation.availableUntil);

    const getStatusIcon = (status) => {
        const iconClass = "w-5 h-5";
        const icons = {
            PENDING: <HourglassBottom className={iconClass} />,
            AVAILABLE: <CalendarMonth className={iconClass} />,
            FULFILLED: <CheckCircle className={iconClass} />,
            CANCELLED: <Close className={iconClass} />,
            EXPIRED: <AccessAlarm className={iconClass} />,
        };
        return icons[status] || <AccessAlarm className={iconClass} />;
    };

    return (
        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden border border-gray-100">
            {/* status banner */}
            <div
                className={`bg-gradient-to-r ${statusColors.gradient} p-4 px-4 py-3 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <span>{getStatusIcon(reservation.status)}</span>
                    <span className={` ${getStatusColor(reservation.status).text} font-bold text-sm uppercase
                        tracking-wider`}>{statusLabel(reservation.status)}</span>
                </div>


            </div>

            <div className="p-6">
                {/* book header */}
                <div className="mb-4">
                    <div className="flex items-center gap-3 mb-2">

                        <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">

                            <Book className="w-6 h-6 text-white" />

                        </div>
                        <div>
                            <p>Mã sách</p>
                            <h3>#{reservation.bookId}</h3>
                        </div>

                    </div>

                    <p>{reservation.bookTitle}</p>

                </div>

                <Divider />

                {/* Timeline */}

                <div className="space-y-3 mt-3">
                    <div className="flex items-start gap-2">
                        <AccessAlarm className="w-4 h-4 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase">
                                Ngày đặt
                            </p>
                            <p className="text-sm font-semibold text-gray-700">
                                {formatDate(reservation.reservedAt)}
                            </p>
                        </div>
                    </div>

                    {reservation.availableAt && (
                        <div className="flex items-start gap-2">
                            <CalendarMonth className="w-4 h-4 text-green-500 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-green-600 uppercase">
                                    Sẵn sàng từ
                                </p>
                                <p className="text-sm font-semibold text-green-700">
                                    {formatDate(reservation.availableAt)}
                                </p>
                            </div>
                        </div>
                    )}


                    {reservation.availableUntil && (
                        <div className="flex items-start gap-2">
                            <Notifications className="w-4 h-4 text-red-500 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-red-600 uppercase">
                                    Hạn nhận
                                </p>
                                <p className="text-sm font-semibold text-red-700">
                                    {formatDate(reservation.availableUntil)}
                                </p>
                            </div>
                        </div>
                    )}


                    {reservation.fulfilledAt && (
                        <div className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-blue-600 uppercase">
                                    Đã nhận
                                </p>
                                <p className="text-sm font-semibold text-blue-700">
                                    {formatDate(reservation.fulfilledAt)}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

    );
};

export default MyReservationCard;
