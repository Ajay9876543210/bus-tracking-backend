const Route = require("../models/Route");


// =====================================
// Create Route
// =====================================

const createRoute = async (req, res) => {

    try {

        const {
            name,
            description
        } = req.body || {};


        // Name validation
        if (
            typeof name !== "string" ||
            !name.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: "Route name is required"
            });

        }


        const normalizedName =
            name.trim();


        // Description validation
        if (
            description !== undefined &&
            description !== null &&
            typeof description !== "string"
        ) {

            return res.status(400).json({
                success: false,
                message: "Description must be a string"
            });

        }


        const normalizedDescription =
            typeof description === "string" &&
            description.trim()
                ? description.trim()
                : null;


        const routeId =
            await Route.create(
                normalizedName,
                normalizedDescription
            );


        return res.status(201).json({

            success: true,

            message: "Route created successfully",

            data: {

                route_id: routeId,

                name: normalizedName,

                description: normalizedDescription

            }

        });

    } catch (error) {

        console.error(
            "Create route error:",
            error
        );


        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                success: false,
                message: "Route already exists"
            });

        }


        return res.status(500).json({

            success: false,

            message: "Failed to create route"

        });

    }
};


// =====================================
// Get All Routes
// =====================================

const getAllRoutes = async (req, res) => {

    try {

        const routes =
            await Route.getAll();


        return res.json({

            success: true,

            data: routes

        });

    } catch (error) {

        console.error(
            "Get routes error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to fetch routes"

        });

    }
};


// =====================================
// Get Route By ID
// =====================================

const getRouteById = async (req, res) => {

    try {

        const routeId =
            Number(req.params.id);


        // ID validation
        if (
            !Number.isInteger(routeId) ||
            routeId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid route id"

            });

        }


        const route =
            await Route.findById(routeId);


        if (!route) {

            return res.status(404).json({

                success: false,

                message: "Route not found"

            });

        }


        return res.json({

            success: true,

            data: route

        });

    } catch (error) {

        console.error(
            "Get route error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to fetch route"

        });

    }
};


// =====================================
// Delete Route
// Admin Only
// =====================================

const deleteRoute = async (req, res) => {

    try {

        const routeId =
            Number(req.params.id);


        // =================================
        // Validate Route ID
        // =================================

        if (
            !Number.isInteger(routeId) ||
            routeId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid route id"

            });

        }


        // =================================
        // Find Route
        // =================================

        const route =
            await Route.findById(routeId);


        if (!route) {

            return res.status(404).json({

                success: false,

                message: "Route not found"

            });

        }


        // =================================
        // Check Trip History
        // =================================

        const trips =
            await Route.findTripsByRoute(
                routeId
            );


        if (trips.length > 0) {

            // Active trip check
            const activeTrip =
                trips.find(
                    trip =>
                        trip.status === "active"
                );


            if (activeTrip) {

                return res.status(409).json({

                    success: false,

                    message:
                        "Cannot delete route because it has an active trip",

                    data: {

                        route_id: routeId,

                        active_trip_id:
                            activeTrip.id

                    }

                });

            }


            // Completed trip history exists
            return res.status(409).json({

                success: false,

                message:
                    "Cannot delete route because trip history still exists. The route can be deleted after old trip history is cleaned up.",

                data: {

                    route_id: routeId,

                    trip_count:
                        trips.length

                }

            });

        }


        // =================================
        // Delete Route Stops
        // =================================

        await Route.deleteRouteStops(
            routeId
        );


        // =================================
        // Delete Route
        // =================================

        const deleted =
            await Route.deleteById(
                routeId
            );


        if (!deleted) {

            return res.status(404).json({

                success: false,

                message: "Route not found"

            });

        }


        return res.json({

            success: true,

            message: "Route deleted permanently",

            data: {

                route_id: routeId

            }

        });

    } catch (error) {

        console.error(
            "Delete route error:",
            error
        );


        // =================================
        // Foreign Key Protection
        // =================================

        if (
            error.code ===
            "ER_ROW_IS_REFERENCED_2"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Cannot delete route because it is still referenced by existing data."

            });

        }


        return res.status(500).json({

            success: false,

            message: "Failed to delete route"

        });

    }
};


module.exports = {

    createRoute,

    getAllRoutes,

    getRouteById,

    deleteRoute

};