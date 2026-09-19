const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");


// =====================================
// Create Driver
// Admin Only
// =====================================

const createDriver = async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            phone
        } = req.body || {};


        // Required fields validation
        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: "Name, email and password are required"
            });

        }


        const normalizedName =
            name.trim();

        const normalizedEmail =
            email.trim().toLowerCase();


        // Phone validation
        if (
            phone !== undefined &&
            phone !== null &&
            typeof phone !== "string"
        ) {

            return res.status(400).json({
                success: false,
                message: "Phone must be a valid string"
            });

        }


        const normalizedPhone =
            typeof phone === "string" && phone.trim()
                ? phone.trim()
                : null;


        // Password validation
        if (password.length < 8) {

            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });

        }


        // Check if user already exists
        const existingUser =
            await User.findByEmail(normalizedEmail);


        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });

        }


        // Hash password
        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Create user
        const userId =
            await User.create(
                normalizedName,
                normalizedEmail,
                hashedPassword,
                "driver"
            );


        // Create driver profile
        const driverId =
            await Driver.create(
                userId,
                normalizedPhone
            );


        // Success response
        return res.status(201).json({

            success: true,

            message: "Driver created successfully",

            data: {

                driver_id: driverId,

                user_id: userId,

                name: normalizedName,

                email: normalizedEmail,

                phone: normalizedPhone,

                role: "driver"

            }

        });

    } catch (error) {

        console.error(
            "Create driver error:",
            error
        );


        // Duplicate database entry
        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                success: false,
                message: "Driver or email already exists"
            });

        }


        return res.status(500).json({

            success: false,

            message: "Failed to create driver"

        });

    }
};


// =====================================
// Get All Drivers
// Admin Only
// =====================================

const getAllDrivers = async (req, res) => {

    try {

        const drivers =
            await Driver.getAll();


        return res.json({

            success: true,

            data: drivers

        });

    } catch (error) {

        console.error(
            "Get drivers error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to fetch drivers"

        });

    }
};


// =====================================
// Get Driver By ID
// Admin Only
// =====================================

const getDriverById = async (req, res) => {

    try {

        const driverId =
            Number(req.params.id);


        // ID validation
        if (
            !Number.isInteger(driverId) ||
            driverId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid driver id"

            });

        }


        const driver =
            await Driver.findById(driverId);


        if (!driver) {

            return res.status(404).json({

                success: false,

                message: "Driver not found"

            });

        }


        return res.json({

            success: true,

            data: driver

        });

    } catch (error) {

        console.error(
            "Get driver error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to fetch driver"

        });

    }

};


// =====================================
// Delete Driver
// Admin Only
// =====================================

const deleteDriver = async (req, res) => {

    try {

        const driverId =
            Number(req.params.id);


        // ID validation
        if (
            !Number.isInteger(driverId) ||
            driverId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid driver id"

            });

        }


        // Find driver
        const driver =
            await Driver.findById(driverId);


        if (!driver) {

            return res.status(404).json({

                success: false,

                message: "Driver not found"

            });

        }


        // =====================================
        // Active trip check
        // =====================================

        const activeTrip =
            await Trip.findActiveByDriver(driverId);


        if (activeTrip) {

            return res.status(409).json({

                success: false,

                message:
                    "Cannot delete driver because the driver has an active trip"

            });

        }


        // =====================================
        // Trip history check
        // =====================================

        const tripHistory =
            await Trip.findByDriver(driverId);


        if (tripHistory.length > 0) {

            return res.status(409).json({

                success: false,

                message:
                    "Cannot delete driver because trip history still exists. The old trip data must be cleaned up first."

            });

        }


        // =====================================
        // Delete linked driver user
        // drivers record will be deleted
        // automatically because of ON DELETE CASCADE
        // =====================================

        const deleted =
            await Driver.deleteUserById(
                driver.user_id
            );


        if (!deleted) {

            return res.status(404).json({

                success: false,

                message: "Driver user account not found"

            });

        }


        return res.json({

            success: true,

            message: "Driver deleted successfully",

            data: {

                driver_id: driverId,

                name: driver.name,

                email: driver.email

            }

        });

    } catch (error) {

        console.error(
            "Delete driver error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to delete driver"

        });

    }

};


// =====================================
// Reset Driver Password
// Admin Only
// =====================================

const resetDriverPassword = async (req, res) => {

    try {

        const driverId =
            Number(req.params.id);

        const {
            newPassword
        } = req.body || {};


        // =====================================
        // Driver ID validation
        // =====================================

        if (
            !Number.isInteger(driverId) ||
            driverId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid driver id"

            });

        }


        // =====================================
        // New password validation
        // =====================================

        if (
            typeof newPassword !== "string" ||
            newPassword.length < 8
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "New password must be at least 8 characters"

            });

        }


        // =====================================
        // Find Driver
        // =====================================

        const driver =
            await Driver.findById(driverId);


        if (!driver) {

            return res.status(404).json({

                success: false,

                message: "Driver not found"

            });

        }


        // =====================================
        // Hash new password
        // =====================================

        const hashedPassword =
            await bcrypt.hash(
                newPassword,
                10
            );


        // =====================================
        // Update password
        // =====================================

        const updated =
            await User.updatePasswordById(
                driver.user_id,
                hashedPassword
            );


        if (!updated) {

            return res.status(404).json({

                success: false,

                message: "Driver user account not found"

            });

        }


        // =====================================
        // Success
        // =====================================

        return res.json({

            success: true,

            message:
                "Driver password reset successfully",

            data: {

                driver_id: driverId,

                name: driver.name,

                email: driver.email

            }

        });

    } catch (error) {

        console.error(
            "Reset driver password error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to reset driver password"

        });

    }

};


// =====================================
// Export Controllers
// =====================================

module.exports = {

    createDriver,

    getAllDrivers,

    getDriverById,

    deleteDriver,

    resetDriverPassword

};