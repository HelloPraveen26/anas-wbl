const { SipClient } = require("livekit-server-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function purgeTelecmi() {
    const sip = new SipClient(
        process.env.LIVEKIT_URL.replace("wss://", "https://"),
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
    );

    const TARGET_NUMBER = "917943446719"; // Strip + for fuzzy match

    try {
        console.log(`--- TELECMI EXHAUSTIVE PURGE FOR ${TARGET_NUMBER} ---`);

        const existingTrunks = await sip.listSipTrunk();

        for (const trunk of existingTrunks) {
            const trunkName = trunk.name || "";
            const trunkAddress = trunk.address || "";
            const trunkNumbers = trunk.numbers || [];

            const isTelecmi = trunkName.includes("Telecmi") || trunkAddress.includes("piopiy") || trunkAddress.includes("vobiz") || trunkAddress.includes("Telecmi");
            const hasNumber = trunkNumbers.some(n => n.includes(TARGET_NUMBER));

            if (isTelecmi && hasNumber) {
                console.log(`Deleting trunk: "${trunkName}" (ID: ${trunk.sipTrunkId}, Address: ${trunkAddress}, Numbers: [${trunkNumbers.join(", ")}])`);
                await sip.deleteSipTrunk(trunk.sipTrunkId).catch(e => console.log(`Failed to delete trunk ${trunk.sipTrunkId}: ${e.message}`));
            }
        }

        console.log("\nPurge finished. The environment is now clean.");

    } catch (e) {
        console.error("Purge failed:", e.message);
    }
}

purgeTelecmi();
