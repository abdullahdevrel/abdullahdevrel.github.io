import { config } from './config.js';
import { createSummaryCard } from './summary.js';
import { getRandomIPs } from './randomIPs.js';

const CONSTANTS = {
    ICONS: {
        blueDot: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png',
        redDot: 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png'
    },
    API_ENDPOINTS: {
        ipinfo: config.apiEndpoints.ipinfo,
        nominatim: config.apiEndpoints.nominatim
    }
};

const map = L.map('map', {
    zoomControl: false,  // This will hide the zoom controls
    duration: 0.8  // Duration of animation in seconds
}).setView([config.map.initialView.lat, config.map.initialView.lng], config.map.initialView.zoom);

L.tileLayer('https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  maxZoom: config.map.maxZoom
}).addTo(map);

// Add event listener for start button
document.getElementById('startButton').addEventListener('click', startGame);

const gameState = {
    currentScore: 0,
    realLocation: null,
    currentData: null,
    guessCount: 0,
    guessedItems: [],
    guesses: [],
    nextIPData: null,
    startTime: null,
    timerInterval: null,
    totalTime: 0,
    resultMap: null,
    lastScore: null
};

let ipAddress = '';
let previousIpAddress = null;

const modeSelector = document.getElementById('modeSelector');
let currentMode = localStorage.getItem('ipGuessMode') || '';
modeSelector.value = currentMode;

modeSelector.addEventListener('change', () => {
  currentMode = modeSelector.value;
  localStorage.setItem('ipGuessMode', currentMode);
});

const infoDiv = document.getElementById('info');
const scoreDisplay = document.getElementById('scoreDisplay');

function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimer() {
    if (!gameState.startTime) return;
    const timeDisplay = document.getElementById('timeDisplay');
    if (timeDisplay) {
        const currentTime = Date.now() - gameState.startTime;
        timeDisplay.innerHTML = `Time: <strong>${formatTime(currentTime)}</strong>`;
    }
}

function startTimer() {
    gameState.startTime = Date.now();
    gameState.timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
    if (gameState.startTime) {
        gameState.totalTime = Date.now() - gameState.startTime;
    }
}

async function startGame() {
  if (!currentMode) {
    alert("Please select a mode before starting the game.");
    return;
  }

  clearMap();
  document.getElementById('result').innerHTML = '';
  document.getElementById('status').innerText = 'Fetching a new IP...';
  
  // Reset lastScore before each new round
  gameState.lastScore = null;

  // Only create time display and start timer if this is the first round (no guesses yet)
  if (gameState.guessCount === 0) {
    const timeDisplay = document.createElement('div');
    timeDisplay.id = 'timeDisplay';
    timeDisplay.innerHTML = 'Time: <strong>0:00</strong>';
    document.getElementById('info').insertBefore(timeDisplay, document.getElementById('status'));
    startTimer();
  }
  
  // Remove mode selector and start button if they exist
  const modeSelector = document.getElementById('modeSelector');
  const startButton = document.getElementById('startButton');
  if (modeSelector) modeSelector.remove();
  if (startButton) startButton.remove();

  // Use prefetched data if available, otherwise fetch new data
  const fetchedData = gameState.nextIPData || await fetchValidIPLocation();
  gameState.nextIPData = null; // Clear the prefetched data

  if (!fetchedData) {
    document.getElementById('status').innerText = 'Failed to load IP info. Try again.';
    return;
  }

  // Store the fetched data in the `currentData` variable globally
  gameState.currentData = fetchedData;

  // Update the last IP address link if there's a previous one
  if (previousIpAddress) {
    document.getElementById('lastIpLink').innerHTML = `Last IP: <a href="https://ipinfo.io/${previousIpAddress}" target="_blank">${previousIpAddress}</a>`;
  } else {
    document.getElementById('lastIpLink').innerHTML = '';
  }

  previousIpAddress = gameState.currentData.ip;
  ipAddress = gameState.currentData.ip;
  gameState.realLocation = gameState.currentData.loc.split(',').map(Number);
  map.flyTo([config.map.initialView.lat, config.map.initialView.lng], config.map.initialView.zoom, {
    duration: 0.8,
    easeLinearity: 0.5
  });

  let details = '';
  if (!gameState.lastScore) {
    details += `IP: <strong>${ipAddress}</strong><br>`;
  } else {
    details += `Score: <strong>+${gameState.lastScore}</strong><br>`;
  }
  if (gameState.currentData.org) {
    details += `ASN: <a href="https://ipinfo.io/${gameState.currentData.org.split(' ')[0]}" target="_blank">${gameState.currentData.org}</a><br>`;
  }
  if (currentMode === 'normal' && gameState.currentData.hostname) {
    details += `Hostname: ${gameState.currentData.hostname}<br>`;
  }
  document.getElementById('status').innerHTML = details + 'Click on the map to drop your pin.';
}

