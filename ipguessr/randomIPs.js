// randomIPs.js
// Utility to generate an array of 5 random IPv4 addresses

export function getRandomIPs(count = 5) {
    function getRandomIP() {
        const octet = () => Math.floor(Math.random() * 256);
        return `${octet()}.${octet()}.${octet()}.${octet()}`;
    }
    return Array.from({ length: count }, getRandomIP);
}
