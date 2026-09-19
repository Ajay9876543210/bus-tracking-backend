const express = require("express");

const {
    createBusStop,
    getAllBusStops,
    getBusStopById,
    deleteBusStop
} = require("../controllers/busStopController");

const {
    authenticate,
    requireAdmin
} = require("../middleware/authMiddleware");

const router = express.Router();

// Create Bus Stop
// Only Admin
router.post(
    "/",
    authenticate,
    requireAdmin,
    createBusStop
);

// Get All Bus Stops
// Only Admin
router.get(
    "/",
    authenticate,
    requireAdmin,
    getAllBusStops
);

// Get Bus Stop By ID
// Only Admin
router.get(
    "/:id",
    authenticate,
    requireAdmin,
    getBusStopById
);

// Delete Bus Stop Permanently
// Only Admin
router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    deleteBusStop
);

module.exports = router;