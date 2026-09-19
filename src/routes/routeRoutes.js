const express = require("express");

const {
    createRoute,
    getAllRoutes,
    getRouteById,
    deleteRoute
} = require("../controllers/routeController");

const {
    authenticate,
    requireAdmin
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================
// Create Route
// Admin Only
// =====================================

router.post(
    "/",
    authenticate,
    requireAdmin,
    createRoute
);


// =====================================
// Get All Routes
// Admin Only
// =====================================

router.get(
    "/",
    authenticate,
    requireAdmin,
    getAllRoutes
);


// =====================================
// Get Route By ID
// Admin Only
// =====================================

router.get(
    "/:id",
    authenticate,
    requireAdmin,
    getRouteById
);


// =====================================
// Delete Route
// Admin Only
// =====================================

router.delete(
    "/:id",
    authenticate,
    requireAdmin,
    deleteRoute
);


module.exports = router;