const express = require("express");

const {
    createLocation,
    getLatestLocation,
    getTripLocations
} = require("../controllers/locationController");

const {
    authenticate,
    requireAdmin,
    requireDriver
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================
// Create Location
// Driver Only
// =====================================

router.post(
    "/",
    authenticate,
    requireDriver,
    createLocation
);


// =====================================
// Get Latest Location
// Admin Only
// =====================================

router.get(
    "/trip/:trip_id/latest",
    authenticate,
    requireAdmin,
    getLatestLocation
);


// =====================================
// Get Trip Location History
// Admin Only
// =====================================

router.get(
    "/trip/:trip_id",
    authenticate,
    requireAdmin,
    getTripLocations
);


module.exports = router;