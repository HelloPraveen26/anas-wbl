const { SipClient } = require("livekit-server-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function finalAudit() {
    const sip = new SipClient(
        process.env.LIVEKIT_URL.replace("wss://", "https://"),
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
    );

    const TARGET_NUMBER = "+17752427674";

    try {
        console.log(`--- FINAL AUDIT FOR ${TARGET_NUMBER} ---`);

        const trunks = await sip.listSipTrunk();
        const relevantTrunks = trunks.filter(t =>
            t.inboundNumbers?.includes(TARGET_NUMBER) ||
            t.numbers?.includes(TARGET_NUMBER) ||
            t.name.includes(TARGET_NUMBER)
        );

        console.log(`Found ${relevantTrunks.length} relevant trunks:`);
        relevantTrunks.forEach(t => {
            console.log(`- Trunk: ${t.name} (ID: ${t.sipTrunkId})`);
        });

        const rules = await sip.listSipDispatchRule();
        const relevantRules = rules.filter(r =>
            r.inboundNumbers?.includes(TARGET_NUMBER) ||
            r.name.includes(TARGET_NUMBER)
        );

        console.log(`\nFound ${relevantRules.length} relevant rules:`);
        relevantRules.forEach(r => {
            console.log(`- Rule: ${r.name} (ID: ${r.sipDispatchRuleId})`);
            console.log(`  Linked Trunks: ${r.trunkIds.join(", ")}`);
        });

        console.log("\n--- CONCLUSION ---");
        const activeTrunk = "ST_dUbyArWKbTsW"; // From screenshot
        const isTrunkInList = relevantTrunks.some(t => t.sipTrunkId === activeTrunk);
        console.log(`Is the active trunk (${activeTrunk}) in the list? ${isTrunkInList}`);

    } catch (e) {
        console.error("Audit failed:", e.message);
    }
}

finalAudit();
