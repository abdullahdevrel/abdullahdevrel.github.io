// randomIPs.js
// Utility to generate an array of 5 random IPv4 addresses

import { config } from './config.js';

const EXCLUDED_DOMAINS = new Set(['mail.mil','amazon.com','chinatelecom.com.cn','att.com','verizonbusiness.com','chinaunicom.cn','comcast.com','microsoft.com','lumen.com','kt.com','charter.com','softbank.jp','ntt.com','telekom.de','cogentco.com','orange.com','telecomitalia.com','telefonica.com.br','10086.cn','google.com','kddi.com','apple.com','chinamobile.com','cernet.edu.cn','mercedes-benz.com','claro.com.br','skbroadband.com','sfr.fr','bt.com','t-mobile.com','telstra.com.au','telmex.com','alibabagroup.com','akamai.com','vodafone.de','ucsd.edu','hinet.net','cox.com','free.fr','lguplus.co.kr','frontier.com','movistar.es','tim.com.br','vtal.com','windstream.com','airtel.com','rt.ru','virginmedia.com','sinet.ad.jp','chinatelecom.cn','bell.ca','iam.net.ma','telecom.com.ar','telefonica.de','uplus.co.kr','sky.com','tencent.com','gtt.net','dfn.de','sktelecom.com','vnpt.vn','te.eg','turktelekom.com.tr','kpn.com','windtre.it','surf.nl','jisc.ac.uk','bouyguestelecom.fr','orange.es','teliacompany.com','telenor.no','arteria-net.com','jcom.co.jp','vodafone.nl','tele2.com','etisalat.com.eg','vodafone.it','bsnl.co.in','chartercom.com','optus.com.au','telkomsel.com','rogers.com','twnic.net.tw','orange.pl','viettel.com.vn','shaw.ca','tdcgroup.com','renater.fr','cablevision.com','lilly.com','telus.com','comcel.com.co','mobinil.com','telefonica.com.ar','ovhcloud.com','pg.com','algerietelecom.dz','stc.com.sa','telin.net','jio.com','oracle.com','bta.net.cn','ibm.com','proximus.com','vodafone.es','sonynetwork.co.jp','iij.ad.jp','ptcl.com.pk','elisa.fi','mtn.com','biglobe.co.jp','swisscom.ch','fastweb.it','vodafone.com','safaricom.co.ke','telia.fi','tpgtelecom.com.au','movistar.com.co','tm.com.my','is.co.za','nasa.gov','tci.ir','usda.gov','telkom.co.za','optage.co.jp','odido.nl','digitalocean.com','texas.gov','pldt.com','mobily.com.sa','telefonicachile.cl','tatacommunications.com','optimum.com','hetzner.de','a1.net','chinatietong.com','gfiber.com','garr.it','ertelecom.ru','pxc.co.uk','hpc.mil','vodacom.com','ono.es','huaweicloud.com','nttdocomo.com','vodafone.co.uk','videotron.com','claro.com.co','centurylink.com','une.com.co','ooredoo.tn','cantv.com.ve','ioh.co.id','ncr.com','orange.ma','emirates.net.ae','mts.ru','telenor.dk','telenet.be','megacable.com.mx','mci.ir','meo.pt','play.pl','merit.edu','ote.gr','switch.ch','antel.com.uy','seed.net.tw','orange.co.il','sunrise.ch','rackspace.com','brightspeed.com','vodafone.com.eg','belwue.de','plus.net','taiwanmobile.com','mcnc.org','nttpc.co.jp','nos.pt','o2.cz','cenic.org','astound.com','telefonica.com','tunisietelecom.tn','cloudflare.com','corbina.net','dodig.mil','airtel.in','freebit.com','orange.tn','mit.edu','as1101.net','leaseweb.com','heanet.ie','globalconnect.no','dna.fi','hkbn.net','usg.edu','digi.ro']);
const API_TOKEN = 'a6c2e5328296f5';
const BASE_URL = 'https://api.ipinfo.io/lite';
const BATCH_SIZE = 10;

function getRandomIP() {
    const octet = () => Math.floor(Math.random() * 256);
    return `${octet()}.${octet()}.${octet()}.${octet()}`;
}

async function checkIP(ip) {
    try {
        const response = await fetch(`${BASE_URL}/${ip}/as_domain?token=${API_TOKEN}`);
        if (response.status !== 200) {
            console.warn(`Skipping IP: ${ip} due to non-200 status code: ${response.status}`);
            return null;
        }

        const domain = (await response.text()).trim();
        if (!domain) {
            console.warn(`Invalid response for IP: ${ip}`);
            return null;
        }

        return EXCLUDED_DOMAINS.has(domain) ? null : ip;
    } catch (error) {
        console.error(`Error processing IP: ${ip}`, error);
        return null;
    }
}

export async function getRandomIPs(count = 5) {
    const validIPs = [];
    const maxAttempts = config.gameSettings.maxTries * count;
    let attempts = 0;

    while (validIPs.length < count && attempts < maxAttempts) {
        const batchSize = Math.min(BATCH_SIZE, maxAttempts - attempts);
        const batch = Array.from({ length: batchSize }, getRandomIP);
        attempts += batchSize;

        const results = await Promise.all(batch.map(checkIP));
        for (const ip of results) {
            if (ip && validIPs.length < count) validIPs.push(ip);
        }
    }

    return validIPs;
}
