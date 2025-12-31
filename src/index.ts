import dotenv from "dotenv";

dotenv.config();

import express, { type Request, type Response } from "express";
import session from "express-session";
import cors from "cors";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";
import { loggingMiddleware } from "./middleware/loggingMiddleware.js";

// Start the server
async function startServer() {
    // Import passport AFTER environment variables are loaded
    const passportModule = await import("./config/passport.js");
    const passport = passportModule.default;

    const authRoutesModule = await import("./routes/auth.routes.js");
    const authRoutes = authRoutesModule.default;

    connectDB();

    const app = express();
    const PORT = process.env.PORT || 3003;

    // CORS configuration
    app.use(loggingMiddleware);
    app.use(
        cors({
            origin: process.env.FRONTEND_URL || "http://localhost:5173",
            credentials: true,
        })
    );

    app.use(express.json());

    // Session configuration
    app.use(
        session({
            secret: process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === "production",
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
            },
        })
    );

    // Initialize Passport
    app.use(passport.initialize());
    app.use(passport.session());

    // Routes
    app.get("/health", (req: Request, res: Response) => {
        res.send("RUNNING");
    });
    app.get("/db-health", async (req: Request, res: Response) => {
        try {
            await connectDB();
            res.send("RUNNING");
        } catch (error) {
            console.error(error);
            res.status(500).send("Database connection failed");
        }
    });

    app.use("/", authRoutes);

    app.listen(PORT, () => {
        logger.info(`auth-service server running at http://localhost:${PORT}`);
    });
}

startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});