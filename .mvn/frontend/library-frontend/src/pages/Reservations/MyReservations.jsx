import { AccessAlarm, Book, CalendarToday } from '@mui/icons-material';
import React from 'react';
import { tabs } from "./tabs";
import { myReservation } from "./reservation";
import MyReservationCard from "./MyReservationCard";

const MyReservations = () => {
    const state = { total: myReservation.length, active: myReservation.filter((item) => item.status === "PENDING").length, available: myReservation.filter((item) => item.status === "AVAILABLE").length };
    const [activeTab, setActiveTab] = React.useState(0);

    return (
        <div className='min-h-screen py-8'>
            <div className="px-4 sm:px-6 lg:px-8">

                {/* header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center space-x-3">
                        <span aria-hidden="true" className="text-5xl">📑</span>
                        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            Sách đã đặt trước
                        </span>
                    </h1>

                    <p className="text-lg text-gray-600">
                        Theo dõi trạng thái và thứ tự chờ của các yêu cầu đặt sách
                    </p>
                </div>

                <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Danh sách đặt trước bên dưới là dữ liệu minh họa.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                    {/* 1. Reservation */}
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tổng lượt đặt</p>
                                <p className="text-4xl font-extrabold text-gray-900 mt-1">{state.total}</p>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                                <Book className="w-8 h-8 text-white" />
                            </div>

                        </div>
                    </div>

                    {/* 2. Active */}
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                    Đang chờ
                                </p>
                                <p className="text-4xl font-extrabold text-gray-900 mt-1">
                                    {state.active}
                                </p>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-xl shadow-lg">
                                <AccessAlarm className="w-8 h-8 text-white" />
                            </div>

                        </div>
                    </div>

                    {/* 3. Sẵn sàng nhận */}
                    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                                    Sẵn sàng nhận
                                </p>
                                <p className="text-4xl font-extrabold text-gray-900 mt-1">
                                    {state.available}</p>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                                <CalendarToday className="w-8 h-8 text-white" />
                            </div>

                        </div>
                    </div>

                </div>

                {/* Tabs */}
                <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
                    <div className="flex border-b border-gray-200">
                        {tabs.map((tab, index) =>
                        (<button
                            onClick={() => setActiveTab(index)}
                            key={index}
                            className={`flex-1 px-2 sm:px-6 py-4 font-semibold text-base flex items-center ${
                                activeTab === index
                                    ? "text-indigo-600 border-b-4 border-indigo-600 bg-indigo-50"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}>
                            {tab.icon}
                            {tab.label}
                        </button>
                        ))}


                    </div>
                </div>


                {/* Content - Reservation List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myReservation.filter((item) => activeTab === 0 || (activeTab === 1 ? ["PENDING", "AVAILABLE"].includes(item.status) : ["FULFILLED", "EXPIRED", "CANCELLED"].includes(item.status))).map((reservation) => (
                        <MyReservationCard key={reservation.id} reservation={reservation} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default MyReservations
