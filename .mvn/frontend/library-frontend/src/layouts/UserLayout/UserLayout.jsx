import { Box, Toolbar } from "@mui/material";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import UserSidebar from "./UserSidebar";

const drawerWidth = 240;
const UserLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

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
