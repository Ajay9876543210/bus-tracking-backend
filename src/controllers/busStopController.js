const BusStop = require("../models/BusStop");


// =====================================
// Create Bus Stop
// =====================================

const createBusStop = async (req, res) => {

    try {

        const {
            name,
            latitude,
            longitude
        } = req.body || {};


        // Required fields validation
        if (
            typeof name !== "string" ||
            !name.trim() ||
            latitude === undefined ||
            longitude === undefined
        ) {

            return res.status(400).json({
                success: false,
                message: "Name, latitude and longitude are required"
            });

        }


        const normalizedName =
            name.trim();


        // Convert coordinates to numbers
        const lat = Number(latitude);
        const lng = Number(longitude);


        // Validate coordinates
        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
        ) {

            return res.status(400).json({
                success: false,
                message: "Latitude and longitude must be valid numbers"
            });

        }


        // Latitude range
        if (
            lat < -90 ||
            lat > 90
        ) {

            return res.status(400).json({
                success: false,
                message: "Latitude must be between -90 and 90"
            });

        }


        // Longitude range
        if (
            lng < -180 ||
            lng > 180
        ) {

            return res.status(400).json({
                success: false,
                message: "Longitude must be between -180 and 180"
            });

        }


        // Create bus stop
        const stopId =
            await BusStop.create(
                normalizedName,
                lat,
                lng
            );


        return res.status(201).json({

            success: true,

            message: "Bus stop created successfully",

            data: {

                stop_id: stopId,

                name: normalizedName,

                latitude: lat,

                longitude: lng

            }

        });

    } catch (error) {

        console.error(
            "Create bus stop error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to create bus stop"

        });

    }
};


// =====================================
// Get All Bus Stops
// =====================================

const getAllBusStops = async (req, res) => {

    try {

        const stops =
            await BusStop.getAll();


        return res.json({

            success: true,

            data: stops

        });

    } catch (error) {

        console.error(
            "Get bus stops error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to fetch bus stops"

        });

    }
};


// =====================================
// Get Bus Stop By ID
// =====================================

const getBusStopById = async (req, res) => {

    try {

        const stopId =
            Number(req.params.id);


        // ID validation
        if (
            !Number.isInteger(stopId) ||
            stopId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid bus stop id"

            });

        }


        const stop =
            await BusStop.findById(stopId);


        if (!stop) {

            return res.status(404).json({

                success: false,

                message: "Bus stop not found"

            });

        }


        return res.json({

            success: true,

            data: stop

        });

    } catch (error) {

        console.error(
            "Get bus stop error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to fetch bus stop"

        });

    }
};


// =====================================
// Delete Bus Stop
// Admin Only
// =====================================

const deleteBusStop = async (req, res) => {

    try {

        const stopId =
            Number(req.params.id);


        // ID validation
        if (
            !Number.isInteger(stopId) ||
            stopId <= 0
        ) {

            return res.status(400).json({

                success: false,

                message: "Invalid bus stop id"

            });

        }


        // Check stop exists
        const stop =
            await BusStop.findById(stopId);


        if (!stop) {

            return res.status(404).json({

                success: false,

                message: "Bus stop not found"

            });

        }


        // Check whether stop is assigned
        // to any route
        const assignments =
            await BusStop.findRouteAssignments(
                stopId
            );


        if (assignments.length > 0) {

            return res.status(409).json({

                success: false,

                message:
                    "Cannot delete bus stop because it is assigned to one or more routes.",

                data: {

                    stop_id: stopId,

                    route_count:
                        assignments.length,

                    routes:
                        assignments

                }

            });

        }


        // Permanently delete stop
        const deleted =
            await BusStop.deleteById(
                stopId
            );


        if (!deleted) {

            return res.status(404).json({

                success: false,

                message: "Bus stop not found"

            });

        }


        return res.json({

            success: true,

            message:
                "Bus stop deleted permanently",

            data: {

                stop_id: stopId

            }

        });

    } catch (error) {

        console.error(
            "Delete bus stop error:",
            error
        );


        // Foreign key protection
        if (
            error.code === "ER_ROW_IS_REFERENCED_2"
        ) {

            return res.status(409).json({

                success: false,

                message:
                    "Cannot delete bus stop because it is still referenced by route assignments."

            });

        }


        return res.status(500).json({

            success: false,

            message:
                "Failed to delete bus stop"

        });

    }
};


module.exports = {
    createBusStop,
    getAllBusStops,
    getBusStopById,
    deleteBusStop
};