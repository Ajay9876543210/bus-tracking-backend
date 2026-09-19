const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const pool = require("./src/config/database");

// =========================
// Routes
// =========================

const busRoutes = require("./src/routes/busRoutes");
const driverRoutes = require("./src/routes/driverRoutes");
const routeRoutes = require("./src/routes/routeRoutes");
const busStopRoutes = require("./src/routes/busStopRoutes");
const tripRoutes = require("./src/routes/tripRoutes");
const routeStopRoutes = require("./src/routes/routeStopRoutes");
const locationRoutes = require("./src/routes/locationRoutes");
const authRoutes = require("./src/routes/authRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

// =========================
// Socket
// =========================

const driverSocket = require("./src/sockets/driverSocket");
const passengerSocket = require("./src/sockets/passengerSocket");

// =========================
// Error Middleware
// =========================

const errorMiddleware = require("./src/middleware/errorMiddleware");

const app = express();


// =========================
// Middleware
// =========================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// =========================
// Request Debug
// =========================

app.use((req, res, next) => {

    console.log("================================");
    console.log("Request:", req.method, req.url);
    console.log(
        "Content-Type:",
        req.headers["content-type"]
    );
    console.log("Body:", req.body);
    console.log("================================");

    next();

});


// =========================
// Home Route
// =========================

app.get("/", (req, res) => {

    res.send(
        "Bus Tracking Backend is Running"
    );

});


// =========================
// API Routes
// =========================

app.use(
    "/api/buses",
    busRoutes
);

app.use(
    "/api/drivers",
    driverRoutes
);

app.use(
    "/api/routes",
    routeRoutes
);

app.use(
    "/api/stops",
    busStopRoutes
);

app.use(
    "/api/trips",
    tripRoutes
);

app.use(
    "/api/route-stops",
    routeStopRoutes
);

app.use(
    "/api/locations",
    locationRoutes
);

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/admins",
    adminRoutes
);


// =========================
// Routes Loaded Check
// =========================

console.log(
    "Bus routes loaded successfully"
);

console.log(
    "Driver routes loaded successfully"
);

console.log(
    "Route routes loaded successfully"
);

console.log(
    "Bus Stop routes loaded successfully"
);

console.log(
    "Trip routes loaded successfully"
);

console.log(
    "Route Stop routes loaded successfully"
);

console.log(
    "Location routes loaded successfully"
);

console.log(
    "Auth routes loaded successfully"
);

console.log(
    "Admin routes loaded successfully"
);


// =========================
// Database Test
// =========================

app.get(
    "/api/test-db",
    async (req, res, next) => {

        try {

            const [rows] = await pool.query(
                "SELECT 1 AS result"
            );

            res.json({

                success: true,

                message: "MySQL is working",

                data: rows

            });

        } catch (error) {

            next(error);

        }

    }
);


// =========================
// 404 Handler
// =========================

app.use(
    (req, res) => {

        res.status(404).json({

            success: false,

            message: "API route not found",

            path: req.originalUrl

        });

    }
);


// =========================
// Global Error Handler
// =========================

app.use(errorMiddleware);


// =========================
// HTTP Server
// =========================

const PORT =
    process.env.PORT || 5000;

const httpServer =
    http.createServer(app);


// =========================
// Socket.IO
// =========================

const io =
    new Server(
        httpServer,
        {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        }
    );


// =========================
// Make Socket.IO available
// to Express controllers
// =========================

app.set("io", io);


// =========================
// Socket Connections
// =========================

driverSocket(io);

passengerSocket(io);


// =========================
// Start Server
// =========================

httpServer.listen(
    PORT,
    () => {

        console.log(
            "================================"
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log(
            "Socket.IO server is running"
        );

        console.log(
            "================================"
        );

    }
);