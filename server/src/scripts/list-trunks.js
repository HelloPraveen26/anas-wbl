
const { SipClient } = require('livekit-server-sdk');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../../.env');
console.log('Loading .env from:', envPath);
if (!fs.existsSync(envPath)) {
    console.error('.env file not found!');
    process.exit(1);
}

dotenv.config({ path: envPath });

const url = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

async function listTrunks() {
    if (!url || !apiKey || !apiSecret) {
        console.error('LiveKit credentials missing in .env!');
        process.exit(1);
    }

    console.log('Connecting to:', url);
    console.log('API Key:', apiKey);

    const sipClient = new SipClient(url, apiKey, apiSecret);

    const timer = setTimeout(() => {
        console.error('Request timed out after 15 seconds');
        process.exit(1);
    }, 15000);

    try {
        const trunks = await sipClient.listSipOutboundTrunk();
        clearTimeout(timer);
        console.log('Outbound Trunks:', JSON.stringify(trunks, null, 2));

        const inboundTrunks = await sipClient.listSipInboundTrunk();
        console.log('\nInbound Trunks:', JSON.stringify(inboundTrunks, null, 2));
    } catch (error) {
        clearTimeout(timer);
        console.error('Error:', error.message);
        process.exit(1);
    }
}

listTrunks();
