const cityMap = {
  'Москва': { lat: 55.7558, lon: 37.6176 },
  'Санкт-Петербург': { lat: 59.9311, lon: 30.3609 },
  'Краснодар': { lat: 45.0355, lon: 38.9753 },
  'Новосибирск': { lat: 55.0084, lon: 82.9357 },
  'Екатеринбург': { lat: 56.8389, lon: 60.6057 },
  'Казань': { lat: 55.7961, lon: 49.1064 }
};

const form = document.getElementById('weatherForm');
const cityInput = document.getElementById('cityInput');
const statusEl = document.getElementById('status');
const cityList = document.getElementById('cityList');
const currentCard = document.getElementById('currentCard');
const weatherIconWrap = document.getElementById('weatherIconWrap');

const els = {
  cityName: document.getElementById('cityName'),
  currentDate: document.getElementById('currentDate'),
  currentTemp: document.getElementById('currentTemp'),
  currentDesc: document.getElementById('currentDesc'),
  windSpeed: document.getElementById('windSpeed'),
  humidity: document.getElementById('humidity'),
  feelsLike: document.getElementById('feelsLike'),
  precipitation: document.getElementById('precipitation'),
  hourlyForecast: document.getElementById('hourlyForecast'),
  forecastGrid: document.getElementById('forecastGrid')
};

function createParticles() {
  const container = document.getElementById('particles');
  const count = 28;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    p.style.left = `${Math.random() * 100}%`;
    p.style.animationDuration = `${12 + Math.random() * 14}s`;
    p.style.animationDelay = `${Math.random() * -18}s`;
    p.style.transform = `scale(${0.6 + Math.random() * 1.4})`;
    container.appendChild(p);
  }
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.style.color = isError ? '#ffd1d1' : 'rgba(238, 246, 255, 0.72)';
}

function getWeatherMeta(code) {
  if ([0, 1].includes(code)) {
    return { text: 'Ясно', icon: 'images/cat-sun.png', cls: 'weather-clear' };
  }

  if ([2, 3, 45, 48].includes(code)) {
    return { text: 'Облачно', icon: 'images/cat-cloud.png', cls: 'weather-cloudy' };
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { text: 'Дождь', icon: 'images/cat-rain.png', cls: 'weather-rain' };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { text: 'Снег', icon: 'images/cat-snow.png', cls: 'weather-snow' };
  }

  if ([95, 96, 99].includes(code)) {
    return { text: 'Гроза', icon: 'images/cat-storm.png', cls: 'weather-storm' };
  }

  return { text: 'Переменная погода', icon: 'images/cat-partly.png', cls: 'weather-clear' };
}
function weekdayLabel(dateStr) {
  return new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(new Date(dateStr));
}

function fullDateLabel(dateStr) {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateStr));
}

function hourLabel(dateStr) {
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
}

function activateCityChip(city) {
  document.querySelectorAll('.city-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.city === city);
  });
}

function renderCurrent(city, data) {
  const current = data.current;
  const dailyIndex = 0;
  const meta = getWeatherMeta(current.weather_code);

  els.cityName.textContent = city;
  els.currentDate.textContent = fullDateLabel(current.time);
  els.currentTemp.textContent = `${Math.round(current.temperature_2m)}°`;
  els.currentDesc.textContent = `${meta.text}. Комфортный и красивый погодный интерфейс с анимацией.`;
  els.windSpeed.textContent = `${Math.round(current.wind_speed_10m)} км/ч`;
  els.humidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
  els.feelsLike.textContent = `${Math.round(current.apparent_temperature)}°`;
  els.precipitation.textContent = `${(data.daily.precipitation_sum[dailyIndex] ?? 0).toFixed(1)} мм`;

  currentCard.className = `current-card glass card fade-up ${meta.cls}`;
  weatherIconWrap.className = 'weather-icon-wrap';
  currentCard.offsetHeight;
}

