import { config } from './config.js';

export function getEmoji(distance) {
    if (distance < config.gameSettings.scoring.perfect.distance) return '🎯';
    if (distance < config.gameSettings.scoring.excellent.distance) return '🌟';
    if (distance < config.gameSettings.scoring.good.distance) return '👍';
    if (distance < config.gameSettings.scoring.fair.distance) return '🌍';
    return '✈️';
}

export function createSummaryCard(guesses, totalScore, totalTime) {
    const avgDistance = guesses.reduce((acc, guess) => acc + guess.distance, 0) / guesses.length;
    const perfectGuesses = guesses.filter(g => g.distance < 100).length;
    const minutes = Math.floor((totalTime / (1000 * 60)) % 60);
    const seconds = Math.floor((totalTime / 1000) % 60);
    const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Find the best guess (shortest distance)
    const bestGuess = guesses.reduce((best, current) => 
        current.distance < best.distance ? current : best
    , guesses[0]);
    
    const cardHTML = `
        <div class="summary-content">
            <h2>🎮 IP Guessr Results 🎮</h2>
            <div class="stats">
                <div class="stat-item">
                    <span class="stat-value">${totalScore}</span>
                    <span class="stat-label">Total Score</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${avgDistance.toFixed(0)}km</span>
                    <span class="stat-label">Avg Distance</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${perfectGuesses}</span>
                    <span class="stat-label">Perfect Guesses</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value">${timeStr}</span>
                    <span class="stat-label">Time</span>
                </div>
            </div>
            <div class="guesses-list">
                ${guesses.map((guess, index) => `
                    <div class="guess-item" onclick="this.classList.toggle('expanded')">
                        <div class="guess-summary">
                            <span class="guess-number">#${index + 1}</span>
                            <span class="guess-emoji">${getEmoji(guess.distance)}</span>
                            <span class="guess-ip"><a href="https://ipinfo.io/${guess.ip}" target="_blank" onclick="event.stopPropagation()">${guess.ip}</a></span>
                            <span class="guess-distance">${guess.distance.toFixed(0)}km</span>
                            <span class="guess-score">+${guess.score}</span>
                        </div>
                        <div class="guess-details">
                            <div class="detail-section">
                                <div class="detail-content">
                                    <div class="detail-item">
                                        <span class="detail-label">📍 IP Location:</span>
                                        <span class="detail-value">${guess.realLocation.city}, ${guess.realLocation.region}, ${guess.realLocation.country}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">🎯 Your Guess:</span>
                                        <span class="detail-value">${guess.guessedLocation.city}, ${guess.guessedLocation.region}, ${guess.guessedLocation.country}</span>
                                    </div>
                                </div>
                                <div class="detail-actions">
                                    <a href="https://ipinfo.io/${guess.ip}" class="detail-button" target="_blank" onclick="event.stopPropagation()">
                                        <span class="button-icon">🔍</span>
                                        <span class="button-text">IP</span>
                                    </a>
                                    ${guess.org ? `
                                    <a href="https://ipinfo.io/${guess.org.split(' ')[0]}" class="detail-button" target="_blank" onclick="event.stopPropagation()">
                                        <span class="button-icon">🌐</span>
                                        <span class="button-text">ASN</span>
                                    </a>
                                    ` : ''}
                                    <a href="https://ipinfo.io/countries/${guess.realLocation.country.toLowerCase()}" class="detail-button" target="_blank" onclick="event.stopPropagation()">
                                        <span class="button-icon">🗺️</span>
                                        <span class="button-text">Country</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <button onclick="location.reload()" class="play-again-button">Play Again 🎮</button>
            <div class="footer-text">
                Play at ipguessr.abdullahdevrel.io
            </div>
        </div>
        <div class="summary-map-container">
            <div class="map-title">🏆 Best Guess</div>
            <div class="summary-map" id="summaryMap"></div>
            <div class="map-details">
                <p>📍 <strong>IP:</strong> <a href="https://ipinfo.io/${bestGuess.ip}" target="_blank">${bestGuess.ip}</a></p>
                <p>🎯 <strong>Actual Location:</strong> ${bestGuess.realLocation.city}, ${bestGuess.realLocation.region}, ${bestGuess.realLocation.country}</p>
                <p>🌍 <strong>Your Guess:</strong> ${bestGuess.guessedLocation.city}, ${bestGuess.guessedLocation.region}, ${bestGuess.guessedLocation.country}</p>
                <p>📏 <strong>Distance:</strong> ${bestGuess.distance.toFixed(1)} km</p>
            </div>
        </div>
    `;
    
    // Wait for the next tick to ensure the map container is in the DOM
    setTimeout(() => {
        const summaryMap = L.map('summaryMap', {
            zoomControl: false,
            attributionControl: false
        });

        L.tileLayer('https://tiles.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 18
        }).addTo(summaryMap);

        // Add markers for the best guess
        const guessLatLng = [bestGuess.guessedLat, bestGuess.guessedLng];
        const realLatLng = [bestGuess.realLat, bestGuess.realLng];

        const guessMarker = L.marker(guessLatLng, {
            icon: L.icon({ 
                iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/blue-dot.png', 
                iconSize: [24, 24] 
            })
        }).addTo(summaryMap);

        const realMarker = L.marker(realLatLng, {
            icon: L.icon({ 
                iconUrl: 'https://maps.gstatic.com/mapfiles/ms2/micons/red-dot.png', 
                iconSize: [24, 24] 
            })
        }).addTo(summaryMap);

        // Draw a line between the points
        const line = L.polyline([guessLatLng, realLatLng], { 
            color: 'green', 
            dashArray: '5,10',
            weight: 2
        }).addTo(summaryMap);

        // Fit the map to show both markers
        const bounds = L.latLngBounds([guessLatLng, realLatLng]);
        summaryMap.fitBounds(bounds, {
            padding: [50, 50],
            maxZoom: 8
        });
    }, 0);
    
    return `<div class="summary-card">${cardHTML}</div>`;
}