const express = require("express");

const {
    createAdmin,

    createPassenger,
    createPassengersBulk,

    getAllPassengers,

    deletePassenger,
    deletePassengersBulk

} = require("../controllers/adminController");

const {
    authenticate,
    requireAdmin
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================
// Admin Management
// =====================================

router.post(
    "/",
    authenticate,
    requireAdmin,
    createAdmin
);


// =====================================
// Passenger Management
// =====================================

// Create single passenger
router.post(
    "/passengers",
    authenticate,
    requireAdmin,
    createPassenger
);


// Create multiple passengers
router.post(
    "/passengers/bulk",
    authenticate,
    requireAdmin,
    createPassengersBulk
);


// Get all passengers
router.get(
    "/passengers",
    authenticate,
    requireAdmin,
    getAllPassengers
);


// Delete single passenger
router.delete(
    "/passengers/:id",
    authenticate,
    requireAdmin,
    deletePassenger
);


// Delete multiple passengers
router.delete(
    "/passengers/bulk",
    authenticate,
    requireAdmin,
    deletePassengersBulk
);


module.exports = router;