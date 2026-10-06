import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy initialization of Gemini AI
  let aiClient: GoogleGenAI | null = null;
  function getGeminiClient(): GoogleGenAI | null {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
        aiClient = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      }
    }
    return aiClient;
  }

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // AI Position Analysis Endpoint
  app.post("/api/ai/analyze-position", async (req, res) => {
    try {
      const { fen, moveHistory, currentEvaluation, lang = "es", userLevel = "Intermedio" } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(200).json({
          offlineFallback: true,
          insight: getOfflineInsight(currentEvaluation, moveHistory, lang),
        });
      }

      const prompt = `System: You are an expert chess grandmaster and cognitive coach specializing in cognitive stimulation through chess.
Position FEN: ${fen}
Move History: ${moveHistory ? moveHistory.join(" ") : "Beginning of game"}
Current Evaluation (Centipawns): ${currentEvaluation ?? 0}
User Profile Level: ${userLevel}
Target Language: ${lang}

Task: Provide a concise, encouraging 2-3 sentence cognitive analysis of this chess position. Point out key tactical threats, memory/pawn patterns, or strategic ideas that stimulate executive planning.
Answer ONLY in language code '${lang}'. Keep it clear, inspiring, and accessible.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      res.json({
        success: true,
        insight: response.text || getOfflineInsight(currentEvaluation, moveHistory, lang),
      });
    } catch (error) {
      console.error("Gemini API position analysis error:", error);
      res.json({
        success: false,
        offlineFallback: true,
        insight: getOfflineInsight(req.body.currentEvaluation, req.body.moveHistory, req.body.lang || "es"),
      });
    }
  });

  // AI Game Cognitive Summary Report
  app.post("/api/ai/cognitive-report", async (req, res) => {
    try {
      const { gameResult, totalMoves, avgTimePerMove, accuracyScore, blunders, difficulty, lang = "es" } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.status(200).json({
          offlineFallback: true,
          report: getOfflineReport(gameResult, accuracyScore, avgTimePerMove, lang),
        });
      }

      const prompt = `System: You are a Cognitive Health & Neuroscience Coach evaluating a completed chess training session.
Game Outcome: ${gameResult}
Difficulty Level: ${difficulty}
Total Moves: ${totalMoves}
Accuracy Score: ${accuracyScore}%
Average Decision Time: ${avgTimePerMove}s
Blunders Count: ${blunders}
Language: ${lang}

Task: Write a short 3-bullet point Cognitive Assessment in language code '${lang}':
1. Executive Function & Focus Evaluation
2. Pattern Recognition & Memory Strength
3. Key Recommendation for next cognitive session

Be positive, precise, and scientifically grounded in cognitive stimulation concepts.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });

      res.json({
        success: true,
        report: response.text || getOfflineReport(gameResult, accuracyScore, avgTimePerMove, lang),
      });
    } catch (error) {
      console.error("Gemini API report error:", error);
      res.json({
        success: false,
        offlineFallback: true,
        report: getOfflineReport(req.body.gameResult, req.body.accuracyScore, req.body.avgTimePerMove, req.body.lang || "es"),
      });
    }
  });

  // Vite or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CogniChess server running on http://0.0.0.0:${PORT}`);
  });
}

function getOfflineInsight(evalScore: number = 0, history: string[] = [], lang: string = "es"): string {
  const isWhiteAdv = evalScore > 0.8;
  const isBlackAdv = evalScore < -0.8;

  if (lang === "es") {
    if (isWhiteAdv) return "Control del centro ventajoso. Mantén la concentración en la estructura de peones y la coordinación de tus piezas.";
    if (isBlackAdv) return "La posición requiere atención defensiva. Evalúa las casillas débiles y calcula rupturas tácticas.";
    return "Posición equilibrada. Estimula tu visión espacial buscando piezas sin defender o columnas abiertas.";
  }
  if (lang === "en") {
    if (isWhiteAdv) return "Advantageous central control. Maintain focus on pawn structure and piece coordination.";
    if (isBlackAdv) return "Position calls for defensive awareness. Look for tactical counterplay and weak squares.";
    return "Balanced position. Stimulate spatial vision by scanning for undefended pieces and open files.";
  }
  // Default encouraging offline message for other languages
  return "Posición analizada localmente. Concentra tu atención en la seguridad del rey y el desarrollo de piezas.";
}

function getOfflineReport(result: string, accuracy: number = 75, avgTime: number = 4, lang: string = "es"): string {
  if (lang === "en") {
    return `• Focus & Precision: Achieved ${accuracy}% decision accuracy across training.\n• Processing Speed: Average decision time of ${avgTime}s demonstrates smooth cognitive rhythm.\n• Recommendation: Continue challenging pattern recognition at this AI difficulty tier.`;
  }
  return `• Enfoque y Precisión: Alcanzaste un ${accuracy}% de precisión en la toma de decisiones.\n• Velocidad de Procesamiento: Promedio de ${avgTime}s por jugada mostrando buen flujo cognitivo.\n• Recomendación: Continúa fortaleciendo la memoria de trabajo y el cálculo táctico.`;
}

startServer();
