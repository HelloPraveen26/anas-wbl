const { SipClient } = require("livekit-server-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function totalCleanup() {
    const sip = new SipClient(
        process.env.LIVEKIT_URL.replace("wss://", "https://"),
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
    );

    const TARGET_NUMBER = "+17752427674";

    try {
        console.log(`--- STARTING TOTAL CLEANUP FOR ${TARGET_NUMBER} ---`);

        // 1. Find and Delete ALL rules for this number
        const rules = await sip.listSipDispatchRule();
        for (const rule of rules) {
            if (rule.inboundNumbers.includes(TARGET_NUMBER) || rule.name.includes(TARGET_NUMBER)) {
                console.log(`Deleting stale rule: ${rule.name} (ID: ${rule.sipDispatchRuleId})`);
                await sip.deleteSipDispatchRule(rule.sipDispatchRuleId);
            }
        }

        // 2. Find and Delete ALL trunks for this number
        const trunks = await sip.listSipTrunk();
        for (const trunk of trunks) {
            if (trunk.inboundNumbers?.includes(TARGET_NUMBER) || trunk.name.includes(TARGET_NUMBER) || trunk.outboundNumber === TARGET_NUMBER) {
                console.log(`Deleting stale trunk: ${trunk.name} (ID: ${trunk.sipTrunkId})`);
                await sip.deleteSipTrunk(trunk.sipTrunkId);
            }
        }

        console.log("Cleanup complete. Now recreating clean setup...");

        // 3. Create fresh Inbound Trunk
        const trunk = await sip.createSipInboundTrunk(
            `CLEAN-TWILIO-${TARGET_NUMBER}`,
            [TARGET_NUMBER]
        );
        console.log(`Created fresh Inbound Trunk: ${trunk.sipTrunkId}`);

        // 4. Create fresh Dispatch Rule
        // Metadata is required by your agent to find the assistant
        const assistantId = "59bf3581-e59b-4fd1-9388-7050a1ddda77"; // From your previous logs
        const metadata = JSON.stringify({
            assistant_id: assistantId,
            phone_number: TARGET_NUMBER,
            call_type: "inbound"
        });

        const rule = await sip.createSipDispatchRule({
            name: `CLEAN-RULE-${TARGET_NUMBER}`,
            trunkIds: [trunk.sipTrunkId],
            rule: {
                dispatchRuleIndividual: {
                    roomPrefix: "call-",
                }
            },
            roomConfig: {
                agents: [{
                    agentName: "inbound-agent",
                    metadata: metadata
                }]
            }
        });

        console.log(`Created fresh Dispatch Rule: ${rule.sipDispatchRuleId}`);
        console.log("--- CLEANUP & SETUP SUCCESSFUL ---");
        console.log("Please try the inbound call now!");

    } catch (e) {
        console.error("Cleanup failed:", e.message);
    }
}

totalCleanup();
