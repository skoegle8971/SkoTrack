import React from 'react';
import {
  AppBar, Toolbar, IconButton, Typography, Box, Badge, 
  useTheme, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText,
  Zoom
} from '@mui/material';
import {
  ArrowBackIosNew as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  LocationOn as LocationOnIcon,
  DevicesOther as DeviceIcon,
  FiberManualRecord as StatusIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const DeviceNavigation = ({ 
  currentDeviceLabel, 
  deviceOptions, 
  selectedDeviceIndex, 
  goToPreviousDevice, 
  goToNextDevice,
  deviceStatus,
  onDeviceSelect
}) => {
  const theme = useTheme();
  const [deviceMenuAnchor, setDeviceMenuAnchor] = React.useState(null);

  const handleDeviceMenuOpen = (event) => {
    setDeviceMenuAnchor(event.currentTarget);
  };

  const handleDeviceMenuClose = () => {
    setDeviceMenuAnchor(null);
  };

  const handleDeviceSelect = (index) => {
    onDeviceSelect(index);
    handleDeviceMenuClose();
  };

  // Get device status - online if location updated in the last hour
  const getStatusColor = (device) => {
    if (!device) return "error";
    
    // If we have device data and it was found
    if (deviceStatus && deviceStatus.found) {
      const lastUpdated = new Date(deviceStatus.lastUpdated);
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      
      return lastUpdated > oneHourAgo ? "success" : "warning";
    }
    return "error";
  };

  const statusColor = getStatusColor(deviceStatus);
  const deviceCount = deviceOptions.length;

  return (
    <AppBar 
      position="static" 
      sx={{ 
        borderRadius: '12px 12px 0 0', 
        mb: 0,
        // background: 'linear-gradient(145deg, #00796B, #00796A)' 
        background : `linear-gradient(145deg ,#fff,#fff)`
      }}
      elevation={3}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
  
  {/* Left Arrow - Stays at the Left End */}
  <IconButton 
    edge="start" 
    color="black" 
    onClick={goToPreviousDevice}
    disabled={deviceOptions.length <= 1}
    sx={{
      '&:hover': { backgroundColor: 'rgba(27, 2, 2, 0.1)' },
      transition: 'all 0.2s'
    }}
  >
    <ArrowBackIcon />
  </IconButton>

  {/* Centered Device Icon and Text */}
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
    <Badge
      overlap="circular"
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      badgeContent={
        <Zoom in={true}>
          <StatusIcon 
            sx={{ 
              color: statusColor === "success" ? 'success.main' : 
                     statusColor === "warning" ? 'warning.main' : 'error.main',
              fontSize: 12
            }}
          />
        </Zoom>
      }
    >
      <DeviceIcon sx={{ fontSize: 28, color: "blue" }} />
    </Badge>

    <Typography 
      variant="h6" 
      component="div" 
      noWrap
      sx={{ 
        fontWeight: 'medium',
        textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
        color: "black"
      }}
    >
      {currentDeviceLabel || "No Device"}
    </Typography>
  </Box>

  {/* Right Arrow - Stays at the Right End */}
  <IconButton 
    edge="end" 
    color="black" 
    onClick={goToNextDevice}
    disabled={deviceOptions.length <= 1}
    sx={{
      '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
      transition: 'all 0.2s'
    }}
  >
    <ArrowForwardIcon />
  </IconButton>

</Toolbar>

    </AppBar>
  );
};

export default DeviceNavigation;