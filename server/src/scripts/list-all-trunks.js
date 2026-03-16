
const { SipClient } = require('livekit-server-sdk');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(__dirname, '../../.env');
if (!fs.existsSync(envPath)) {
    console.error('.env file not found!');
    process.exit(1);
}

dotenv.config({ path: envPath });

const url = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

async function listTrunks() {
    const sipClient = new SipClient(url, apiKey, apiSecret);
    try {
        const trunks = await sipClient.listSipOutboundTrunk();
        console.log('Outbound Trunks:');
        trunks.forEach(t => {
            console.log(`- ID: ${t.sipTrunkId}, Name: ${t.name}, Numbers: ${t.numbers.join(', ')}`);
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

listTrunks();