async function fetchValidIPLocation() {
  // Generate 5 random IPs using the new utility
  const ips = getRandomIPs(5);
  for (const ip of ips) {
    try {
      const data = await fetchWithRetry(`${CONSTANTS.API_ENDPOINTS.ipinfo}/${ip}/json`);
      if (data && data.loc && data.org) {
        return data;
      }
    } catch (e) {
      // ignore error, try next IP
    }
  }
  return null;
}

function clearMap() {
  gameState.guessedItems.forEach(item => map.removeLayer(item));
  gameState.guessedItems.length = 0;
}

function haversineDistance(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * Math.PI / 180;
  const R = 6371; // Radius of Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function scoreFromDistance(km) {
  const { scoring } = config.gameSettings;
  if (km < scoring.perfect.distance) return scoring.perfect.points;
  if (km < scoring.excellent.distance) return scoring.excellent.points;
  if (km < scoring.good.distance) return scoring.good.points;
  if (km < scoring.fair.distance) return scoring.fair.points;
  return scoring.poor.points;
}

// Update the total score display dynamically
function updateTotalScoreDisplay() {
  const totalScoreElement = document.querySelector('#status strong'); // Assuming the total score is inside a <strong> tag in #status
  if (totalScoreElement) {
      totalScoreElement.textContent = gameState.currentScore;
  }
}

// Update the total score display dynamically
function updateScoreDisplay() {
  const scoreDisplayElement = document.getElementById('scoreDisplay');
  if (scoreDisplayElement) {
      scoreDisplayElement.innerHTML = `Total Score: <strong>${gameState.currentScore}</strong>`;
  }
}

function handleMapClick(e) {
    if (!gameState.realLocation || !gameState.currentData) return;

    const guessLatLng = e.latlng;

    if (gameState.guessedItems.length > 0) {
        map.removeLayer(gameState.guessedItems[gameState.guessedItems.length - 1]);
    }

    const markerGuess = L.marker(guessLatLng, {
        icon: L.icon({ iconUrl: CONSTANTS.ICONS.blueDot, iconSize: [24, 24] })
    }).addTo(map);
    gameState.guessedItems.push(markerGuess);

    guessButton.style.display = 'block';
    guessButton.dataset.lat = guessLatLng.lat;
    guessButton.dataset.lng = guessLatLng.lng;
}

map.on('click', handleMapClick);

// Function to debounce another function
function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// Apply debounce to the keydown event listener
document.addEventListener('keydown', debounce((event) => {
    if (guessButton.style.display === 'block' && (event.key === 'Enter' || event.key === ' ')) {
        guessButton.click();
    }
}, 200));

// Function to fetch location details (city, region, country) from Nominatim
async function getLocationDetails(latLng) {
  const [lat, lon] = latLng;
  const url = `${CONSTANTS.API_ENDPOINTS.nominatim}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=en`;

  try {
    return await fetchWithRetry(url);
  } catch (error) {
    console.error('Error fetching location details:', error);
  }
  return null;
}

