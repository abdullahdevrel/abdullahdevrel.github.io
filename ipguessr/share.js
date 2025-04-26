export function generateShareText(bestGuess, totalScore) {
    return `I scored ${totalScore} points in IP Guessr! My best guess was only ${bestGuess.distance.toFixed(1)}km away! 🎯 Try it at abdullahdevrel.github.io/ipguessr`;
}

export function shareToSocialMedia(platform, text) {
    const encodedText = encodeURIComponent(text);
    const baseUrl = 'https://abdullahdevrel.github.io/ipguessr';
    const urls = {
        facebook: `https://www.facebook.com/sharer.php?u=${encodeURIComponent(baseUrl)}&quote=${encodedText}`,
        x: `https://x.com/intent/tweet?text=${encodedText}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl)}&summary=${encodedText}`
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
}