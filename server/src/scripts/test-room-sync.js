const { RoomServiceClient } = require("livekit-server-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function createTestRoom() {
    console.log("Using API Key:", process.env.LIVEKIT_API_KEY.substring(0, 5) + "...");
    const svc = new RoomServiceClient(
        process.env.LIVEKIT_URL.replace("wss://", "https://"),
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
    );

    try {
        const roomName = "test-check-" + Math.floor(Math.random() * 1000);
        console.log(`Creating test room: ${roomName}`);
        const room = await svc.createRoom({
            name: roomName,
            emptyTimeout: 60,
        });
        console.log("Successfully created room!");
        console.log("Room ID:", room.sid);
        console.log("Room Name:", room.name);
        console.log("-----------------------------------------");
        console.log("ACTION: Please check your LiveKit 'Sessions' tab.");
        console.log(`IF YOU SEE '${roomName}', then your API keys are correct.`);
        console.log("IF YOU DO NOT SEE IT, then your API keys belong to another project.");
    } catch (e) {
        console.error("Failed to create room:", e.message);
    }
}

createTestRoom();
