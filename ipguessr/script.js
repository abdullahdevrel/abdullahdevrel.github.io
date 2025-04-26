import { config } from './config.js';
import { createSummaryCard } from './summary.js';

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

let currentScore = 0;
let ipAddress = '';
let realLocation = null;
let previousIpAddress = null;
let guessedItems = [];
let guesses = []; // Stores guesses for each round
let currentMode = localStorage.getItem('ipGuessMode') || '';
let guessCount = 0; // Tracks number of guesses
let currentData = null; // Store data globally for access in event handler
let nextIPData = null; // Store the next IP data

// Add timer variables at the top with other global variables
let startTime = null;
let timerInterval = null;
let totalTime = 0;

// At the top with other global variables
let resultMap = null;

const modeSelector = document.getElementById('modeSelector');
modeSelector.value = currentMode;

modeSelector.addEventListener('change', () => {
  currentMode = modeSelector.value;
  localStorage.setItem('ipGuessMode', currentMode);
});

const infoDiv = document.getElementById('info');
const scoreDisplay = document.getElementById('scoreDisplay');

const excludedASNs = config.excludedASNs; // List of ASNs for which the IP address should not be shown

function formatTime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimer() {
    if (!startTime) return;
    const timeDisplay = document.getElementById('timeDisplay');
    if (timeDisplay) {
        const currentTime = Date.now() - startTime;
        timeDisplay.innerHTML = `Time: <strong>${formatTime(currentTime)}</strong>`;
    }
}

