import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../Context/AuthContext";
import { logoutUser } from '../../api';
import {
  Drawer, List, ListItem, ListItemText,
  AppBar, Toolbar, Typography, IconButton,
  CssBaseline, Divider, Box
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import LogoutIcon from '@mui/icons-material/Logout';
// import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WhatshotSharpIcon from '@mui/icons-material/WhatshotSharp';
import './Nav.css'; 


// const drawerWidth = 240;

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { logout,role } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const response = await logoutUser();
    // console.log(response);
    logout();
    navigate("/auth");
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navigated = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <div>
      <div className="drawer-header">
        <Typography variant="h6">Attendance System</Typography>
      </div>
      <Divider />
      <List>
        <ListItem  onClick={() => navigated('/home')}>
          <HomeIcon className="drawer-icon" />
          <ListItemText primary="Dashboard" />
        </ListItem>
       <ListItem 
  onClick={() => 
    role === "user" ? navigated('/attendance/${id}') : navigated('/attendance')
  }
>
  <DescriptionIcon className="drawer-icon" />
  <ListItemText primary="Attendance" />
</ListItem>

        <ListItem  onClick={() => navigated('/profile/:id')}>
          <AccountCircleIcon className="drawer-icon" />
          <ListItemText primary="Profile" />
        </ListItem>
        {(role === "admin" || role === "subadmin") && (
          <ListItem onClick={() => navigated('/fire')}>
            <WhatshotSharpIcon className="drawer-icon" />
            <ListItemText primary="Fire" />
          </ListItem>
        )}
        <ListItem onClick={handleLogout}>
          <LogoutIcon className="drawer-icon logout-btn" />
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Attendance System
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        classes={{ paper: 'drawer-paper' }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1 }}>
        <Toolbar />
        {/* Routed pages will render here */}
      </Box>
    </Box>
  );
};

export default Navbar;
