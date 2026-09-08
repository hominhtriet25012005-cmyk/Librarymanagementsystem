import { Chip } from "@mui/material";
import { statusLabel } from "../../utils/locale";
export default function GetStatusChip({ status }) {
  const colors = { ACTIVE: "success", CHECKED_OUT: "success", OVERDUE: "error", PENDING: "warning", READY: "success", AVAILABLE: "success" };
  return <Chip label={statusLabel(status)} color={colors[status?.toUpperCase()] || "default"} size="small" />;
}
