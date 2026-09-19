const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/User");


// =====================================
// Create Token
// =====================================

const createToken = (
    user,
    expiresIn = null,
    sessionId = null
) => {

    return jwt.sign(
        {
            id: user.id,
            user_id: user.user_id || null,
            name: user.name,
            email: user.email || null,
            role: user.role,
            ...(sessionId && {
                session_id: sessionId
            })
        },
        process.env.JWT_SECRET,
        {
            expiresIn:
                expiresIn ||
                process.env.JWT_EXPIRES_IN ||
                "1d"
        }
    );
};


// =====================================
// Admin Login
// =====================================

const adminLogin = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body || {};

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await User.findByEmail(
                normalizedEmail
            );

        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (user.role !== "admin") {

            return res.status(403).json({
                success: false,
                message: "Admin account required"
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token =
            createToken(user);

        return res.json({

            success: true,

            message:
                "Admin login successful",

            data: {

                token,

                user: {

                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error) {

        console.error(
            "Admin login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Admin login failed"
        });
    }
};


// =====================================
// Master Admin Forgot Password
// =====================================

const masterAdminForgotPassword = async (req, res) => {

    try {

        const {
            name,
            email,
            date_of_birth,
            new_password
        } = req.body || {};


        // ---------------------------------
        // Validate input
        // ---------------------------------

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof date_of_birth !== "string" ||
            typeof new_password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !date_of_birth.trim() ||
            !new_password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Name, email, date of birth and new password are required"
            });
        }


        // ---------------------------------
        // Password length
        // ---------------------------------

        if (new_password.length < 8) {

            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 8 characters"
            });
        }


        // ---------------------------------
        // Normalize input
        // ---------------------------------

        const normalizedName =
            name.trim();

        const normalizedEmail =
            email.trim().toLowerCase();

        const normalizedDob =
            date_of_birth.trim();


        // ---------------------------------
        // Find Master Admin
        // ---------------------------------

        const masterAdmin =
            await User.findMasterAdminForRecovery(
                normalizedName,
                normalizedEmail,
                normalizedDob
            );


        if (!masterAdmin) {

            return res.status(401).json({
                success: false,
                message:
                    "Master Admin verification failed"
            });
        }


        // ---------------------------------
        // Hash new password
        // ---------------------------------

        const hashedPassword =
            await bcrypt.hash(
                new_password,
                10
            );


        // ---------------------------------
        // Update password
        // ---------------------------------

        const updated =
            await User.updatePasswordById(
                masterAdmin.id,
                hashedPassword
            );


        if (!updated) {

            return res.status(500).json({
                success: false,
                message:
                    "Failed to reset Master Admin password"
            });
        }


        // ---------------------------------
        // Success
        // ---------------------------------

        return res.json({

            success: true,

            message:
                "Master Admin password reset successfully"
        });

    } catch (error) {

        console.error(
            "Master Admin forgot password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Master Admin password reset failed"
        });
    }
};


// =====================================
// Driver Login
// =====================================

const driverLogin = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body || {};

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        const normalizedEmail =
            email.trim().toLowerCase();

        const user =
            await User.findByEmail(
                normalizedEmail
            );

        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        if (user.role !== "driver") {

            return res.status(403).json({
                success: false,
                message: "Driver account required"
            });
        }

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token =
            createToken(user);

        return res.json({

            success: true,

            message:
                "Driver login successful",

            data: {

                token,

                user: {

                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });

    } catch (error) {

        console.error(
            "Driver login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Driver login failed"
        });
    }
};


// =====================================
// Passenger Login
// =====================================

const passengerLogin = async (req, res) => {

    try {

        const {
            user_id,
            password
        } = req.body || {};


        // ---------------------------------
        // Validate input
        // ---------------------------------

        if (
            typeof user_id !== "string" ||
            typeof password !== "string" ||
            !user_id.trim() ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: "User ID and password are required"
            });
        }


        const normalizedUserId =
            user_id.trim();


        // ---------------------------------
        // Find passenger
        // ---------------------------------

        const user =
            await User.findByUserId(
                normalizedUserId
            );


        if (!user) {

            return res.status(401).json({
                success: false,
                message: "Invalid User ID or password"
            });
        }


        if (user.role !== "passenger") {

            return res.status(403).json({
                success: false,
                message: "Passenger account required"
            });
        }


        // ---------------------------------
        // Check password
        // ---------------------------------

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message: "Invalid User ID or password"
            });
        }


        // ---------------------------------
        // Check active session
        // ---------------------------------

        const activeSession =
            await User.getActiveSession(
                user.id
            );


        if (
            activeSession &&
            activeSession.active_session_id &&
            activeSession.session_expires_at &&
            new Date(
                activeSession.session_expires_at
            ) > new Date()
        ) {

            return res.status(409).json({
                success: false,
                message:
                    "Account is already active on another device"
            });
        }


        // ---------------------------------
        // Create new session
        // ---------------------------------

        const sessionId =
            crypto.randomUUID();


        const expiresAt =
            new Date(
                Date.now() + 15 * 60 * 1000
            );


        const sessionCreated =
            await User.createSession(
                user.id,
                sessionId,
                expiresAt
            );


        if (!sessionCreated) {

            return res.status(500).json({
                success: false,
                message:
                    "Unable to create passenger session"
            });
        }


        // ---------------------------------
        // Create Passenger JWT
        // ---------------------------------

        const token =
            createToken(
                user,
                "15m",
                sessionId
            );


        // ---------------------------------
        // Success
        // ---------------------------------

        return res.json({

            success: true,

            message:
                "Passenger login successful",

            data: {

                token,

                user: {

                    id: user.id,
                    user_id: user.user_id,
                    name: user.name,
                    role: user.role
                }
            }
        });

    } catch (error) {

        console.error(
            "Passenger login error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Passenger login failed"
        });
    }
};


