const express = require("express");

const {
    addStopToRoute,
    getRouteStops,
    removeStopFromRoute
} = require("../controllers/routeStopController");

const {
    authenticate,
    requireAdmin
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================
// Add Stop To Route
// =====================================
// Only Admin

router.post(
    "/",
    authenticate,
    requireAdmin,
    addStopToRoute
);


// =====================================
// Get Route Stops
// =====================================
// Admin + Passenger

router.get(
    "/route/:route_id",
    authenticate,
    getRouteStops
);


// =====================================
// Remove Stop From Route
// =====================================
// Only Admin
// This removes only the assignment.
// Bus stop itself is NOT deleted.

router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    removeStopFromRoute
);


module.exports = router;