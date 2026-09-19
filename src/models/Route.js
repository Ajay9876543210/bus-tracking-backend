const pool = require("../config/database");

const Route = {

    // =====================================
    // Create Route
    // =====================================

    async create(name, description) {

        const [result] = await pool.query(
            `INSERT INTO routes (name, description)
             VALUES (?, ?)`,
            [name, description]
        );

        return result.insertId;
    },


    // =====================================
    // Get All Routes
    // =====================================

    async getAll() {

        const [rows] = await pool.query(
            `SELECT *
             FROM routes
             ORDER BY id DESC`
        );

        return rows;
    },


    // =====================================
    // Find Route By ID
    // =====================================

    async findById(id) {

        const [rows] = await pool.query(
            `SELECT *
             FROM routes
             WHERE id = ?`,
            [id]
        );

        return rows[0];
    },


    // =====================================
    // Check Route Trip History
    // =====================================

    async findTripsByRoute(routeId) {

        const [rows] = await pool.query(
            `SELECT
                id,
                status,
                started_at,
                ended_at
             FROM trips
             WHERE route_id = ?
             ORDER BY id DESC`,
            [routeId]
        );

        return rows;
    },


    // =====================================
    // Delete Route Stops
    // =====================================

    async deleteRouteStops(routeId) {

        await pool.query(
            `DELETE FROM route_stops
             WHERE route_id = ?`,
            [routeId]
        );
    },


    // =====================================
    // Delete Route
    // =====================================

    async deleteById(routeId) {

        const [result] = await pool.query(
            `DELETE FROM routes
             WHERE id = ?`,
            [routeId]
        );

        return result.affectedRows;
    }

};

module.exports = Route;