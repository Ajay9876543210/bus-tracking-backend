const express = require("express");

const {
    createDriver,
    getAllDrivers,
    getDriverById,
    deleteDriver,
    resetDriverPassword
} = require("../controllers/driverController");

const {
    authenticate,
    requireAdmin
} = require("../middleware/authMiddleware");

const router = express.Router();


// Create Driver
// Only Admin can create Driver

router.post(
    "/",
    authenticate,
    requireAdmin,
    createDriver
);


// Get all drivers

router.get(
    "/",
    authenticate,
    requireAdmin,
    getAllDrivers
);


// Get driver by ID

router.get(
    "/:id",
    authenticate,
    requireAdmin,
    getDriverById
);


// Delete Driver
// Only Admin can delete Driver

router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    deleteDriver
);


// Reset Driver Password
// Only Admin can reset Driver password

router.patch(
    "/:id/reset-password",
    authenticate,
    requireAdmin,
    resetDriverPassword
);


module.exports = router;