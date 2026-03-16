const { RoomServiceClient } = require("livekit-server-sdk");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function listRooms() {
    const svc = new RoomServiceClient(
        process.env.LIVEKIT_URL.replace("wss://", "https://"),
        process.env.LIVEKIT_API_KEY,
        process.env.LIVEKIT_API_SECRET
    );

    const rooms = await svc.listRooms();
    console.log("Active Rooms:", JSON.stringify(rooms, null, 2));
}

listRooms().catch(console.error);