function startTimer() {
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    if (startTime) {
        totalTime = Date.now() - startTime;
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
  
  // Only create time display and start timer if this is the first round (no guesses yet)
  if (guessCount === 0) {
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
  const fetchedData = nextIPData || await fetchValidIPLocation();
  nextIPData = null; // Clear the prefetched data

  if (!fetchedData) {
    document.getElementById('status').innerText = 'Failed to load IP info. Try again.';
    return;
  }

  // Store the fetched data in the `currentData` variable globally
  currentData = fetchedData;

  // Update the last IP address link if there's a previous one
  if (previousIpAddress) {
    document.getElementById('lastIpLink').innerHTML = `Last IP: <a href="https://ipinfo.io/${previousIpAddress}" target="_blank">${previousIpAddress}</a>`;
  } else {
    document.getElementById('lastIpLink').innerHTML = '';
  }

  previousIpAddress = currentData.ip;
  ipAddress = currentData.ip;
  realLocation = currentData.loc.split(',').map(Number);
  map.flyTo([config.map.initialView.lat, config.map.initialView.lng], config.map.initialView.zoom, {
    duration: 0.8,
    easeLinearity: 0.5
  });

  let details = '';
  details += `IP: <strong>${ipAddress}</strong><br>`;
  if (currentData.org) {
    details += `ASN: <a href="https://ipinfo.io/${currentData.org.split(' ')[0]}" target="_blank">${currentData.org}</a><br>`;
  }
  if (currentMode === 'normal' && currentData.hostname) {
    details += `Hostname: ${currentData.hostname}<br>`;
  }

  document.getElementById('status').innerHTML = details + 'Click on the map to drop your pin.';
}

async function fetchValidIPLocation() {
  const BATCH_SIZE = 5; // Number of parallel requests per batch
  const NUM_BATCHES = 3; // Fixed number of batches

  for (let batch = 0; batch < NUM_BATCHES; batch++) {
    const requests = [];
    
    // Create BATCH_SIZE parallel requests for this batch
    for (let i = 0; i < BATCH_SIZE; i++) {
      const ip = getRandomIP();
      requests.push(
        fetch(`${config.apiEndpoints.ipinfo}/${ip}/json`)
          .then(res => res.json())
          .then(data => ({ ip, data }))
          .catch(() => ({ ip, data: null }))
      );
    }

    // Wait for all requests in this batch to complete
    const results = await Promise.all(requests);
    
    // Check each result for validity
    for (const { data } of results) {
      if (data && !data.bogon && data.loc && data.org && 
          !config.excludedASNs.includes(data.org.split(' ')[0])) {
        return data;
      }
    }
  }
  
  return null;
}

function getRandomIP() {
  const octet = () => Math.floor(Math.random() * 256);
  return `${octet()}.${octet()}.${octet()}.${octet()}`;
}

function clearMap() {
  guessedItems.forEach(item => map.removeLayer(item));
  guessedItems.length = 0;
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
      totalScoreElement.textContent = currentScore;
  }
}

// Update the total score display dynamically
function updateScoreDisplay() {
  const scoreDisplayElement = document.getElementById('scoreDisplay');
  if (scoreDisplayElement) {
      scoreDisplayElement.innerHTML = `Total Score: <strong>${currentScore}</strong>`;
  }
}

map.on('click', function (e) {
  if (!realLocation || !currentData) return;

  const guessLatLng = e.latlng;

  // Remove any previously placed pins
  if (guessedItems.length > 0) {
      map.removeLayer(guessedItems[guessedItems.length - 1]);
  }

  // Place a pin on the map
  const markerGuess = L.marker(guessLatLng, {
      icon: L.icon({ iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png', iconSize: [24, 24] })
  }).addTo(map);
  guessedItems.push(markerGuess);

  // Show the "Guess" button
  guessButton.style.display = 'block';

  // Store the guess location for later use
  guessButton.dataset.lat = guessLatLng.lat;
  guessButton.dataset.lng = guessLatLng.lng;
});

// Add keyboard event listeners for Enter and Space keys
document.addEventListener('keydown', (event) => {
  if (guessButton.style.display === 'block' && (event.key === 'Enter' || event.key === ' ')) {
      guessButton.click();
  }
});

// Function to fetch location details (city, region, country) from Nominatim
async function getLocationDetails(latLng) {
  const [lat, lon] = latLng;
  const url = `${config.apiEndpoints.nominatim}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=en`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.address) {
      return {
        city: data.address.city || data.address.town || data.address.village || 'Unknown',
        region: data.address.state || 'Unknown',
        country: data.address.country_code.toUpperCase() || 'Unknown'
      };
    }
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

    const summaryHTML = createSummaryCard(guesses, currentScore, totalTime);
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
  if (!realLocation || !currentData) return;

  const guessLatLng = [parseFloat(guessButton.dataset.lat), parseFloat(guessButton.dataset.lng)];

  // Fetch location details using Nominatim reverse geocoding API
  const locationDetails = await getLocationDetails(guessLatLng);
  if (!locationDetails) {
      alert("Could not fetch location details.");
      return;
  }

  // Add a marker for the real location
  const mainMarkerReal = L.marker(realLocation, {
      icon: L.icon({ iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png', iconSize: [24, 24] })
  }).addTo(map);

  const mainLine = L.polyline([guessLatLng, realLocation], { color: 'green', dashArray: '5,10' }).addTo(map);
  guessedItems.push(mainMarkerReal, mainLine);

  // Create a bounds object that includes both pins
  const mainBounds = L.latLngBounds([guessLatLng, realLocation]);
  
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
  const distance = haversineDistance(...guessLatLng, ...realLocation);
  const score = scoreFromDistance(distance);
  currentScore += score;
  updateTotalScoreDisplay();
  updateScoreDisplay();

  // Save the guess data for the round
  guesses.push({
      ip: ipAddress,
      distance,
      score,
      org: currentData.org,
      guessedLocation: locationDetails,
      realLocation: {
          city: currentData.city || 'Unknown',
          region: currentData.region || 'Unknown',
          country: currentData.country || 'Unknown'
      },
      guessedLat: guessLatLng[0],
      guessedLng: guessLatLng[1],
      realLat: realLocation[0],
      realLng: realLocation[1]
  });

  // Update the footer with redesigned results
  const footer = document.getElementById('footer');
  footer.innerHTML = `
      <div class="result-container">
          <div class="result-info">
              <p class="result-location">📍 <strong>${currentData.city || 'Unknown'}, ${currentData.region || 'Unknown'}, ${currentData.country || 'Unknown'}</strong> ${locationDetails.city === currentData.city ? '✅' : '❌'}</p>
              <p class="result-distance">Your guess was <strong>${distance.toFixed(1)} km</strong> from the correct location → <strong class="score-highlight">+${score}</strong></p>
              <p class="result-total">Total Score: <strong class="score-highlight">${currentScore}</strong></p>
              <div class="result-actions">
                  <a href="https://ipinfo.io/${ipAddress}" target="_blank" class="result-button ip-button">🔍 ${ipAddress}</a>
                  <button id="nextIpButton" class="result-button next-button">Next IP ➜</button>
              </div>
          </div>
          <div class="result-map" id="resultMap"></div>
      </div>
  `;

  // Initialize the small result map
  if (resultMap) {
      resultMap.remove();
  }
  resultMap = L.map('resultMap', {
      zoomControl: false,
      attributionControl: false
  });

  // Add the same tile layer as the main map
  L.tileLayer('https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: config.map.maxZoom
  }).addTo(resultMap);

  // Add markers for guess and real location
  const guessMarker = L.marker(guessLatLng, {
      icon: L.icon({ iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png', iconSize: [24, 24] })
  }).addTo(resultMap);
  
  const realMarker = L.marker(realLocation, {
      icon: L.icon({ iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png', iconSize: [24, 24] })
  }).addTo(resultMap);

  // Draw a line between the points in result map
  const resultLine = L.polyline([guessLatLng, realLocation], { 
      color: 'green', 
      dashArray: '5,10',
      weight: 2
  }).addTo(resultMap);

  // Fit the bounds with some padding
  const resultBounds = L.latLngBounds([guessLatLng, realLocation]);
  resultMap.fitBounds(resultBounds, {
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
  if (guessCount < config.gameSettings.rounds - 1) {
    prefetchNextIP();
  }

  guessCount++;

  // Hide the "Guess" button after it's used
  guessButton.style.display = 'none';

  // Add event listener to the "Next IP?" button
  document.getElementById('nextIpButton').addEventListener('click', () => {
      // Remove keyboard event listener
      document.removeEventListener('keydown', nextIpKeyHandler);
      
      // Revert footer content to default
      resetFooter();

      // Re-enable pin dropping
      map.on('click', function (e) {
          if (!realLocation || !currentData) return;

          const guessLatLng = e.latlng;

          // Remove any previously placed pins
          if (guessedItems.length > 0) {
              map.removeLayer(guessedItems[guessedItems.length - 1]);
          }

          // Place a pin on the map
          const markerGuess = L.marker(guessLatLng, {
              icon: L.icon({ iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png', iconSize: [24, 24] })
          }).addTo(map);
          guessedItems.push(markerGuess);

          // Show the "Guess" button
          guessButton.style.display = 'block';

          // Store the guess location for later use
          guessButton.dataset.lat = guessLatLng.lat;
          guessButton.dataset.lng = guessLatLng.lng;
      });

      if (guessCount >= config.gameSettings.rounds) {
          showSummary(); // Show summary if the game is over
      } else {
          currentData = null; // Clear the current data
          startGame(); // Start the next round
      }
  });
});

// Add function to prefetch next IP
async function prefetchNextIP() {
  nextIPData = await fetchValidIPLocation();
}


