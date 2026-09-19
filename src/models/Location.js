const pool = require("../config/database");

const Location = {
    async create(tripId, latitude, longitude, speed, timestamp) {
        const [result] = await pool.query(
            `INSERT INTO locations
             (trip_id, latitude, longitude, speed, timestamp)
             VALUES (?, ?, ?, ?, ?)`,
            [
                tripId,
                latitude,
                longitude,
                speed,
                timestamp
            ]
        );

        return result.insertId;
    },

    async getLatest(tripId) {
        const [rows] = await pool.query(`
            SELECT *
            FROM locations
            WHERE trip_id = ?
            ORDER BY timestamp DESC
            LIMIT 1
        `, [tripId]);

        return rows[0];
    },

    async getTripLocations(tripId) {
        const [rows] = await pool.query(`
            SELECT *
            FROM locations
            WHERE trip_id = ?
            ORDER BY timestamp ASC
        `, [tripId]);

        return rows;
    }
};

module.exports = Location;