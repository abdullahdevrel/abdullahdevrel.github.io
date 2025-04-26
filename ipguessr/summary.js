import { config } from './config.js';
import { generateShareText, shareToSocialMedia } from './share.js';

// Make share functions available globally as soon as the module loads
window.shareToSocialMedia = shareToSocialMedia;
window.generateShareText = generateShareText;

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
    
    // Create a safe version of bestGuess for sharing
    const shareData = {
        distance: bestGuess.distance,
        ip: bestGuess.ip,
        realLocation: bestGuess.realLocation,
        guessedLocation: bestGuess.guessedLocation
    };
    
    // Create a serialized version of the share data
    const serializedShareData = encodeURIComponent(JSON.stringify(shareData));
    
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
            <div class="share-container">
                <p class="share-text">Share your achievement! 🏆</p>
                <div class="share-buttons">
                    <button onclick="window.shareToSocialMedia('facebook', window.generateShareText(JSON.parse(decodeURIComponent('${serializedShareData}')), ${totalScore}))" class="share-button facebook">
                        <svg viewBox="0 0 24 24" class="share-icon"><path fill="currentColor" d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z"/></svg>
                    </button>
                    <button onclick="window.shareToSocialMedia('x', window.generateShareText(JSON.parse(decodeURIComponent('${serializedShareData}')), ${totalScore}))" class="share-button x">
                        <svg viewBox="0 0 24 24" class="share-icon"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </button>
                    <button onclick="window.shareToSocialMedia('linkedin', window.generateShareText(JSON.parse(decodeURIComponent('${serializedShareData}')), ${totalScore}))" class="share-button linkedin">
                        <svg viewBox="0 0 24 24" class="share-icon"><path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                    </button>
                </div>
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