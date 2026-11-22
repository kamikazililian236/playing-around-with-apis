// --- External APIs & Dynamic Location Configuration ---
let apiConfig = JSON.parse(localStorage.getItem( 'pomodoro_api_config')) || {
  city: 'Kigali',
  country: 'RW'
};

const weatherText = document.getElementById('weatherText');
const holidayText = document.getElementById('holidayText');
const serverText = document.getElementById('serverText');
const adviceText = document.getElementById('adviceText');

async function fetchJson(url,timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try{
    const res = await fetch(url, { signal: controller.signal});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function loadWeather(city) {
  weatherText.textContent = `${city}: loading...`;
  try {
    const geoData = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    if (!geoData.results || geoData.results.length === 0) {
      weatherText.textContent = `City "${city}" not found`;
      return;
    }

    const { latitude, longitude, name } = geoData.results[0];
    const data = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`);
    weatherText.textContent = `${name}: ${Math.round(data.current.temperature_2m)}°C`;
  } catch (err) {
    weatherText.textContent = err.name === 'AbortError' ? 'Weather timed out' : 'Weather offline';
  }
}

async function loadHoliday(country) {
  try { 
    const list = await fetchJson(`https://date.nager.at/api/v3/NextPublicHolidays/${encodeURIComponent(country)}`);
    if (!Array.isArray(list) || list.length === 0) {
      holidayText.textContent = `No holidays found for "${country}"`;
      return;
    }
    holidayText.textContent = `Next holiday (${country}): ${list[0].name} (${list[0].date})`;
  } catch (err) {
    if (err.message.includes('404')) {
      holidayText.textContent = `Invalid country code "${country}"`;
    } else {
      holidayText.textContent = err.name === 'AbortError' ? 'Holidays timed out' : 'Holidays offline';
    }
  }
}

async function loadAdvice() {
  try {
    const data = await fetchJson(`https://api.adviceslip.com/advice?ts=${Date.now()}`);
    adviceText.textContent = `"${data.slip.advice}"`;
  } catch {
    adviceText.textContent = '"Begin, and the momentum will follow."';
  }
}

async function loadServerInfo() {
  try {
    const data = await fetchJson('/api/health');
    serverText.textContent = `Server: ${data.server}`;
  } catch {
    serverText.textContent = '';
  }
}

adviceText.addEventListener('click', loadAdvice);

document.getElementById('saveApiBtn').addEventListener('click', () => {
  const city = document.getElementById('apiCityInput').value.trim();
  const country = document.getElementById('apiCountryInput').value.trim().toUpperCase();
  const apiError = document.getElementById('apiError');

  if (!city) {
    apiError.textContent = 'Please enter a valid city name.';
    apiError.classList.remove('hidden');
    return;
  }
  if (!/^[A-Z]{2}$/.test(country)) {
    apiError.textContent = 'Please enter a 2-letter country code (e.g. RW, KE, US).';
    apiError.classList.remove('hidden');
     return;
  }

  apiError.classList.add('hidden');
  apiConfig.city = city;
  apiConfig.country = country;
  localStorage.setItem('pomodoro_api_config', JSON.stringify(apiConfig));
  loadWeather(apiConfig.city);
  loadHoliday(apiConfig.country);
  closeModal();
});

// Initial API load
loadWeather(apiConfig.city);
loadHoliday(apiConfig.country);
loadAdvice();
loadServerInfo();