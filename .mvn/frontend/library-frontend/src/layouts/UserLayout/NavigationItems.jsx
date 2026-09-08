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
    AdminPanelSettings as AdminPanelSettingsIcon,
    Category as CategoryIcon,
    Storefront as StorefrontIcon,
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

// Khu vực quản trị dùng bộ điều hướng riêng để admin tập trung vào nghiệp vụ thư viện.
export const adminNavigationItems = [
    {
        title: 'Tổng quan quản trị',
        path: '/admin/dashboard',
        icon: <AdminPanelSettingsIcon />,
        description: 'Số liệu vận hành thư viện',
    },
    {
        title: 'Quản lý sách',
        path: '/admin/books',
        icon: <MenuBookIcon />,
        description: 'Tạo, cập nhật và ẩn sách',
    },
    {
        title: 'Quản lý thể loại',
        path: '/admin/genres',
        icon: <CategoryIcon />,
        description: 'Sắp xếp danh mục sách',
    },
    {
        title: 'Khu vực bạn đọc',
        path: '/books',
        icon: <StorefrontIcon />,
        description: 'Xem giao diện người dùng',
    },
];
