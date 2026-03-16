const { SipClient } = require("livekit-server-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function inspectTrunk() {
    const sip = new SipClient(
        process.env.LIVEKIT_URL.replace("wss://", "https://"),
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
    );

    const TARGET_TRUNK_ID = "ST_dUbyArWKbTsW";
    const TARGET_NUMBER = "+17752427674";

    try {
        console.log(`--- INSPECTING TRUNK: ${TARGET_TRUNK_ID} ---`);

        // 1. List all trunks and find this one
        const trunks = await sip.listSipTrunk();
        const trunk = trunks.find(t => t.sipTrunkId === TARGET_TRUNK_ID);

        if (trunk) {
            console.log("Trunk Found!");
            console.log(JSON.stringify(trunk, null, 2));
        } else {
            console.log("Trunk NOT FOUND in list! Checking inbound-only list...");
            const inTrunks = await sip.listSipInboundTrunk();
            const inTrunk = inTrunks.find(t => t.sipTrunkId === TARGET_TRUNK_ID);
            if (inTrunk) {
                console.log("Inbound Trunk Found!");
                console.log(JSON.stringify(inTrunk, null, 2));
            } else {
                console.log("Trunk still NOT FOUND anywhere.");
            }
        }

        // 2. Check for ANY rules associated with this trunk
        console.log("\n--- SEARCHING FOR RULES ---");
        const rules = await sip.listSipDispatchRule();
        const associatedRules = rules.filter(r => r.trunkIds.includes(TARGET_TRUNK_ID));

        console.log(`Found ${associatedRules.length} rules associated with this trunk.`);
        associatedRules.forEach(r => {
            console.log(`- Rule: ${r.name} (ID: ${r.sipDispatchRuleId})`);
        });

    } catch (e) {
        console.error("Inspection failed:", e.message);
    }
}

inspectTrunk();
