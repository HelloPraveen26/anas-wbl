
const { SipClient } = require('livekit-server-sdk');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function fixDispatch() {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;
    const wsUrl = livekitUrl.replace('wss://', 'https://');

    const trunkId = 'ST_4v86LSmi5wGn';
    const phoneNumber = '+17752427674';
    const assistantId = '59bf3581-e59b-4fd1-9388-7050a1ddda77';

    const metadata = {
        assistant_id: assistantId,
        phone_number: phoneNumber,
        call_type: 'inbound'
    };

    const body = {
        rule: {
            dispatchRuleIndividual: {
                roomPrefix: "call-",
                pin: "",
            },
        },
        trunkIds: [trunkId],
        inboundNumbers: [phoneNumber, phoneNumber.replace('+', '')], // ✅ Match both + and no-+
        name: `RECONSTRUCTED-${phoneNumber}`,
        roomConfig: {
            agents: [
                {
                    agentName: "inbound-agent",
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
        apiSecret
    );

    console.log('--- RECONSTRUCTING DISPATCH RULE ---');
    try {
        const response = await axios.post(
            `${wsUrl}/twirp/livekit.Sip/CreateSipDispatchRule`,
            body,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log('✅ Success! New Rule Created:', response.data.sipDispatchRuleId);
    } catch (err) {
        console.error('❌ Error creating rule:', err.response?.data || err.message);
    }
}

fixDispatch();
