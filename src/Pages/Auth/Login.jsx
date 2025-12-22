import { useState, useEffect } from "react";
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
  Grow,
  Slide,
  Fade,
  Divider,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Link as MuiLink,
  Card,
  CardContent,
  useTheme,
  useMediaQuery,
  OutlinedInput,
  FormControl,
  InputLabel,
  FormHelperText,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { useStore } from "../../Store/Store";
import Layout from "../../Layout/Layout";
import { toast } from "react-toastify";
import Checkbox from "@mui/material/Checkbox";
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  VpnKey as VpnKeyIcon,
  Login as LoginIcon,
  Security as SecurityIcon,
  AccountCircle as AccountCircleIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import axios from "axios";

const bypassOtpEmails = {
  // "skoegletesting@gmail.com": true,
  "mail@manojgowda.in": true,
  "harsha@tech.skoegle.com": true,
  "krishna@mail.skoegle.com": true,
  "dominate@skoegle.com":true,
};

export default function Login() {
  const { login, setisAdmin, setisLogin, skipotp, verifyOtp, sendOtpByEmail } =
    useStore();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  const skoegleToken = urlParams.get("token");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    otp: "",
    devicedetails: "Not Available",
    loginTime: "",
    clientInfo: {},
  });
  const [getotp, setOtp] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("login"); // 'login' or 'otp'
  const [resendCount, setResendCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [clientInfoLoaded, setClientInfoLoaded] = useState(false);
  const [isChecked, setIsChecked] = useState(true);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(cooldown - 1);
      }, 1000);
    } else {
      setIsResendDisabled(false);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const getFormattedDateTime = () => {
    const now = new Date();
    return now.toISOString().replace("T", " ").substr(0, 19);
  };

  const getClientTimeZone = () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset = new Date().getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offset / 60));
    const offsetMinutes = Math.abs(offset % 60);
    const offsetSign = offset > 0 ? "-" : "+";
    return `${timeZone} (UTC${offsetSign}${offsetHours
      .toString()
      .padStart(2, "0")}:${offsetMinutes.toString().padStart(2, "0")})`;
  };

  const getScreenInfo = () => {
    return {
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      screenOrientation: screen.orientation?.type || "N/A",
    };
  };

  const getNetworkInfo = async () => {
    let connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    return connection
      ? {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        }
      : "Network info not available";
  };

  const getBrowserInfo = () => {
    const browserData = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      languages: navigator.languages,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      vendor: navigator.vendor,
      maxTouchPoints: navigator.maxTouchPoints,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory || "N/A",
    };
    return browserData;
  };

  const handleGithubLogin = () => {
    setLoading(true);
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${
      import.meta.env.VITE_GITHUB_CLIENT_ID
    }&redirect_uri=${import.meta.env.VITE_GITHUB_REDIRECT_URI}&scope=user`;
  };


  const handleSkoegleLogin = () => {
    setLoading(true);
      window.location.href = `https://skoegle.com/auth/signin?redirecting_auth_url=https://vmarg.skoegle.com/login`;
  };  



  useEffect(() => {
    if (code) {
      setLoading(true);
      const fetchGitHubToken = async () => {
        try {
          const response = await axios.post(
            "https://vmarg.skoegle.co.in/api/auth/user/github",
            {
              devicedetails: {
                devicedetails: formData.devicedetails,
                loginTime: formData.loginTime,
                clientInfo: formData.clientInfo,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${code}`,
              },
            }
          );

          const data = response.data;
          console.log("GitHub OAuth response:", data);

          if (data?.valid) {
            setisLogin(data.valid);
            setisAdmin(data.isAdmin);

            localStorage.setItem("isAdmin", data.isAdmin);
            localStorage.setItem("isLogin", data.valid);
            localStorage.setItem("token", data.token);
            localStorage.setItem("custommerid", data.custommerId);
            localStorage.setItem("lastLoginTime", new Date().toISOString());
            localStorage.setItem(
              "clientInfo",
              JSON.stringify(formData.clientInfo || {})
            );
            sessionStorage.setItem("termsAccepted", true);

            toast.success("GitHub login successful!");

            setTimeout(() => {
              window.location.reload();
              navigate("/");
            }, 2000);
          } else {
            toast.error(
              data?.message || "GitHub login failed. Please try again."
            );
          }
        } catch (error) {
          console.error("GitHub Login Error:", error);
          toast.error("An error occurred during GitHub login.");
        } finally {
          setTimeout(() => {
          setLoading(false);
          }, 2000);
        }
      };

      fetchGitHubToken();
    }
  }, [code]);

   useEffect(()=>{
 if (skoegleToken) {
      setLoading(true);
      const fetchGitHubToken = async () => {
        try {
          const response = await axios.post(
            "https://vmarg.skoegle.co.in/api/auth/user/skoegle",
            {
              devicedetails: {
                devicedetails: formData.devicedetails,
                loginTime: formData.loginTime,
                clientInfo: formData.clientInfo,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${skoegleToken}`,
              },
            }
          );

          const data = response.data;
          console.log("GitHub OAuth response:", data);

          if (data?.valid) {
            setisLogin(data.valid);
            setisAdmin(data.isAdmin);

            localStorage.setItem("isAdmin", data.isAdmin);
            localStorage.setItem("isLogin", data.valid);
            localStorage.setItem("token", data.token);
            localStorage.setItem("custommerid", data.custommerId);
            localStorage.setItem("lastLoginTime", new Date().toISOString());
            localStorage.setItem(
              "clientInfo",
              JSON.stringify(formData.clientInfo || {})
            );
            sessionStorage.setItem("termsAccepted", true);

            toast.success("Skoegle login successful!");

            setTimeout(() => {
              window.location.reload();
              navigate("/");
            }, 2000);
          } else {
            toast.error(
              data?.message || "GitHub login failed. Please try again."
            );
          }
        } catch (error) {
          console.error("GitHub Login Error:", error);
          toast.error("An error occurred during GitHub login.");
        } finally {
          setLoading(false);
        }
      };

      fetchGitHubToken();
    }
   },[skoegleToken])



  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        console.log(
          "✅ Google Login Success:",
          tokenResponse.access_token,
          formData
        );
        const response = await axios.post(
          "https://vmarg.skoegle.co.in/api/auth/user/google",
          {
            devicedetails: {
              devicedetails: formData.devicedetails,
              loginTime: formData.loginTime,
              clientInfo: formData.clientInfo,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        const data = response.data;

        if (data?.valid) {
          // ✅ Store data in localStorage
          setisLogin(data.valid);
          setisAdmin(data.isAdmin);

          localStorage.setItem("isAdmin", data.isAdmin);
          localStorage.setItem("isLogin", data.valid);
          localStorage.setItem("token", data.token);
          localStorage.setItem("custommerid", data.custommerId);
          localStorage.setItem("lastLoginTime", new Date().toISOString());
          localStorage.setItem(
            "clientInfo",
            JSON.stringify(formData.clientInfo || {})
          );
          sessionStorage.setItem("termsAccepted", true);

          toast.success("Google login successful!");

          setTimeout(() => {
            window.location.reload();
            navigate("/");
          }, 2000);
        } else {
          toast.error(
            data?.message || "Google login failed. Please try again."
          );
        }
      } catch (error) {
        // console.error("Google Login Error:", error);
        toast.error("An error occurred during Google login.");
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error("❌ Google Login Failed:", error);
      toast.error("Google login failed. Please try again.");
    },
  });

  useEffect(() => {
    const getDeviceDetails = async () => {
      try {
        // Get battery information
        const battery = await navigator.getBattery();
        const batteryInfo = {
          level: (battery.level * 100).toFixed(0),
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
        };

        // Get network information
        const networkInfo = await getNetworkInfo();

        // Get screen information
        const screenInfo = getScreenInfo();

        // Get browser information
        const browserInfo = getBrowserInfo();

        // Compile client information
        const clientInfo = {
          loginDateTime: getFormattedDateTime(),
          timeZone: getClientTimeZone(),
          battery: batteryInfo,
          network: networkInfo,
          screen: screenInfo,
          browser: browserInfo,
          platform: {
            os: navigator.platform,
            vendor: navigator.vendor,
            userAgent: navigator.userAgent,
          },
        };

        // Create a detailed device information string
        const devicedetails = `Login Time (UTC): ${clientInfo.loginDateTime}
          TimeZone: ${clientInfo.timeZone}
          Device: ${clientInfo.platform.os}
          Browser: ${clientInfo.browser.vendor}
          Screen: ${clientInfo.screen.screenWidth}x${
          clientInfo.screen.screenHeight
        }
          Battery: ${clientInfo.battery.level}% (${
          clientInfo.battery.charging ? "Charging" : "Not Charging"
        })
          Network: ${
            typeof clientInfo.network === "object"
              ? clientInfo.network.effectiveType
              : "N/A"
          }
          Language: ${clientInfo.browser.language}`.trim();

        setFormData((prevState) => ({
          ...prevState,
          devicedetails,
          loginTime: clientInfo.loginDateTime,
          clientInfo,
        }));

        setClientInfoLoaded(true);
      } catch (error) {
        // console.error("Error fetching device details: ", error);
        const basicInfo = {
          loginDateTime: getFormattedDateTime(),
          timeZone: getClientTimeZone(),
          platform: navigator.platform,
          userAgent: navigator.userAgent,
        };

        setFormData((prevState) => ({
          ...prevState,
          devicedetails: `Login Time: ${basicInfo.loginDateTime}, Device: ${basicInfo.platform}`,
          loginTime: basicInfo.loginDateTime,
          clientInfo: basicInfo,
        }));

        setClientInfoLoaded(true);
        toast.error("Error fetching complete device details");
      }
    };

    getDeviceDetails();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error when typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!formData.email) tempErrors.email = "Email is required";
    else if (
      !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(formData.email)
    ) {
      tempErrors.email = "Please enter a valid email address";
    }

    if (step === "login" && !formData.password)
      tempErrors.password = "Password is required";
    else if (step === "login" && formData.password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters";
    }

    if (step === "otp" && !formData.otp) tempErrors.otp = "OTP is required";

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  // New function to check if user exists
  const checkUserExists = async () => {
    try {
      const credentials = btoa(`${formData.email}:${formData.password}`);
      const response = await fetch(
        "https://vmarg.skoegle.co.in/api/auth/user/check",
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error checking user:", error);
      return { valid: false, message: "Error checking user credentials" };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      setLoading(true);
      try {
        if (skipotp || bypassOtpEmails[formData.email]) {
          // Directly login without OTP
          const loginData = {
            ...formData,
            loginTimestamp: getFormattedDateTime(),
          };

          const response = await login(loginData);

          if (response?.valid) {
            setisLogin(response.valid);
            setisAdmin(response.isAdmin);
            localStorage.setItem("isAdmin", response.isAdmin);
            localStorage.setItem("isLogin", response.valid);
            localStorage.setItem("token", response.token);
            localStorage.setItem("custommerid", response.custommerId);
            localStorage.setItem("lastLoginTime", loginData.loginTimestamp);
            localStorage.setItem(
              "clientInfo",
              JSON.stringify(formData.clientInfo)
            );
            sessionStorage.setItem("termsAccepted", true);

            toast.success("Welcome back!");
            setTimeout(() => {
              window.location.reload();
              navigate("/");
            }, 2000);
          } else {
            toast.error(
              "User may not exist or the password is incorrect. Please check your credentials or create an account."
            );
          }
        } else {
          if (step === "login") {
            // First check if user exists before sending OTP
            const userCheckResult = await checkUserExists();

            if (userCheckResult.valid) {
              // User exists and password is correct, proceed with OTP
              await sendOtpByEmail(formData.email, setOtp);
              toast.success("OTP sent to your email");
              setStep("otp");
            } else {
              // User doesn't exist or password is incorrect
              toast.error(
                userCheckResult.message ||
                  "User may not exist or the password is incorrect. Please check your credentials."
              );
            }
          } else if (step === "otp") {
            // Verify OTP
            const isValidOtp = verifyOtp(formData.otp, formData.email, getotp);

            if (isValidOtp?.valid) {
              const loginData = {
                ...formData,
                loginTimestamp: getFormattedDateTime(),
              };
              const response = await login(loginData);

              if (response?.valid) {
                setisLogin(response.valid);
                setisAdmin(response.isAdmin);
                localStorage.setItem("isAdmin", response.isAdmin);
                localStorage.setItem("isLogin", response.valid);
                localStorage.setItem("token", response.token);
                localStorage.setItem("custommerid", response.custommerId);
                localStorage.setItem("lastLoginTime", loginData.loginTimestamp);
                localStorage.setItem(
                  "clientInfo",
                  JSON.stringify(formData.clientInfo)
                );
                sessionStorage.setItem("termsAccepted", true);

                toast.success("Welcome back!");
                setTimeout(() => {
                  window.location.reload();
                  navigate("/");
                }, 2000);
              } else {
                toast.error(
                  "User may not exist or the password is incorrect. Please check your credentials or create an account."
                );
                setTimeout(() => {
                  window.location.reload();
                }, 3000);
              }
            } else {
              toast.error(
                isValidOtp.message || "Invalid OTP. Please try again."
              );
            }
          }
        }
      } catch (error) {
        toast.error("An error occurred. Please try again.");
        console.error("Login error:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   if (validate()) {
  //     setLoading(true);
  //     try {
  //       const loginData = {
  //         ...formData,
  //         loginTimestamp: getFormattedDateTime(),
  //       };

  //       const response = await login(loginData);

  //       if (response?.valid) {
  //         setisLogin(response.valid);
  //         setisAdmin(response.isAdmin);

  //         // Save to localStorage
  //         localStorage.setItem("isAdmin", response.isAdmin);
  //         localStorage.setItem("isLogin", response.valid);
  //         localStorage.setItem("token", response.token);
  //         localStorage.setItem("custommerid", response.custommerId);
  //         localStorage.setItem("lastLoginTime", loginData.loginTimestamp);
  //         localStorage.setItem(
  //           "clientInfo",
  //           JSON.stringify(formData.clientInfo)
  //         );
  //         sessionStorage.setItem("termsAccepted", true);

  //         toast.success("Welcome back!");
  //         setTimeout(() => {
  //           window.location.reload();
  //           navigate("/");
  //         }, 2000);
  //       } else {
  //         toast.error(
  //           "User may not exist or the password is incorrect. Please check your credentials or create an account."
  //         );
  //       }
  //     } catch (error) {
  //       toast.error("An error occurred. Please try again.");
  //       console.error("Login error:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }
  // };

  const handleResendOtp = async () => {
    if (resendCount < 5) {
      try {
        setResendLoading(true);
        // Verify user credentials again before resending OTP
        const userCheckResult = await checkUserExists();

        if (userCheckResult.valid) {
          await sendOtpByEmail(formData.email, setOtp);
          toast.success("OTP resent to your email");
          setResendCount(resendCount + 1);
          setIsResendDisabled(true);
          setCooldown(60);
        } else {
          toast.error(
            "Failed to verify credentials. Please go back and try again."
          );
        }
      } catch (error) {
        toast.error("Failed to resend OTP. Please try again.");
      } finally {
        setResendLoading(false);
      }
    } else {
      toast.error(
        "You have reached the maximum resend attempts. Please try again later."
      );
    }
  };

  // Handle go back to login from OTP screen
  const handleGoBack = () => {
    setStep("login");
    setFormData({ ...formData, otp: "" });
    setErrors({ ...errors, otp: null });
  };

  return (
    <Layout title="Vmarg - Login">
      <Container maxWidth="md" sx={{ py: { xs: 2, md: 8 } }}>
        <Fade in={clientInfoLoaded} timeout={600}>
          <Paper
            elevation={5}
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: "background.paper",
            }}
          >
            <Grid container>
              {/* Left Panel - Hidden on mobile */}
              {!isMobile && (
                <Grid
                  item
                  md={5}
                  sx={{
                    background: "linear-gradient(to bottom, #00796b, #004d40)",
                    p: 4,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    color: "white",
                  }}
                >
                  <Box sx={{ mb: 4 }}>
                    <SecurityIcon sx={{ fontSize: 60, mb: 2, opacity: 0.8 }} />
                    <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
                      Welcome Back
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
                      Log in to access your Sko-Track account and track your
                      devices securely.
                    </Typography>
                    <Box sx={{ mt: 4 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ opacity: 0.8, fontSize: "0.85rem" }}
                      >
                        Secure login with two-factor authentication
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        sx={{ opacity: 0.8, fontSize: "0.85rem" }}
                      >
                        End-to-end encrypted connection
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ position: "absolute", bottom: 20, opacity: 0.7 }}>
                    <Typography variant="caption">
                      © {new Date().getFullYear()} Sko-Track by Skoegle
                    </Typography>
                  </Box>
                </Grid>
              )}

              {/* Right Panel - Login Form */}
              <Grid
                item
                xs={12}
                md={7}
                sx={{
                  p: { xs: 2, sm: 4 },
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box sx={{ mb: 4, textAlign: isMobile ? "center" : "left" }}>
                  {isMobile && (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", mb: 2 }}
                    >
                      <SecurityIcon color="primary" sx={{ fontSize: 40 }} />
                    </Box>
                  )}
                  <Typography
                    variant="h4"
                    fontWeight="bold"
                    color="primary"
                    sx={{ mb: 1 }}
                  >
                    {step === "login" ? "Sign In" : "Verify OTP"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step === "login"
                      ? "Enter your credentials to access your account"
                      : `We've sent a verification code to ${formData.email}`}
                  </Typography>
                </Box>

                {/* Login Steps Indicator */}
                <Stepper
                  activeStep={step === "login" ? 0 : 1}
                  alternativeLabel
                  sx={{ mb: 4 }}
                >
                  <Step>
                    <StepLabel>Credentials</StepLabel>
                  </Step>
                  <Step>
                    <StepLabel>Verification</StepLabel>
                  </Step>
                </Stepper>

                {/* Form Content */}
                <Box
                  component="form"
                  onSubmit={handleSubmit}
                  sx={{ width: "100%" }}
                >
                  {step === "login" ? (
                    <Fade in={step === "login"} timeout={500}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                        }}
                      >
                        {/* Email */}
                        <FormControl
                          variant="outlined"
                          fullWidth
                          error={!!errors.email}
                        >
                          <InputLabel htmlFor="email">Email Address</InputLabel>
                          <OutlinedInput
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            startAdornment={
                              <InputAdornment position="start">
                                <EmailIcon color="action" />
                              </InputAdornment>
                            }
                            label="Email Address"
                          />
                          {errors.email && (
                            <FormHelperText>{errors.email}</FormHelperText>
                          )}
                        </FormControl>

                        {/* Password */}
                        <FormControl
                          variant="outlined"
                          fullWidth
                          error={!!errors.password}
                        >
                          <InputLabel htmlFor="password">Password</InputLabel>
                          <OutlinedInput
                            id="password"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            startAdornment={
                              <InputAdornment position="start">
                                <LockIcon color="action" />
                              </InputAdornment>
                            }
                            endAdornment={
                              <InputAdornment position="end">
                                <IconButton
                                  aria-label="toggle password visibility"
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                >
                                  {showPassword ? (
                                    <VisibilityOffIcon />
                                  ) : (
                                    <VisibilityIcon />
                                  )}
                                </IconButton>
                              </InputAdornment>
                            }
                            label="Password"
                          />
                          {errors.password && (
                            <FormHelperText>{errors.password}</FormHelperText>
                          )}
                        </FormControl>

                        {/* Forgot Password */}
                        <Typography
                          variant="body2"
                          component={Link}
                          to="/forgotpassword"
                          sx={{
                            color: "primary.main",
                            textDecoration: "none",
                            textAlign: "right",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          Forgot Password?
                        </Typography>
                      </Box>
                    </Fade>
                  ) : (
                    <Fade in={step === "otp"} timeout={500}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                        }}
                      >
                        <Box sx={{ mb: 1 }}>
                          <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={handleGoBack}
                            sx={{ color: "text.secondary", mb: 2 }}
                          >
                            Back to Login
                          </Button>

                          <Card
                            variant="outlined"
                            sx={{ mb: 2, bgcolor: "primary.50" }}
                          >
                            <CardContent>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  mb: 1,
                                }}
                              >
                                <EmailIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="body2" fontWeight="medium">
                                  {formData.email}
                                </Typography>
                              </Box>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                Please check your email inbox for the OTP and
                                enter it below
                              </Typography>
                            </CardContent>
                          </Card>
                        </Box>

                        {/* OTP Input */}
                        <FormControl
                          variant="outlined"
                          fullWidth
                          error={!!errors.otp}
                        >
                          <InputLabel htmlFor="otp">Enter OTP</InputLabel>
                          <OutlinedInput
                            id="otp"
                            name="otp"
                            value={formData.otp}
                            onChange={handleChange}
                            startAdornment={
                              <InputAdornment position="start">
                                <VpnKeyIcon color="action" />
                              </InputAdornment>
                            }
                            label="Enter OTP"
                          />
                          {errors.otp && (
                            <FormHelperText>{errors.otp}</FormHelperText>
                          )}
                        </FormControl>

                        <Button
                          variant="outlined"
                          color="secondary"
                          disabled={isResendDisabled || resendLoading}
                          onClick={handleResendOtp}
                          startIcon={
                            resendLoading && (
                              <CircularProgress size={16} color="inherit" />
                            )
                          }
                        >
                          {resendLoading
                            ? "Resending..."
                            : isResendDisabled
                            ? `Resend OTP (${cooldown}s)`
                            : "Resend OTP"}
                        </Button>
                      </Box>
                    </Fade>
                  )}

                  <>
                    {/* Checkbox Section */}
                    {!sessionStorage.getItem("termsAccepted") && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "flex-start",
                          mt: 2,
                        }}
                      >
                        <Checkbox
                          checked={isChecked}
                          onChange={(e) => setIsChecked(e.target.checked)}
                        />
                        <Typography>
                          By creating an account, you agree to the{" "}
                          <MuiLink
                            variant="body2"
                            component={Link}
                            to="https://skoegle.in/Terms%20and%20Conditions.html"
                            target="_blank"
                            sx={{
                              color: "primary.main",
                              textDecoration: "none",
                              "&:hover": { textDecoration: "underline" },
                            }}
                          >
                            Terms and Conditions
                          </MuiLink>
                        </Typography>
                      </Box>
                    )}

                    {/* Continue Button */}
                    <Box>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        type="submit"
                        disabled={!isChecked || loading}
                        startIcon={
                          loading ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <LoginIcon />
                          )
                        }
                        sx={{
                          mt: 3,
                          py: 1.2,
                          borderRadius: 30,
                          backgroundColor: "#00796b",
                          fontWeight: "bold",
                          "&:hover": { backgroundColor: "#00635a" },
                          boxShadow: 2,
                        }}
                      >
                        {loading
                          ? "Please wait..."
                          : step === "login"
                          ? "Continue"
                          : "Continue"}
                      </Button>
                    </Box>

                    {/* OR Divider + Google Login (Only on login step) */}
                    {step === "login" && (
                      <>
                        {/* Divider with OR */}
                        <Box
                          sx={{ my: 3, display: "flex", alignItems: "center" }}
                        >
                          <Divider sx={{ flexGrow: 1 }} />
                          <Typography
                            sx={{
                              mx: 2,
                              color: "text.secondary",
                              fontWeight: 500,
                            }}
                          >
                            OR
                          </Typography>
                          <Divider sx={{ flexGrow: 1 }} />
                        </Box>

                        {/* Google Button */}
                        <Button
                          onClick={() => googleLogin()}
                          variant="outlined"
                          startIcon={
                            <img
                              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                              alt="Google"
                              width="20"
                              height="20"
                            />
                          }
                          fullWidth
                          disabled={!isChecked}
                          sx={{
                            py: 1.2,
                            mb: 2,
                            borderRadius: 30,
                            textTransform: "none",
                            fontWeight: "bold",
                            borderColor: "#00796b",
                            color: "#00796b",
                            "&:hover": {
                              backgroundColor: "rgba(0,121,107,0.08)",
                              borderColor: "#00796b",
                            },
                          }}
                        >
                          Continue with Google
                        </Button>
  <Button
                          variant="contained"
                          fullWidth
                          startIcon={
                            <img
                              src="https://firebasestorage.googleapis.com/v0/b/projects-4f71b.appspot.com/o/Skoegle_01.png?alt=media&token=db2e0958-e545-4901-a060-3d98929326a3"
                              alt="Skoegle"
                              width="22"
                              height="22"
                              style={{ borderRadius: "50%" }}
                            />
                          }
                          onClick={handleSkoegleLogin}
                          sx={{
                            py: 1.2,
                            borderRadius: 30,
                            textTransform: "none",
                            fontWeight: "bold",
                            backgroundColor: "#0056D2",
                            color: "#fff",
                            boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
                            "&:hover": {
                              backgroundColor: "#003FA3",
                            },
                          }}
                        >
                          Continue with Skoegle
                        </Button>
                        {/* GitHub Button */}
                        {/* <Button
                          variant="contained"
                          fullWidth
                          startIcon={
                            <img
                              src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg"
                              alt="GitHub"
                              width="22"
                              height="22"
                            />
                          }
                          onClick={handleGithubLogin}
                          sx={{
                            py: 1.2,
                            mb: 2,
                            borderRadius: 30,
                            textTransform: "none",
                            fontWeight: "bold",
                            backgroundColor: "#24292F",
                            color: "#fff",
                            "&:hover": {
                              backgroundColor: "#000",
                            },
                          }}
                        >
                          Continue with GitHub
                        </Button> */}

                        {/* Divider before custom button */}
                        {/* <Divider sx={{ my: 3 }} /> */}

                        {/* Skoegle Button */}
                        {/* <Button
                          variant="contained"
                          fullWidth
                          startIcon={
                            <img
                              src="https://firebasestorage.googleapis.com/v0/b/projects-4f71b.appspot.com/o/Skoegle_01.png?alt=media&token=db2e0958-e545-4901-a060-3d98929326a3"
                              alt="Skoegle"
                              width="22"
                              height="22"
                              style={{ borderRadius: "50%" }}
                            />
                          }
                          onClick={handleSkoegleLogin}
                          sx={{
                            py: 1.2,
                            borderRadius: 30,
                            textTransform: "none",
                            fontWeight: "bold",
                            backgroundColor: "#0056D2",
                            color: "#fff",
                            boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
                            "&:hover": {
                              backgroundColor: "#003FA3",
                            },
                          }}
                        >
                          Continue with Skoegle
                        </Button> */}
                      </>
                    )}
                  </>

                  {/* Signup Link */}
                  {step === "login" && (
                    <Box sx={{ mt: 3, textAlign: "center" }}>
                      <Typography variant="body2">
                        Don't have an account?{" "}
                        <MuiLink
                          component={Link}
                          to="/signup"
                          sx={{
                            fontWeight: "bold",
                            color: "primary.main",
                            textDecoration: "none",
                            "&:hover": { textDecoration: "underline" },
                          }}
                        >
                          Sign Up
                        </MuiLink>
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Fade>
      </Container>
    </Layout>
  );
}
