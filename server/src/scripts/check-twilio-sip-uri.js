/**
 * check-twilio-sip-uri.js
 * 
 * Tells you exactly what SIP URI Twilio should be calling (LiveKit's ingest URI for this project)
 * and checks what's currently set in your Twilio account.
 */

const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkTwilioSipUri() {
    const livekitUrl = process.env.LIVEKIT_URL;
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

    // Derive the LiveKit SIP ingest domain from the LiveKit URL
    // e.g. wss://metarix-6jlub4io.livekit.cloud → metarix-6jlub4io.sip.livekit.cloud
    const livekitDomain = livekitUrl
        .replace('wss://', '')
        .replace('ws://', '')
        .replace('https://', '');

    const livekitSipDomain = livekitDomain.replace('.livekit.cloud', '.sip.livekit.cloud');
    const expectedSipUri = `sip:+17752427674@${livekitSipDomain};transport=tcp`;
    const expectedSipUriTls = `sip:+17752427674@${livekitSipDomain};transport=tls`;

    console.log('='.repeat(60));
    console.log('LiveKit Project SIP Ingest Domain:');
    console.log(`  ${livekitSipDomain}`);
    console.log('\nTwilio should be sending calls to:');
    console.log(`  ${expectedSipUri}`);
    console.log('  OR');
    console.log(`  ${expectedSipUriTls}`);
    console.log('='.repeat(60));

    if (!twilioAccountSid || !twilioAuthToken ||
        twilioAccountSid.includes('your') || twilioAuthToken.includes('your')) {
        console.log('\n⚠️  Twilio credentials not set in .env');
        console.log('   Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to auto-check Twilio config.');
        console.log('\n📋 MANUAL CHECK:');
        console.log('   1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming');
        console.log('   2. Click on +1 (775) 242-7674');
        console.log('   3. Scroll to "Voice Configuration"');
        console.log(`   4. Make sure "SIP ENDPOINT" is set to: ${livekitSipDomain}`);
        console.log(`   5. The SIP URI value should be something like:`);
        console.log(`      sip:+17752427674@${livekitSipDomain};transport=tcp`);
        return;
    }

    // If Twilio credentials are available, check via API
    try {
        const twilio = require('twilio');
        const client = twilio(twilioAccountSid, twilioAuthToken);

        const numbers = await client.incomingPhoneNumbers.list({ phoneNumber: '+17752427674' });
        if (numbers.length === 0) {
            console.log('\n❌ Phone number +17752427674 not found in this Twilio account');
            return;
        }

        const num = numbers[0];
        console.log('\n📞 Twilio Number Configuration:');
        console.log(`  Voice URL: ${num.voiceUrl || '(empty)'}`);
        console.log(`  Voice Method: ${num.voiceMethod}`);
        console.log(`  SIP Domain: ${num.addressRequirements}`);

        if (num.voiceUrl && num.voiceUrl.includes(livekitSipDomain)) {
            console.log('\n✅ Twilio SIP URI looks correctly pointed to this LiveKit project');
        } else {
            console.log('\n❌ Twilio Voice URL does NOT match this LiveKit project SIP domain!');
            console.log(`   Current:  ${num.voiceUrl}`);
            console.log(`   Expected: Something containing ${livekitSipDomain}`);
        }
    } catch (err) {
        console.error('\n❌ Twilio API check failed:', err.message);
    }
}

checkTwilioSipUri();
