/**
 * Recreate ALL SIP Dispatch Rules for the new hspsms-6vxroqsc project.
 * 
 * This script:
 * 1. Deletes ALL existing dispatch rules on the project (clean slate)
 * 2. Recreates each rule for every registered number with inbound trunks
 * 
 * Run: node server/src/scripts/recreate-all-dispatch-rules.js
 */

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const LIVEKIT_URL = process.env.LIVEKIT_URL.replace('wss://', 'https://').replace('ws://', 'http://');
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

console.log('🔗 LiveKit URL:', LIVEKIT_URL);
console.log('🔑 API Key:', LIVEKIT_API_KEY);

if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
}

// ===========================
// DATA: Phone → Trunk → Assistant mapping
// From live audit of hspsms-6vxroqsc project:
//   Inbound Trunks:
//     +15075815898 → ST_vSqYgvWk6PvU (twilio)
//     +917943446725 → ST_HbYMB7sTFPQ7 (telecmi)
//
// The dispatch rule metadata tells inbound-agent which assistant to use.
// If assistant_id is not set here, the agent will look it up by phone number.
// ===========================
const DISPATCH_CONFIGS = [
    {
        phoneNumber: '+15075815898',
        trunkId: 'ST_vSqYgvWk6PvU',
        assistantId: 'e28dd121-b8a3-43e6-8fe1-910cffb25450',  // Default Assistant for this number
        name: 'twilio-dispatch-15075815898',
    },
    {
        phoneNumber: '+917943446725',
        trunkId: 'ST_HbYMB7sTFPQ7',
        assistantId: null,  // Will be looked up by phone number at call time
        name: 'telecmi-dispatch-917943446725',
    },
];

async function generateJWT() {
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
        {
            iss: LIVEKIT_API_KEY,
            sub: LIVEKIT_API_KEY,
            video: { roomConfig: true },
            sip: { admin: true },
            exp: Math.floor(Date.now() / 1000) + 300, // 5 min
        },
        LIVEKIT_API_SECRET
    );
    return token;
}

async function livekitRequest(path, body, method = 'POST') {
    const token = await generateJWT();
    const response = await fetch(`${LIVEKIT_URL}${path}`, {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(`${response.status}: ${JSON.stringify(data)}`);
    }
    return data;
}

async function deleteAllDispatchRules() {
    console.log('\n📋 Step 1: Listing existing dispatch rules...');
    try {
        const result = await livekitRequest('/twirp/livekit.SIP/ListSIPDispatchRule', {});
        const rules = result.items || [];
        console.log(`   Found ${rules.length} existing rules`);
        console.log('   Raw response:', JSON.stringify(rules.map(r => ({ name: r.name, id: r.sipDispatchRuleId || r.sip_dispatch_rule_id })), null, 2));

        for (const rule of rules) {
            // Handle both camelCase and snake_case from API
            const ruleId = rule.sipDispatchRuleId || rule.sip_dispatch_rule_id;
            const ruleName = rule.name || 'unnamed';

            if (!ruleId) {
                console.log(`   ⚠️  Skipping rule "${ruleName}" - no ID found`);
                continue;
            }

            console.log(`   Deleting: ${ruleName} (${ruleId})`);
            try {
                await livekitRequest('/twirp/livekit.SIP/DeleteSIPDispatchRule', {
                    sip_dispatch_rule_id: ruleId
                });
                console.log(`   ✅ Deleted ${ruleId}`);
            } catch (e) {
                console.log(`   ⚠️  Failed to delete ${ruleId}: ${e.message}`);
            }
        }
    } catch (e) {
        console.log(`   ⚠️  Could not list rules: ${e.message} — continuing...`);
    }
}

async function createDispatchRule(config) {
    const { phoneNumber, trunkId, assistantId, name } = config;

    const metadata = {
        phone_number: phoneNumber,
        call_type: 'inbound',
        ...(assistantId ? { assistant_id: assistantId } : {}),
    };

    const body = {
        rule: {
            dispatchRuleIndividual: {
                roomPrefix: 'call-',
                pin: '',
            },
        },
        trunkIds: [trunkId],
        inboundNumbers: [phoneNumber, phoneNumber.replace('+', '')],
        name: name,
        roomConfig: {
            agents: [
                {
                    agentName: 'inbound-agent',
                    metadata: JSON.stringify(metadata),
                },
            ],
        },
    };

    const result = await livekitRequest('/twirp/livekit.SIP/CreateSIPDispatchRule', body);
    return result.sipDispatchRuleId;
}

async function main() {
    console.log('\n🚀 Starting SIP Dispatch Rules Recreation...\n');

    // Step 1: Clean slate
    await deleteAllDispatchRules();

    // Step 2: Create fresh rules
    console.log('\n📋 Step 2: Creating new dispatch rules...');
    const results = [];

    for (const config of DISPATCH_CONFIGS) {
        console.log(`\n   Creating rule for ${config.phoneNumber} (trunk: ${config.trunkId})...`);
        try {
            const ruleId = await createDispatchRule(config);
            console.log(`   ✅ Created: ${ruleId}`);
            results.push({ phone: config.phoneNumber, ruleId, status: 'success' });
        } catch (e) {
            console.log(`   ❌ Failed: ${e.message}`);
            results.push({ phone: config.phoneNumber, status: 'failed', error: e.message });
        }
    }

    console.log('\n📊 Summary:');
    console.log('─'.repeat(60));
    for (const r of results) {
        const icon = r.status === 'success' ? '✅' : '❌';
        console.log(`${icon} ${r.phone} → ${r.ruleId || r.error}`);
    }
    console.log('─'.repeat(60));

    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`\n✅ Done: ${successCount}/${DISPATCH_CONFIGS.length} dispatch rules created.`);

    if (successCount > 0) {
        console.log('\n⚡ Next step: Restart your inbound_agent.py and test an inbound call!');
    }
}

main().catch(e => {
    console.error('\n💥 Fatal error:', e.message);
    process.exit(1);
});
