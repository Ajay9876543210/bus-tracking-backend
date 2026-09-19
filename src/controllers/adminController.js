const bcrypt = require("bcryptjs");
const User = require("../models/User");
const pool = require("../config/database");


// =====================================
// Create New Admin
// =====================================

const createAdmin = async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body || {};

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

        const normalizedName = name.trim();
        const normalizedEmail = email.trim().toLowerCase();

        if (password.length < 8) {

            return res.status(400).json({
                success: false,
                message: "Password must be at least 8 characters"
            });

        }

        const existingUser =
            await User.findByEmail(normalizedEmail);

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "Email already exists"
            });

        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const adminId =
            await User.create(
                normalizedName,
                normalizedEmail,
                hashedPassword,
                "admin"
            );

        return res.status(201).json({

            success: true,

            message: "New admin created successfully",

            data: {
                admin_id: adminId,
                name: normalizedName,
                email: normalizedEmail,
                role: "admin"
            }

        });

    } catch (error) {

        console.error(
            "Create admin error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to create admin"
        });
    }
};



// =====================================
// Create Single Passenger
// =====================================

const createPassenger = async (req, res) => {

    try {

        const {
            user_id,
            name,
            password,
            date_of_birth
        } = req.body || {};

        if (
            typeof user_id !== "string" ||
            typeof name !== "string" ||
            typeof password !== "string" ||
            typeof date_of_birth !== "string" ||
            !user_id.trim() ||
            !name.trim() ||
            !password ||
            !date_of_birth.trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "User ID, name, password and date of birth are required"
            });
        }

        const normalizedUserId =
            user_id.trim();

        const normalizedName =
            name.trim();

        const normalizedDob =
            date_of_birth.trim();

        if (password.length < 8) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 8 characters"
            });
        }

        const existingUser =
            await User.findByUserId(
                normalizedUserId
            );

        if (existingUser) {

            return res.status(409).json({
                success: false,
                message: "User ID already exists"
            });
        }

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        const passengerId =
            await User.create(
                normalizedName,
                null,
                hashedPassword,
                "passenger",
                normalizedUserId,
                normalizedDob
            );

        return res.status(201).json({

            success: true,

            message:
                "Passenger created successfully",

            data: {
                passenger_id: passengerId,
                user_id: normalizedUserId,
                name: normalizedName,
                date_of_birth: normalizedDob,
                role: "passenger"
            }

        });

    } catch (error) {

        console.error(
            "Create passenger error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to create passenger"
        });
    }
};



// =====================================
// Create Multiple Passengers
// =====================================

const createPassengersBulk = async (req, res) => {

    try {

        const { passengers } =
            req.body || {};

        if (!Array.isArray(passengers)) {

            return res.status(400).json({
                success: false,
                message:
                    "Passengers must be an array"
            });
        }

        if (passengers.length === 0) {

            return res.status(400).json({
                success: false,
                message:
                    "At least one passenger is required"
            });
        }

        if (passengers.length > 5000) {

            return res.status(400).json({
                success: false,
                message:
                    "Maximum 5000 passengers can be created at once"
            });
        }


        // ---------------------------------
        // Prepare and validate
        // ---------------------------------

        const preparedPassengers = [];
        const userIds = new Set();

        for (
            let index = 0;
            index < passengers.length;
            index++
        ) {

            const passenger =
                passengers[index] || {};

            const {
                user_id,
                name,
                password,
                date_of_birth
            } = passenger;


            if (
                typeof user_id !== "string" ||
                typeof name !== "string" ||
                typeof password !== "string" ||
                typeof date_of_birth !== "string" ||
                !user_id.trim() ||
                !name.trim() ||
                !password ||
                !date_of_birth.trim()
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        `Invalid passenger data at row ${index + 1}`
                });
            }


            if (password.length < 8) {

                return res.status(400).json({
                    success: false,
                    message:
                        `Password must be at least 8 characters at row ${index + 1}`
                });
            }


            const normalizedUserId =
                user_id.trim();

            const normalizedName =
                name.trim();

            const normalizedDob =
                date_of_birth.trim();


            if (
                userIds.has(
                    normalizedUserId
                )
            ) {

                return res.status(409).json({
                    success: false,
                    message:
                        `Duplicate User ID in uploaded data: ${normalizedUserId}`
                });
            }


            userIds.add(
                normalizedUserId
            );


            preparedPassengers.push({
                user_id: normalizedUserId,
                name: normalizedName,
                password,
                date_of_birth: normalizedDob
            });
        }


        // ---------------------------------
        // Check existing User IDs
        // ---------------------------------

        for (
            const passenger
            of preparedPassengers
        ) {

            const existingUser =
                await User.findByUserId(
                    passenger.user_id
                );

            if (existingUser) {

                return res.status(409).json({
                    success: false,
                    message:
                        `User ID already exists: ${passenger.user_id}`
                });
            }
        }


        // ---------------------------------
        // Hash passwords
        // ---------------------------------

        for (
            const passenger
            of preparedPassengers
        ) {

            passenger.password =
                await bcrypt.hash(
                    passenger.password,
                    10
                );
        }


        // ---------------------------------
        // Insert all passengers
        // ---------------------------------

        const createdPassengers =
            await User.createPassengersBulk(
                preparedPassengers
            );


        return res.status(201).json({

            success: true,

            message:
                `${createdPassengers.length} passengers created successfully`,

            data: createdPassengers

        });

    } catch (error) {

        console.error(
            "Bulk passenger creation error:",
            error
        );


        // Duplicate User ID race-condition
        if (
            error.code === "ER_DUP_ENTRY"
        ) {

            return res.status(409).json({
                success: false,
                message:
                    "One or more User IDs already exist"
            });
        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to create passengers"
        });
    }
};



