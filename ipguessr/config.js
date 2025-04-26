export const config = {
    excludedASNs: [
        'AS27142', // DoD Network Information Center
        'AS749',   // DoD Network Information Center
        'AS721',   // DoD Network Information Center
        'AS4134',  // CHINANET-BACKBONE
        'AS6389',  // AT&T Enterprises, LLC
        'AS17676', // SoftBank Corp.
        'AS8075',  // Microsoft Corporation
        'AS3356',  // Level 3 Parent, LLC
        'AS32703', // Zayo Bandwidth
        'AS4837',  // CHINA UNICOM China169 Backbone
        'AS20214', // Comcast Cable Communications, LLC
        'AS16509', // Amazon.com, Inc.
        'AS10796', // Charter Communications Inc
        'AS7377',  // University of California, San Diego
        'AS7922',  // Comcast Cable Communications
        'AS7792',  // Alaska Communications Internet
        'AS4766',  // Korea Telecom
        'AS334',   // Network Information Center Mexico
        'AS7738',  // Telemar Norte Leste S.A.
        'AS3320',  // Deutsche Telekom AG
        'AS701',   // Verizon Business
        'AS4713',  // NTT Communications Corporation
        'AS7018',  // AT&T Services
        'AS3269',  // Telecom Italia
        'AS367'    // DoD Network Information Center
    ],
    // Add more configuration options here as needed
    apiEndpoints: {
        ipinfo: 'https://ipinfo.io',
        nominatim: 'https://nominatim.openstreetmap.org'
    },
    map: {
        initialView: {
            lat: 20,
            lng: 0,
            zoom: 3
        },
        maxZoom: 18
    },
    gameSettings: {
        maxTries: 15, // Maximum number of tries to fetch a valid IP
        rounds: 10,   // Number of rounds in a game
        scoring: {
            perfect: { distance: 100, points: 100 },
            excellent: { distance: 500, points: 75 },
            good: { distance: 1000, points: 50 },
            fair: { distance: 2000, points: 25 },
            poor: { points: 10 } // Default points for distances > 2000km
        }
    }
};