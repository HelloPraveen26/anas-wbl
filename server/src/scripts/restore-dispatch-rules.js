const { AccessToken } = require('livekit-server-sdk');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const url = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

async function restoreDispatchRules() {
    const httpsUrl = url.replace('wss://', 'https://').replace('ws://', 'http://');

    const configs = [
        {
            phoneNumber: '+15075815898',
            trunkId: 'ST_dvaN5x2ko4qP',
            assistantId: 'c0aecbb5-ba30-4c0e-b8a6-aba990814680',
            name: 'dispatch-+15075815898'
        },
        {
            phoneNumber: '+917943446725',
            trunkId: 'ST_aKbutDJbRLXf',
            assistantId: 'c0aecbb5-ba30-4c0e-b8a6-aba990814680',
            name: 'dispatch-+917943446725'
        }
    ];

    for (const config of configs) {
        console.log(`Restoring rule for ${config.phoneNumber}...`);

        // Generate Token
        const at = new AccessToken(apiKey, apiSecret, { ttl: '10m' });
        at.addSIPGrant({ admin: true });
        const token = await at.toJwt();
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 1. Delete matching existing rules
        console.log('  Listing existing rules...');
        const listRes = await fetch(`${httpsUrl}/twirp/livekit.SIP/ListSIPDispatchRule`, {
            method: 'POST',
            headers,
            body: '{}'
        });
        const listData = await listRes.json();
        for (const r of (listData.items || [])) {
            if (r.name.includes(config.phoneNumber)) {
                console.log(`  Deleting existing rule: ${r.name}`);
                await fetch(`${httpsUrl}/twirp/livekit.SIP/DeleteSIPDispatchRule`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ sip_dispatch_rule_id: r.sip_dispatch_rule_id || r.sipDispatchRuleId })
                });
            }
        }

        // 2. Create fresh rule
        const body = {
            rule: {
                dispatchRuleIndividual: {
                    roomPrefix: 'call-',
                    pin: ""
                }
            },
            trunkIds: [config.trunkId],
            name: config.name,
            inboundNumbers: [config.phoneNumber], // Add it here just in case
            roomConfig: {
                agents: [
                    {
                        agentName: "inbound-agent",
                        metadata: JSON.stringify({
                            assistant_id: config.assistantId,
                            phone_number: config.phoneNumber,
                            call_type: "inbound"
                        }),
                    },
                ],
            },
        };

        const createRes = await fetch(`${httpsUrl}/twirp/livekit.SIP/CreateSIPDispatchRule`, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!createRes.ok) {
            const err = await createRes.json();
            console.error(`  ❌ Failed: ${JSON.stringify(err)}`);
        } else {
            const result = await createRes.json();
            console.log(`  ✅ Restored: ${result.sip_dispatch_rule_id || result.sipDispatchRuleId}`);
        }
    }
}

restoreDispatchRules().catch(console.error);
