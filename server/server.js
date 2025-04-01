import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get the root directory (where .env is)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const users = {}; // Stores { userId: { socketId, role } }

// Handle user connections
io.on("connection", (socket) => {
  console.log(`✅ A user connected: ${socket.id}`);

  // ✅ Register user
  socket.on("register", async ({ userId, role }) => {
    if (!userId) {
      console.error(`❌ Error: Received undefined userId from socket ${socket.id}`);
      return;
    }

    // Update user socketId if they reconnect
    users[userId] = { socketId: socket.id, role };
    console.log(`✅ User ${userId} registered as ${role}`);
    console.log(`📌 Current Users:`, users); // Log the entire users object
  });

  // ✅ Handle doctor initiating a call
  socket.on("call-user", async ({ doctorId, targetUserId, offer }) => {
    console.log(`📞 call-user event received: Doctor ${doctorId} → Patient ${targetUserId}`);

    if (!doctorId || !targetUserId || !offer) {
      console.error("❌ Error: Invalid doctorId, targetUserId, or missing offer in call-user event");
      return;
    }

    console.log("🔍 Checking database connection status...");
    try {
      const { data, error } = await supabase
        .from("doctor_patient_connections")
        .select("status")
        .eq("doctor_id", doctorId)
        .eq("patient_id", targetUserId)
        .single();

      if (error) {
        console.error("❌ Supabase Query Error:", error);
        return;
      }

      if (!data || data.status !== "connected") {
        console.log(`⛔ Call blocked: Doctor ${doctorId} and Patient ${targetUserId} are not connected.`);
        return;
      }

      console.log(`✅ Connection exists in database. Proceeding with call...`);

      // Fetch the target user's socket ID
      console.log(`📌 Current Users Object:`, users);
      const targetSocket = users[targetUserId]?.socketId;
      console.log(`🎯 Target socket ID for patient ${targetUserId}:`, targetSocket);

      if (!targetSocket) {
        console.log(`⚠️ Patient ${targetUserId} is not online.`);
        return;
      }

      // Emit incoming call to the patient, including the offer
      io.to(targetSocket).emit("incoming-call", { offer, from: socket.id, targetPatientId: targetUserId });

      console.log(`📞 Call request sent from Doctor ${doctorId} to Patient ${targetUserId} with offer`);
    } catch (err) {
      console.error("❌ Error processing call request:", err);
    }
  });

  // ✅ Handle patient answering the call
  socket.on("answer-call", ({ targetSocketId, answer }) => {
    if (!targetSocketId || !answer) {
      console.error("❌ Error: Invalid targetSocketId or answer in answer-call event");
      return;
    }

    io.to(targetSocketId).emit("call-answered", answer);
    console.log(`📩 Answer relayed to ${targetSocketId}`);
  });

  // ✅ Handle ICE candidate exchange
  socket.on("ice-candidate", ({ targetSocketId, candidate }) => {
    if (!targetSocketId || !candidate) {
      console.error("❌ Error: Invalid targetSocketId or candidate in ice-candidate event");
      return;
    }

    console.log(`📡 Relaying ICE candidate to: ${targetSocketId}`);
    io.to(targetSocketId).emit("ice-candidate", candidate);
  });

  // ✅ Handle user disconnection
  socket.on("disconnect", () => {
    let disconnectedUserId = null;

    // Find and remove the disconnected user
    for (const userId in users) {
      if (users[userId].socketId === socket.id) {
        disconnectedUserId = userId;
        delete users[userId];
        break;
      }
    }

    if (disconnectedUserId) {
      console.log(`❌ User ${disconnectedUserId} disconnected`);
    } else {
      console.log(`❌ Unknown user disconnected: ${socket.id}`);
    }
  });
});

setInterval(() => {
  if (Object.keys(users).length > 0) { // Only ping if users are connected
    io.emit("ping", "keep-alive");
    console.log("🔄 Keep-alive ping sent to all connected clients.");
  }
}, 50000);

// ✅ Start the server
server.listen(5000, () => {
  console.log("🚀 Signaling server running on http://localhost:5000");
});
