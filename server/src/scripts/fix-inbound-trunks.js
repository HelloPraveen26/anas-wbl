const { SipClient } = require('livekit-server-sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const url = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

async function fixInboundTrunks() {
    const httpsUrl = url.replace('wss://', 'https://').replace('ws://', 'http://');
    const sipClient = new SipClient(httpsUrl, apiKey, apiSecret);

    console.log('--- Auditing Inbound Trunks ---');
    const trunks = await sipClient.listSipInboundTrunk();

    for (const trunk of trunks) {
        console.log(`\nTrunk: ${trunk.name} (${trunk.sipTrunkId})`);
        console.log(`  Numbers: ${trunk.numbers.join(', ')}`);
        console.log(`  AllowedAddresses: ${trunk.allowedAddresses?.join(', ') || 'None'}`);

        // IF there are restrictions, we MUST clear them for Twilio
        if (trunk.allowedAddresses && trunk.allowedAddresses.length > 0) {
            console.log('  [!] This trunk has IP restrictions. Removing them...');

            // 1. Get all rules that use this trunk
            const allRules = await sipClient.listSipDispatchRule();
            const rulesToUpdate = allRules.filter(r => r.trunkIds.includes(trunk.sipTrunkId));

            console.log(`  Found ${rulesToUpdate.length} rules to preserve.`);

            // 2. Delete ALL rules using this trunk first (mandatory to avoid conflict)
            for (const rule of rulesToUpdate) {
                console.log(`    Deleting rule: ${rule.name} (${rule.sipDispatchRuleId})`);
                await sipClient.deleteSipDispatchRule(rule.sipDispatchRuleId);
            }

            // 3. Delete the restricted trunk
            console.log(`    Deleting restricted trunk: ${trunk.sipTrunkId}`);
            await sipClient.deleteSipTrunk(trunk.sipTrunkId);

            // 4. Recreate the trunk CLEAN (no allowedAddresses)
            console.log(`    Recreating clean trunk for ${trunk.numbers.join(', ')}...`);
            const newTrunk = await sipClient.createSipInboundTrunk(
                trunk.name,
                trunk.numbers,
                {
                    metadata: trunk.metadata,
                    krispEnabled: true
                }
            );
            console.log(`    CLEAN TRUNK CREATED: ${newTrunk.sipTrunkId}`);

            // 5. Restore the rules pointing to the NEW trunk
            for (const rule of rulesToUpdate) {
                console.log(`    Restoring rule: ${rule.name}...`);
                const newRule = await sipClient.createSipDispatchRule({
                    name: rule.name,
                    metadata: rule.metadata,
                    trunkIds: [newTrunk.sipTrunkId],
                    rule: rule.rule,
                    inboundNumbers: rule.inboundNumbers,
                    roomConfig: rule.roomConfig,
                    hidePhoneNumber: rule.hidePhoneNumber,
                    krispEnabled: rule.krispEnabled
                });
                console.log(`    RULE RESTORED: ${newRule.sipDispatchRuleId}`);
            }
        } else {
            console.log('  [+] Trunk is clean (no restrictions).');
        }
    }

    console.log('\n--- Final Check ---');
    const finalRules = await sipClient.listSipDispatchRule();
    console.log(`Total active rules: ${finalRules.length}`);
    finalRules.forEach(r => {
        console.log(` - ${r.name} -> ${r.roomConfig?.agents?.[0]?.agentName || 'no-agent'}`);
    });
}

fixInboundTrunks().catch(console.error);
