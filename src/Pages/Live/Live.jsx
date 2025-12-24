import React, { useEffect, useState, useRef } from "react";
import "leaflet/dist/leaflet.css";
import Layout from "../../Layout/Layout";
import { useStore } from "../../Store/Store";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { connectToMQTT, disconnectMQTT } from "../../utils/Mqtt";
import {
  Box,
  useMediaQuery,
  useTheme,
  Container,
  Alert,
  Snackbar,
  Grid,
  Fade,
} from "@mui/material";

import Skeleton from "@mui/material/Skeleton";
// Import components
import DeviceNavigation from "./DeviceNavigation";
import MapView from "./MapView";
import DeviceStatusCard from "./DeviceStatusCard";
import GeofenceSettings from "./GeofenceSettings";
import ActionButtons from "./ActionButtons";
import NoDeviceMessage from "./NoDeviceMessage";

export default function Live() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const {
    addGeofencingDevice,
    deleteGeofencingDevice,
    getGeofencingData,
    getRealTimeData,
    updateGeofencingRadius,
    GetRegisterdDevices,
    deleteRegesteredDevice,
  } = useStore();

  const mapRef = useRef(null);
  const [selectedDeviceIndex, setSelectedDeviceIndex] = useState(0);
  const [deviceData, setDeviceData] = useState({});
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });
  const [deviceOptions, setDeviceOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const defaultLatLng = { lat: 20.5937, lng: 78.9629 }; // India's center coordinates
  const [sliderValue, setSliderValue] = useState(1);
  const [errorSnackbar, setErrorSnackbar] = useState({
    open: false,
    message: "",
  });
  const [successSnackbar, setSuccessSnackbar] = useState({
    open: false,
    message: "",
  });

  // Prevent browser reload (F5, Ctrl+R, Cmd+R, browser refresh, browser close, navigation)
  useEffect(() => {
    // Block all reloads and navigation away
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    // Block F5, Ctrl+R, Cmd+R
    const handleKeyDown = (e) => {
      if (
        e.key === "F5" ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r")
      ) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Reload is disabled on this page.");
        return false;
      }
    };
    // Block browser navigation buttons (back/forward)
    const handlePopState = (e) => {
      history.pushState(null, document.title, window.location.href);
      toast.warning("Navigation is disabled on this page.");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("popstate", handlePopState);
    // Push a new state to history to block back navigation initially
    history.pushState(null, document.title, window.location.href);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // Get the current selected device based on the index
  const selectedDevice = deviceOptions[selectedDeviceIndex]?.value || "";
  const currentDeviceLabel =
    deviceOptions[selectedDeviceIndex]?.label || "No Device";

  // Only fetch data for the current device
  const fetchDeviceData = async (device) => {
    if (!device) return;
    try {
      const apiData = await getRealTimeData(device);

      if (apiData?.time && apiData?.date) {
        const latitude = parseFloat(apiData.latitude);
        const longitude = parseFloat(apiData.longitude);

        setDeviceData((prev) => ({
          ...prev,
          [device]: {
            ...(prev[device] || {}),
            lat: latitude,
            lng: longitude,
            lastUpdated: `${apiData.date} ${apiData.time}`,
            found: true,
            Gpsstatus: apiData.GPS,
            main: apiData.main,
            battery: apiData.battery,
            hr: apiData.HR ?? "--",
            spo2: apiData.SPO2 ?? "--",
            bp: apiData.BP ?? "--",
            tp: apiData.temperature ?? "--",

            // 🏃 Activity
            sc: apiData.stepcount ?? 0,
            cal: apiData.calories ?? 0,
            distance: apiData.distance ?? 0,
          },
        }));
        setMapCenter({ lat: latitude, lng: longitude });
        return true;
      } else {
        setDeviceData((prev) => ({
          ...prev,
          [device]: {
            ...(prev[device] || {}),
            found: false,
          },
        }));
        return false;
      }
    } catch (error) {
      console.error("Error fetching device data:", error);
      setErrorSnackbar({
        open: true,
        message: "Failed to fetch device data",
      });
      return false;
    }
  };

  // Fetch geofencing data from API for current device only
  const fetchGeofencingData = async (device) => {
    try {
      const apiData = await getGeofencingData(device);

      if (apiData?._id) {
        setDeviceData((prev) => ({
          ...prev,
          [device]: {
            ...prev[device],
            geofencing: {
              lat: apiData.latitude,
              lng: apiData.longitude,
              main: apiData.main,
              battery: apiData.battery,
              radius: apiData.radius,
            },
          },
        }));

        // Set the slider to match the current radius
        if (apiData.radius && device === selectedDevice) {
          setSliderValue(apiData.radius);
        }
        return true;
      } else {
        setDeviceData((prev) => ({
          ...prev,
          [device]: {
            ...prev[device],
            geofencing: false,
          },
        }));

        return false;
      }
    } catch (error) {
      console.error("Error fetching geofencing data:", error);
      setErrorSnackbar({
        open: true,
        message: "Failed to fetch geofencing data",
      });

      return false;
    }
  };

  // Function to update radius via API
  const updateRadius = async (device, radius) => {
    try {
      await updateGeofencingRadius(device, radius);

      // Update local state to reflect the new radius
      setDeviceData((prev) => ({
        ...prev,
        [device]: {
          ...prev[device],
          geofencing: {
            ...prev[device].geofencing,
            radius: radius,
          },
        },
      }));

      setSuccessSnackbar({
        open: true,
        message: `Radius updated to ${radius}km successfully`,
      });
    } catch (error) {
      console.error("Error updating radius:", error);
      setErrorSnackbar({
        open: true,
        message: "Failed to update radius",
      });
    }
  };

  // Handle slider change
  const handleSliderChange = (e, newValue) => {
    setSliderValue(newValue);
  };

  // Apply radius change when slider is released
  const handleSliderCommit = (e, newValue) => {
    if (selectedDevice) {
      updateRadius(selectedDevice, newValue);
    }
  };

  // Navigation functions
  const goToNextDevice = () => {
    if (selectedDeviceIndex < deviceOptions.length - 1) {
      setSelectedDeviceIndex(selectedDeviceIndex + 1);
    } else {
      setSelectedDeviceIndex(0); // Loop back to the first device
    }
  };

  const goToPreviousDevice = () => {
    if (selectedDeviceIndex > 0) {
      setSelectedDeviceIndex(selectedDeviceIndex - 1);
    } else {
      setSelectedDeviceIndex(deviceOptions.length - 1); // Loop to the last device
    }
  };

  // Select a specific device by index
  const handleDeviceSelect = (index) => {
    setSelectedDeviceIndex(index);
  };

  // On mount, load devices, but do NOT fetch for all, only for the selected device
  useEffect(() => {
    const fetchDevices = async () => {
      setLoading(true);
      try {
        const response = await GetRegisterdDevices();
        if (response?.devices?.length > 0) {
          const options = response.devices.map((device) => ({
            value: device.deviceName,
            label: device.nickname || device.deviceName,
          }));
          setDeviceOptions(options);
          setSelectedDeviceIndex(0); // Start with the first device
          // Fetch data for first device only
          await fetchDeviceData(options[0].value);
          await fetchGeofencingData(options[0].value);
        } else {
          setErrorSnackbar({
            open: true,
            message:
              "You don't have any registered devices. Please register a device.",
          });
        }
      } catch (error) {
        console.error("Error fetching registered devices:", error);
        setErrorSnackbar({
          open: true,
          message: "Failed to fetch registered devices",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
    // eslint-disable-next-line
  }, [GetRegisterdDevices]);

  // When the selected device changes, fetch its data ONLY
  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceData(selectedDevice);
      fetchGeofencingData(selectedDevice);
    }
    // eslint-disable-next-line
  }, [selectedDevice]);

  // Polling (for selected device only)
  // useEffect(() => {
  //   if (!selectedDevice) return;
  //   const interval = setInterval(() => {
  //     fetchDeviceData(selectedDevice);
  //     fetchGeofencingData(selectedDevice);
  //   }, 30000); // 30s
  //   return () => clearInterval(interval);
  //   // eslint-disable-next-line
  // }, [selectedDevice]);

  useEffect(() => {
    if (!selectedDevice) return;

    const handleCallApi = async () => {
      // console.log(`⚡ 'call api' received for ${selectedDevice}`);
      await fetchDeviceData(selectedDevice);
      await fetchGeofencingData(selectedDevice);
    };

    connectToMQTT(selectedDevice, handleCallApi);

    return () => {
      disconnectMQTT();
    };
  }, [selectedDevice]);

  useEffect(() => {
    if (mapRef.current && mapCenter.lat && mapCenter.lng) {
      mapRef.current.setView([mapCenter.lat, mapCenter.lng], 15);
    } else if (mapRef.current) {
      mapRef.current.setView([defaultLatLng.lat, defaultLatLng.lng], 5);
    }
    // eslint-disable-next-line
  }, [mapCenter]);

  const handleShare = () => {
    const data = deviceData[selectedDevice];
    if (data?.found) {
      const googleMapsLink = `https://www.google.com/maps/place/${data.lat},${data.lng}`;
      window.open(googleMapsLink, "_blank");
    } else {
      setErrorSnackbar({
        open: true,
        message: "No location data available to share",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedDevice) return;

    try {
      await deleteRegesteredDevice(selectedDevice);
      const updatedOptions = deviceOptions.filter(
        (d) => d.value !== selectedDevice
      );
      setDeviceOptions(updatedOptions);

      // If we deleted the last device or current selected device
      if (updatedOptions.length === 0) {
        setSelectedDeviceIndex(-1);
      } else if (selectedDeviceIndex >= updatedOptions.length) {
        setSelectedDeviceIndex(updatedOptions.length - 1);
      }

      setSuccessSnackbar({
        open: true,
        message: "Device deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting device:", error);
      setErrorSnackbar({
        open: true,
        message: "Failed to delete device",
      });
    }
  };

  const handleAddGeofencing = async () => {
    if (!selectedDevice) return;

    const data = deviceData[selectedDevice];
    if (data?.found) {
      try {
        await addGeofencingDevice(selectedDevice, {
          lat: data.lat,
          lng: data.lng,
        });

        setSuccessSnackbar({
          open: true,
          message: "Geofencing coordinates added successfully",
        });

        setDeviceData((prev) => ({
          ...prev,
          [selectedDevice]: {
            ...prev[selectedDevice],
            geofencing: {
              lat: data.lat,
              lng: data.lng,
              radius: 1, // Default radius when creating a new geofence
            },
          },
        }));
        setSliderValue(1);
      } catch (error) {
        console.error("Error adding geofencing coordinates:", error);
        setErrorSnackbar({
          open: true,
          message: "Failed to add geofencing coordinates",
        });
      }
    } else {
      setErrorSnackbar({
        open: true,
        message: "Device location data is required to create a geofence",
      });
    }
  };

  const handleDeleteGeofencing = async () => {
    if (!selectedDevice) return;

    try {
      await deleteGeofencingDevice(selectedDevice);

      setSuccessSnackbar({
        open: true,
        message: "Geofencing coordinates deleted successfully",
      });

      setDeviceData((prev) => ({
        ...prev,
        [selectedDevice]: {
          ...prev[selectedDevice],
          geofencing: false,
        },
      }));
    } catch (error) {
      console.error("Error deleting geofencing coordinates:", error);
      setErrorSnackbar({
        open: true,
        message: "Failed to delete geofencing coordinates",
      });
    }
  };

  const refreshData = () => {
    if (selectedDevice) {
      toast.info("Refreshing device data...", { autoClose: 1000 });
      fetchDeviceData(selectedDevice).then((success) => {
        fetchGeofencingData(selectedDevice).then((geoSuccess) => {
          if (success || geoSuccess) {
            setSuccessSnackbar({
              open: true,
              message: "Device data refreshed successfully",
            });
          }
        });
      });
    }
  };

  // Format the date from 2025-03-13 04:46:15 to Mar 13, 04:46 AM
  const formatTimeDisplay = (dateTimeString) => {
    if (!dateTimeString) return "N/A";
    const [datePart, timePart] = dateTimeString.split(" ");
    if (!datePart || !timePart) return dateTimeString;

    const date = new Date(datePart + "T" + timePart);
    if (isNaN(date)) return dateTimeString;

    const options = {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return date.toLocaleString("en-US", options);
  };

  // Handlers for snackbar close
  const handleErrorSnackbarClose = () => {
    setErrorSnackbar({ open: false, message: "" });
  };

  const handleSuccessSnackbarClose = () => {
    setSuccessSnackbar({ open: false, message: "" });
  };

  if (loading) {
    return (
      <Layout title={"Vmarg - Live"}>
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              position: "relative",
            }}
          >
            {/* Navigation Skeleton */}
            <Box sx={{ p: 2, borderBottom: "1px solid rgba(0,0,0,0.12)" }}>
              <Grid container alignItems="center" spacing={2}>
                <Grid item>
                  <Skeleton variant="circular" width={40} height={40} />
                </Grid>
                <Grid item>
                  <Skeleton variant="text" width={100} height={40} />
                </Grid>
                <Grid item>
                  <Skeleton variant="circular" width={40} height={40} />
                </Grid>
                <Grid item xs>
                  <Skeleton variant="text" height={40} />
                </Grid>
              </Grid>
            </Box>
            {/* Main Content Skeleton */}
            <Grid container spacing={2} sx={{ p: 2 }}>
              {/* Map Area Skeleton */}
              <Grid item xs={12} md={8}>
                <Skeleton
                  variant="rectangular"
                  height={isMobile ? 300 : 500}
                  sx={{
                    borderRadius: 2,
                    aspectRatio: isMobile ? "1" : "2/1",
                  }}
                />
              </Grid>
              {/* Info Panel Skeleton */}
              <Grid item xs={12} md={4}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Skeleton
                    variant="rectangular"
                    height={40}
                    sx={{ borderRadius: 1 }}
                  />
                  <Skeleton
                    variant="rounded"
                    height={120}
                    sx={{ borderRadius: 2 }}
                  />
                  <Skeleton
                    variant="rounded"
                    height={200}
                    sx={{ borderRadius: 2 }}
                  />
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Skeleton variant="rounded" width="100%" height={40} />
                    <Skeleton variant="rounded" width="100%" height={40} />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Layout>
    );
  }
  return (
    <Layout title={"Vmarg - Live Tracking"}>
      <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
        <Fade in={!loading}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              position: "relative",
            }}
          >
            {/* Device Navigation Component */}
            <DeviceNavigation
              currentDeviceLabel={currentDeviceLabel}
              deviceOptions={deviceOptions}
              selectedDeviceIndex={selectedDeviceIndex}
              goToPreviousDevice={goToPreviousDevice}
              goToNextDevice={goToNextDevice}
              onDeviceSelect={handleDeviceSelect}
              deviceStatus={deviceData[selectedDevice]}
            />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                height: "100%",
                bgcolor: "#f5f5f5",
                overflow: "hidden",
                p: { xs: 1, md: 2 },
              }}
            >
              {/* Main Content Grid */}
              <Grid container spacing={2}>
                {/* Map Area - Full width on mobile, 2/3 on desktop */}
                <Grid item xs={12} md={8}>
                  <MapView
                    mapRef={mapRef}
                    mapCenter={mapCenter}
                    selectedDevice={selectedDevice}
                    deviceData={deviceData}
                    currentDeviceLabel={currentDeviceLabel}
                    isMobile={isMobile}
                    refreshData={refreshData}
                    handleShare={handleShare}
                    defaultLatLng={defaultLatLng}
                  />
                </Grid>
                {/* Device Info Area - Full width on mobile, 1/3 on desktop */}
                <Grid item xs={12} md={4}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                    }}
                  >
                    {/* Device Status Card */}
                    {selectedDevice && deviceData[selectedDevice] && (
                      <DeviceStatusCard
                        selectedDevice={selectedDevice}
                        deviceData={deviceData}
                        formatTimeDisplay={formatTimeDisplay}
                      />
                    )}
                    {/* Geofence Settings */}
                    {selectedDevice &&
                      deviceData[selectedDevice]?.geofencing && (
                        <GeofenceSettings
                          selectedDevice={selectedDevice}
                          deviceData={deviceData}
                          sliderValue={sliderValue}
                          handleSliderChange={handleSliderChange}
                          handleSliderCommit={handleSliderCommit}
                        />
                      )}
                    {/* Action Buttons */}
                    {selectedDevice && (
                      <ActionButtons
                        selectedDevice={selectedDevice}
                        deviceData={deviceData}
                        handleAddGeofencing={handleAddGeofencing}
                        handleDeleteGeofencing={handleDeleteGeofencing}
                        handleDelete={handleDelete}
                      />
                    )}
                    {/* Empty or no device message */}
                    {deviceOptions.length === 0 && <NoDeviceMessage />}
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Fade>
        {/* Success Snackbar */}
        <Snackbar
          open={successSnackbar.open}
          autoHideDuration={4000}
          onClose={handleSuccessSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleSuccessSnackbarClose}
            severity="success"
            variant="filled"
            sx={{ width: "100%" }}
          >
            {successSnackbar.message}
          </Alert>
        </Snackbar>
        {/* Error Snackbar */}
        <Snackbar
          open={errorSnackbar.open}
          autoHideDuration={4000}
          onClose={handleErrorSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleErrorSnackbarClose}
            severity="error"
            variant="filled"
            sx={{ width: "100%" }}
          >
            {errorSnackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Layout>
  );
}
