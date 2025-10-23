// server.js
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middleware
app.use(cors());
app.use(express.json());

// serve static files (index.html, script.js, style.css) from repo root
app.use(express.static(__dirname));

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.post("/chat", async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: "no message provided" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "missing OPENAI_API_KEY" });

  try {
    const oiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "you are yunie, a gentle lowercase ai companion. keep replies soft, warm, lowercase, and conversational. avoid sounding robotic or overly formal."
          },
          { role: "user", content: message }
        ],
        temperature: 0.8
      })
    });

    const data = await oiRes.json().catch(() => ({}));
    if (!oiRes.ok) {
      console.error("openai error", data);
      return res.status(oiRes.status).json({
        error: data?.error?.message || `openai request failed (${oiRes.status})`
      });
    }

    const reply = data.choices?.[0]?.message?.content?.trim() || "(no response)";
    res.json({ reply });
  } catch (err) {
    console.error("server error:", err);
    res.status(500).json({ error: "server error calling openai" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🌸 yunie server running on http://localhost:${PORT}`);
});
