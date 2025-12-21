
# VMARG Tracker Logs API Documentation

## Overview

VMARG Tracker Logs API enables you to send and retrieve GPS tracking logs for devices. The API supports both HTTP and HTTPS on the domain, but only HTTP on the direct IP. 

- **Domain**: `dev-vmarg.skoegle.co.in` (supports HTTP & HTTPS)
- **IP**: `3.111.119.47` (supports HTTP only)

All API endpoints respond with JSON.

---

## 1. Health Check

Check if the API is reachable.

**Endpoints:**
- Domain (HTTP):  `http://dev-vmarg.skoegle.co.in/ping`
- Domain (HTTPS): `https://dev-vmarg.skoegle.co.in/ping`
- IP (HTTP):      `http://3.111.119.47/ping`

**Sample Request:**
```bash
curl http://dev-vmarg.skoegle.co.in/ping
```

---

## 2. POST /api/logs  
Submit a GPS log for a device.

**Endpoints:**
- Domain (HTTP/HTTPS): 
  - `http://dev-vmarg.skoegle.co.in/api/logs`
  - `https://dev-vmarg.skoegle.co.in/api/logs`
- IP (HTTP only): 
  - `http://3.111.119.47/api/logs`

**Request:**
- **Method:** POST
- **Headers:** `Content-Type: application/json`
- **Body:**
    ```json
    {
      "deviceName": "Tracker-200",
      "latitude": 29,
      "longitude": 20.10,
      "date": "03-03-2025",
      "time": "12:00:00",
      "main": 1,
      "battery": 50
    }
    ```

**Sample cURL:**
```bash
curl --location 'https://dev-vmarg.skoegle.co.in/api/logs' \
  --header 'Content-Type: application/json' \
  --data '{
      "deviceName": "Tracker-200",
      "latitude": 29,
      "longitude": 20.10,
      "date": "03-03-2025",
      "time": "12:00:00",
      "main": 1,
      "battery": 50
  }'
```

**Note:** For IP endpoint, use HTTP only:
```bash
curl --location 'http://3.111.119.47/api/logs' \
  --header 'Content-Type: application/json' \
  --data '{ ... }'
```

---

## 3. GET /api/logs  
Retrieve logs for a device (optionally by latitude, longitude, date, etc.)

**Endpoints:**
- Domain (HTTP/HTTPS): 
  - `http://dev-vmarg.skoegle.co.in/api/logs`
  - `https://dev-vmarg.skoegle.co.in/api/logs`
- IP (HTTP only): 
  - `http://3.111.119.47/api/logs`

**Request:**
- **Method:** GET
- **Query Parameters:**  
    - `deviceName`, `latitude`, `longitude`, `date`, `time`, `main`, `battery`
- **Headers:** `Content-Type: application/json`

**Sample cURL:**
```bash
curl --location 'https://dev-vmarg.skoegle.co.in/api/logs/?deviceName=Tracker-1&latitude=13.003556&longitude=77.578789&date=2025-06-18&time=12%3A30%3A00&main=1&battery=85' \
  --header 'Content-Type: application/json'
```

**IP Example:**
```bash
curl --location 'http://3.111.119.47/api/logs/?deviceName=Tracker-1&latitude=13.003556&longitude=77.578789&date=2025-06-18&time=12%3A30%3A00&main=1&battery=85' \
  --header 'Content-Type: application/json'
```

---

## 4. API Responses

### a) Without Geofencing

```json
{
  "message": "Logs Created without geofencing",
  "location": {
    "latitude": 29,
    "longitude": 20.1
  }
}
```

### b) With Geofencing

```json
{
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
}
```
- **geofencing.activated**: Indicates if geofencing is enabled for the device.
- **status**: Current geofence status (e.g., inside/outside geofence region, can be `null` if not set).
- **fixedLat/fixedLong**: The geofence boundary location.
- **distance**: Distance from current position to the geofence boundary (meters).

---

## 5. Devices & Geofencing

- Devices like `Tracker-200` have geofencing enabled.
- Devices like `Tracker-5`, `Tracker-4` may have different configurations.
- Devices are attached to user accounts and can be managed via the web portal.

---

## 6. UI & Admin Portal

- Visit: [vmarg.skoegle.com](https://vmarg.skoegle.com)
- **Login credentials for testing:**
    - **Email:** `skoegletesting@gmail.com`
    - **Password:** `skoegletesting@123`
- After login, you can manage devices, view logs, and configure geofencing.

---

## 7. Integration Notes

- **IP Endpoint:** Only supports HTTP (no SSL).
- **Domain Endpoint:** Supports both HTTP and HTTPS (prefer HTTPS for security).
- **For development/testing:** Use the provided credentials and static OTP.
- **For production:** Use your own account and device assignments.

---

## 8. General Notes

- All endpoints expect and return JSON.
- Ensure correct Content-Type headers.
- If geofencing is activated for a device, the response contains geofencing status and information.
- Logs can be filtered and retrieved via GET requests with query parameters.

---

## 9. Support

- For further API or integration support, contact the VMARG technical team via the web portal or your assigned account manager.
