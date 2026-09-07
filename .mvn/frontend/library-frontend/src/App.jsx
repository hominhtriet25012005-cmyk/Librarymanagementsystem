import "./App.css";
import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import UserLayout from "./layouts/UserLayout/UserLayout";
import ModulePlaceholder from "./components/common/ModulePlaceholder";

const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const BookPage = lazy(() => import("./pages/Books/BookPage"));
const MyLoans = lazy(() => import("./pages/Loans/MyLoans"));
const MyReservations = lazy(() => import("./pages/Reservations/MyReservations"));

function App() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-600">Đang tải giao diện...</div>}>
      <Routes>
        {/* Các route dành cho bạn đọc. */}
        <Route element={<UserLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="books" element={<BookPage />} />
          <Route path="my-loans" element={<MyLoans />} />
          <Route path="my-reservations" element={<MyReservations />} />
          <Route path="my-fines" element={<ModulePlaceholder title="Tiền phạt của tôi" />} />
          <Route path="subscriptions" element={<ModulePlaceholder title="Gói thành viên" />} />
          <Route path="wishlist" element={<ModulePlaceholder title="Danh sách yêu thích" />} />
          <Route path="profile" element={<ModulePlaceholder title="Hồ sơ cá nhân" />} />
          <Route path="settings" element={<ModulePlaceholder title="Cài đặt" />} />
        </Route>

        {/* Đường dẫn không tồn tại sẽ quay về trang chủ. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App
