const { SipClient } = require('livekit-server-sdk');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function checkInboundTrunk() {
    const sip = new SipClient(
        process.env.LIVEKIT_URL,
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET,
    );

    const TARGET_TRUNK_ID = 'ST_4wFDYSWh9Uc6';

    console.log('='.repeat(60));
    console.log('LISTING ALL INBOUND TRUNKS');
    console.log('='.repeat(60));
    const inboundTrunks = await sip.listSipInboundTrunk();
    console.log(JSON.stringify(inboundTrunks, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log(`SEARCHING FOR TARGET TRUNK: ${TARGET_TRUNK_ID}`);
    console.log('='.repeat(60));
    const found = inboundTrunks.find(t => t.sipTrunkId === TARGET_TRUNK_ID);
    if (found) {
        console.log('✅ FOUND:');
        console.log(JSON.stringify(found, null, 2));
    } else {
        console.log('❌ NOT FOUND in inbound trunks. IDs found:');
        inboundTrunks.forEach(t => console.log(`  - ${t.sipTrunkId}: ${t.name}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log('DISPATCH RULES');
    console.log('='.repeat(60));
    const rules = await sip.listSipDispatchRule();
    console.log(`Total rules: ${rules.length}`);
    rules.forEach(r => {
        console.log(`\nRule: ${r.name} (${r.sipDispatchRuleId})`);
        console.log(`  trunkIds: ${r.trunkIds.join(', ')}`);
        console.log(`  inboundNumbers: ${r.inboundNumbers?.join(', ')}`);
        console.log(`  agentName: ${r.roomConfig?.agents?.[0]?.agentName}`);
    });
}

checkInboundTrunk().catch(console.error);
