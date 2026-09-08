export function formatDate(value) {
  if (!value) return "Chưa có";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Chưa có" : date.toLocaleDateString("vi-VN");
}
export function formatMoney(value, currency = "INR") {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(Number(value) || 0);
}
export const statusLabels = {
  ACTIVE: "Đang hoạt động", CHECKED_OUT: "Đang mượn", OVERDUE: "Quá hạn", RETURNED: "Đã trả",
  LOST: "Đã mất", DAMAGED: "Hư hỏng", PENDING: "Đang chờ", READY: "Sẵn sàng nhận",
  AVAILABLE: "Sẵn sàng nhận", FULFILLED: "Đã nhận", CANCELLED: "Đã hủy", EXPIRED: "Hết hạn",
};
export const statusLabel = (status) => statusLabels[status?.toUpperCase()] || "Chưa xác định";
