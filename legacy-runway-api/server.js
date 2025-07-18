const express = require("express");
const cors = require("cors");
const multer = require("multer");
const RunwayML = require("@runwayml/sdk");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const slowDown = require("express-slow-down");
const cookieParser = require("cookie-parser");
require("dotenv").config();

// Import auth routes
const authRoutes = require("./routes/auth");
const rhodeSignRoutes = require("./routes/rhodesign");

const app = express();
const port = process.env.PORT || 3001;

// Initialize Runway ML client
const runway = new RunwayML({
  apiKey: process.env.RUNWAY_API_TOKEN,
});

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: false, // Already set by nginx, avoid double CSP
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // allow 50 requests per 15 minutes, then...
  delayMs: 500, // add 500ms per request above 50
});
app.use(speedLimiter);

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    runway: !!process.env.RUNWAY_API_TOKEN,
    timestamp: new Date().toISOString(),
  });
});

// Generate video from uploaded image
app.post(
  "/api/runway/generate-video",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!process.env.RUNWAY_API_TOKEN) {
        return res.status(500).json({
          error: "Runway API token not configured",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: "No image file provided",
        });
      }

      const { textPrompt, duration = 5, ratio = "1280:720" } = req.body;

      // Validate duration (Runway ML only accepts 5 or 10)
      const validDuration = duration === 10 ? 10 : 5;

      console.log("Generating video with Runway ML...");
      console.log("File info:", {
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer.length,
      });
      console.log("Prompt:", textPrompt);
      console.log("Duration:", validDuration);
      console.log("Ratio:", ratio);

      // Convert buffer to base64 data URI
      const mimeType = req.file.mimetype;
      const base64String = req.file.buffer.toString("base64");
      const dataUri = `data:${mimeType};base64,${base64String}`;

      console.log("Data URI length:", dataUri.length);
      console.log("Data URI start:", dataUri.substring(0, 100) + "...");

      // Generate video using Runway ML
      const task = await runway.imageToVideo
        .create({
          model: "gen4_turbo",
          promptImage: dataUri,
          promptText:
            textPrompt || "Professional animation with subtle movement",
          ratio: ratio,
          duration: validDuration,
        })
        .waitForTaskOutput();

      console.log("Video generation completed");
      console.log("Task result:", {
        id: task.id,
        status: task.status,
        outputUrl: task.output?.[0],
        hasOutput: !!task.output,
      });

      // Return the video URL
      res.json({
        success: true,
        videoUrl: task.output?.[0],
        taskId: task.id,
        status: task.status,
      });
    } catch (error) {
      console.error("Error generating video:", error);
      res.status(500).json({
        error: error.message || "Failed to generate video",
        details: error.toString(),
      });
    }
  }
);

// Generate video from base64 image data
app.post("/api/runway/generate-video-base64", async (req, res) => {
  try {
    if (!process.env.RUNWAY_API_TOKEN) {
      return res.status(500).json({
        error: "Runway API token not configured",
      });
    }

    const {
      imageData,
      textPrompt,
      duration = 5,
      ratio = "1280:720",
    } = req.body;

    if (!imageData) {
      return res.status(400).json({
        error: "No image data provided",
      });
    }

    // Validate duration (Runway ML only accepts 5 or 10)
    const validDuration = duration === 10 ? 10 : 5;

    console.log("Generating video with Runway ML (base64)...");
    console.log("Image data length:", imageData.length);
    console.log("Image data start:", imageData.substring(0, 100) + "...");
    console.log("Duration:", validDuration);

    // Generate video using Runway ML
    const task = await runway.imageToVideo
      .create({
        model: "gen4_turbo",
        promptImage: imageData,
        promptText: textPrompt || "Professional animation with subtle movement",
        ratio: ratio,
        duration: validDuration,
      })
      .waitForTaskOutput();

    console.log("Video generation completed");
    console.log("Task result:", {
      id: task.id,
      status: task.status,
      outputUrl: task.output?.[0],
      hasOutput: !!task.output,
    });

    // Return the video URL
    res.json({
      success: true,
      videoUrl: task.output?.[0],
      taskId: task.id,
      status: task.status,
    });
  } catch (error) {
    console.error("Error generating video:", error);
    res.status(500).json({
      error: error.message || "Failed to generate video",
      details: error.toString(),
    });
  }
});

// Get animation presets
app.get("/api/runway/presets", (req, res) => {
  const presets = {
    food: {
      name: "Food Presentation",
      textPrompt:
        "Professional food photography with steam rising and subtle movement. High-end restaurant quality with cinematic lighting.",
      duration: 5,
      ratio: "1280:720",
    },
    banquet: {
      name: "Banquet Hall",
      textPrompt:
        "Elegant banquet hall with soft lighting changes and gentle fabric movement. Luxurious atmosphere with warm ambient lighting.",
      duration: 5,
      ratio: "1280:720",
    },
    dessert: {
      name: "Dessert Showcase",
      textPrompt:
        "Beautiful dessert with sparkling effects and gentle rotation. Cinematic food photography with dramatic lighting.",
      duration: 4,
      ratio: "1280:720",
    },
    chef: {
      name: "Chef at Work",
      textPrompt:
        "Professional chef in action with natural movement and kitchen atmosphere. Dynamic cooking scene with professional lighting.",
      duration: 6,
      ratio: "1280:720",
    },
    table: {
      name: "Table Setting",
      textPrompt:
        "Elegant table setting with soft candlelight flickering and gentle fabric movement. Sophisticated dining atmosphere.",
      duration: 4,
      ratio: "1280:720",
    },
    chicken: {
      name: "Chicken Chase",
      textPrompt:
        "Cartoon chicken running fast with wings flapping, comedic chase scene with motion blur and speed effects. Animated style.",
      duration: 4,
      ratio: "1280:720",
    },
  };

  res.json(presets);
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/signatures", authRoutes);
app.use("/api/rhodesign", rhodeSignRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 VH Banquets API server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/api/health`);
  console.log(`🎬 Runway API configured: ${!!process.env.RUNWAY_API_TOKEN}`);
});

module.exports = app;
