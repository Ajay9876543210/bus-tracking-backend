
const express = require("express");

const {
    createBus,
    getAllBuses,
    getBusById,
    updateBusStatus,
    deleteBus
} = require("../controllers/busController");

const {
    authenticate,
    requireAdmin
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================
// Create Bus
// Admin Only
// =====================================

router.post(
    "/",
    authenticate,
    requireAdmin,
    createBus
);


// =====================================
// Get All Buses
// Admin Only
// =====================================

router.get(
    "/",
    authenticate,
    requireAdmin,
    getAllBuses
);


// =====================================
// Get Bus By ID
// Admin Only
// =====================================

router.get(
    "/:id",
    authenticate,
    requireAdmin,
    getBusById
);


// =====================================
// Update Bus Status
// Admin Only
// =====================================

router.patch(
    "/:id/status",
    authenticate,
    requireAdmin,
    updateBusStatus
);


// =====================================
// Delete Bus
// Admin Only
// =====================================

router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    deleteBus
);


module.exports = router;
