import { useState } from "react";
import { AppBar, Avatar, Button, IconButton, Menu, MenuItem, Toolbar, Tooltip, Typography } from "@mui/material";
import { Menu as MenuIcon, Search } from "@mui/icons-material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { adminNavigationItems, navigationItems, secondaryItems } from "./NavigationItems";
import { isActive } from "./util";
import { useAuth } from "../../auth/AuthContext";

export default function Navbar({ handleDrawerToggle }) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [anchor, setAnchor] = useState(null);
  const go = (path) => { setAnchor(null); navigate(path); };
  const title = [...adminNavigationItems, ...navigationItems, ...secondaryItems]
    .find((item) => isActive(item.path, location))?.title || "Thư viện sách";
  return <AppBar position="fixed" sx={{
    width: { md: "calc(100% - 240px)" }, ml: { md: "240px" },
    bgcolor: "white", color: "text.primary", boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  }}>
    <Toolbar>
      <IconButton aria-label="Mở thanh điều hướng" onClick={handleDrawerToggle} sx={{ mr: 1, display: { md: "none" } }}><MenuIcon /></IconButton>
      <Typography variant="h6" noWrap sx={{ flexGrow: 1, fontWeight: 600 }}>{title}</Typography>
      <Tooltip title="Tìm sách"><IconButton aria-label="Tìm sách" component={Link} to="/books"><Search /></IconButton></Tooltip>
      {user ? <>
        <Tooltip title="Tài khoản"><IconButton aria-label="Mở menu tài khoản" aria-controls={anchor ? "account-menu" : undefined}
          aria-haspopup="true" aria-expanded={!!anchor} onClick={(event) => setAnchor(event.currentTarget)}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>{user.fullName?.charAt(0)}</Avatar>
        </IconButton></Tooltip>
        <Menu id="account-menu" anchorEl={anchor} open={!!anchor} onClose={() => setAnchor(null)}>
          <MenuItem disabled>{user.fullName}</MenuItem>
          <MenuItem onClick={() => go("/profile")}>Hồ sơ cá nhân</MenuItem>
          {isAdmin && <MenuItem onClick={() => go("/admin")}>Quản trị</MenuItem>}
          <MenuItem onClick={() => { setAnchor(null); logout(); navigate("/login", { replace: true }); }}>Đăng xuất</MenuItem>
        </Menu>
      </> : <Button component={Link} to="/login">Đăng nhập</Button>}
    </Toolbar>
  </AppBar>;
}
