import React, { useState } from "react";
import Layout from "../../Layout/Layout";
import { TextField, Button, Typography, Box, Container } from "@mui/material";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      setSuccess("");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("https://vmarg.skoegle.co.in/api/auth/forgotpassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link.");
      }

      setSuccess("Password reset link has been sent to your email.");
      setEmail("");
      setTimeout(() => {
        
        window.location.href = "/login"; 
      }, 2000); // Redirect after 20 seconds

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Container maxWidth="sm">
        <Box
          sx={{
            mt: 8,
            mb: 10,
            p: 4,
            boxShadow: 3,
            borderRadius: 2,
            textAlign: "center",
            bgcolor: "background.paper",
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom>  
            Forgot Password?
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Enter your email, and we'll send you a link to reset your password.
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Enter Email"
              type="email"
              variant="outlined"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && (
              <Typography color="error" variant="body2" mt={1}>
                {error}
              </Typography>
            )}
            {success && (
              <Typography color="success.main" variant="body2" mt={1}>
                {success}
              </Typography>
            )}
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{
                mt: 2,
                py: 1,
                backgroundColor: "#00796B",
                "&:hover": { backgroundColor: "#005a4f" },
              }}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        </Box>
      </Container>
    </Layout>
  );
}
