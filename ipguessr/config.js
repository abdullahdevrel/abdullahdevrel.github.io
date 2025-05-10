export const config = {
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
        rounds: 5,   // Number of rounds in a game
        scoring: {
            perfect: { distance: 100, points: 100 },
            excellent: { distance: 500, points: 75 },
            good: { distance: 1000, points: 50 },
            fair: { distance: 2000, points: 25 },
            poor: { points: 10 } // Default points for distances > 2000km
        }
    }
};