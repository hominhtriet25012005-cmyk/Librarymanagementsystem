import {
    Dashboard as DashboardIcon,
    MenuBook as MenuBookIcon,
    EventNote as EventNoteIcon,
    EventAvailable as EventAvailableIcon,
    CardMembership as CardMembershipIcon,
    Favorite as FavoriteIcon,
    Person as PersonIcon,
    Settings as SettingsIcon,
    Receipt as ReceiptIcon,
} from "@mui/icons-material";

import React from "react";

export const secondaryItems = [
    {
        title: 'Hồ sơ',
        path: '/profile',
        icon: <PersonIcon />,
    },
    {
        title: 'Cài đặt',
        path: '/settings',
        icon: <SettingsIcon />,
    },
];

export const navigationItems = [
    {
        title: 'Tổng quan',
        path: '/',
        icon: <DashboardIcon />,
        description: 'Tổng quan và thống kê',
    },
    {
        title: 'Kho sách',
        path: '/books',
        icon: <MenuBookIcon />,
        description: 'Tra cứu sách trong thư viện',
    },
    {
        title: 'Sách đang mượn',
        path: '/my-loans',
        icon: <EventNoteIcon />,
        description: 'Đang mượn và lịch sử',
        badge: 'loans',
    },
    {
        title: 'Đặt trước',
        path: '/my-reservations',
        icon: <EventAvailableIcon />,
        description: 'Theo dõi hàng chờ đặt sách',
        badge: 'reservations',
    },
    {
        title: 'Tiền phạt',
        path: '/my-fines',
        icon: <ReceiptIcon />,
        description: 'Chưa trả và đã thanh toán',
        badge: 'fines',
    },
    {
        title: 'Gói thành viên',
        path: '/subscriptions',
        icon: <CardMembershipIcon />,
        description: 'Quản lý gói đang sử dụng',
        badge: 'subscription',
    },
    {
        title: 'Yêu thích',
        path: '/wishlist',
        icon: <FavoriteIcon />,
        description: 'Các sách đã lưu',
    },
];
