const { SipClient } = require("livekit-server-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function getSipDetails() {
    const sip = new SipClient(
        process.env.LIVEKIT_URL.replace("wss://", "https://"),
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
    );

    try {
        // Creating a dummy trunk and deleting it is the only way to "discover" the SIP URI if it's not in the SDK
        // But actually, we can just look at the existing ones.
        const trunks = await sip.listSipTrunk();
        console.log("--- SIP URI AUDIT ---");
        if (trunks.length > 0) {
            // In SDK 2.x, some trunk objects might have the URI or we can infer it
            console.log("Checking trunks for SIP URI hints...");
            trunks.forEach(t => {
                console.log(`Trunk: ${t.name} (ID: ${t.sipTrunkId})`);
            });
        } else {
            console.log("No trunks found to check.");
        }
    } catch (e) {
        console.error("Audit failed:", e.message);
    }
}

getSipDetails();
