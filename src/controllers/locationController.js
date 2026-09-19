const Location = require("../models/Location");
const Trip = require("../models/Trip");
const Driver = require("../models/Driver");


// =====================================
// CREATE LOCATION
// Driver Only
// =====================================

const createLocation = async (req, res) => {
    try {
        const {
            trip_id,
            latitude,
            longitude,
            speed,
            timestamp
        } = req.body || {};

        // =====================================
        // REQUIRED FIELDS
        // =====================================

        if (
            trip_id === undefined ||
            latitude === undefined ||
            longitude === undefined
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "trip_id, latitude and longitude are required"
            });
        }

        const tripId = Number(trip_id);
        const lat = Number(latitude);
        const lng = Number(longitude);

        const vehicleSpeed =
            speed === undefined
                ? 0
                : Number(speed);

        // =====================================
        // NUMBER VALIDATION
        // =====================================

        if (
            !Number.isInteger(tripId) ||
            tripId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "trip_id must be a positive integer"
            });
        }

        if (!Number.isFinite(lat)) {
            return res.status(400).json({
                success: false,
                message:
                    "latitude must be a valid number"
            });
        }

        if (!Number.isFinite(lng)) {
            return res.status(400).json({
                success: false,
                message:
                    "longitude must be a valid number"
            });
        }

        if (!Number.isFinite(vehicleSpeed)) {
            return res.status(400).json({
                success: false,
                message:
                    "speed must be a valid number"
            });
        }

        // =====================================
        // LATITUDE / LONGITUDE
        // =====================================

        if (
            lat < -90 ||
            lat > 90
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "latitude must be between -90 and 90"
            });
        }

        if (
            lng < -180 ||
            lng > 180
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "longitude must be between -180 and 180"
            });
        }

        // =====================================
        // SPEED
        // =====================================

        if (
            vehicleSpeed < 0 ||
            vehicleSpeed > 200
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "speed must be between 0 and 200 km/h"
            });
        }

        // =====================================
        // TIMESTAMP
        // =====================================

        let locationTime = new Date();

        if (timestamp !== undefined) {

            const parsedTimestamp =
                new Date(timestamp);

            if (
                Number.isNaN(
                    parsedTimestamp.getTime()
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "timestamp must be a valid date"
                });
            }

            locationTime =
                parsedTimestamp;
        }

        // =====================================
        // LOGGED-IN DRIVER
        // =====================================

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

        // =====================================
        // FIND TRIP
        // =====================================

        const trip =
            await Trip.findById(tripId);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message:
                    "Trip not found"
            });
        }

        // =====================================
        // DRIVER OWNERSHIP
        // =====================================

        if (
            Number(trip.driver_id) !==
            Number(driver.id)
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to update this trip"
            });
        }

        // =====================================
        // TRIP ACTIVE CHECK
        // =====================================

        if (
            trip.status !== "active"
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "GPS location can only be added to an active trip",
                data: {
                    trip_id: tripId,
                    status: trip.status
                }
            });
        }

        // =====================================
        // SAVE LOCATION
        // =====================================

        const locationId =
            await Location.create(
                tripId,
                lat,
                lng,
                vehicleSpeed,
                locationTime
            );

        console.log(
            "📍 Location saved:",
            {
                location_id: locationId,
                trip_id: tripId,
                bus_id: trip.bus_id,
                driver_id: trip.driver_id,
                latitude: lat,
                longitude: lng,
                speed: vehicleSpeed
            }
        );

        // =====================================
        // SOCKET.IO BROADCAST
        // =====================================

        const io =
            req.app.get("io");

        if (io) {

            const locationData = {

                location_id:
                    locationId,

                trip_id:
                    tripId,

                bus_id:
                    trip.bus_id,

                driver_id:
                    trip.driver_id,

                latitude:
                    lat,

                longitude:
                    lng,

                speed:
                    vehicleSpeed,

                timestamp:
                    locationTime
            };

            io.to(
                `trip_${tripId}`
            ).emit(
                "bus:location",
                locationData
            );

            console.log(
                "📡 Location broadcasted:",
                `trip_${tripId}`
            );

        } else {

            console.error(
                "❌ Socket.IO instance not found"
            );
        }

        // =====================================
        // RESPONSE
        // =====================================

        return res.status(201).json({
            success: true,
            message:
                "Location saved successfully",
            data: {
                location_id:
                    locationId,

                trip_id:
                    tripId,

                bus_id:
                    trip.bus_id,

                driver_id:
                    trip.driver_id,

                latitude:
                    lat,

                longitude:
                    lng,

                speed:
                    vehicleSpeed,

                timestamp:
                    locationTime
            }
        });

    } catch (error) {

        console.error(
            "Create location error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to save location"
        });
    }
};


// =====================================
// GET LATEST LOCATION
// Admin Only
// =====================================

const getLatestLocation = async (req, res) => {

    try {

        const tripId =
            Number(req.params.trip_id);

        if (
            !Number.isInteger(tripId) ||
            tripId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid trip_id"
            });
        }

        const trip =
            await Trip.findById(tripId);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message:
                    "Trip not found"
            });
        }

        const location =
            await Location.getLatest(
                tripId
            );

        if (!location) {
            return res.status(404).json({
                success: false,
                message:
                    "No location found for this trip"
            });
        }

        return res.json({
            success: true,
            data: location
        });

    } catch (error) {

        console.error(
            "Get latest location error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch latest location"
        });
    }
};


// =====================================
// GET TRIP LOCATIONS
// Admin Only
// =====================================

const getTripLocations = async (req, res) => {

    try {

        const tripId =
            Number(req.params.trip_id);

        if (
            !Number.isInteger(tripId) ||
            tripId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid trip_id"
            });
        }

        const trip =
            await Trip.findById(tripId);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message:
                    "Trip not found"
            });
        }

        const locations =
            await Location.getTripLocations(
                tripId
            );

        return res.json({
            success: true,
            data: {
                trip_id:
                    tripId,

                count:
                    locations.length,

                locations:
                    locations
            }
        });

    } catch (error) {

        console.error(
            "Get trip locations error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch trip locations"
        });
    }
};


module.exports = {
    createLocation,
    getLatestLocation,
    getTripLocations
};