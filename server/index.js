const express = require("express");
const axios = require("axios");
const cors = require("cors");
const OpenAI = require("openai");

require("dotenv").config({ path: ".env.local" });

const app = express();
app.use(cors());
app.use(express.json());

const LIVEAVATAR_API_KEY = process.env.LIVEAVATAR_API_KEY;
const AVATAR_ID = process.env.LIVEAVATAR_AVATAR_ID;
const VOICE_ID = process.env.LIVEAVATAR_VOICE_ID;
const CONTEXT_ID = process.env.LIVEAVATAR_CONTEXT_ID;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateIcebreaker() {
  try {
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input:
        "Write one short, casual watercooler question (max 15 words). Only return the question.",
    });
    const firstOutput = response.output[0];

    if (
      firstOutput &&
      firstOutput.content &&
      firstOutput.content[0] &&
      firstOutput.content[0].text
    ) {
      return firstOutput.content[0].text;
    }

    // Fallback
    return "So, how’s your day going so far?";
  } catch (err) {
    console.error("OpenAI error:", err.message);
    return "So, how’s your day going so far?";
  }
}

app.get("/", (req, res) => {
  res.send("Live Avatar backend is running ✅");
});

// --- MAIN ROUTE: create session + return LiveKit meet URL ---
app.post("/api/session", async (req, res) => {
  try {
    // 1) Create session token in FULL mode
    const tokenResp = await axios.post(
      "https://api.liveavatar.com/v1/sessions/token",
      {
        mode: "FULL",
        avatar_id: AVATAR_ID,
        avatar_persona: {
          voice_id: VOICE_ID,
          context_id: CONTEXT_ID,
          language: "en",
        },
      },
      {
        headers: {
          "X-API-KEY": LIVEAVATAR_API_KEY,
          accept: "application/json",
          "content-type": "application/json",
        },
      }
    );

    console.log("Create session token response:", tokenResp.data);

    const sessionToken = tokenResp.data.data.session_token;

    if (!sessionToken) {
      throw new Error("No session token found in LiveAvatar response");
    }

    // 2) Start session – this gives us LiveKit details
    const startResp = await axios.post(
      "https://api.liveavatar.com/v1/sessions/start",
      {},
      {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${sessionToken}`,
        },
      }
    );

    console.log("Start session response:", startResp.data);

    // ⚠️ Check the log once to confirm these property names.
    const livekitUrl = startResp.data.data.livekit_url;
    const livekitToken = startResp.data.data.livekit_client_token;

    // 3) Compose LiveKit hosted UI URL
    const meetUrl = `https://meet.livekit.io/custom?liveKitUrl=${encodeURIComponent(
      livekitUrl
    )}&token=${encodeURIComponent(livekitToken)}`;

    // 4) Get optional OpenAI-generated icebreaker
    const icebreaker = await generateIcebreaker();

    // Send back to frontend
    res.json({ meetUrl, icebreaker });
  } catch (err) {
    console.error(
      "LiveAvatar error:",
      err.response?.data || err.message || err.toString()
    );
    res.status(500).json({ error: "Failed to create LiveAvatar session" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
