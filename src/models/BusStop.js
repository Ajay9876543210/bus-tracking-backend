const pool = require("../config/database");

const BusStop = {

    // Create Bus Stop
    async create(name, latitude, longitude) {
        const [result] = await pool.query(
            `
            INSERT INTO bus_stops
            (name, latitude, longitude)
            VALUES (?, ?, ?)
            `,
            [name, latitude, longitude]
        );

        return result.insertId;
    },

    // Get All Bus Stops
    async getAll() {
        const [rows] = await pool.query(
            `
            SELECT *
            FROM bus_stops
            ORDER BY id DESC
            `
        );

        return rows;
    },

    // Get Bus Stop By ID
    async findById(id) {
        const [rows] = await pool.query(
            `
            SELECT *
            FROM bus_stops
            WHERE id = ?
            `,
            [id]
        );

        return rows[0];
    },

    // Check whether stop is assigned to any route
    async findRouteAssignments(stopId) {
        const [rows] = await pool.query(
            `
            SELECT
                route_stops.route_id,
                routes.name AS route_name,
                route_stops.stop_order
            FROM route_stops
            JOIN routes
                ON route_stops.route_id = routes.id
            WHERE route_stops.stop_id = ?
            ORDER BY route_stops.route_id
            `,
            [stopId]
        );

        return rows;
    },

    // Permanently delete Bus Stop
    async deleteById(id) {
        const [result] = await pool.query(
            `
            DELETE FROM bus_stops
            WHERE id = ?
            `,
            [id]
        );

        return result.affectedRows;
    }

};

module.exports = BusStop;