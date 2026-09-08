import { Avatar, Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Typography } from "@mui/material";
import { AdminPanelSettings, Login, Logout, MenuBook } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { navigationItems, secondaryItems } from "./NavigationItems";
import { isActive } from "./util";
import { useAuth } from "../../auth/AuthContext";

export default function SidebarDrawer({ onNavigate }) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const go = (path) => { navigate(path); onNavigate?.(); };
  const items = user ? [...navigationItems, ...secondaryItems] : navigationItems.filter((item) => item.path === "/books");
  if (isAdmin) items.push({ title: "Quản trị", path: "/admin", icon: <AdminPanelSettings /> });
  return <Box sx={{ minHeight: "100%", background: "linear-gradient(180deg,#1e293b,#0f172a)", color: "white", p: 2 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 2 }}>
      <Avatar sx={{ bgcolor: "#4f46e5" }}><MenuBook /></Avatar>
      <div><Typography sx={{ fontWeight: 700 }}>Thư viện sách</Typography><Typography variant="caption">Cùng bạn mở trang mới</Typography></div>
    </Box>
    <List aria-label="Điều hướng chính">
      {items.map((item) => <ListItemButton key={item.path} selected={isActive(item.path, location)} onClick={() => go(item.path)}
        sx={{ borderRadius: 2, mb: 0.5, "&.Mui-selected": { bgcolor: "#3730a3" }, "&:hover": { bgcolor: "#334155" } }}>
        <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>{item.icon}</ListItemIcon><ListItemText primary={item.title} />
      </ListItemButton>)}
    </List>
    <Divider sx={{ borderColor: "#334155", my: 2 }} />
    {user && <Typography variant="body2" sx={{ px: 2, mb: 1, overflowWrap: "anywhere" }}>{user.fullName}</Typography>}
    <ListItemButton onClick={() => { if (user) logout(); go("/login"); }} sx={{ borderRadius: 2 }}>
      <ListItemIcon sx={{ color: "inherit", minWidth: 40 }}>{user ? <Logout /> : <Login />}</ListItemIcon>
      <ListItemText primary={user ? "Đăng xuất" : "Đăng nhập"} />
    </ListItemButton>
    <Typography variant="caption" sx={{ display: "block", p: 2, color: "#94a3b8" }}>© {new Date().getFullYear()} Thư viện sách</Typography>
  </Box>;
}
