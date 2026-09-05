import { AppBar, Avatar, Box, IconButton, Toolbar, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { navigationItems } from './NavigationItems';
import { isActive } from './util';
import { useLocation } from 'react-router-dom';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ContrastIcon from '@mui/icons-material/Contrast';

const drawerWidth = 280;
const user = {
    fullName: "John Doe",
    profilePicture: "https://example.com/profile.jpg",
};
const Navbar = ({ handleDrawerToggle }) => {
    const location = useLocation();
    return (
        <AppBar position='fixed' sx={{
            width: { md: `calc(100% - ${drawerWidth}px)` },
            ml: { md: `${drawerWidth}px` },
            bgcolor: "white",
            color: "text.primary",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}>

            <Toolbar>
                <IconButton
                    color="inherit"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2, display: { md: "none" } }}
                >
                    <MenuIcon />
                </IconButton>

                <Typography
                    variant="h6"
                    noWrap
                    component="div"
                    sx={{ flexGrow: 1, fontWeight: 600 }}
                >
                    {navigationItems.find((item) => isActive(item.path, location))?.title ||
                        "Dashboard"}
                </Typography>

                <Tooltip title="Search">
                    <IconButton>
                        <SearchIcon />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Notifications">
                    <IconButton><NotificationsIcon /></IconButton>
                </Tooltip>

                <Box sx={{ ml: 2 }}>
                    <ContrastIcon />
                </Box>

                <Tooltip title="Account">
                    <IconButton sx={{ ml: 1 }}>
                        <Avatar src={user?.profilePicture} sx={{ width: 36, height: 36 }}>
                            {user?.fullName?.charAt(0)}
                        </Avatar>
                    </IconButton>
                </Tooltip>

            </Toolbar>

        </AppBar>
    )
}

export default Navbar