function showSummary() {
    document.getElementById('result').innerHTML = '';
    document.getElementById('status').innerHTML = '';
    
    // Stop the timer
    stopTimer();
    
    // Safely remove elements if they exist
    const modeSelector = document.getElementById('modeSelector');
    const startButton = document.getElementById('startButton');
    if (modeSelector) modeSelector.remove();
    if (startButton) startButton.remove();

    const summaryHTML = createSummaryCard(gameState.guesses, gameState.currentScore, gameState.totalTime);
    const summaryDiv = document.getElementById('summary');
    summaryDiv.innerHTML = summaryHTML;
    summaryDiv.classList.add('visible');
    infoDiv.classList.remove('playing');
}

// Function to reset footer to default
function resetFooter() {
    footer.innerHTML = `
        Click on the map to guess the IP's location. Score based on distance! Press Space or Enter to submit.<br>
        <div class="footer-credits">
            <strong>Data powered by <a href="https://ipinfo.io" target="_blank">IPinfo.io</a></strong>
            <span id="lastIpLink"></span>
        </div>
    `;
}

const guessButton = document.createElement('button');
guessButton.innerHTML = 'Guess';
guessButton.id = 'guessButton';
guessButton.style.display = 'none'; // Only keeping this as it's dynamically toggled
document.body.appendChild(guessButton);

