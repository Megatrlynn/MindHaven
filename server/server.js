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
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://mind-haven.netlify.app",
];

const envAllowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([...defaultAllowedOrigins, ...envAllowedOrigins]);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json());
const server = createServer(app);

const socketCorsOrigins = Array.from(allowedOrigins);
const io = new Server(server, {
  cors: {
    origin: socketCorsOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;
const users = {}; // Stores { userId: { socketId, role } }
const pendingCalls = {}; // Stores { userId: [{ offer, from, targetPatientId, createdAt }] }

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

app.post("/admin/create-doctor", async (req, res) => {
  try {
    if (!supabaseService) {
      return res.status(500).json({
        message: "Server is missing SUPABASE_SERVICE_ROLE_KEY configuration.",
      });
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Missing authorization token." });
    }

    const { data: requesterData, error: requesterError } = await supabaseService.auth.getUser(token);
    if (requesterError || !requesterData?.user) {
      return res.status(401).json({ message: "Invalid authorization token." });
    }

    const requesterId = requesterData.user.id;
    const { data: adminRow, error: adminCheckError } = await supabaseService
      .from("admins")
      .select("id")
      .eq("user_id", requesterId)
      .maybeSingle();

    if (adminCheckError) {
      return res.status(500).json({ message: "Failed to validate admin access." });
    }

    if (!adminRow) {
      return res.status(403).json({ message: "Only admins can create therapist accounts." });
    }

    const { email, password, name, profession, phone, profile_picture } = req.body || {};

    if (!email || !password || !name || !profession) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    const emailDomain = String(email).split("@")[1]?.split(".")[0];
    if (emailDomain !== "doc") {
      return res.status(400).json({ message: "Doctor email must use the format: example@doc.com" });
    }

    let doctorUserId = null;
    let createdAuthUser = false;

    const { data: createData, error: createError } = await supabaseService.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "doctor" },
    });

    if (createError) {
      if (createError.message?.includes("already been registered") || createError.message?.includes("already registered")) {
        const { data: userListData, error: userListError } = await supabaseService.auth.admin.listUsers({
          page: 1,
          perPage: 1000,
        });

        if (userListError) {
          return res.status(500).json({ message: "Failed to fetch existing auth users." });
        }

        const existingUser = userListData.users.find(
          (user) => (user.email || "").toLowerCase() === String(email).toLowerCase()
        );

        if (!existingUser) {
          return res.status(500).json({ message: "User exists but could not be resolved by email." });
        }

        doctorUserId = existingUser.id;
      } else {
        return res.status(400).json({ message: createError.message });
      }
    } else {
      doctorUserId = createData.user?.id || null;
      createdAuthUser = true;
    }

    if (!doctorUserId) {
      return res.status(500).json({ message: "Failed to determine therapist user ID." });
    }

    const { error: doctorError } = await supabaseService
      .from("doctors")
      .upsert(
        {
          user_id: doctorUserId,
          name,
          profession,
          phone: phone || null,
          profile_picture: profile_picture || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (doctorError) {
      return res.status(400).json({ message: doctorError.message });
    }

    return res.status(200).json({
      success: true,
      createdAuthUser,
      doctorUserId,
    });
  } catch (error) {
    console.error("Error creating therapist account:", error);
    return res.status(500).json({ message: "Unexpected server error while creating therapist account." });
  }
});

app.post("/admin/delete-user", async (req, res) => {
  try {
    if (!supabaseService) {
      return res.status(500).json({
        message: "Server is missing SUPABASE_SERVICE_ROLE_KEY configuration.",
      });
    }

    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: "Missing authorization token." });
    }

    const { data: requesterData, error: requesterError } = await supabaseService.auth.getUser(token);
    if (requesterError || !requesterData?.user) {
      return res.status(401).json({ message: "Invalid authorization token." });
    }

    const requesterId = requesterData.user.id;
    const { data: adminRow, error: adminCheckError } = await supabaseService
      .from("admins")
      .select("id")
      .eq("user_id", requesterId)
      .maybeSingle();

    if (adminCheckError) {
      return res.status(500).json({ message: "Failed to validate admin access." });
    }

    if (!adminRow) {
      return res.status(403).json({ message: "Only admins can delete users." });
    }

    const { userId } = req.body || {};
    if (!userId) {
      return res.status(400).json({ message: "Missing userId." });
    }

    const { error: deleteError } = await supabaseService.auth.admin.deleteUser(userId);
    if (deleteError) {
      return res.status(400).json({ message: deleteError.message });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Unexpected server error while deleting user." });
  }
});

