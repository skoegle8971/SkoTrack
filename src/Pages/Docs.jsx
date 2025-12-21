import React, { useRef } from "react";
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  IconButton,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { CopyToClipboard } from "react-copy-to-clipboard";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#121212",
      paper: "#1E1E1E",
    },
  },
  typography: {
    fontFamily: "Roboto, Arial",
  },
});

// Code block component
function CodeBlock({ code }) {
  return (
    <Box
      sx={{
        backgroundColor: "#2D2D2D",
        color: "#F8F8F2",
        p: 2,
        borderRadius: 2,
        position: "relative",
        my: 2,
        fontFamily: "Monospace",
        overflowX: "auto",
      }}
    >
      <CopyToClipboard text={code}>
        <IconButton
          sx={{ position: "absolute", top: 4, right: 4, color: "#F8F8F2" }}
        >
          <ContentCopyIcon />
        </IconButton>
      </CopyToClipboard>
      <pre style={{ margin: 0 }}>{code}</pre>
    </Box>
  );
}

// Sections data
const sectionsData = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <>
        <Typography gutterBottom>
          The VMARG Tracker Logs API allows you to send and retrieve GPS tracking logs for devices.
        </Typography>
        <ul>
          <li>Domain: <strong>dev-vmarg.skoegle.co.in</strong> (HTTP & HTTPS)</li>
          <li>IP: <strong>3.111.119.47</strong> (HTTP only)</li>
          <li>All endpoints respond with <strong>JSON</strong></li>
        </ul>
      </>
    ),
  },
  {
    id: "health",
    title: "Health Check",
    content: (
      <>
        <Typography gutterBottom>Check if the API is reachable:</Typography>
        <ul>
          <li>Domain HTTP: <a href="http://dev-vmarg.skoegle.co.in/ping">http://dev-vmarg.skoegle.co.in/ping</a></li>
          <li>Domain HTTPS: <a href="https://dev-vmarg.skoegle.co.in/ping">https://dev-vmarg.skoegle.co.in/ping</a></li>
          <li>IP HTTP: <a href="http://3.111.119.47/ping">http://3.111.119.47/ping</a></li>
        </ul>
        <CodeBlock code={`curl http://dev-vmarg.skoegle.co.in/ping`} />
      </>
    ),
  },
  {
    id: "post-logs",
    title: "POST /api/logs",
    content: (
      <>
        <Typography gutterBottom>Submit a GPS log for a device.</Typography>
        <ul>
          <li>Domain: HTTP & HTTPS</li>
          <li>IP: HTTP only</li>
        </ul>
        <Typography>Request Body:</Typography>
        <CodeBlock
          code={`{
  "deviceName": "Tracker-200",
  "latitude": 29,
  "longitude": 20.10,
  "date": "03-03-2025",
  "time": "12:00:00",
  "main": 1,
  "battery": 50
}`}
        />
        <Typography>Sample cURL:</Typography>
        <CodeBlock
          code={`curl --location 'https://dev-vmarg.skoegle.co.in/api/logs' \\
--header 'Content-Type: application/json' \\
--data '{
    "deviceName": "Tracker-200",
    "latitude": 29,
    "longitude": 20.10,
    "date": "03-03-2025",
    "time": "12:00:00",
    "main": 1,
    "battery": 50
}'`}
        />
      </>
    ),
  },
  {
    id: "get-logs",
    title: "GET /api/logs",
    content: (
      <>
        <Typography gutterBottom>
          Retrieve logs for a device (optionally filter by latitude, longitude, date, etc.)
        </Typography>
        <Typography gutterBottom>Query Parameters: deviceName, latitude, longitude, date, time, main, battery</Typography>
        <Typography>Sample cURL:</Typography>
        <CodeBlock
          code={`curl --location 'https://dev-vmarg.skoegle.co.in/api/logs/?deviceName=Tracker-1&latitude=13.003556&longitude=77.578789&date=2025-06-18&time=12%3A30%3A00&main=1&battery=85' \\
--header 'Content-Type: application/json'`}
        />
      </>
    ),
  },
  {
    id: "responses",
    title: "API Responses",
    content: (
      <>
        <Typography gutterBottom>Without Geofencing:</Typography>
        <CodeBlock
          code={`{
  "message": "Logs Created without geofencing",
  "location": {
    "latitude": 29,
    "longitude": 20.1
  }
}`}
        />
        <Typography gutterBottom>With Geofencing:</Typography>
        <CodeBlock
          code={`{
  "message": "Logs Created",
  "geofencing": {
    "activated": false,
    "status": null,
    "fixedLat": 29,
    "fixedLong": 20.1
  },
  "location": {
    "latitude": 29,
    "longitude": 20.1,
    "distance": 0
  }
}`}
        />
      </>
    ),
  },
  {
    id: "support",
    title: "Support",
    content: (
      <>
        <Typography gutterBottom>Contact the VMARG technical team:</Typography>
        <ul>
          <li>Email: <a href="mailto:contact@skoegle.com">contact@skoegle.com</a></li>
          <li>Phone: 9591367327</li>
        </ul>
      </>
    ),
  },
];

export default function Docs() {
  const refs = useRef([]);

  const scrollToSection = (index) => {
    refs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom>
          VMARG API Documentation
        </Typography>
        <Grid container spacing={4}>
          {/* Left: Navigation sidebar */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2, position: "sticky", top: 16 }}>
              <Typography variant="h6" gutterBottom>
                Quick Navigation
              </Typography>
              <List>
                {sectionsData.map((section, idx) => (
                  <ListItemButton key={section.id} onClick={() => scrollToSection(idx)}>
                    <ListItemText primary={section.title} />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Right: Main content */}
          <Grid item xs={12} md={9}>
            {sectionsData.map((section, idx) => (
              <Box key={section.id} ref={(el) => (refs.current[idx] = el)} sx={{ mb: 4 }}>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">{section.title}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>{section.content}</AccordionDetails>
                </Accordion>
              </Box>
            ))}
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}
