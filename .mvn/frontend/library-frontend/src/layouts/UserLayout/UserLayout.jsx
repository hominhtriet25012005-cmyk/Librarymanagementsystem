import { Box, Toolbar } from "@mui/material";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import UserSidebar from "./UserSidebar";

const drawerWidth = 240;
const UserLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Mỗi trang phải bắt đầu từ đầu; nếu giữ vị trí cuộn cũ, tiêu đề sẽ nằm sau thanh đầu trang.
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  return (
    <Box sx={{ display: "flex",
        minHeight: "100vh", bgcolor:"white"
     }}>
      <Navbar handleDrawerToggle={() => setMobileOpen((open) => !open)} />

      {/* user sidebar */}
      <UserSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          p: 2,
        }}
      >
        <Toolbar/>
        <Box>
          <Outlet/>
        </Box>
      </Box>
    </Box>
  );
};

export default UserLayout
