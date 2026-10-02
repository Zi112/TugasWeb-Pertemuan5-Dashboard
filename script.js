// ==========================================================================
// KONFIGURASI
// ==========================================================================
const API_KEY = '1a920ab37db83b59a9f338b305bb6608';
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const HISTORY_KEY = 'weatherApp.searchHistory';
const MAX_HISTORY = 8;

// ==========================================================================
// AMBIL ELEMEN DOM
// ==========================================================================
const searchForm = document.getElementById('searchForm');
const cityInput = document.getElementById('cityInput');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('error');
const errorMessageEl = document.getElementById('errorMessage');
const weatherCardEl = document.getElementById('weatherCard');
const historyWrap = document.getElementById('historyWrap');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistory');
const unitToggleBtn = document.getElementById('unitToggle');

const cityNameEl = document.getElementById('cityName');
const cityDateEl = document.getElementById('cityDate');
const weatherIconEl = document.getElementById('weatherIcon');
const temperatureEl = document.getElementById('temperature');
const feelsLikeEl = document.getElementById('feelsLike');
const descriptionEl = document.getElementById('description');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const pressureEl = document.getElementById('pressure');

// Menyimpan data mentah dari API terakhir, supaya toggle satuan suhu
// (bonus feature) tidak perlu fetch ulang ke server.
let lastWeatherData = null;
let currentUnit = 'metric'; // 'metric' = Celsius, 'imperial' = Fahrenheit

// ==========================================================================
// HELPER: UI STATE (loading / error / hasil)
// ==========================================================================
const showLoading = () => {
    loadingEl.classList.remove('hidden');
    errorEl.classList.add('hidden');
    weatherCardEl.classList.add('hidden');
};

const showError = (message) => {
    loadingEl.classList.add('hidden');
    weatherCardEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    errorMessageEl.textContent = message;
};

const showWeather = () => {
    loadingEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    weatherCardEl.classList.remove('hidden');
};

// ==========================================================================
// HELPER: RIWAYAT PENCARIAN (Bonus — LocalStorage)
// Pakai array method .filter() untuk buang duplikat & .map() untuk render.
// ==========================================================================
const getHistory = () => {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
};

const saveToHistory = (city) => {
    const existing = getHistory();
    // Buang entri lama yang namanya sama (case-insensitive) sebelum ditambah lagi
    const filtered = existing.filter(
        (item) => item.toLowerCase() !== city.toLowerCase()
    );
    const updated = [city, ...filtered].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    renderHistory();
};

const renderHistory = () => {
    const history = getHistory();

    if (history.length === 0) {
        historyWrap.classList.add('hidden');
        return;
    }

    historyWrap.classList.remove('hidden');

    // .map() dipakai untuk mengubah tiap nama kota jadi elemen HTML "chip"
    historyList.innerHTML = history
        .map((city) => `<button class="history__chip" data-city="${city}">${city}</button>`)
        .join('');
};

clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
});

historyList.addEventListener('click', (event) => {
    const chip = event.target.closest('.history__chip');
    if (!chip) return;
    cityInput.value = chip.dataset.city;
    fetchWeather(chip.dataset.city);
});

// ==========================================================================
// HELPER: FORMAT TAMPILAN
// ==========================================================================
const formatDate = () =>
    new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

const unitSymbol = () => (currentUnit === 'metric' ? '°C' : '°F');
const windUnit = () => (currentUnit === 'metric' ? 'm/s' : 'mph');

const renderWeather = (data) => {
    const { name, main, weather, wind, sys } = data;
    const [condition] = weather; // ambil elemen pertama dari array 'weather'

    cityNameEl.textContent = `${name}${sys?.country ? ', ' + sys.country : ''}`;
    cityDateEl.textContent = formatDate();
    weatherIconEl.src = `https://openweathermap.org/img/wn/${condition.icon}@2x.png`;
    weatherIconEl.alt = condition.description;
    temperatureEl.textContent = `${Math.round(main.temp)}${unitSymbol()}`;
    feelsLikeEl.textContent = `Terasa seperti ${Math.round(main.feels_like)}${unitSymbol()}`;
    descriptionEl.textContent = condition.description;
    humidityEl.textContent = `${main.humidity}%`;
    windEl.textContent = `${wind.speed} ${windUnit()}`;
    pressureEl.textContent = `${main.pressure} hPa`;

    showWeather();
};

// ==========================================================================
// FETCH DATA CUACA (async/await + error handling)
// ==========================================================================
const fetchWeather = async (city) => {
    showLoading();

    const url = `${BASE_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=${currentUnit}&lang=id`;

    try {
        const response = await fetch(url);

        if (response.status === 404) {
            throw new Error(`Kota "${city}" tidak ditemukan. Coba periksa ejaannya.`);
        }

        if (!response.ok) {
            throw new Error('Gagal mengambil data cuaca. Coba lagi beberapa saat.');
        }

        const data = await response.json();
        lastWeatherData = data;
        renderWeather(data);
        saveToHistory(data.name);
    } catch (error) {
        // TypeError biasanya muncul kalau fetch gagal total (mis. tidak ada internet)
        if (error instanceof TypeError) {
            showError('Tidak bisa terhubung ke server. Periksa koneksi internet kamu.');
        } else {
            showError(error.message);
        }
    }
};

// ==========================================================================
// EVENT LISTENERS
// ==========================================================================
searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const city = cityInput.value.trim();
    if (!city) return;
    fetchWeather(city);
});

// Toggle satuan suhu °C/°F (Bonus) — fetch ulang dengan parameter unit baru,
// supaya nilai "terasa seperti" dan angin juga ikut dikonversi oleh server
// (lebih akurat daripada dihitung manual di JavaScript).
unitToggleBtn.addEventListener('click', () => {
    if (!lastWeatherData) return;
    currentUnit = currentUnit === 'metric' ? 'imperial' : 'metric';
    fetchWeather(lastWeatherData.name);
});

// ==========================================================================
// INISIALISASI
// ==========================================================================
renderHistory();
