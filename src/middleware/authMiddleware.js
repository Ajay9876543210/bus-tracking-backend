
const jwt = require("jsonwebtoken");
const pool = require("../config/database");


// =====================================
// Authenticate User
// =====================================

const authenticate = async (req, res, next) => {

    try {

        const authHeader =
            req.headers.authorization;


        // ---------------------------------
        // Check Authorization Header
        // ---------------------------------

        if (!authHeader) {

            return res.status(401).json({
                success: false,
                message: "Authorization token is required"
            });
        }


        // ---------------------------------
        // Check Bearer Format
        // ---------------------------------

        const parts =
            authHeader.trim().split(/\s+/);


        if (
            parts.length !== 2 ||
            parts[0] !== "Bearer" ||
            !parts[1]
        ) {

            return res.status(401).json({
                success: false,
                message: "Invalid authorization format"
            });
        }


        const token = parts[1];


        // ---------------------------------
        // Verify JWT
        // ---------------------------------

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );


        // ---------------------------------
        // Passenger Session Check
        // ---------------------------------

        if (decoded.role === "passenger") {

            if (!decoded.session_id) {

                return res.status(401).json({
                    success: false,
                    message: "Invalid passenger session"
                });
            }


            const [rows] =
                await pool.query(
                    `SELECT
                        active_session_id,
                        session_expires_at
                     FROM users
                     WHERE id = ?
                       AND role = 'passenger'
                     LIMIT 1`,
                    [decoded.id]
                );


            if (
                !rows.length ||
                !rows[0].active_session_id
            ) {

                return res.status(401).json({
                    success: false,
                    message: "Passenger session is no longer active"
                });
            }


            // ---------------------------------
            // Check Session ID
            // ---------------------------------

            if (
                rows[0].active_session_id !==
                decoded.session_id
            ) {

                return res.status(401).json({
                    success: false,
                    message: "Passenger session is no longer active"
                });
            }


            // ---------------------------------
            // Check Session Expiry
            // ---------------------------------

            if (
                !rows[0].session_expires_at ||
                new Date(rows[0].session_expires_at) <= new Date()
            ) {

                return res.status(401).json({
                    success: false,
                    message: "Passenger session has expired"
                });
            }
        }


        // ---------------------------------
        // Save User
        // ---------------------------------

        req.user = decoded;

        next();


    } catch (error) {

        console.error(
            "Authentication error:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
};


// =====================================
// Admin Only
// =====================================

const requireAdmin = (req, res, next) => {

    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }


    if (req.user.role !== "admin") {

        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });
    }


    next();
};


// =====================================
// Driver Only
// =====================================

const requireDriver = (req, res, next) => {

    if (!req.user) {

        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }


    if (req.user.role !== "driver") {

        return res.status(403).json({
            success: false,
            message: "Driver access required"
        });
    }


    next();
};


// =====================================
// Exports
// =====================================

module.exports = {
    authenticate,
    requireAdmin,
    requireDriver
};
