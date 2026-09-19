
const jwt = require("jsonwebtoken");

const Trip = require("../models/Trip");
const Location = require("../models/Location");
const pool = require("../config/database");


module.exports = (io) => {

    // =====================================
    // SOCKET CONNECTION
    // =====================================

    io.on("connection", async (socket) => {

        // =====================================
        // SOCKET AUTHENTICATION
        // =====================================

        const token =
            socket.handshake.auth?.token;


        // ---------------------------------
        // Token required
        // ---------------------------------

        if (
            typeof token !== "string" ||
            !token.trim()
        ) {
            return;
        }


        let decoded;


        // ---------------------------------
        // Verify JWT
        // ---------------------------------

        try {

            decoded =
                jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

        } catch (error) {

            return;
        }


        // =====================================
        // IMPORTANT
        // Driver connection must be ignored
        // Driver socket handles drivers.
        // =====================================

        if (
            decoded.role !== "passenger"
        ) {
            return;
        }


        // =====================================
        // PASSENGER SESSION SECURITY
        // =====================================

        try {

            // ---------------------------------
            // Session ID required
            // ---------------------------------

            if (
                !decoded.session_id
            ) {

                console.log(
                    "Passenger socket rejected: Invalid session"
                );

                return socket.disconnect(true);
            }


            // ---------------------------------
            // Check active session in DB
            // ---------------------------------

            const [rows] =
                await pool.query(
                    `SELECT
                        active_session_id,
                        session_expires_at
                     FROM users
                     WHERE id = ?
                       AND role = 'passenger'
                     LIMIT 1`,
                    [decoded.id]
                );


            if (
                !rows.length ||
                !rows[0].active_session_id
            ) {

                console.log(
                    "Passenger socket rejected: Session inactive"
                );

                return socket.disconnect(true);
            }


            // ---------------------------------
            // Session ID must match
            // ---------------------------------

            if (
                rows[0].active_session_id !==
                decoded.session_id
            ) {

                console.log(
                    "Passenger socket rejected: Session mismatch"
                );

                return socket.disconnect(true);
            }


            // ---------------------------------
            // Check session expiry
            // ---------------------------------

            if (
                !rows[0].session_expires_at ||
                new Date(
                    rows[0].session_expires_at
                ) <= new Date()
            ) {

                console.log(
                    "Passenger socket rejected: Session expired"
                );

                return socket.disconnect(true);
            }


            // ---------------------------------
            // Save passenger on socket
            // ---------------------------------

            socket.user = decoded;


        } catch (error) {

            console.error(
                "Passenger socket authentication error:",
                error.message
            );

            return socket.disconnect(true);
        }


        // =====================================
        // PASSENGER CONNECTION
        // =====================================

        console.log(
            "Passenger socket connected:",
            socket.id,
            "Passenger:",
            socket.user.user_id
        );


        // =====================================
        // INITIAL SOCKET STATE
        // =====================================

        socket.tripId = null;


        // =====================================
        // PASSENGER JOIN TRIP
        // =====================================

        socket.on(
            "passenger:join",
            async (data) => {

                try {

                    const { trip_id } =
                        data || {};


                    const tripId =
                        Number(trip_id);


                    // ---------------------------------
                    // Validate trip ID
                    // ---------------------------------

                    if (
                        !Number.isInteger(tripId) ||
                        tripId <= 0
                    ) {

                        return socket.emit(
                            "passenger:error",
                            {
                                message:
                                    "Invalid trip_id"
                            }
                        );
                    }


                    // ---------------------------------
                    // One socket = one trip
                    // ---------------------------------

                    if (
                        socket.tripId !== null
                    ) {

                        return socket.emit(
                            "passenger:error",
                            {
                                message:
                                    "This socket is already joined to a trip"
                            }
                        );
                    }


                    // ---------------------------------
                    // Find trip
                    // ---------------------------------

                    const trip =
                        await Trip.findById(
                            tripId
                        );


                    if (!trip) {

                        return socket.emit(
                            "passenger:error",
                            {
                                message:
                                    "Trip not found"
                            }
                        );
                    }


                    // ---------------------------------
                    // Trip must be active
                    // ---------------------------------

                    if (
                        trip.status !== "active"
                    ) {

                        return socket.emit(
                            "passenger:error",
                            {
                                message:
                                    "This trip is not active"
                            }
                        );
                    }


                    // ---------------------------------
                    // Join trip room
                    // ---------------------------------

                    const roomName =
                        `trip_${tripId}`;


                    socket.join(roomName);


                    socket.tripId =
                        tripId;


                    // ---------------------------------
                    // Get latest location
                    // ---------------------------------

                    const latestLocation =
                        await Location.getLatest(
                            tripId
                        );


                    // ---------------------------------
                    // Passenger joined
                    // ---------------------------------

                    socket.emit(
                        "passenger:joined",
                        {
                            success: true,

                            trip_id:
                                tripId,

                            bus_id:
                                trip.bus_id,

                            route_id:
                                trip.route_id,

                            status:
                                trip.status,

                            message:
                                "Passenger joined trip"
                        }
                    );


                    // ---------------------------------
                    // Send latest bus location
                    // ---------------------------------

                    if (latestLocation) {

                        socket.emit(
                            "bus:location",
                            {
                                location_id:
                                    latestLocation.id,

                                trip_id:
                                    tripId,

                                bus_id:
                                    trip.bus_id,

                                latitude:
                                    Number(
                                        latestLocation.latitude
                                    ),

                                longitude:
                                    Number(
                                        latestLocation.longitude
                                    ),

                                speed:
                                    Number(
                                        latestLocation.speed
                                    ),

                                timestamp:
                                    latestLocation.timestamp
                            }
                        );
                    }


                    console.log(
                        `Passenger socket ${socket.id} joined trip ${tripId}`
                    );


                } catch (error) {

                    console.error(
                        "================================"
                    );

                    console.error(
                        "Passenger join error"
                    );

                    console.error(
                        "Message:",
                        error.message
                    );

                    console.error(
                        "Stack:",
                        error.stack
                    );

                    console.error(
                        "================================"
                    );


                    socket.emit(
                        "passenger:error",
                        {
                            message:
                                "Failed to join trip"
                        }
                    );
                }
            }
        );


        // =====================================
        // DISCONNECT
        // =====================================

        socket.on(
            "disconnect",
            (reason) => {

                console.log(
                    "Passenger socket disconnected:",
                    socket.id
                );


                console.log(
                    "Reason:",
                    reason
                );


                console.log(
                    "Passenger:",
                    socket.user?.user_id || null
                );


                console.log(
                    "Trip:",
                    socket.tripId || null
                );
            }
        );

    });
};
