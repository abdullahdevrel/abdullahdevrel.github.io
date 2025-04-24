  const map = L.map('map').setView([20, 0], 3);
  L.tileLayer('https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 18
  }).addTo(map);
  
  let currentScore = 0;
  let ipAddress = '';
  let realLocation = null;
  let previousIpAddress = null;
  let guessedItems = [];
  let guesses = []; // Stores guesses for each round
  let currentMode = localStorage.getItem('ipGuessMode') || '';
  let guessCount = 0; // Tracks number of guesses
  let currentData = null; // Store data globally for access in event handler
  
  const modeSelector = document.getElementById('modeSelector');
  modeSelector.value = currentMode;
  
  modeSelector.addEventListener('change', () => {
    currentMode = modeSelector.value;
    localStorage.setItem('ipGuessMode', currentMode);
  });
  
  const infoDiv = document.getElementById('info');
  const scoreDisplay = document.getElementById('scoreDisplay');
  
  async function startGame() {
    if (!currentMode) {
      alert("Please select a mode before starting the game.");
      return;
    }

    clearMap();
    document.getElementById('result').innerHTML = '';
    document.getElementById('status').innerText = 'Fetching a new IP...';
    infoDiv.classList.add('playing');
  
    const fetchedData = await fetchValidIPLocation();
    if (!fetchedData) {
      document.getElementById('status').innerText = 'Failed to load IP info. Try again.';
      return;
    }
  
    // Store the fetched data in the `currentData` variable globally
    currentData = fetchedData;
  
    // Update the last IP address link if there's a previous one
    if (previousIpAddress) {
      document.getElementById('lastIpLink').innerHTML = `Last IP address: <a href="https://ipinfo.io/${previousIpAddress}" target="_blank">${previousIpAddress}</a>`;
    } else {
      document.getElementById('lastIpLink').innerHTML = '';
    }
  
    previousIpAddress = currentData.ip;
    ipAddress = currentData.ip;
    realLocation = currentData.loc.split(',').map(Number);
    map.setView([20, 0], 3);
  
    let details = `IP: <strong>${ipAddress}</strong><br>`;
    if (currentData.org) {
      const asn = currentData.org.split(' ')[0]; // Extract ASN like AS12345
      details += `ASN: <a href="https://ipinfo.io/${asn}" target="_blank">${currentData.org}</a><br>`;
    }
    if (currentMode === 'normal' && currentData.hostname) {
      details += `Hostname: ${currentData.hostname}<br>`;
    }

  
    document.getElementById('status').innerHTML = details + 'Click on the map to drop your pin.';
  }
  
  async function fetchValidIPLocation() {
    for (let i = 0; i < 15; i++) {
      const ip = getRandomIP();
      try {
        const res = await fetch(`https://ipinfo.io/${ip}/json`);
        const data = await res.json();
        if (!data.bogon && data.loc) {
          return data;
        }
      } catch (e) {
        continue;
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
    if (km < 100) return 100;
    if (km < 500) return 75;
    if (km < 1000) return 50;
    if (km < 2000) return 25;
    return 10;
  }
  
  map.on('click', async function(e) {
    if (!realLocation || !currentData) return;
  
    const guessLatLng = [e.latlng.lat, e.latlng.lng];
  
    // Fetch location details using Nominatim reverse geocoding API
    const locationDetails = await getLocationDetails(guessLatLng);
    if (!locationDetails) {
        alert("Could not fetch location details.");
        return;
    }

    // Add a marker for the guess and the real location
    const markerGuess = L.marker(guessLatLng, {icon: L.icon({iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png', iconSize: [24, 24]})}).addTo(map);
    const markerReal = L.marker(realLocation, {icon: L.icon({iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png', iconSize: [24, 24]})}).addTo(map);
  
    const line = L.polyline([guessLatLng, realLocation], {color: 'green', dashArray: '5,10'}).addTo(map);
    guessedItems.push(markerGuess, markerReal, line);
  
    // Calculate the distance and score
    const distance = haversineDistance(...guessLatLng, ...realLocation);
    const score = scoreFromDistance(distance);
    currentScore += score;
  
    // Display the results
    document.getElementById('result').innerHTML = `You were <strong>${distance.toFixed(1)} km</strong> away. You earned <strong>${score}</strong> points.`;
    scoreDisplay.innerText = `Total Score: ${currentScore}`;
  
    // Save the guess data for the round
    guesses.push({
        ip: ipAddress,
        distance,
        score,
        guessedLocation: locationDetails,
        realLocation: {
            city: currentData.city || 'Unknown',
            region: currentData.region || 'Unknown',
            country: currentData.country || 'Unknown'
        }
    });


  
    guessCount++;
  
    if (guessCount >= 5) {
        showSummary();
    } else {
        currentData = null; // Clear the location and fetch a new one
        setTimeout(startGame, 2000);
    }
  });
  
  // Function to fetch location details (city, region, country) from Nominatim
  async function getLocationDetails(latLng) {
    const [lat, lon] = latLng;
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1&accept-language=en`;
  
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
    document.getElementById('modeSelector').outerHTML = '';
    document.getElementById('startButton').outerHTML = '';

  let summaryHTML = '<h3>Game Summary</h3><ul style="padding-left: 20px;">';
  let totalDistance = 0;

  guesses.forEach((guess, index) => {
    const guessed = guess.guessedLocation;
    const real = guess.realLocation;
    const ip = guess.ip;

    const cityMatch = guessed.city === real.city;
    const regionMatch = guessed.region === real.region;
    const countryMatch = guessed.country === real.country;

    totalDistance += guess.distance;

    summaryHTML += `
      <li style="margin-bottom: 10px;">
        <strong>Guess ${index + 1}</strong> - 
        <a href="https://ipinfo.io/${ip}" target="_blank">${ip}</a><br>
        City: ${guessed.city} ${cityMatch ? '✅' : '❌'} vs ${real.city}<br>
        Region: ${guessed.region} ${regionMatch ? '✅' : '❌'} vs ${real.region}<br>
        Country: ${guessed.country} ${countryMatch ? '✅' : '❌'} vs ${real.country}<br>
        Distance: ${guess.distance.toFixed(1)} km - Score: ${guess.score}
      </li>
    `;
  });

  const averageDistance = (totalDistance / guesses.length).toFixed(1);
  summaryHTML += '</ul>';
  summaryHTML += `<p><strong>Average Distance:</strong> ${averageDistance} km</p>`;

  document.getElementById('summary').innerHTML = summaryHTML;
  infoDiv.classList.remove('playing');
}


