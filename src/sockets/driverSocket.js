
const jwt = require("jsonwebtoken");

const Location = require("../models/Location");
const Trip = require("../models/Trip");
const Driver = require("../models/Driver");

const driverSocket = (io) => {

    io.on("connection", (socket) => {

        const token =
            socket.handshake.auth?.token;

        // No token = nothing for driver socket
        if (!token) {
            return;
        }

        // ============================================
        // AUTHENTICATION
        // ============================================

        let user;

        try {

            user = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        } catch (error) {

            console.log(
                "Driver socket rejected: Invalid or expired token"
            );

            socket.emit(
                "driver:error",
                {
                    message:
                        "Invalid or expired token"
                }
            );

            return socket.disconnect(true);
        }

        // ============================================
        // IMPORTANT
        // Passenger connections must be ignored
        // by driverSocket.
        // passengerSocket handles them.
        // ============================================

        if (user.role !== "driver") {
            return;
        }

        socket.user = user;

        console.log(
            "Driver socket connected:",
            socket.id
        );

        console.log(
            "Driver socket authenticated:",
            socket.user.id
        );

        // ============================================
        // INITIAL SOCKET STATE
        // ============================================

        socket.driver = null;
        socket.tripId = null;

        // ============================================
        // DRIVER JOIN TRIP
        // ============================================

        socket.on(
            "driver:join",
            async (data) => {

                try {

                    console.log(
                        "driver:join received:",
                        data
                    );

                    const tripId =
                        Number(data?.trip_id);

                    if (
                        !Number.isInteger(tripId) ||
                        tripId <= 0
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Valid trip_id is required"
                            }
                        );
                    }

                    if (
                        socket.tripId !== null
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "This socket is already connected to a trip."
                            }
                        );
                    }

                    const driver =
                        await Driver.findByUserId(
                            socket.user.id
                        );

                    if (!driver) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Driver profile not found"
                            }
                        );
                    }

                    const trip =
                        await Trip.findById(
                            tripId
                        );

                    if (!trip) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Trip not found"
                            }
                        );
                    }

                    if (
                        Number(trip.driver_id) !==
                        Number(driver.id)
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "This trip is not assigned to this driver"
                            }
                        );
                    }

                    if (
                        trip.status !== "active"
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Trip is not active"
                            }
                        );
                    }

                    socket.driver = driver;
                    socket.tripId = tripId;

                    const roomName =
                        `trip_${tripId}`;

                    socket.join(roomName);

                    console.log(
                        `Driver ${driver.id} joined ${roomName}`
                    );

                    socket.emit(
                        "driver:joined",
                        {
                            trip_id:
                                tripId,

                            bus_id:
                                trip.bus_id,

                            driver_id:
                                driver.id,

                            status:
                                trip.status
                        }
                    );

                } catch (error) {

                    console.error(
                        "================================"
                    );

                    console.error(
                        "driver:join error"
                    );

                    console.error(
                        "Message:",
                        error.message
                    );

                    console.error(
                        "Code:",
                        error.code
                    );

                    console.error(
                        "Stack:",
                        error.stack
                    );

                    console.error(
                        "================================"
                    );

                    socket.emit(
                        "driver:error",
                        {
                            message:
                                "Unable to join trip"
                        }
                    );
                }
            }
        );

        // ============================================
        // DRIVER LOCATION
        // ============================================

        socket.on(
            "driver:location",
            async (data) => {

                try {

                    console.log(
                        "driver:location received:",
                        data
                    );

                    if (
                        !socket.user ||
                        socket.user.role !== "driver"
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Driver authentication required"
                            }
                        );
                    }

                    if (
                        !socket.driver ||
                        socket.tripId === null
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Driver is not connected to a trip"
                            }
                        );
                    }

                    const tripId =
                        Number(data?.trip_id);

                    if (
                        !Number.isInteger(tripId) ||
                        tripId <= 0
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Valid trip_id is required"
                            }
                        );
                    }

                    if (
                        tripId !==
                        Number(socket.tripId)
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Trip ID does not match socket session"
                            }
                        );
                    }

                    const latitude =
                        Number(data?.latitude);

                    if (
                        !Number.isFinite(latitude)
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Valid latitude is required"
                            }
                        );
                    }

                    if (
                        latitude < -90 ||
                        latitude > 90
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Invalid latitude"
                            }
                        );
                    }

                    const longitude =
                        Number(data?.longitude);

                    if (
                        !Number.isFinite(longitude)
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Valid longitude is required"
                            }
                        );
                    }

                    if (
                        longitude < -180 ||
                        longitude > 180
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Invalid longitude"
                            }
                        );
                    }

                    const vehicleSpeed =
                        data?.speed === undefined
                            ? 0
                            : Number(data.speed);

                    if (
                        !Number.isFinite(vehicleSpeed)
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Invalid speed"
                            }
                        );
                    }

                    if (
                        vehicleSpeed < 0 ||
                        vehicleSpeed > 200
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Invalid speed. Speed must be between 0 and 200 km/h."
                            }
                        );
                    }

                    const trip =
                        await Trip.findById(
                            tripId
                        );

                    if (!trip) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Trip not found"
                            }
                        );
                    }

                    if (
                        Number(trip.driver_id) !==
                        Number(socket.driver.id)
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Driver is not authorized for this trip"
                            }
                        );
                    }

                    if (
                        trip.status !== "active"
                    ) {

                        return socket.emit(
                            "driver:error",
                            {
                                message:
                                    "Trip is no longer active"
                            }
                        );
                    }

                    const timestamp =
                        new Date();

                    const locationId =
                        await Location.create(
                            tripId,
                            latitude,
                            longitude,
                            vehicleSpeed,
                            timestamp
                        );

                    const locationData = {

                        location_id:
                            locationId,

                        trip_id:
                            tripId,

                        bus_id:
                            trip.bus_id,

                        latitude:
                            latitude,

                        longitude:
                            longitude,

                        speed:
                            vehicleSpeed,

                        timestamp:
                            timestamp
                    };

                    io.to(`trip_${tripId}`)
                        .emit(
                            "bus:location",
                            locationData
                        );

                    socket.emit(
                        "driver:location_saved",
                        locationData
                    );

                    console.log(
                        "Location saved and broadcast:",
                        locationData
                    );

                } catch (error) {

                    console.error(
                        "================================"
                    );

                    console.error(
                        "driver:location error"
                    );

                    console.error(
                        "Message:",
                        error.message
                    );

                    console.error(
                        "Code:",
                        error.code
                    );

                    console.error(
                        "Stack:",
                        error.stack
                    );

                    console.error(
                        "================================"
                    );

                    socket.emit(
                        "driver:error",
                        {
                            message:
                                "Unable to save location"
                        }
                    );
                }
            }
        );

        // ============================================
        // DISCONNECT
        // ============================================

        socket.on(
            "disconnect",
            (reason) => {

                console.log(
                    "Driver socket disconnected:",
                    socket.id
                );

                console.log(
                    "Reason:",
                    reason
                );

                console.log(
                    "Driver:",
                    socket.driver?.id || null
                );

                console.log(
                    "Trip:",
                    socket.tripId || null
                );
            }
        );

    });
};

module.exports = driverSocket;
