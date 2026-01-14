import express from "express";
import fetch from "node-fetch";

const app = express();

/* =========================
   CORS CONFIGURATION
   ========================= */
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://teddacebpo-lab.github.io"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});


/* =========================
   BODY PARSER
   ========================= */
app.use(express.json());

/* =========================
   GEMINI API ENDPOINT
   ========================= */
app.post("/api/gemini", async (req, res) => {
  try {
    const { contents, config } = req.body;

    if (!contents) {
      return res.status(400).json({ error: "Missing contents" });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
        body: JSON.stringify({
          contents,
          ...config,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error("Gemini backend error:", error);
    res.status(500).json({ error: "Backend failure" });
  }
});

/* =========================
   HEALTH CHECK
   ========================= */
app.get("/", (req, res) => {
  res.send("Gemini backend is running");
});

/* =========================
   EXPORT FOR VERCEL
   ========================= */
export default app;
