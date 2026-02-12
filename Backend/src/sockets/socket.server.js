const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

const userModel = require("../models/user.model");
const chatModel = require("../models/chat.model");
const messageModel = require("../models/message.model");

const aiService = require("../services/ai.service");
const { createMemory, queryMemory } = require("../services/vector.service");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    },
  });

  /* ================= AUTH ================= */
  io.use(async (socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
      if (!cookies.token) return next(new Error("No token"));

      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  /* ================= SOCKET ================= */
  io.on("connection", (socket) => {
    console.log("🟢 Connected:", socket.user._id.toString());

    socket.on("ai-message", async ({ chat, content }) => {
      try {
        /* =====================================================
           1️⃣ SAVE USER MESSAGE (FAST, BLOCKING)
        ===================================================== */
        const userMessage = await messageModel.create({
          chat,
          user: socket.user._id,
          role: "user",
          content,
        });

        /* =====================================================
           2️⃣ START EMBEDDING + MEMORY WRITE (NON-BLOCKING)
        ===================================================== */
        const userVectorPromise = aiService.generateVector(content);

        userVectorPromise.then((vector) =>
          createMemory({
            vectors: vector,
            messageId: userMessage._id,
            metadata: {
              user: socket.user._id,
              chat,
              role: "user",
              text: content,
            },
          })
        );

        /* =====================================================
           3️⃣ FETCH STM + LTM IN PARALLEL
        ===================================================== */
        const userVector = await userVectorPromise;

        const [chatHistory, memory] = await Promise.all([
          messageModel
            .find({ chat })
            .sort({ createdAt: -1 })
            .limit(20)
            .lean(),

          queryMemory({
            queryVector: userVector,
            limit: 3,
            metadata: { user: socket.user._id },
          }),
        ]);

        /* =====================================================
           4️⃣ BUILD STM + LTM
        ===================================================== */
        const stm = chatHistory.reverse().map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.content }],
        }));

        const ltm =
          memory.length > 0
            ? [
                {
                  role: "user",
                  parts: [
                    {
                      text: `
Relevant past user context (use only if helpful):

${memory.map((m) => `• ${m.metadata.text}`).join("\n")}
`,
                    },
                  ],
                },
              ]
            : [];

        /* =====================================================
           5️⃣ GEMINI RESPONSE (CRITICAL PATH)
        ===================================================== */
        const aiResponse = await aiService.generateResponse([
          ...ltm,
          ...stm,
        ]);

        /* =====================================================
           6️⃣ EMIT RESPONSE IMMEDIATELY
        ===================================================== */
        socket.emit("ai-response", {
          chat,
          content: aiResponse,
        });

        /* =====================================================
           BACKGROUND TASKS (NON-BLOCKING)
        ===================================================== */
        Promise.all([
          // Save AI message
          messageModel.create({
            chat,
            user: socket.user._id,
            role: "model",
            content: aiResponse,
          }),

          // Vectorize + store AI memory
          (async () => {
            const aiVector = await aiService.generateVector(aiResponse);
            await createMemory({
              vectors: aiVector,
              messageId: userMessage._id,
              metadata: {
                user: socket.user._id,
                chat,
                role: "model",
                text: aiResponse,
              },
            });
          })(),

          // Auto-generate chat title from first user message
          messageModel.countDocuments({ chat, role: "user" }).then((userCount) => {
            if (userCount === 1) {
              const title =
                content.trim().slice(0, 50) + (content.trim().length > 50 ? "…" : "");
              chatModel
                .updateOne(
                  { _id: chat, user: socket.user._id },
                  { $set: { title: title || "New Chat", lastActivity: new Date() } }
                )
                .then(() => {
                  socket.emit("chat-title-updated", { chat, title: title || "New Chat" });
                });
            }
          }),
        ]);
      } catch (err) {
        console.error("❌ AI Socket Error:", err);
        socket.emit("ai-response", {
          chat,
          content: "⚠️ Something went wrong. Please try again.",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Disconnected:", socket.user._id.toString());
    });
  });
}

module.exports = initSocketServer;
