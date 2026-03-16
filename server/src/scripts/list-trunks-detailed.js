const { SipClient } = require("livekit-server-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function listTrunks() {
    const client = new SipClient(
        process.env.LIVEKIT_URL.replace("wss://", "https://"),
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
    );

    const trunks = await client.listSipTrunk();
    console.log("SIP Trunks:", JSON.stringify(trunks, null, 2));
}

listTrunks().catch(console.error);