// =====================================
// Get All Passengers
// =====================================

const getAllPassengers = async (req, res) => {

    try {

        const [rows] =
            await pool.query(
                `SELECT
                    id,
                    user_id,
                    name,
                    date_of_birth,
                    created_at
                 FROM users
                 WHERE role = 'passenger'
                 ORDER BY id DESC`
            );


        return res.json({

            success: true,

            data: rows

        });

    } catch (error) {

        console.error(
            "Get passengers error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch passengers"

        });
    }
};



// =====================================
// Delete Single Passenger
// =====================================

const deletePassenger = async (req, res) => {

    try {

        const passengerId =
            Number(req.params.id);


        if (
            !Number.isInteger(passengerId) ||
            passengerId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid passenger id"
            });
        }


        const passenger =
            await User.findById(
                passengerId
            );


        if (
            !passenger ||
            passenger.role !== "passenger"
        ) {

            return res.status(404).json({
                success: false,
                message:
                    "Passenger not found"
            });
        }


        const [result] =
            await pool.query(
                `DELETE FROM users
                 WHERE id = ?
                   AND role = 'passenger'`,
                [passengerId]
            );


        if (!result.affectedRows) {

            return res.status(404).json({
                success: false,
                message:
                    "Passenger not found"
            });
        }


        return res.json({

            success: true,

            message:
                "Passenger deleted successfully",

            data: {
                passenger_id: passengerId,
                user_id: passenger.user_id
            }

        });

    } catch (error) {

        console.error(
            "Delete passenger error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to delete passenger"
        });
    }
};



// =====================================
// Delete Multiple Passengers
// =====================================

const deletePassengersBulk = async (req, res) => {

    try {

        const { passenger_ids } =
            req.body || {};


        if (!Array.isArray(passenger_ids)) {

            return res.status(400).json({
                success: false,
                message:
                    "passenger_ids must be an array"
            });
        }


        if (passenger_ids.length === 0) {

            return res.status(400).json({
                success: false,
                message:
                    "At least one passenger ID is required"
            });
        }


        if (passenger_ids.length > 5000) {

            return res.status(400).json({
                success: false,
                message:
                    "Maximum 5000 passengers can be deleted at once"
            });
        }


        const ids =
            passenger_ids.map(
                id => Number(id)
            );


        const allValid =
            ids.every(
                id =>
                    Number.isInteger(id) &&
                    id > 0
            );


        if (!allValid) {

            return res.status(400).json({
                success: false,
                message:
                    "All passenger IDs must be valid"
            });
        }


        const uniqueIds =
            [...new Set(ids)];


        const deletedCount =
            await User.deletePassengersBulk(
                uniqueIds
            );


        return res.json({

            success: true,

            message:
                `${deletedCount} passengers deleted successfully`,

            data: {
                requested: uniqueIds.length,
                deleted: deletedCount
            }

        });

    } catch (error) {

        console.error(
            "Bulk passenger deletion error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to delete passengers"
        });
    }
};



// =====================================
// Exports
// =====================================

module.exports = {

    createAdmin,

    createPassenger,
    createPassengersBulk,

    getAllPassengers,

    deletePassenger,
    deletePassengersBulk

};