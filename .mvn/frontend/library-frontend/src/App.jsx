import "./App.css";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import UserLayout from "./layouts/UserLayout/UserLayout";
import ModulePlaceholder from "./components/common/ModulePlaceholder";
import { AdminRoute, ForbiddenPage, GuestRoute, ProtectedRoute } from "./auth/RouteGuards";
import AuthPage from "./pages/Auth/AuthPage";
import ProfilePage from "./pages/Profile/ProfilePage";

const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const BookPage = lazy(() => import("./pages/Books/BookPage"));
const BookDetail = lazy(() => import("./pages/Books/BookDetail"));
const MyLoans = lazy(() => import("./pages/Loans/MyLoans"));
const MyReservations = lazy(() => import("./pages/Reservations/MyReservations"));
const MyFines = lazy(() => import("./pages/Fines/MyFines"));
const WishlistPage = lazy(() => import("./pages/Wishlist/WishlistPage"));
const AdminDashboardPage = lazy(() => import("./pages/Admin/AdminDashboardPage"));
const AdminBooksPage = lazy(() => import("./pages/Admin/AdminBooksPage"));
const AdminGenresPage = lazy(() => import("./pages/Admin/AdminGenresPage"));

export default function App() {
  return <Suspense fallback={<div role="status" className="p-8 text-center">Đang tải giao diện...</div>}>
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="login" element={<AuthPage key="login" mode="login" />} />
        <Route path="signup" element={<AuthPage key="signup" mode="signup" />} />
      </Route>
      <Route path="forgot-password" element={<AuthPage key="forgot" mode="forgot" />} />
      <Route path="reset-password" element={<AuthPage key="reset" mode="reset" />} />
      <Route element={<UserLayout />}>
        <Route path="books" element={<BookPage />} />
        <Route path="books/:id" element={<BookDetail />} />
        <Route element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="my-loans" element={<MyLoans />} />
          <Route path="my-reservations" element={<MyReservations />} />
          <Route path="my-fines" element={<MyFines />} />
          <Route path="subscriptions" element={<ModulePlaceholder title="Gói thành viên" />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<ModulePlaceholder title="Cài đặt" />} />
          <Route path="forbidden" element={<ForbiddenPage />} />
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="admin/books" element={<AdminBooksPage />} />
            <Route path="admin/genres" element={<AdminGenresPage />} />
          </Route>
        </Route>
        <Route path="*" element={<ModulePlaceholder title="Không tìm thấy trang" description="Đường dẫn không tồn tại. Hãy chọn một mục trong thanh điều hướng." />} />
      </Route>
    </Routes>
  </Suspense>;
}
