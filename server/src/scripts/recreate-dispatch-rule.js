/**
 * recreate-dispatch-rule.js
 * 
 * Deletes the existing dispatch rule and recreates it WITHOUT inboundNumbers filter.
 * This removes the number-matching requirement so any call arriving on the trunk
 * will be dispatched to the inbound-agent.
 * 
 * After testing: if this works, we know the inboundNumbers format was wrong.
 */

const { SipClient } = require('livekit-server-sdk');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const TRUNK_ID = 'ST_4wFDYSWh9Uc6';
const PHONE_NUMBER = '+17752427674';
const RULE_ID_TO_DELETE = 'SDR_D8u67hx6H8PU';
const ASSISTANT_ID = '59bf3581-e59b-4fd1-9388-7050a1ddda77';

async function recreateDispatchRule() {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;
    const wsUrl = livekitUrl.replace('wss://', 'https://');

    const sipClient = new SipClient(livekitUrl, apiKey, apiSecret);

    // Step 1: Delete existing rule
    console.log(`\n🗑️  Deleting existing dispatch rule: ${RULE_ID_TO_DELETE}`);
    try {
        await sipClient.deleteSipDispatchRule(RULE_ID_TO_DELETE);
        console.log('✅ Old rule deleted');
    } catch (err) {
        console.log(`⚠️  Delete warning (may not exist): ${err.message}`);
    }

    // Step 2: Wait a moment
    await new Promise(r => setTimeout(r, 1000));

    // Step 3: Create new rule WITHOUT inboundNumbers (matches any call on the trunk)
    const metadata = {
        assistant_id: ASSISTANT_ID,
        phone_number: PHONE_NUMBER,
        call_type: 'inbound',
    };

    const body = {
        rule: {
            dispatchRuleIndividual: {
                roomPrefix: 'call-',
                pin: '',
            },
        },
        trunkIds: [TRUNK_ID],
        // NO inboundNumbers filter — accept any call arriving on this trunk
        name: `inbound-agent-${PHONE_NUMBER}`,
        roomConfig: {
            agents: [
                {
                    agentName: 'inbound-agent',
                    metadata: JSON.stringify(metadata),
                },
            ],
        },
    };

    // Generate JWT for Twirp
    const token = jwt.sign(
        {
            iss: apiKey,
            sub: apiKey,
            video: { roomConfig: true },
            exp: Math.floor(Date.now() / 1000) + 60,
        },
        apiSecret,
    );

    console.log('\n🔧 Creating new dispatch rule (no inboundNumbers filter)...');
    console.log(`   Trunk: ${TRUNK_ID}`);
    console.log(`   Agent: inbound-agent`);
    console.log(`   Metadata: ${JSON.stringify(metadata)}`);

    try {
        const response = await axios.post(
            `${wsUrl}/twirp/livekit.Sip/CreateSipDispatchRule`,
            body,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            },
        );
        console.log(`\n✅ New rule created! ID: ${response.data.sipDispatchRuleId}`);
        console.log('Full response:', JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('❌ Failed to create rule:', err.response?.data || err.message);
    }

    // Step 4: Verify
    console.log('\n📋 Verifying all dispatch rules:');
    const rules = await sipClient.listSipDispatchRule();
    rules.forEach(r => {
        console.log(`  - ${r.sipDispatchRuleId}: ${r.name}`);
        console.log(`    trunkIds: ${r.trunkIds.join(', ')}`);
        console.log(`    inboundNumbers: ${r.inboundNumbers?.join(', ') || '(none — matches all)'}`);
        console.log(`    agentName: ${r.roomConfig?.agents?.[0]?.agentName}`);
    });
}

recreateDispatchRule().catch(console.error);
