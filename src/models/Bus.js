
const pool = require("../config/database");

const Bus = {

    // =====================================
    // Create a new bus
    // =====================================

    async create(busNumber) {

        const [result] = await pool.query(
            `INSERT INTO buses (bus_number)
             VALUES (?)`,
            [busNumber]
        );

        return result.insertId;
    },


    // =====================================
    // Get all buses
    // =====================================

    async getAll() {

        const [rows] = await pool.query(
            `SELECT * FROM buses ORDER BY id DESC`
        );

        return rows;
    },


    // =====================================
    // Find bus by ID
    // =====================================

    async findById(id) {

        const [rows] = await pool.query(
            `SELECT * FROM buses WHERE id = ?`,
            [id]
        );

        return rows[0];
    },


    // =====================================
    // Update bus status
    // =====================================

    async updateStatus(id, status) {

        await pool.query(
            `UPDATE buses
             SET status = ?
             WHERE id = ?`,
            [status, id]
        );
    },


    // =====================================
    // Delete bus
    // =====================================

    async deleteById(id) {

        const [result] = await pool.query(
            `DELETE FROM buses
             WHERE id = ?`,
            [id]
        );

        return result.affectedRows;
    }

};

module.exports = Bus;
