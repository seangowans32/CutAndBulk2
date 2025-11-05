import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import fs from "fs";
import config from "./config/config.js";
import app from "./server/express.js";
import userRoutes from "./server/routes/user.routes.js";
import authRoutes from "./server/routes/auth.routes.js";
import { startDailyResetScheduler } from "./server/helpers/dailyResetScheduler.js";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

// Database connection
mongoose.Promise = global.Promise;

// Log connection attempt (but don't log the full URI with credentials in production)
const mongoUriDisplay = config.mongoUri.includes('@') 
  ? config.mongoUri.split('@')[1] 
  : config.mongoUri;
console.log("Attempting to connect to MongoDB at:", mongoUriDisplay);

mongoose
  .connect(config.mongoUri, {
    serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    retryWrites: true,
    w: 'majority'
  })
  .then(() => {
    console.log("✅ Connected to the database successfully!");
    console.log("Database name:", mongoose.connection.name);
  })
  .catch((err) => {
    console.error("❌ Database connection error:", err.message);
    console.error("MongoDB URI being used:", mongoUriDisplay);
    if (!config.mongoUri || config.mongoUri.includes('localhost')) {
      console.error("⚠️  WARNING: MONGODB_URI environment variable is not set!");
      console.error("Please set MONGODB_URI in your Render environment variables.");
    }
    console.error("Server will continue running, but API endpoints may not work.");
    // Don't throw - allow server to continue running even if DB is unavailable
  });

mongoose.connection.on("error", (err) => {
  console.error("Database connection error event:", err.message);
  // Don't throw - allow server to continue running
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠️  MongoDB disconnected. Attempting to reconnect...");
});

// Serve static files from the React app in production
if (config.env === 'production') {
  const clientBuildPath = path.join(__dirname, 'client/dist');
  
  // Log the build path for debugging
  console.log('Serving static files from:', clientBuildPath);
  
  // Check if the build directory exists
  if (!fs.existsSync(clientBuildPath)) {
    console.error('❌ ERROR: Client build directory not found at:', clientBuildPath);
    console.error('Make sure the build command completed successfully.');
  } else {
    console.log('✅ Client build directory found');
    // Check if index.html exists
    const indexPath = path.join(clientBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      console.log('✅ index.html found');
    } else {
      console.error('❌ index.html not found at:', indexPath);
    }
  }
  
  // Serve static files from the client build directory
  // Use fallthrough: true so we can catch missing files and serve index.html for SPA routes
  app.use(express.static(clientBuildPath, {
    fallthrough: true, // Continue to next middleware if file not found
    index: false // Don't auto-serve index.html, we'll handle it manually
  }));
  
  // SPA fallback: serve index.html for all non-API routes that don't match static files
  // Use app.use() with a middleware function to handle catch-all for Express 5
  app.use((req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    // Skip non-GET requests
    if (req.method !== 'GET') {
      return next();
    }
    // Skip requests that look like static assets (have file extensions)
    // This prevents serving index.html for missing static files
    if (req.path.match(/\.[a-zA-Z0-9]+$/)) {
      return next();
    }
    // Serve index.html for all other GET requests (SPA routing)
    const indexPath = path.join(clientBuildPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        console.error('Attempted path:', indexPath);
        res.status(500).send('Error loading application');
      }
    });
  });
} else {
  // Development root route
  app.get("/", (req, res) => {
    res.type("text/plain");
    res.send(
      "Wake up, Sean…\nThe Matrix has you…\nFollow the white rabbit.\nKnock, knock, Sean."
    );
  });
}

// Start server
app.listen(config.port, (err) => {
  if (err) {
    console.error(err);
  }
  console.info(`Server started on port ${config.port}`);
  
  // Start the daily reset scheduler (runs at midnight)
  startDailyResetScheduler();
});