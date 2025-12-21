import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  InputAdornment,
  Tooltip,
  CircularProgress,
  LinearProgress,
  Fade
} from "@mui/material";
import {
  DevicesOther as DeviceIcon,
  QrCode as QrCodeIcon,
  Edit as EditIcon,
  SaveAlt as SaveIcon,
  Help as HelpIcon
} from "@mui/icons-material";

const ManualEntryForm = ({ onSubmit, loadingStep, isActive }) => {
  const [deviceName, setDeviceName] = useState("");
  const [deviceCode, setDeviceCode] = useState("");
  const [nickname, setNickname] = useState(""); // Added nickname state
  const [errors, setErrors] = useState({});

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'deviceName') setDeviceName(value);
    if (name === 'deviceCode') setDeviceCode(value);
    if (name === 'nickname') setNickname(value); // Handle nickname input

    // Clear error when user types
    if (errors[name]) {
      setErrors({...errors, [name]: null});
    }
  };

  // Validate form fields
  const validateForm = () => {
    let tempErrors = {};
    let isValid = true;

    if (!deviceName.trim()) {
      tempErrors.deviceName = "Device name is required";
      isValid = false;
    }

    if (!deviceCode.trim()) {
      tempErrors.deviceCode = "Device code is required";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      const formData = {
        deviceName: deviceName.trim(),
        deviceCode: deviceCode.trim(),
        nickname: nickname.trim() // Send nickname as is, even if it's empty
      };
      
      console.log('Submitting form data:', formData);
      await onSubmit(formData); // Ensure this calls the registerDevice function
    }
  };

  return (
    <Fade in={isActive}>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Typography variant="h6" gutterBottom>
          Enter Device Details
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please enter the device information exactly as it appears on your device or packaging
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              name="deviceName"
              label="Device Name"
              value={deviceName}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              required
              error={!!errors.deviceName}
              helperText={errors.deviceName}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <DeviceIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: deviceName && (
                  <InputAdornment position="end">
                    <Tooltip title="Device name is typically found on the label">
                      <HelpIcon color="action" fontSize="small" />
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              name="deviceCode"
              label="Device Code"
              value={deviceCode}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              required
              error={!!errors.deviceCode}
              helperText={errors.deviceCode}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <QrCodeIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: deviceCode && (
                  <InputAdornment position="end">
                    <Tooltip title="Device code is a unique identifier printed on your device">
                      <HelpIcon color="action" fontSize="small" />
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              name="nickname"
              label="Nickname (Optional)"
              value={nickname}
              onChange={handleInputChange}
              fullWidth
              variant="outlined"
              error={!!errors.nickname}
              helperText={errors.nickname}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EditIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: nickname && (
                  <InputAdornment position="end">
                    <Tooltip title="You can give your device a nickname">
                      <HelpIcon color="action" fontSize="small" />
                    </Tooltip>
                  </InputAdornment>
                )
              }}
            />
          </Grid>
        </Grid>
        
        {loadingStep && (
          <Box sx={{ mt: 3 }}>
            <LinearProgress color="primary" />
            <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
              {loadingStep}
            </Typography>
          </Box>
        )}
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            disabled={loadingStep !== null || !deviceName || !deviceCode} // Disable if loading or fields are empty
            startIcon={loadingStep ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            sx={{ 
              px: 4, 
              py: 1.5,
              borderRadius: 8,
              bgcolor: '#00796b',
              '&:hover': { bgcolor: '#00635a' }
            }}
          >
            {loadingStep ? "Registering..." : "Register Device"}
          </Button>
        </Box>
      </Box>
    </Fade>
  );
};

export default ManualEntryForm;