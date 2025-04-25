function getEmoji(distance) {
    if (distance < 100) return '🎯';
    if (distance < 500) return '🌟';
    if (distance < 1000) return '👍';
    if (distance < 2000) return '🌍';
    return '✈️';
}

function getPerformanceMessage(avgDistance) {
    if (avgDistance < 100) return "You're a geography genius! 🏆";
    if (avgDistance < 500) return "Outstanding performance! 🌟";
    if (avgDistance < 1000) return "Great job! 🎉";
    if (avgDistance < 2000) return "Not bad at all! 💪";
    return "Keep practicing! 📚";
}

function createSummaryCard(guesses, totalScore, totalTime) {
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
                    <div class="guess-item">
                        <span class="guess-number">#${index + 1}</span>
                        <span class="guess-emoji">${getEmoji(guess.distance)}</span>
                        <span class="guess-distance">${guess.distance.toFixed(0)}km</span>
                        <span class="guess-score">+${guess.score}</span>
                    </div>
                `).join('')}
            </div>
            <div class="performance-message">
                ${getPerformanceMessage(avgDistance)}
            </div>
            <div class="footer-text">
                Play at ipguessr.abdullahdevrel.io
            </div>
        </div>
    `;
    
    return cardHTML;
}