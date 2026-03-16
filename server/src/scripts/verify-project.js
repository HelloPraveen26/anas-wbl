const { AccessToken } = require("livekit-server-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function checkProject() {
    console.log("Current .env LiveKit URL:", process.env.LIVEKIT_URL);
    console.log("Current .env API Key:", process.env.LIVEKIT_API_KEY);

    // We can't directly "get project name" via SDK easily without some room listing
    // but we can look at what the keys return.
    const { RoomServiceClient, SipClient } = require("livekit-server-sdk");
    const svc = new RoomServiceClient(
        process.env.LIVEKIT_URL.replace("wss://", "https://"),
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
    );

    try {
        const rooms = await svc.listRooms();
        console.log("Successfully connected to LiveKit server.");
        console.log("Connection verified for project associated with API Key ending in:", process.env.LIVEKIT_API_KEY.slice(-4));
    } catch (e) {
        console.error("Failed to connect with .env keys:", e.message);
    }
}

checkProject();
