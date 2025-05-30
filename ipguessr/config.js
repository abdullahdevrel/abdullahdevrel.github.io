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
        'AS367',   // DoD Network Information Center
        'AS30722', // Vodafone Italia S.p.A.
        'AS3257',  // GTT Communications Inc.
        'AS9808',  // China Mobile Communications Group Co., Ltd.
        'AS33363', // Charter Communications, Inc
        'AS2907',  // Research Organization of Information and Systems, National Institute of Informatics
        'AS31399', // Mercedes-Benz Group AG
        'AS6167',  // Verizon Business
        'AS22394', // Verizon Business
        'AS45899', // VNPT Corp
        'AS9318',  // SK Broadband Co Ltd
        'AS56047', // China Mobile communications corporation
        'AS396982',// Google LLC
        'AS22773', // Cox Communications Inc.
        'AS20115', // Charter Communications LLC
        'AS56',    // DoD Network Information Center
        'AS8167',  // V tal
        'AS2828',  // Verizon Business
        'AS20001', // Charter Communications Inc
        'AS56048', // China Mobile Communications Corporation
        'AS6461',  // Zayo Bandwidth
        'AS174',   // Cogent Communications
        'AS12271', // Charter Communications Inc
        'AS3561',  // CenturyLink Communications, LLC
        'AS4538',  // China Education and Research Network Center
        'AS1221',  // Telstra Limited
        'AS16625', // Akamai Technologies, Inc.
        'AS702',    // Verizon Business
        'AS2856',   // British Telecommunications PLC
        'AS10429',  // TELEFÔNICA BRASIL S.A
        'AS17858',  // LG POWERCOMM
        'AS12322',  // Free SAS
        'AS237',    // Merit Network Inc.
        'AS6713',   // Office National des Postes et Telecommunications ONPT (Maroc Telecom) / IAM
        'AS306',    // DoD Network Information Center
        'AS45090',  // Shenzhen Tencent Computer Systems Company Limited
        'AS668',    // DoD Network Information Center
        'AS209',    // CenturyLink Communications, LLC
        'AS7843',   // Charter Communications Inc
        'AS15557'   // Societe Francaise Du Radiotelephone - SFR SA
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