function renderHourly(data) {
  els.hourlyForecast.innerHTML = '';
  const now = Date.now();
  const items = [];

  for (let i = 0; i < data.hourly.time.length; i++) {
    const time = new Date(data.hourly.time[i]).getTime();
    if (time >= now && items.length < 8) {
      items.push({
        time: data.hourly.time[i],
        temp: data.hourly.temperature_2m[i],
        code: data.hourly.weather_code[i]
      });
    }
  }

  items.forEach((item, idx) => {
    const meta = getWeatherMeta(item.code);
    const card = document.createElement('div');
    card.className = 'hour-card';
    card.style.animationDelay = `${idx * 0.05}s`;
    card.innerHTML = `
      <p>${hourLabel(item.time)}</p>
      <div class="icon">
  <img src="${meta.icon}" class="icon-img">
</div>
      <p><strong>${Math.round(item.temp)}°</strong></p>
      <p>${meta.text}</p>
    `;
    els.hourlyForecast.appendChild(card);
  });
}

function renderDaily(data) {
  els.forecastGrid.innerHTML = '';

  data.daily.time.slice(0, 7).forEach((time, idx) => {
    const meta = getWeatherMeta(data.daily.weather_code[idx]);

    const card = document.createElement('div');
    card.className = 'day-card';
    card.style.animationDelay = `${idx * 0.06}s`;

    card.innerHTML = `
      <p><strong>${weekdayLabel(time)}</strong></p>

      <div class="icon">
        <img src="${meta.icon}" class="icon-img">
      </div>

      <p>${meta.text}</p>

      <div class="temps">
        <span>${Math.round(data.daily.temperature_2m_max[idx])}°</span>
        <span>${Math.round(data.daily.temperature_2m_min[idx])}°</span>
      </div>

      <p>Осадки: ${(data.daily.precipitation_sum[idx] ?? 0).toFixed(1)} мм</p>
    `;

    els.forecastGrid.appendChild(card);
  });
}

async function geocodeCity(city) {
  if (cityMap[city]) return { ...cityMap[city], name: city };

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Ошибка геокодирования');
  const data = await res.json();
  if (!data.results || !data.results.length) throw new Error('Город не найден');

  const first = data.results[0];
  return { lat: first.latitude, lon: first.longitude, name: first.name };
}

async function loadWeather(city) {
  setStatus(`Загружаю прогноз для города: ${city}...`);

  try {
    const place = await geocodeCity(city);
    const params = new URLSearchParams({
      latitude: place.lat,
      longitude: place.lon,
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'apparent_temperature',
        'weather_code',
        'wind_speed_10m'
      ].join(','),
      hourly: ['temperature_2m', 'weather_code'].join(','),
      daily: ['weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum'].join(','),
      timezone: 'auto',
      forecast_days: '7'
    });

    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Не удалось получить прогноз');

    const data = await res.json();
    renderCurrent(place.name, data);
    renderHourly(data);
    renderDaily(data);
    setStatus(`Данные обновлены: ${new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(new Date())}`);
    activateCityChip(place.name);
    cityInput.value = place.name;
  } catch (error) {
    setStatus(error.message || 'Произошла ошибка при загрузке данных.', true);
  }
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const city = cityInput.value.trim();
  if (!city) {
    setStatus('Введите название города.', true);
    return;
  }
  loadWeather(city);
});

cityList.addEventListener('click', (e) => {
  const btn = e.target.closest('.city-chip');
  if (!btn) return;
  loadWeather(btn.dataset.city);
});

createParticles();
loadWeather('Москва');


const music = document.getElementById("bgMusic");
const btn = document.getElementById("musicBtn");

let isPlaying = false;

btn.addEventListener("click", () => {
  if (isPlaying) {
    music.pause();
    btn.textContent = "▶️ Музыка";
  } else {
    music.play();
    btn.textContent = "⏸ Музыка";
  }
  isPlaying = !isPlaying;
});