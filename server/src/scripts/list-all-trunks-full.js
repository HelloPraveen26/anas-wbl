
const { SipClient } = require('livekit-server-sdk');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const url = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

async function listTrunks() {
    const sipClient = new SipClient(url, apiKey, apiSecret);
    try {
        const trunks = await sipClient.listSipOutboundTrunk();
        console.log(JSON.stringify(trunks, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listTrunks();
