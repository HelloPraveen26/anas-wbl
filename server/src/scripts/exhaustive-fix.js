const { SipClient, AccessToken } = require("livekit-server-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function exhaustiveFix() {
    const LIVEKIT_URL = process.env.LIVEKIT_URL;
    const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
    const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
    const TARGET_NUMBER = "+17752427674";
    const assistantId = "59bf3581-e59b-4fd1-9388-7050a1ddda77";

    const sip = new SipClient(LIVEKIT_URL.replace("wss://", "https://"), LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    console.log(`--- EXHAUSTIVE SIP REPAIR FOR ${TARGET_NUMBER} ---`);

    try {
        // 1. PURGE ALL RULES
        console.log("Purging all rules...");
        let rules = await sip.listSipDispatchRule();
        let rulesToDelete = rules.filter(r => r.inboundNumbers.includes(TARGET_NUMBER) || r.name.includes(TARGET_NUMBER));
        for (const rule of rulesToDelete) {
            console.log(`Deleting rule: ${rule.sipDispatchRuleId} (${rule.name})`);
            await sip.deleteSipDispatchRule(rule.sipDispatchRuleId).catch(e => console.log(`Failed to delete rule ${rule.sipDispatchRuleId}: ${e.message}`));
        }

        // 2. PURGE ALL TRUNKS (Loop until zero)
        console.log("Purging all trunks...");
        let purgePass = 1;
        while (true) {
            console.log(`Purge Pass #${purgePass}...`);
            let trunks = await sip.listSipTrunk();
            let trunksToDelete = trunks.filter(t =>
                t.inboundNumbers?.includes(TARGET_NUMBER) ||
                t.numbers?.includes(TARGET_NUMBER) ||
                t.name.includes(TARGET_NUMBER) ||
                t.name.includes("CLEAN") || // Cleanup my previous attempts
                t.name.includes("FINAL")
            );

            if (trunksToDelete.length === 0) {
                console.log("No more conflicting trunks found.");
                break;
            }

            for (const t of trunksToDelete) {
                console.log(`Deleting trunk: ${t.sipTrunkId} (${t.name})`);
                await sip.deleteSipTrunk(t.sipTrunkId).catch(e => console.log(`Failed to delete trunk ${t.sipTrunkId}: ${e.message}`));
            }
            purgePass++;
            if (purgePass > 5) {
                console.log("Stopping purge loop after 5 passes to avoid infinite loop.");
                break;
            }
            await new Promise(r => setTimeout(r, 1000));
        }

        // 3. CREATE FRESH SETUP
        console.log("\nReconstructing fresh setup...");
        const newTrunk = await sip.createSipInboundTrunk(`REBORN-TRUNK-${TARGET_NUMBER}`, [TARGET_NUMBER]);
        console.log("New Trunk Created:", newTrunk.sipTrunkId);

        // 4. Create Rule via Direct API (proven necessary)
        const url = new URL(
            "/twirp/livekit.SIP/CreateSIPDispatchRule",
            LIVEKIT_URL.replace("wss://", "https://").replace("ws://", "http://")
        );

        const body = {
            rule: {
                dispatchRuleIndividual: { roomPrefix: "call-", pin: "" },
            },
            trunkIds: [newTrunk.sipTrunkId],
            inboundNumbers: [TARGET_NUMBER],
            name: `REBORN-RULE-${TARGET_NUMBER}`,
            roomConfig: {
                agents: [{
                    agentName: "inbound-agent",
                    metadata: JSON.stringify({
                        assistant_id: assistantId,
                        phone_number: TARGET_NUMBER,
                        call_type: "inbound",
                    }),
                }],
            },
        };

        const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, { ttl: "10m" });
        at.addSIPGrant({ admin: true });
        const authHeader = `Bearer ${await at.toJwt()}`;

        console.log("Creating Dispatch Rule via Twirp...");
        const response = await fetch(url.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: authHeader },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({ msg: "Unknown error" }));
            throw new Error(err.msg || response.statusText);
        }

        const result = await response.json();
        // Use the actual field names from the Twirp response object
        const ruleId = result.sipDispatchRuleId || result.sip_dispatch_rule_id || "CREATED";
        console.log("SUCCESS! Fresh Dispatch Rule ID:", ruleId);
        console.log("Details:", JSON.stringify(result));

        console.log("\n--- VERIFICATION ---");
        console.log("Please cross-check the 'SIP trunks' and 'Dispatch rules' tabs in your dashboard.");
        console.log(`You should see exactly ONE trunk: ${newTrunk.sipTrunkId}`);
        console.log(`You should see exactly ONE rule: ${ruleId}`);

    } catch (e) {
        console.error("EXHAUSTIVE FIX FAILED:", e.message);
    }
}

exhaustiveFix();
