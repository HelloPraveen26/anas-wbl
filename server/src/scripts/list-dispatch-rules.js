const { SipClient } = require('livekit-server-sdk');
const dotenv = require('dotenv');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const url = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

async function listDispatchRules() {
    const httpsUrl = url.replace('wss://', 'https://').replace('ws://', 'http://');
    console.log('Connecting to:', httpsUrl);
    const sipClient = new SipClient(httpsUrl, apiKey, apiSecret);
    try {
        const rules = await sipClient.listSipDispatchRule();
        console.log(JSON.stringify(rules, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listDispatchRules();
