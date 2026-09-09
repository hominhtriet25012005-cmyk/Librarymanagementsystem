import { Box, Drawer } from "@mui/material";
import SidebarDrawer from "./SidebarDrawer";

const drawerWidth = "240px";
const UserSidebar = ({ mobileOpen, onClose }) => {
    return (
        <Box
            component="nav"
            sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        >
            {/* Desktop drawer */}

            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onClose}
                ModalProps={{ keepMounted: true }}
                sx={{
                    display: { xs: "block", md: "none" },
                    "& .MuiDrawer-paper": {
                        boxSizing: "border-box",
                        width: drawerWidth,
                        border: "none",
                        overflow: "hidden",
                    },
                }}
            >
                <SidebarDrawer onNavigate={onClose} />
            </Drawer>

            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: "none", md: "block" },
                    "& .MuiDrawer-paper": {
                        boxSizing: "border-box",
                        width: drawerWidth,
                        border: "none",
                        overflow: "hidden",
                    },
                }}
                open
            >

                <SidebarDrawer />
            </Drawer>
        </Box>
    );
};

export default UserSidebar