guessButton.addEventListener('click', async () => {
  if (!gameState.realLocation || !gameState.currentData) return;

  const guessLatLng = [parseFloat(guessButton.dataset.lat), parseFloat(guessButton.dataset.lng)];

  // Fetch location details using Nominatim reverse geocoding API
  const locationDetails = await getLocationDetails(guessLatLng);
  if (!locationDetails) {
      alert("Could not fetch location details.");
      return;
  }

  // Add a marker for the real location
  const mainMarkerReal = L.marker(gameState.realLocation, {
      icon: L.icon({ iconUrl: CONSTANTS.ICONS.redDot, iconSize: [24, 24] })
  }).addTo(map);

  const mainLine = L.polyline([guessLatLng, gameState.realLocation], { color: 'green', dashArray: '5,10' }).addTo(map);
  gameState.guessedItems.push(mainMarkerReal, mainLine);

  // Create a bounds object that includes both pins
  const mainBounds = L.latLngBounds([guessLatLng, gameState.realLocation]);
  
  // Fit the map to the bounds with more padding and a lower max zoom
  map.fitBounds(mainBounds, {
    padding: [200, 200],
    maxZoom: 8
  });
  
  // If we're too zoomed out (zoom < 3), set a minimum zoom
  if (map.getZoom() < 3) {
    map.setZoom(3);
  }

  // Calculate the distance and score
  const distance = haversineDistance(...guessLatLng, ...gameState.realLocation);
  const score = scoreFromDistance(distance);
  gameState.currentScore += score;
  updateTotalScoreDisplay();
  updateScoreDisplay();

  // Save the guess data for the round
  gameState.guesses.push({
      ip: ipAddress,
      distance,
      score,
      org: gameState.currentData.org,
      guessedLocation: locationDetails,
      realLocation: {
          city: gameState.currentData.city || 'Unknown',
          region: gameState.currentData.region || 'Unknown',
          country: gameState.currentData.country || 'Unknown'
      },
      guessedLat: guessLatLng[0],
      guessedLng: guessLatLng[1],
      realLat: gameState.realLocation[0],
      realLng: gameState.realLocation[1]
  });

  // Update the footer with redesigned results
  const footer = document.getElementById('footer');
  footer.innerHTML = `
      <div class="result-container">
          <div class="result-info">
              <p class="result-location">📍 <strong>${gameState.currentData.city || 'Unknown'}, ${gameState.currentData.region || 'Unknown'}, ${gameState.currentData.country || 'Unknown'}</strong> ${locationDetails.city === gameState.currentData.city ? '✅' : '❌'}</p>
              <p class="result-distance">Your guess was <strong>${distance.toFixed(1)} km</strong> from the correct location → <strong class="score-highlight">+${score}</strong></p>
              <p class="result-total">Total Score: <strong class="score-highlight">${gameState.currentScore}</strong></p>
              <div class="result-actions">
                  <a href="https://ipinfo.io/${ipAddress}" target="_blank" class="result-button ip-button">🔍 ${ipAddress}</a>
                  <button id="nextIpButton" class="result-button next-button">Next IP ➜</button>
              </div>
          </div>
          <div class="result-map" id="resultMap"></div>
      </div>
  `;

  // Initialize the small result map
  if (gameState.resultMap) {
      gameState.resultMap.remove();
  }
  gameState.resultMap = L.map('resultMap', {
      zoomControl: false,
      attributionControl: false
  });

  // Add the same tile layer as the main map
  L.tileLayer('https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: config.map.maxZoom
  }).addTo(gameState.resultMap);

  // Add markers for guess and real location
  const guessMarker = L.marker(guessLatLng, {
      icon: L.icon({ iconUrl: CONSTANTS.ICONS.blueDot, iconSize: [24, 24] })
  }).addTo(gameState.resultMap);
  
  const realMarker = L.marker(gameState.realLocation, {
      icon: L.icon({ iconUrl: CONSTANTS.ICONS.redDot, iconSize: [24, 24] })
  }).addTo(gameState.resultMap);

  // Draw a line between the points in result map
  const resultLine = L.polyline([guessLatLng, gameState.realLocation], { 
      color: 'green', 
      dashArray: '5,10',
      weight: 2
  }).addTo(gameState.resultMap);

  // Fit the bounds with some padding
  const resultBounds = L.latLngBounds([guessLatLng, gameState.realLocation]);
  gameState.resultMap.fitBounds(resultBounds, {
      padding: [20, 20],
      maxZoom: 8
  });

  // Enable keyboard shortcuts for next IP
  const handleNextIp = () => {
    const nextButton = document.getElementById('nextIpButton');
    if (nextButton) {
      nextButton.click();
    }
  };

  const nextIpKeyHandler = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleNextIp();
    }
  };

  document.addEventListener('keydown', nextIpKeyHandler);

  // Start prefetching the next IP while user reviews their guess
  if (gameState.guessCount < config.gameSettings.rounds - 1) {
    prefetchNextIP();
  }

  gameState.guessCount++;
  gameState.lastScore = score;

  // Update status box to show score instead of IP
  let details = `Score: <strong>+${score}</strong><br>`;
  if (gameState.currentData.org) {
    details += `ASN: <a href="https://ipinfo.io/${gameState.currentData.org.split(' ')[0]}" target="_blank">${gameState.currentData.org}</a><br>`;
  }
  if (currentMode === 'normal' && gameState.currentData.hostname) {
    details += `Hostname: ${gameState.currentData.hostname}<br>`;
  }
  document.getElementById('status').innerHTML = details;

  // Hide the "Guess" button after it's used
  guessButton.style.display = 'none';

  // Add event listener to the "Next IP?" button
  document.getElementById('nextIpButton').addEventListener('click', () => {
      // Remove keyboard event listener
      document.removeEventListener('keydown', nextIpKeyHandler);
      
      // Revert footer content to default
      resetFooter();

      // Re-enable pin dropping
      map.on('click', handleMapClick);

      if (gameState.guessCount >= config.gameSettings.rounds) {
          showSummary(); // Show summary if the game is over
      } else {
          gameState.currentData = null; // Clear the current data
          startGame(); // Start the next round
      }
  });
});

// Add function to prefetch next IP
async function prefetchNextIP() {
  gameState.nextIPData = await fetchValidIPLocation();
}

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) return await response.json();
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
        }
    }
    throw new Error('Failed to fetch data after multiple attempts.');
}