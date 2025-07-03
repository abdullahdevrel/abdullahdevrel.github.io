// randomIPs.js
// Utility to generate an array of 5 random IPv4 addresses

const EXCLUDED_DOMAINS = ['cloudflare.com'];
const API_TOKEN = 'd669c1cf0c2cfa';
const BASE_URL = 'https://api.ipinfo.io/lite';

function getRandomIP() {
    const octet = () => Math.floor(Math.random() * 256);
    return `${octet()}.${octet()}.${octet()}.${octet()}`;
}

export async function getRandomIPs(count = 5) {
    const validIPs = [];

    while (validIPs.length < count) {
        const ip = getRandomIP();
        try {
            const response = await fetch(`${BASE_URL}/${ip}/as_domain?token=${API_TOKEN}`);
            if (response.status !== 200) {
                console.warn(`Skipping IP: ${ip} due to non-200 status code: ${response.status}`);
                continue;
            }

            // Get content type but don't skip based on it - we're handling text responses
            const contentType = response.headers.get('Content-Type');

            const text = await response.text();
            const data = { domain: text.trim() }; // Assume plain text is the domain

            if (!data || !data.domain) {
                console.warn(`Invalid response for IP: ${ip}`);
                continue;
            }

            const domain = data.domain;
            if (!EXCLUDED_DOMAINS.includes(domain)) {
                validIPs.push(ip);
            }
        } catch (error) {
            console.error(`Error processing IP: ${ip}`, error);
        }
    }

    return validIPs;
}
