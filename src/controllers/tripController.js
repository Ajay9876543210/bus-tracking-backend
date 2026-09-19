const Trip = require("../models/Trip");
const Bus = require("../models/Bus");
const Driver = require("../models/Driver");
const Route = require("../models/Route");
const pool = require("../config/database");


// =====================================
// Start Trip
// Admin + Driver
// =====================================

const startTrip = async (req, res) => {

    try {

        const {
            bus_id,
            route_id,
            driver_id
        } = req.body || {};


        // =================================
        // Required fields
        // =================================

        if (
            bus_id === undefined ||
            route_id === undefined
        ) {

            return res.status(400).json({
                success: false,
                message: "bus_id and route_id are required"
            });

        }


        // =================================
        // Convert IDs
        // =================================

        const busId = Number(bus_id);
        const routeId = Number(route_id);


        // =================================
        // Validate IDs
        // =================================

        if (
            !Number.isInteger(busId) ||
            !Number.isInteger(routeId) ||
            busId <= 0 ||
            routeId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "bus_id and route_id must be positive integers"
            });

        }


        // =================================
        // Determine Driver
        // =================================

        let driverId;


        // =================================
        // Admin starts trip
        // =================================

        if (req.user?.role === "admin") {

            if (driver_id === undefined) {

                return res.status(400).json({
                    success: false,
                    message:
                        "driver_id is required for admin"
                });

            }


            driverId = Number(driver_id);


            if (
                !Number.isInteger(driverId) ||
                driverId <= 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "driver_id must be a positive integer"
                });

            }


            const driver =
                await Driver.findById(driverId);


            if (!driver) {

                return res.status(404).json({
                    success: false,
                    message: "Driver not found"
                });

            }

        }


        // =================================
        // Driver starts trip
        // =================================

        else if (req.user?.role === "driver") {

            const userId =
                Number(req.user.id);


            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(401).json({
                    success: false,
                    message: "Invalid user information"
                });

            }


            const driver =
                await Driver.findByUserId(userId);


            if (!driver) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Driver profile not found"
                });

            }


            driverId =
                Number(driver.id);


            if (
                !Number.isInteger(driverId) ||
                driverId <= 0
            ) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Invalid driver profile"
                });

            }

        }


        // =================================
        // Other roles
        // =================================

        else {

            return res.status(403).json({
                success: false,
                message:
                    "Admin or Driver access required"
            });

        }


        // =================================
        // Check Bus
        // =================================

        const bus =
            await Bus.findById(busId);


        if (!bus) {

            return res.status(404).json({
                success: false,
                message: "Bus not found"
            });

        }


        // =================================
        // Check Route
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
        // Check Existing Active Bus Trip
        // =================================

        const activeBusTrip =
            await Trip.findActiveByBus(busId);


        if (activeBusTrip) {

            return res.status(409).json({

                success: false,

                message:
                    "This bus already has an active trip",

                data: {

                    trip_id: activeBusTrip.id,
                    driver_id: activeBusTrip.driver_id,
                    route_id: activeBusTrip.route_id

                }

            });

        }


        // =================================
        // Check Driver's Existing Active Trip
        // =================================

        const activeDriverTrip =
            await Trip.findActiveByDriver(driverId);


        if (activeDriverTrip) {

            return res.status(409).json({

                success: false,

                message:
                    "This driver already has an active trip",

                data: {

                    trip_id: activeDriverTrip.id,
                    bus_id: activeDriverTrip.bus_id,
                    route_id: activeDriverTrip.route_id

                }

            });

        }


        // =================================
        // Create Trip
        // =================================

        const tripId =
            await Trip.create(
                busId,
                driverId,
                routeId
            );


        // =================================
        // Update Bus Status
        // =================================

        await Bus.updateStatus(
            busId,
            "active"
        );


        // =================================
        // Response
        // =================================

        return res.status(201).json({

            success: true,

            message:
                "Trip started successfully",

            data: {

                trip_id: tripId,
                bus_id: busId,
                driver_id: driverId,
                route_id: routeId,
                status: "active"

            }

        });

    } catch (error) {

        console.error(
            "Start trip error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to start trip"

        });

    }
};


// =====================================
// End Trip
// Admin + Driver
// =====================================

