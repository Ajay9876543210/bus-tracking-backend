const pool = require("../config/database");

const Trip = {

    // =====================================
    // Start a new trip
    // =====================================

    async create(busId, driverId, routeId) {

        const [result] = await pool.query(
            `INSERT INTO trips
             (bus_id, driver_id, route_id, started_at, status)
             VALUES (?, ?, ?, NOW(), 'active')`,
            [
                busId,
                driverId,
                routeId
            ]
        );

        return result.insertId;
    },


    // =====================================
    // Find trip by ID
    // =====================================

    async findById(id) {

        const [rows] = await pool.query(
            `
            SELECT *
            FROM trips
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        return rows[0];
    },


    // =====================================
    // Find currently active trip of a bus
    // =====================================

    async findActiveByBus(busId) {

        const [rows] = await pool.query(
            `
            SELECT *
            FROM trips
            WHERE bus_id = ?
              AND status = 'active'
            ORDER BY id DESC
            LIMIT 1
            `,
            [busId]
        );

        return rows[0];
    },


    // =====================================
    // Find currently active trip of a driver
    // =====================================

    async findActiveByDriver(driverId) {

        const [rows] = await pool.query(
            `
            SELECT *
            FROM trips
            WHERE driver_id = ?
              AND status = 'active'
            ORDER BY id DESC
            LIMIT 1
            `,
            [driverId]
        );

        return rows[0];
    },


    // =====================================
    // Find trip history of a driver
    // =====================================

    async findByDriver(driverId) {

        const [rows] = await pool.query(
            `
            SELECT
                id,
                bus_id,
                driver_id,
                route_id,
                status,
                started_at,
                ended_at
            FROM trips
            WHERE driver_id = ?
            ORDER BY id DESC
            `,
            [driverId]
        );

        return rows;
    },


    // =====================================
    // End trip
    // =====================================

    async endTrip(id) {

        const [result] = await pool.query(
            `
            UPDATE trips
            SET ended_at = NOW(),
                status = 'completed'
            WHERE id = ?
              AND status = 'active'
            `,
            [id]
        );

        return result.affectedRows;
    },


    // =====================================
    // Get active trips
    // Passenger Public API
    // =====================================

    async getActive() {

        const [rows] = await pool.query(
            `
            SELECT
                trips.*,
                buses.bus_number,
                routes.name AS route_name

            FROM trips

            JOIN buses
                ON trips.bus_id = buses.id

            JOIN routes
                ON trips.route_id = routes.id

            WHERE trips.status = 'active'

            ORDER BY trips.id DESC
            `
        );

        return rows;
    },


    // =====================================
    // Get all trips
    // =====================================

    async getAll() {

        const [rows] = await pool.query(
            `
            SELECT
                trips.*,
                buses.bus_number,
                routes.name AS route_name,
                users.name AS driver_name

            FROM trips

            JOIN buses
                ON trips.bus_id = buses.id

            JOIN routes
                ON trips.route_id = routes.id

            JOIN drivers
                ON trips.driver_id = drivers.id

            JOIN users
                ON drivers.user_id = users.id

            ORDER BY trips.id DESC
            `
        );

        return rows;
    }

};

module.exports = Trip;