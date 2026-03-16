const { SipClient } = require("livekit-server-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function identifyProject() {
    console.log("--- PROJECT IDENTITY AUDIT ---");
    console.log("Target URL:", process.env.LIVEKIT_URL);
    console.log("API Key (first 5):", process.env.LIVEKIT_API_KEY.substring(0, 5));

    const sip = new SipClient(
        process.env.LIVEKIT_URL.replace("wss://", "https://"),
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
    );

    try {
        const rules = await sip.listSipDispatchRule();
        console.log("Found Dispatch Rules Count:", rules.length);
        if (rules.length > 0) {
            console.log("First Rule ID:", rules[0].sipDispatchRuleId);
            console.log("First Rule Name:", rules[0].name);
        }

        const trunks = await sip.listSipTrunk();
        console.log("Found SIP Trunks Count:", trunks.length);
        if (trunks.length > 0) {
            console.log("Sample Trunk Name:", trunks[0].name);
        }
    } catch (e) {
        console.error("Audit failed:", e.message);
    }
}

identifyProject();
