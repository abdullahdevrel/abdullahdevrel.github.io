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
    
    const cardHTML = `
        <div class="summary-card">
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
    `;
    
    return cardHTML;
}