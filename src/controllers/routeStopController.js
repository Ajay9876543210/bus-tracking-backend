const Route = require("../models/Route");
const BusStop = require("../models/BusStop");
const RouteStop = require("../models/RouteStop");


// =====================================
// Add Stop To Route
// =====================================

const addStopToRoute = async (req, res) => {

    try {

        const {
            route_id,
            stop_id,
            stop_order
        } = req.body || {};


        // Required fields
        if (
            route_id === undefined ||
            stop_id === undefined ||
            stop_order === undefined
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "route_id, stop_id and stop_order are required"
            });

        }


        // Convert to numbers
        const routeId = Number(route_id);
        const stopId = Number(stop_id);
        const stopOrder = Number(stop_order);


        // Validate integers
        if (
            !Number.isInteger(routeId) ||
            !Number.isInteger(stopId) ||
            !Number.isInteger(stopOrder)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "route_id, stop_id and stop_order must be valid integers"
            });

        }


        // IDs must be positive
        if (
            routeId <= 0 ||
            stopId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "route_id and stop_id must be greater than 0"
            });

        }


        // Stop order must be positive
        if (stopOrder <= 0) {

            return res.status(400).json({
                success: false,
                message:
                    "stop_order must be greater than 0"
            });

        }


        // Check route
        const route =
            await Route.findById(routeId);

        if (!route) {

            return res.status(404).json({
                success: false,
                message: "Route not found"
            });

        }


        // Check bus stop
        const stop =
            await BusStop.findById(stopId);

        if (!stop) {

            return res.status(404).json({
                success: false,
                message: "Bus stop not found"
            });

        }


        // Add stop to route
        const routeStopId =
            await RouteStop.add(
                routeId,
                stopId,
                stopOrder
            );


        return res.status(201).json({

            success: true,

            message:
                "Stop added to route successfully",

            data: {
                route_stop_id: routeStopId,
                route_id: routeId,
                stop_id: stopId,
                stop_order: stopOrder
            }

        });

    } catch (error) {

        console.error(
            "Add stop to route error:",
            error
        );


        // Duplicate route-stop combination
        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                success: false,
                message:
                    "This stop is already added to this route"
            });

        }


        return res.status(500).json({
            success: false,
            message:
                "Failed to add stop to route"
        });

    }

};


// =====================================
// Get Route Stops
// =====================================

const getRouteStops = async (req, res) => {

    try {

        const routeId =
            Number(req.params.route_id);


        // Validate route ID
        if (
            !Number.isInteger(routeId) ||
            routeId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid route_id"
            });

        }


        // Check route
        const route =
            await Route.findById(routeId);


        if (!route) {

            return res.status(404).json({
                success: false,
                message: "Route not found"
            });

        }


        // Get stops
        const stops =
            await RouteStop.getByRoute(routeId);


        return res.json({

            success: true,

            data: {
                route: route,
                stops: stops
            }

        });

    } catch (error) {

        console.error(
            "Get route stops error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch route stops"
        });

    }

};


// =====================================
// Remove Stop From Route
// =====================================
// IMPORTANT:
// This removes only the route-stop
// assignment.
// Physical bus stop is NOT deleted.
// =====================================

const removeStopFromRoute = async (req, res) => {

    try {

        const routeStopId =
            Number(req.params.id);


        // Validate route-stop ID
        if (
            !Number.isInteger(routeStopId) ||
            routeStopId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid route stop id"
            });

        }


        // Check assignment
        const routeStop =
            await RouteStop.findById(routeStopId);


        if (!routeStop) {

            return res.status(404).json({
                success: false,
                message:
                    "Route stop assignment not found"
            });

        }


        // Delete assignment
        const deleted =
            await RouteStop.deleteById(routeStopId);


        if (!deleted) {

            return res.status(404).json({
                success: false,
                message:
                    "Route stop assignment not found"
            });

        }


        return res.json({

            success: true,

            message:
                "Stop removed from route successfully",

            data: {
                route_stop_id: routeStopId,
                route_id: routeStop.route_id,
                stop_id: routeStop.stop_id
            }

        });

    } catch (error) {

        console.error(
            "Remove stop from route error:",
            error
        );


        return res.status(500).json({
            success: false,
            message:
                "Failed to remove stop from route"
        });

    }

};


module.exports = {

    addStopToRoute,

    getRouteStops,

    removeStopFromRoute

};