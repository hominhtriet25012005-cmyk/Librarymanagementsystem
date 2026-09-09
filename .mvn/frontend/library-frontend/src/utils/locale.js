export function formatDate(value) {
  if (!value) return "Chưa có";
  const date = new Date(typeof value === "string" ? value.replace(" ", "T") : value);
  return Number.isNaN(date.getTime()) ? "Chưa có" : date.toLocaleDateString("vi-VN");
}
export function formatDateTime(value) {
  if (!value) return "Chưa có";
  const date = new Date(typeof value === "string" ? value.replace(" ", "T") : value);
  return Number.isNaN(date.getTime()) ? "Chưa có" : date.toLocaleString("vi-VN", {
    hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric",
  });
}
export function formatMoney(value, currency = "VND") {
  const amount = Number(value) || 0;
  try {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency }).format(amount);
  } catch {
    return `${new Intl.NumberFormat("vi-VN").format(amount)} ${currency}`;
  }
}
export const statusLabels = {
  ACTIVE: "Đang hoạt động", CHECKED_OUT: "Đang mượn", OVERDUE: "Quá hạn", RETURNED: "Đã trả",
  LOST: "Đã mất", DAMAGED: "Hư hỏng", PENDING: "Đang chờ", READY: "Sẵn sàng nhận",
  AVAILABLE: "Sẵn sàng nhận", FULFILLED: "Đã nhận", CANCELLED: "Đã hủy", EXPIRED: "Hết hạn",
  PARTIALLY_PAID: "Đã trả một phần", PAID: "Đã thanh toán", WAIVED: "Đã miễn",
};
export const statusLabel = (status) => statusLabels[status?.toUpperCase()] || "Chưa xác định";

export const fineTypeLabels = {
  OVERDUE: "Quá hạn", DAMAGE: "Làm hỏng sách", LOSS: "Làm mất sách", PROCESSING: "Phí xử lý",
};
export const fineTypeLabel = (type) => fineTypeLabels[type?.toUpperCase()] || "Loại khác";
export const fineStatusLabels = {
  PENDING: "Chưa thanh toán", PARTIALLY_PAID: "Đã trả một phần", PAID: "Đã thanh toán", WAIVED: "Đã miễn",
};
export const fineStatusLabel = (status) => fineStatusLabels[status?.toUpperCase()] || "Chưa xác định";
