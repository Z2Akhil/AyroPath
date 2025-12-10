import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import "dotenv/config";
import authRouter from "./src/routes/auth.js";
import userRouter from "./src/routes/user.js";
import adminRouter from "./src/routes/admin.js";
import clientRouter from "./src/routes/client.js";
import cartRouter from "./src/routes/cart.js";
import SiteSettingsRouter from "./src/routes/siteSettings.js";
import orderRouter from "./src/routes/order.js";
import notificationRouter from "./src/routes/notification.js";
import ThyrocareRefreshService from "./src/services/thyrocareRefreshService.js";
import OrderStatusSyncService from "./src/services/OrderStatusSyncService.js";

const app = express();

["MONGODB_URI", "CLIENT_URLS"].forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing environment variable: ${key}`);
    process.exit(1);
  }
});

// --- Middleware ---
const allowedOrigins = process.env.CLIENT_URLS.split(",").map(url => url.trim());
console.log("Allowed origins:", allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`⚠️  CORS: Origin ${origin} not in allowed list, but allowing in development`);
      return callback(null, true);
    }

    console.log(`❌ CORS: Origin ${origin} not allowed`);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
}));

app.use(helmet());
app.use(compression());
app.use(express.json());
if (process.env.NODE_ENV !== "production")
  app.use(morgan("dev"));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// --- Routes ---
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);
app.use("/api/client", clientRouter);
app.use("/api/cart", cartRouter);
app.use("/api/settings", SiteSettingsRouter);
app.use("/api/orders", orderRouter);
app.use("/api/admin/notifications", notificationRouter);

// base /api health check
app.get("/api", (req, res) => res.json({ success: true, message: "AyroPath API base" }));

// --- Error handling ---
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === "production" ? "Something went wrong" : err.message,
  });
});

app.use((req, res) => res.status(404).json({ success: false, message: "Not Found" }));

// --- Database + startup ---
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("✅ MongoDB Connected");
    await ThyrocareRefreshService.checkAndRefreshOnStartup();

    // Daily order status sync scheduler removed
    // Status is refreshed on-demand when users/admins view orders

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// --- Daily Order Status Sync Scheduler (Removed) ---
// Note: Daily scheduler removed to respect Thyrocare API limits
// Order status is now refreshed on-demand:
// 1. When users view their orders (auto-refresh)
// 2. When admins manually refresh specific orders

// --- Graceful shutdown ---
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});
