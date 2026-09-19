const pool = require("../config/database");

const RouteStop = {

    // =====================================
    // Add Stop To Route
    // =====================================

    async add(routeId, stopId, stopOrder) {

        const [result] = await pool.query(
            `
            INSERT INTO route_stops
            (route_id, stop_id, stop_order)
            VALUES (?, ?, ?)
            `,
            [routeId, stopId, stopOrder]
        );

        return result.insertId;
    },


    // =====================================
    // Get Stops Of A Route
    // =====================================

    async getByRoute(routeId) {

        const [rows] = await pool.query(
            `
            SELECT
                route_stops.id,
                route_stops.route_id,
                route_stops.stop_id,
                route_stops.stop_order,

                bus_stops.name,
                bus_stops.latitude,
                bus_stops.longitude

            FROM route_stops

            JOIN bus_stops
                ON route_stops.stop_id = bus_stops.id

            WHERE route_stops.route_id = ?

            ORDER BY route_stops.stop_order ASC
            `,
            [routeId]
        );

        return rows;
    },


    // =====================================
    // Find Route Stop Assignment By ID
    // =====================================

    async findById(id) {

        const [rows] = await pool.query(
            `
            SELECT
                id,
                route_id,
                stop_id,
                stop_order
            FROM route_stops
            WHERE id = ?
            `,
            [id]
        );

        return rows[0];
    },


    // =====================================
    // Remove Stop From Route
    // =====================================
    // IMPORTANT:
    // This only removes the assignment.
    // Physical bus stop is NOT deleted.

    async deleteById(id) {

        const [result] = await pool.query(
            `
            DELETE FROM route_stops
            WHERE id = ?
            `,
            [id]
        );

        return result.affectedRows;
    }

};

module.exports = RouteStop;