const endTrip = async (req, res) => {

    try {

        const tripId =
            Number(req.params.id);


        // =================================
        // Validate Trip ID
        // =================================

        if (
            !Number.isInteger(tripId) ||
            tripId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid trip id"

            });

        }


        // =================================
        // Check Role
        // =================================

        const role =
            req.user?.role;


        if (
            role !== "admin" &&
            role !== "driver"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Admin or Driver access required"

            });

        }


        // =================================
        // Find Trip
        // =================================

        const trip =
            await Trip.findById(tripId);


        if (!trip) {

            return res.status(404).json({

                success: false,

                message: "Trip not found"

            });

        }


        // =================================
        // Check Trip Status
        // =================================

        if (trip.status !== "active") {

            return res.status(409).json({

                success: false,

                message:
                    "This trip is not active",

                data: {

                    trip_id: tripId,
                    status: trip.status

                }

            });

        }


        // =================================
        // Driver Ownership Check
        // =================================

        if (role === "driver") {

            const userId =
                Number(req.user?.id);


            if (
                !Number.isInteger(userId) ||
                userId <= 0
            ) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Invalid user information"

                });

            }


            const driver =
                await Driver.findByUserId(userId);


            if (!driver) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Driver profile not found"

                });

            }


            if (
                Number(trip.driver_id) !==
                Number(driver.id)
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "You are not authorized to end this trip"

                });

            }

        }


        // =================================
        // End Trip
        // =================================

        await Trip.endTrip(tripId);


        // =================================
        // Update Bus Status
        // =================================

        await Bus.updateStatus(
            trip.bus_id,
            "inactive"
        );


        // =================================
        // Notify Passengers
        // =================================

        const io =
            req.app.get("io");


        if (io) {

            io.to(`trip_${tripId}`).emit(
                "trip:end",
                {
                    trip_id: tripId,
                    bus_id: trip.bus_id,
                    driver_id: trip.driver_id,
                    status: "completed",
                    message: "Trip ended"
                }
            );

        }


        // =================================
        // Response
        // =================================

        return res.json({

            success: true,

            message:
                "Trip ended successfully",

            data: {

                trip_id: tripId,
                bus_id: trip.bus_id,
                driver_id: trip.driver_id,
                status: "completed"

            }

        });

    } catch (error) {

        console.error(
            "End trip error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to end trip"

        });

    }
};


// =====================================
// Get Active Trips
// Passenger Public API
// =====================================

const getActiveTrips = async (req, res) => {

    try {

        const trips =
            await Trip.getActive();


        return res.json({

            success: true,

            data: trips

        });

    } catch (error) {

        console.error(
            "Get active trips error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch active trips"

        });

    }
};


// =====================================
// Get My Active Trip
// Driver Only
// =====================================

const getMyActiveTrip = async (req, res) => {

    try {

        // =================================
        // Check Driver Login
        // =================================

        if (req.user?.role !== "driver") {

            return res.status(403).json({

                success: false,

                message:
                    "Driver access required"

            });

        }


        // =================================
        // Get User ID
        // =================================

        const userId =
            Number(req.user.id);


        if (
            !Number.isInteger(userId) ||
            userId <= 0
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Invalid user information"

            });

        }


        // =================================
        // Find Driver Profile
        // =================================

        const driver =
            await Driver.findByUserId(userId);


        if (!driver) {

            return res.status(404).json({

                success: false,

                message:
                    "Driver profile not found"

            });

        }


        // =================================
        // Find Active Trip
        // =================================

        const trip =
            await Trip.findActiveByDriver(
                driver.id
            );


        // =================================
        // No Active Trip
        // =================================

        if (!trip) {

            return res.json({

                success: true,

                data: null,

                message:
                    "No active trip"

            });

        }


        // =================================
        // Success
        // =================================

        return res.json({

            success: true,

            data: {

                trip_id: trip.id,
                bus_id: trip.bus_id,
                driver_id: trip.driver_id,
                route_id: trip.route_id,
                status: trip.status,
                started_at: trip.started_at,
                bus_number: trip.bus_number,
                route_name: trip.route_name

            }

        });

    } catch (error) {

        console.error(
            "Get my active trip error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch active trip"

        });

    }
};


// =====================================
// Get Trip Options
// Driver Only
// =====================================

const getTripOptions = async (req, res) => {

    try {

        // =================================
        // Check Driver Login
        // =================================

        if (req.user?.role !== "driver") {

            return res.status(403).json({

                success: false,

                message:
                    "Driver access required"

            });

        }


        // =================================
        // Get Available Buses
        // =================================

        const [buses] = await pool.query(
            `SELECT
                id,
                bus_number,
                status
             FROM buses
             WHERE status = 'inactive'
             ORDER BY bus_number ASC`
        );


        // =================================
        // Get Routes
        // =================================

        const [routes] = await pool.query(
            `SELECT
                id,
                name,
                description
             FROM routes
             ORDER BY name ASC`
        );


        // =================================
        // Response
        // =================================

        return res.json({

            success: true,

            data: {

                buses,
                routes

            }

        });

    } catch (error) {

        console.error(
            "Get trip options error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch trip options"

        });

    }
};


// =====================================
// Get All Trips
// Admin Only
// =====================================

const getAllTrips = async (req, res) => {

    try {

        const trips =
            await Trip.getAll();


        return res.json({

            success: true,

            data: trips

        });

    } catch (error) {

        console.error(
            "Get trips error:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to fetch trips"

        });

    }
};


// =====================================
// Export
// =====================================

module.exports = {

    startTrip,

    endTrip,

    getActiveTrips,

    getAllTrips,

    getMyActiveTrip,

    getTripOptions

};