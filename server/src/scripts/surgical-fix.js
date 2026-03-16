const { AccessToken } = require("livekit-server-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function fixDirect() {
    const LIVEKIT_URL = process.env.LIVEKIT_URL;
    const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
    const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
    const TARGET_NUMBER = "+17752427674";
    const assistantId = "59bf3581-e59b-4fd1-9388-7050a1ddda77";

    console.log(`--- FINAL DIRECT API RECONSTRUCTION FOR ${TARGET_NUMBER} ---`);

    // 1. Manually create SipClient just for listing/deleting (this part works)
    const { SipClient } = require("livekit-server-sdk");
    const sip = new SipClient(LIVEKIT_URL.replace("wss://", "https://"), LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    try {
        // Aggressive Purge
        let trunks = await sip.listSipTrunk();
        let toDelete = trunks.filter(t => t.inboundNumbers?.includes(TARGET_NUMBER) || t.numbers?.includes(TARGET_NUMBER) || t.name.includes(TARGET_NUMBER));
        for (const t of toDelete) {
            console.log("Deleting Trunk:", t.sipTrunkId);
            await sip.deleteSipTrunk(t.sipTrunkId).catch(e => { });
        }

        // Create new trunk
        const newTrunk = await sip.createSipInboundTrunk(`CLEAN-FINAL-${TARGET_NUMBER}`, [TARGET_NUMBER]);
        console.log("Created Trunk:", newTrunk.sipTrunkId);

        // 2. Direct Twirp Call for Dispatch Rule (The specialized part)
        const url = new URL(
            "/twirp/livekit.SIP/CreateSIPDispatchRule",
            LIVEKIT_URL.replace("wss://", "https://").replace("ws://", "http://")
        );

        const dispatch_metadata = {
            assistant_id: assistantId,
            phone_number: TARGET_NUMBER,
            call_type: "inbound",
        };

        const body = {
            rule: {
                dispatchRuleIndividual: {
                    roomPrefix: "call-",
                    pin: "",
                },
            },
            trunkIds: [newTrunk.sipTrunkId],
            inboundNumbers: [TARGET_NUMBER],
            name: `FINAL-DIRECT-${TARGET_NUMBER}`,
            roomConfig: {
                agents: [
                    {
                        agentName: "inbound-agent",
                        metadata: JSON.stringify(dispatch_metadata),
                    },
                ],
            },
        };

        // Generate token
        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { ttl: "10m" });
        at.addSIPGrant({ admin: true });
        const authHeader = `Bearer ${await at.toJwt()}`;

        console.log("Calling Twirp API directly...");
        const response = await fetch(url.toString(), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ msg: "Unknown" }));
            throw new Error(err.msg || response.statusText);
        }

        const result = await response.json();
        console.log("SUCCESS! Created Dispatch Rule:", result.sipDispatchRuleId);
        console.log("Please test the inbound call now!");

    } catch (e) {
        console.error("Direct fix failed:", e.message);
    }
}

fixDirect();