// =====================================
// Passenger Forgot Password
// =====================================

const passengerForgotPassword = async (req, res) => {

    try {

        const {
            user_id,
            name,
            date_of_birth,
            new_password
        } = req.body || {};


        // ---------------------------------
        // Validate input
        // ---------------------------------

        if (
            typeof user_id !== "string" ||
            typeof name !== "string" ||
            typeof date_of_birth !== "string" ||
            typeof new_password !== "string" ||
            !user_id.trim() ||
            !name.trim() ||
            !date_of_birth.trim() ||
            !new_password
        ) {

            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }


        // ---------------------------------
        // Password length
        // ---------------------------------

        if (new_password.length < 8) {

            return res.status(400).json({
                success: false,
                message:
                    "New password must be at least 8 characters"
            });
        }


        const normalizedUserId =
            user_id.trim();

        const normalizedName =
            name.trim().toLowerCase();

        const normalizedDob =
            date_of_birth.trim();


        // ---------------------------------
        // Find passenger
        // ---------------------------------

        const user =
            await User.findByUserId(
                normalizedUserId
            );


        if (
            !user ||
            user.role !== "passenger"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Unable to verify account details"
            });
        }


        // ---------------------------------
        // Verify name
        // ---------------------------------

        const dbName =
            String(user.name || "")
                .trim()
                .toLowerCase();


        const nameMatch =
            dbName === normalizedName;


        // ---------------------------------
        // Verify DOB
        // ---------------------------------

        let dbDateOfBirth = "";


        if (user.date_of_birth) {

            if (
                user.date_of_birth instanceof Date
            ) {

                const year =
                    user.date_of_birth.getFullYear();

                const month =
                    String(
                        user.date_of_birth.getMonth() + 1
                    ).padStart(2, "0");

                const day =
                    String(
                        user.date_of_birth.getDate()
                    ).padStart(2, "0");

                dbDateOfBirth =
                    `${year}-${month}-${day}`;

            } else {

                dbDateOfBirth =
                    String(
                        user.date_of_birth
                    ).slice(0, 10);
            }
        }


        const dobMatch =
            dbDateOfBirth === normalizedDob;


        // ---------------------------------
        // Final verification
        // ---------------------------------

        if (
            !nameMatch ||
            !dobMatch
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Unable to verify account details"
            });
        }


        // ---------------------------------
        // Hash new password
        // ---------------------------------

        const hashedPassword =
            await bcrypt.hash(
                new_password,
                10
            );


        // ---------------------------------
        // Update password
        // ---------------------------------

        const updated =
            await User.updatePasswordById(
                user.id,
                hashedPassword
            );


        if (!updated) {

            return res.status(500).json({
                success: false,
                message:
                    "Password reset failed"
            });
        }


        // ---------------------------------
        // Clear existing passenger session
        // ---------------------------------

        await User.clearSession(
            user.id
        );


        // ---------------------------------
        // Success
        // ---------------------------------

        return res.json({

            success: true,

            message:
                "Password reset successful"
        });

    } catch (error) {

        console.error(
            "Passenger forgot password error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Password reset failed"
        });
    }
};


// =====================================
// Passenger Logout
// =====================================

const passengerLogout = async (req, res) => {

    try {

        // ---------------------------------
        // Check passenger
        // ---------------------------------

        if (
            !req.user ||
            req.user.role !== "passenger"
        ) {

            return res.status(403).json({
                success: false,
                message: "Passenger access required"
            });
        }


        // ---------------------------------
        // Clear only current session
        // ---------------------------------

        await User.clearSessionIfMatches(
            req.user.id,
            req.user.session_id
        );


        // ---------------------------------
        // Success
        // ---------------------------------

        return res.json({

            success: true,

            message:
                "Passenger logout successful"
        });

    } catch (error) {

        console.error(
            "Passenger logout error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Passenger logout failed"
        });
    }
};


// =====================================
// Exports
// =====================================

module.exports = {

    adminLogin,
    masterAdminForgotPassword,
    driverLogin,
    passengerLogin,
    passengerForgotPassword,
    passengerLogout

};