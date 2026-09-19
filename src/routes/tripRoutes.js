const express = require("express");

const {
    startTrip,
    endTrip,
    getActiveTrips,
    getAllTrips,
    getMyActiveTrip,
    getTripOptions
} = require("../controllers/tripController");

const {
    authenticate,
    requireAdmin,
    requireDriver
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================
// Start Trip
// Admin + Driver
// =====================================

router.post(
    "/",
    authenticate,
    startTrip
);


// =====================================
// Get Trip Options
// Driver Only
// Bus + Route Dropdown
// =====================================

router.get(
    "/options",
    authenticate,
    requireDriver,
    getTripOptions
);


// =====================================
// Get My Active Trip
// Driver Only
// =====================================

router.get(
    "/my-active",
    authenticate,
    requireDriver,
    getMyActiveTrip
);


// =====================================
// Get Active Trips
// Passenger Public API
// =====================================

router.get(
    "/active",
    getActiveTrips
);


// =====================================
// Get All Trips
// Admin Only
// =====================================

router.get(
    "/",
    authenticate,
    requireAdmin,
    getAllTrips
);


// =====================================
// End Trip
// Admin + Driver
// =====================================

router.patch(
    "/:id/end",
    authenticate,
    endTrip
);


module.exports = router;