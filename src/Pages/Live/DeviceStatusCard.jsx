import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Divider,
  Chip,
  Grid,
  useTheme,
  Avatar,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Slider,
} from "@mui/material";
import {
  SignalCellular4Bar as SignalIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  Battery90 as BatteryIcon,
  ElectricBolt as MainIcon,
} from "@mui/icons-material";
import PhoneIcon from "@mui/icons-material/Phone";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import TimelineIcon from "@mui/icons-material/Timeline";
import BoltIcon from "@mui/icons-material/Bolt";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import FavoriteIcon from "@mui/icons-material/Favorite";
import MonitorHeartIcon from "@mui/icons-material/MonitorHeart";
import BloodtypeIcon from "@mui/icons-material/Bloodtype";
import ThermostatIcon from "@mui/icons-material/Thermostat";
import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import axios from "axios";

const DeviceStatusCard = ({
  selectedDevice,
  deviceData,
  formatTimeDisplay,
}) => {
  const theme = useTheme();
  const [phoneNumbers, setPhoneNumbers] = React.useState([]);
  const [phoneLoading, setPhoneLoading] = React.useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = React.useState(false);
  const [editingIndex, setEditingIndex] = React.useState(null);
  const [editingValue, setEditingValue] = React.useState("");
  // refresh rate state (single declaration)
  const [refreshRate, setRefreshRate] = React.useState("");
  const [refreshLoading, setRefreshLoading] = React.useState(false);
  const [refreshDialogOpen, setRefreshDialogOpen] = React.useState(false);
  const [editingRefreshRate, setEditingRefreshRate] = React.useState("");

  // helper to extract plain device identifier
  const getDeviceName = (d) => {
    if (!d) return "";
    return typeof d === "string" ? d : d.deviceName || d.value || "";
  };

  // fetch refresh rate when device changes
  React.useEffect(() => {
    if (!selectedDevice) return;
    const fetchRate = async () => {
      setRefreshLoading(true);
      try {
        const deviceName = getDeviceName(selectedDevice);
        const res = await axios.get(
          "https://vmarg.skoegle.co.in/api/predevice/refreshRate",
          {
            params: { TIN: deviceName },
            headers: { Accept: "application/json" },
          }
        );
        const data = res.data || {};
        // expect { RefreshRate: '200' } or similar
        const rate =
          data.RefreshRate ?? data.refreshRate ?? data?.RefreshRate0 ?? "";
        setRefreshRate(rate ? String(rate) : "");
      } catch (err) {
        console.error("fetchRefreshRate error", err);
        setRefreshRate("");
      } finally {
        setRefreshLoading(false);
      }
    };
    fetchRate();
  }, [selectedDevice]);

  // Fetch phone numbers on mount or when device changes
  React.useEffect(() => {
    if (!selectedDevice) return;
    const fetchPhones = async () => {
      setPhoneLoading(true);
      try {
        const deviceName = getDeviceName(selectedDevice);
        const res = await fetch(
          `https://vmarg.skoegle.co.in/api/getphonenumbers?deviceName=${encodeURIComponent(
            deviceName
          )}`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
          }
        );
        const data = await res.json();

        // Extract all PhoneNumber fields from response
        let phones = [];
        Object.keys(data).forEach((key) => {
          if (
            (key === "PhoneNumber" || /^PhoneNumber\d+$/.test(key)) &&
            data[key]
          ) {
            phones.push(String(data[key]));
          }
        });

        phones = [...new Set(phones)].filter((p) => p && p.trim());
        setPhoneNumbers(phones);
      } catch (err) {
        console.error("Error fetching phones:", err);
        setPhoneNumbers([]);
      } finally {
        setPhoneLoading(false);
      }
    };
    fetchPhones();
  }, [selectedDevice]);

  if (!selectedDevice || !deviceData[selectedDevice]) {
    return null;
  }

  // Calculate time difference from now
  const getTimeSinceUpdate = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    const [datePart, timePart] = dateTimeString.split(" ");
    if (!datePart || !timePart) return "N/A";

    const date = new Date(datePart + "T" + timePart);
    if (isNaN(date)) return "N/A";

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    }
  };

  const timeSinceUpdate = deviceData[selectedDevice]?.lastUpdated
    ? getTimeSinceUpdate(deviceData[selectedDevice]?.lastUpdated)
    : "N/A";

  const device = deviceData[selectedDevice];
  const batteryColor =
    device?.battery > 75
      ? "success.main"
      : device?.battery > 30
      ? "warning.main"
      : "error.main";

  const openPhoneDialog = () => {
    setPhoneDialogOpen(true);
  };

  const closePhoneDialog = () => {
    setPhoneDialogOpen(false);
    setEditingIndex(null);
    setEditingValue("");
  };

  const openRefreshDialog = () => {
    setEditingRefreshRate(refreshRate || "");
    setRefreshDialogOpen(true);
  };
  const closeRefreshDialog = () => {
    setRefreshDialogOpen(false);
    setEditingRefreshRate("");
  };

  const handleAddPhone = () => {
    setPhoneNumbers([...phoneNumbers, ""]);
    setEditingIndex(phoneNumbers.length);
    setEditingValue("");
  };

  const handleStartEdit = (idx) => {
    setEditingIndex(idx);
    setEditingValue(phoneNumbers[idx] || "");
  };

  // Save/update phone via API
  const handleSavePhone = async (idx) => {
    const value = (editingValue || "").trim();
    if (!value) {
      window.alert("Phone can't be empty");
      return;
    }
    if (!/^[0-9]{10}$/.test(value)) {
      window.alert("Enter a valid 10-digit phone number");
      return;
    }

    // build new local list (update the index)
    const updatedList = [...phoneNumbers];
    updatedList[idx] = value;

    try {
      setPhoneLoading(true);
      const deviceName = getDeviceName(selectedDevice);

      // build body: deviceName + PhoneNumber0, PhoneNumber1, ...
      const body = { deviceName };
      updatedList.forEach((p, i) => {
        if (p && String(p).trim()) body[`PhoneNumber${i}`] = String(p).trim();
      });

      await axios.patch(
        "https://vmarg.skoegle.co.in/api/updatephonenumbers",
        body,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      // refresh list from server
      const res = await axios.get(
        "https://vmarg.skoegle.co.in/api/getphonenumbers",
        { params: { deviceName } }
      );
      const data = res.data || {};
      let phones = [];
      Object.keys(data).forEach((key) => {
        if (
          (key === "PhoneNumber" || /^PhoneNumber\d+$/.test(key)) &&
          data[key]
        )
          phones.push(String(data[key]));
      });
      phones = [...new Set(phones)].filter((p) => p && p.trim());
      setPhoneNumbers(phones);
      setEditingIndex(null);
      setEditingValue("");
      window.alert("Phone list updated");
    } catch (err) {
      console.error("Error updating phone list:", err);
      window.alert("Failed to update phone list");
    } finally {
      setPhoneLoading(false);
    }
  };

  // Delete phone via API (query param deviceName + body { PhoneNumber })
  const handleDeletePhone = async (idx) => {
    const value = phoneNumbers[idx];
    if (!value) {
      setPhoneNumbers((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    if (!window.confirm(`Delete phone ${value}?`)) return;
    try {
      setPhoneLoading(true);
      const deviceName = getDeviceName(selectedDevice);
      const url = `https://vmarg.skoegle.co.in/api/deletephonenumbers?deviceName=${encodeURIComponent(
        deviceName
      )}`;
      await axios.patch(
        url,
        { PhoneNumber: value },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      // refresh list
      const res = await axios.get(
        "https://vmarg.skoegle.co.in/api/getphonenumbers",
        { params: { deviceName } }
      );
      const data = res.data || {};
      let phones = [];
      Object.keys(data).forEach((key) => {
        if (
          (key === "PhoneNumber" || /^PhoneNumber\d+$/.test(key)) &&
          data[key]
        )
          phones.push(String(data[key]));
      });
      phones = [...new Set(phones)].filter((p) => p && p.trim());
      setPhoneNumbers(phones);
      window.alert("Phone deleted");
    } catch (err) {
      console.error("Error deleting phone:", err);
      window.alert("Failed to delete phone");
    } finally {
      setPhoneLoading(false);
    }
  };

  // Refresh rate marks for slider
  const refreshRateMarks = [
    { value: 0, label: "20 ms" },
    { value: 1, label: "40 ms" },
    { value: 2, label: "60 ms" },
    { value: 3, label: "120 ms" },
  ];

  const refreshRateValues = [20, 40, 60, 120];

  // Convert refresh rate to slider index
  const getRateIndex = (rate) => {
    const idx = refreshRateValues.indexOf(parseInt(rate));
    return idx >= 0 ? idx : 0;
  };

  // Convert slider index to refresh rate
  const getRate = (idx) => refreshRateValues[idx];

  const handleSaveRefreshRate = async () => {
    const deviceName = getDeviceName(selectedDevice);
    const value = String(editingRefreshRate);
    if (!deviceName) return window.alert("Select device first");
    try {
      setRefreshLoading(true);
      await axios.patch(
        "https://vmarg.skoegle.co.in/api/predevice/refreshRate",
        {
          TIN: deviceName,
          RefreshRate: value,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      setRefreshRate(value);
      closeRefreshDialog();
      window.alert("Refresh rate updated");
    } catch (err) {
      console.error("update refresh rate error", err);
      window.alert("Failed to update refresh rate");
    } finally {
      setRefreshLoading(false);
    }
  };

  return (
    <>
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
          background: "linear-gradient(145deg, #ffffff, #f8f9fa)",
          overflow: "visible",
        }}
        elevation={1}
      >
        <CardContent sx={{ pb: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  mr: 1.5,
                }}
              >
                <SignalIcon />
              </Avatar>
              <Typography
                variant="h6"
                component="h2"
                sx={{
                  fontWeight: "bold",
                  color: theme.palette.text.primary,
                  fontSize: { xs: "1.1rem", md: "1.25rem" },
                }}
              >
                Device Status
              </Typography>
            </Box>

            {deviceData[selectedDevice]?.found && (
              <Chip
                icon={<AccessTimeIcon />}
                label={timeSinceUpdate}
                color={
                  timeSinceUpdate.includes("minute")
                    ? "success"
                    : timeSinceUpdate.includes("hour")
                    ? "warning"
                    : "error"
                }
                variant="outlined"
                size="small"
              />
            )}
          </Box>

          <Divider sx={{ mb: 2 }} />

          {deviceData[selectedDevice]?.found === false ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                py: 3,
                bgcolor: "error.light",
                borderRadius: 1,
              }}
            >
              <SignalIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography
                variant="body2"
                color="error"
                align="center"
                sx={{ fontWeight: "medium" }}
              >
                Device not reporting any location data.
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                align="center"
                sx={{ mt: 1 }}
              >
                The device may be offline or in an area with no signal.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ mb: 1.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block" }}
                  >
                    Latitude
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <LocationOnIcon
                      fontSize="small"
                      color="primary"
                      sx={{ mr: 0.5 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "medium" }}
                      noWrap
                    >
                      {deviceData[selectedDevice]?.lat?.toFixed(6) ??
                        "Loading..."}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={6}>
                <Box sx={{ mb: 1.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block" }}
                  >
                    Longitude
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <LocationOnIcon
                      fontSize="small"
                      color="primary"
                      sx={{ mr: 0.5 }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: "medium" }}
                      noWrap
                    >
                      {deviceData[selectedDevice]?.lng?.toFixed(6) ??
                        "Loading..."}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", display: "block" }}
                  >
                    Last Updated
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <AccessTimeIcon
                      fontSize="small"
                      color="primary"
                      sx={{ mr: 0.5 }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                      {formatTimeDisplay(
                        deviceData[selectedDevice]?.lastUpdated
                      ) ?? "Waiting..."}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              {deviceData[selectedDevice]?.Gpsstatus == "gps-found" ? (
                ""
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ mb: 1 }}>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block" }}
                    >
                      Devicestatus
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <AccessTimeIcon
                        fontSize="small"
                        color="primary"
                        sx={{ mr: 0.5 }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: "medium" }}>
                        {deviceData[selectedDevice]?.Gpsstatus}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {/* System Status Section */}
              <Grid item xs={12}>
                <Typography
                  variant="subtitle2"
                  mb={2}
                  color="text.secondary"
                  fontWeight="bold"
                >
                  System Status
                </Typography>

                <Grid container spacing={2}>
                  {/* Row 1: Main & Battery 
   <Grid item xs={6}>
     <Box display="flex" alignItems="center">
       <BoltIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
       <Typography variant="body2">Main: {deviceData[selectedDevice]?.reserve ?? 'N/A'}</Typography>
     </Box>
   </Grid>*/}
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <BatteryFullIcon
                        fontSize="small"
                        sx={{
                          mr: 1,
                          color:
                            Number(deviceData[selectedDevice]?.battery) < 20
                              ? "error.main"
                              : "success.main",
                        }}
                      />
                      <Typography variant="body2">
                        Battery: {deviceData[selectedDevice]?.battery ?? 0}%
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Row 2: hr (Heart Rate) & spo2 (SpO2) */}
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <FavoriteIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "#f44336" }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          Heart Rate
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {deviceData[selectedDevice]?.hr ?? "--"} bpm
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <MonitorHeartIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "#f44336" }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          SpO₂
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {deviceData[selectedDevice]?.spo2 ?? "--"}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Row 3: bp (Blood Pressure) & tp (Temperature) */}
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <BloodtypeIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "#f44336" }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          Blood Pressure
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {deviceData[selectedDevice]?.bp ?? "--"}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <ThermostatIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "#ff9800" }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          Temperature
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {deviceData[selectedDevice]?.tp ?? "--"}°C
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Row 4: sc (Steps) & cal (Calories) */}
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <DirectionsWalkIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "#ff9800" }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          Steps
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {deviceData[selectedDevice]?.sc ?? 0}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <LocalFireDepartmentIcon
                        fontSize="small"
                        sx={{ mr: 1, color: "#ff9800" }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          Calories
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {Number(deviceData[selectedDevice]?.cal).toFixed(2) ?? 0} kcal
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Row 5: dis (Distance) */}
                  <Grid item xs={12}>
                    <Box display="flex" alignItems="center">
                      <Box>
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          Distance
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {deviceData[selectedDevice]?.distance
                            ? (
                                Number(deviceData[selectedDevice].distance)
                              ).toFixed(1)
                            : "0.00"}{" "}
                          km
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Grid>

              {/* Phone Numbers Section */}
              <Grid item xs={12}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <PhoneIcon
                      fontSize="small"
                      sx={{ color: "primary.main" }}
                    />
                    <Typography variant="subtitle2" color="text.secondary">
                      Phone Numbers
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={openPhoneDialog}
                    startIcon={<EditIcon />}
                  >
                    Edit
                  </Button>
                </Box>
                <Box sx={{ mt: 1 }}>
                  {phoneLoading ? (
                    <Typography variant="body2" color="text.secondary">
                      Loading...
                    </Typography>
                  ) : phoneNumbers.length > 0 ? (
                    phoneNumbers.map((phone, idx) => (
                      <Chip
                        key={idx}
                        label={phone}
                        size="small"
                        sx={{ mr: 0.5, mb: 0.5 }}
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No phone configured
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Refresh Rate Section */}
              <Grid item xs={12}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <AutorenewIcon
                      fontSize="small"
                      sx={{ color: "primary.main" }}
                    />
                    <Typography variant="subtitle2" color="text.secondary">
                      Refresh Rate
                    </Typography>
                    <Typography variant="body2" sx={{ ml: 1, fontWeight: 600 }}>
                      {refreshLoading
                        ? "…"
                        : refreshRate
                        ? `${refreshRate} ms`
                        : "Not set"}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={openRefreshDialog}
                  >
                    Edit
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Phone Numbers Dialog */}
      <Dialog
        open={phoneDialogOpen}
        onClose={closePhoneDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <PhoneIcon />
            Phone Numbers
          </Box>
          <IconButton onClick={closePhoneDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <List>
            {phoneNumbers.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                No phone numbers added yet.
              </Typography>
            ) : (
              phoneNumbers.map((phone, idx) => (
                <ListItem key={idx} divider>
                  {editingIndex === idx ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <ListItemText primary={phone || "— empty —"} />
                  )}
                  <ListItemSecondaryAction>
                    {editingIndex === idx ? (
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleSavePhone(idx)}
                        title="Save"
                      >
                        <SaveIcon />
                      </IconButton>
                    ) : (
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={() => handleStartEdit(idx)}
                        title="Edit"
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => handleDeletePhone(idx)}
                      title="Delete"
                      sx={{ ml: 1 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          {phoneNumbers.length < 3 && (
            <Button startIcon={<AddIcon />} onClick={handleAddPhone}>
              Add Phone
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          <Button onClick={closePhoneDialog} color="inherit">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Refresh Rate Dialog */}
      <Dialog
        open={refreshDialogOpen}
        onClose={closeRefreshDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Refresh Rate — {getDeviceName(selectedDevice)}
        </DialogTitle>
        <DialogContent dividers>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 3,
              mt: 3,
              px: 2,
            }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              Select refresh rate (milliseconds)
            </Typography>
            <Slider
              value={getRateIndex(editingRefreshRate)}
              onChange={(e, newIdx) => setEditingRefreshRate(getRate(newIdx))}
              min={0}
              max={3}
              step={1}
              marks={refreshRateMarks}
              valueLabelDisplay="on"
              valueLabelFormat={(idx) => `${getRate(idx)} ms`}
              sx={{
                "& .MuiSlider-markLabel": {
                  fontSize: "0.85rem",
                  top: 24,
                },
                "& .MuiSlider-valueLabel": {
                  backgroundColor: "primary.main",
                },
              }}
            />
            <Box
              sx={{ display: "flex", justifyContent: "space-around", mt: 2 }}
            >
              {refreshRateValues.map((rate) => (
                <Chip
                  key={rate}
                  label={`${rate} ms`}
                  onClick={() => setEditingRefreshRate(rate)}
                  variant={editingRefreshRate === rate ? "filled" : "outlined"}
                  color={editingRefreshRate === rate ? "primary" : "default"}
                  sx={{ cursor: "pointer" }}
                />
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRefreshDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSaveRefreshRate}
            variant="contained"
            disabled={refreshLoading}
          >
            {refreshLoading ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeviceStatusCard;
