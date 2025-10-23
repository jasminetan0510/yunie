import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve html/css/js directly from root

// main page route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// chat endpoint
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "no message provided" });

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
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

    const data = await response.json();

    if (data.error) {
      console.error("openai error:", data.error);
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.choices?.[0]?.message?.content?.trim() || "(no response)";
    res.json({ reply });
  } catch (error) {
    console.error("server error:", error);
    res.status(500).json({ error: "something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`🌸 yunie server running on http://localhost:${PORT}`);
});
