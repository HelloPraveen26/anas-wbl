const { SipClient } = require('livekit-server-sdk');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function listRules() {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    const sipClient = new SipClient(livekitUrl, apiKey, apiSecret);

    console.log('Listing all dispatch rules...');
    try {
        const rules = await sipClient.listSipDispatchRule();
        console.log(`Found ${rules.length} rules:`);
        rules.forEach(r => {
            console.log(JSON.stringify(r, null, 2));
        });
    } catch (err) {
        console.error('Error listing rules:', err.message);
    }
}

listRules();