// Handle user connections
io.on("connection", (socket) => {
  console.log(` A user connected: ${socket.id}`);

  //  Register user
  socket.on("register", async ({ userId, role }) => {
    if (!userId) {
      console.error(` Error: Received undefined userId from socket ${socket.id}`);
      return;
    }

    socket.data.userId = userId;
    socket.join(`user:${userId}`);

    // Update user socketId if they reconnect
    users[userId] = { socketId: socket.id, role };
    console.log(`User ${userId} registered as ${role}`);
    console.log(` Current Users:`, users); // Log the entire users object

    // Deliver any queued call offers for this user after they come online.
    const queuedCalls = pendingCalls[userId] || [];
    if (queuedCalls.length > 0) {
      console.log(` Delivering ${queuedCalls.length} queued call(s) to user ${userId}`);
      queuedCalls.forEach((callPayload) => {
        io.to(`user:${userId}`).emit("incoming-call", callPayload);
      });
      delete pendingCalls[userId];
    }
  });

  //  Handle doctor initiating a call
  socket.on("call-user", async ({ doctorId, targetUserId, offer }) => {
    console.log(` call-user event received: Doctor ${doctorId} → Patient ${targetUserId}`);

    if (!doctorId || !targetUserId || !offer) {
      console.error(" Error: Invalid doctorId, targetUserId, or missing offer in call-user event");
      return;
    }

    console.log("🔍 Checking database connection status...");
    try {
      const dbClient = supabaseService || supabase;
      const { data, error } = await dbClient
        .from("doctor_patient_connections")
        .select("status")
        .eq("doctor_id", doctorId)
        .eq("patient_id", targetUserId)
        .maybeSingle();

      if (error) {
        console.error(" Supabase Query Error:", error);
        return;
      }

      if (!data || data.status !== "connected") {
        console.log(`Call blocked: Doctor ${doctorId} and Patient ${targetUserId} are not connected.`);
        return;
      }

      console.log(` Connection exists in database. Proceeding with call...`);

      const targetRoom = `user:${targetUserId}`;
      const targetSockets = await io.in(targetRoom).fetchSockets();
      console.log(` Active sockets in room ${targetRoom}:`, targetSockets.map((s) => s.id));

      if (!targetSockets.length) {
        console.log(` Patient ${targetUserId} is not online.`);

        if (!pendingCalls[targetUserId]) {
          pendingCalls[targetUserId] = [];
        }

        pendingCalls[targetUserId].push({
          offer,
          from: socket.id,
          targetPatientId: targetUserId,
          createdAt: Date.now(),
        });

        // Keep queue bounded and drop stale entries.
        pendingCalls[targetUserId] = pendingCalls[targetUserId]
          .filter((entry) => Date.now() - entry.createdAt < 60000)
          .slice(-3);

        return;
      }

      // Emit incoming call to the patient, including the offer
      io.to(targetRoom).emit("incoming-call", { offer, from: socket.id, targetPatientId: targetUserId });

      console.log(`📞 Call request sent from Doctor ${doctorId} to Patient ${targetUserId} with offer`);
    } catch (err) {
      console.error("❌ Error processing call request:", err);
    }
  });

  //  Handle patient answering the call
  socket.on("answer-call", ({ targetSocketId, answer }) => {
    if (!targetSocketId || !answer) {
      console.error("❌ Error: Invalid targetSocketId or answer in answer-call event");
      return;
    }

    io.to(targetSocketId).emit("call-answered", answer);
    console.log(` Answer relayed to ${targetSocketId}`);
  });

  //  Handle ICE candidate exchange
  socket.on("ice-candidate", ({ targetSocketId, candidate }) => {
    if (!targetSocketId || !candidate) {
      console.error(" Error: Invalid targetSocketId or candidate in ice-candidate event");
      return;
    }

    console.log(`📡 Relaying ICE candidate to: ${targetSocketId}`);
    io.to(targetSocketId).emit("ice-candidate", candidate);
  });

  //  Handle call declined
  socket.on("call-declined", ({ targetSocketId }) => {
    if (!targetSocketId) {
      console.error(" Error: Invalid targetSocketId in call-declined event");
      return;
    }

    console.log(`Call declined from ${socket.id} to ${targetSocketId}`);
    io.to(targetSocketId).emit("call-declined");
  });

  // Handle call ended
  socket.on("end-call", ({ targetSocketId }) => {
    if (!targetSocketId) {
      console.error(" Error: Invalid targetSocketId in end-call event");
      return;
    }

    console.log(`🔚 Call ended from ${socket.id} to ${targetSocketId}`);
    io.to(targetSocketId).emit("end-call");
  });

  // Handle user disconnection
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
      console.log(` User ${disconnectedUserId} disconnected`);
    } else {
      console.log(` Unknown user disconnected: ${socket.id}`);
    }
  });
});

setInterval(() => {
  if (Object.keys(users).length > 0) { // Only ping if users are connected
    io.emit("ping", "keep-alive");
    console.log(" Keep-alive ping sent to all connected clients.");
  }
}, 50000);

// Wakeup call to prevent idle shutdown on Render free tier
// Calls the server's /health endpoint every 10 minutes
const wakeupInterval = setInterval(() => {
  const serverUrl = process.env.SERVER_URL || "https://mindhaven-lwo0.onrender.com";
  fetch(`${serverUrl}/health`)
    .then((res) => {
      if (res.ok) {
        console.log(" Server wakeup call successful at", new Date().toISOString());
      }
    })
    .catch((err) => {
      console.error(" Wakeup call failed:", err.message);
    });
}, 10 * 60 * 1000); // 10 minutes

// Clean up wakeup interval on shutdown
process.on("SIGTERM", () => {
  clearInterval(wakeupInterval);
  console.log(" Wakeup interval cleared, shutting down gracefully.");
  server.close(() => {
    console.log(" Server closed.");
    process.exit(0);
  });
});

//  Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(` Signaling server running on port ${PORT}`);
});
