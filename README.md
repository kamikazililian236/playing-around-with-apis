# Pomodoro Timer & Task Studio

> **ALU Software Engineering Summative — Playing Around with APIs**  
> **Author:** Lilian Kamikazi  
> **GitHub:** https://github.com/kamikazililian236/playing-around-with-apis  
> **Live URL:** http://liliankamikazi.tech (`18.170.218.185`)
> **Demo Video:** <https://youtu.be/VP-i0K9JFJ4>

---

## Overview

A minimal, distraction-free Pomodoro Timer and Task Studio built with vanilla HTML, CSS, JavaScript, and a zero-dependency Node.js HTTP server. It helps students stay focused with customizable work/break sessions, daily focus challenges, task tracking, and live weather, holiday, and quote data.

The backend is completely stateless (`localStorage` handles tasks and settings in the browser), allowing traffic to be load-balanced evenly across **`web-01`** and **`web-02`** behind **`lb-01`**.

---

## Key Features

- **Pomodoro Timer:** Focus (25m), Short Break (5m), and Long Break (15m) modes with a circular progress ring, customizable durations, auto-start toggles, and Web Audio API alarm sounds.
- **Task Studio (Search, Filter, Sort):** Add tasks with priority (`High`, `Medium`, `Low`), session estimates, and `#tags`. Search in real time, filter by status or priority, and sort by newest, priority, or pomodoros.
- **Dynamic API Settings & Aesthetics:** Change the Weather city, Holiday country code, timer style (`Ring` / `Numbers only`), background image, dimness, and accent colors without touching code.
- **Error Handling:** 5-second fetch timeouts (`AbortController`), input validation for city and 2-letter country codes, and clean offline/not-found messages.

---

## External APIs Used & Attribution

All APIs used are free public REST APIs requiring **no API keys**:

| API | Purpose | Documentation |
| :--- | :--- | :--- |
| **Open-Meteo Geocoding & Weather API** | Resolves any city name to coordinates and fetches live temperature | [Open-Meteo Docs](https://open-meteo.com/en/docs) |
| **Nager.Date Public Holidays API** | Fetches the next upcoming public holiday for any 2-letter country code | [Nager.Date Docs](https://date.nager.at/) |
| **Advice Slip API** | Provides fresh productivity/focus quotes | [Advice Slip Docs](https://api.adviceslip.com/) |

---

## Run Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)

### Steps
```bash
git clone https://github.com/kamikazililian236/playing-around-with-apis.git
cd playing-around-with-apis
npm start
```
Open **`http://localhost:3000`** in your browser.

---

## Deployment (Multi-Tier Architecture)

Traffic flows from the **Load Balancer (`lb-01`: `18.170.218.185`)** to **`web-01` (`35.177.228.239`)** and **`web-02` (`18.133.156.57`)**. Each server exposes `/api/health` and sets the `X-Served-By` response header.

### 1. Deploy on `web-01` and `web-02`
```bash
git clone https://github.com/kamikazililian236/playing-around-with-apis.git /var/www/playing-around-with-apis
cd /var/www/playing-around-with-apis
sudo npm install -g pm2
pm2 start server.js --name pomodoro
pm2 save
```

### 2. Configure Nginx Reverse Proxy (`/etc/nginx/sites-available/default`)
```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```
Reload Nginx: `sudo nginx -t && sudo service nginx reload`

### 3. Verify Load Balancer
```bash
curl -i http://18.170.218.185/api/health
```

---

## Challenges & Solutions

- **Keeping State Synced Across 2 Web Servers:** Storing tasks on a single server's disk would cause data mismatch under round-robin load balancing. Keeping the Node.js server stateless and persisting user data in browser `localStorage` solved this cleanly.
- **Avoid Hardcoded API Locations:** Instead of hardcoding Kigali's coordinates, integrating Open-Meteo's Geocoding API lets any user type their own city and 2-letter country code in Settings.
