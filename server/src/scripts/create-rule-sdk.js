const { SipClient } = require('livekit-server-sdk');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const TRUNK_ID = 'ST_4wFDYSWh9Uc6';
const PHONE_NUMBER = '+17752427674';
const ASSISTANT_ID = '59bf3581-e59b-4fd1-9388-7050a1ddda77';

async function createRule() {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    const sipClient = new SipClient(livekitUrl, apiKey, apiSecret);

    console.log('Creating SIP dispatch rule via SDK (flat structure)...');

    const metadata = {
        assistant_id: ASSISTANT_ID,
        phone_number: PHONE_NUMBER,
        call_type: 'inbound',
    };

    // Correct flat structure for SipDispatchRuleIndividual in current SDK
    const rule = {
        type: 'individual',
        roomPrefix: 'call-',
    };

    const options = {
        name: `inbound-agent-${PHONE_NUMBER}`,
        trunkIds: [TRUNK_ID],
        roomConfig: {
            agents: [
                {
                    agentName: 'inbound-agent',
                    metadata: JSON.stringify(metadata),
                },
            ],
        },
    };

    try {
        const result = await sipClient.createSipDispatchRule(rule, options);
        console.log('✅ Rule created successfully:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('❌ Error creating rule:', err.message);
    }
}

createRule();
