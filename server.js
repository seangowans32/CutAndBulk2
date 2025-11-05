import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
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
mongoose
  .connect(config.mongoUri)
  .then(() => console.log("Connected to the database!"))
  .catch((err) => console.error("Database connection error:", err));

mongoose.connection.on("error", () => {
  throw new Error(`unable to connect to database: ${config.mongoUri}`);
});

// Serve static files from the React app in production
if (config.env === 'production') {
  const clientBuildPath = path.join(__dirname, 'client/dist');
  
  // Log the build path for debugging
  console.log('Serving static files from:', clientBuildPath);
  
  // Serve static files from the client build directory
  app.use(express.static(clientBuildPath, {
    fallthrough: true // Continue to next middleware if file not found
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