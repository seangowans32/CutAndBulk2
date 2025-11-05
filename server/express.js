import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import compress from "compression";
import cors from "cors";
import helmet from "helmet";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compress());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration - allow Vite dev server and production domain with credentials
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [
      process.env.FRONTEND_URL || 'https://cutandbulk.onrender.com',
      'https://cutandbulk.onrender.com',
      'https://comp229-3mmr.onrender.com'
    ]
  : ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (same-origin requests, mobile apps, curl requests)
    // In production, same-origin requests (from the same domain) won't have an origin header
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Log the blocked origin for debugging
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

export default app;
