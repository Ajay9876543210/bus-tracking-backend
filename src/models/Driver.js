const pool = require("../config/database");

const Driver = {

    async create(userId, phone) {
        const [result] = await pool.query(
            `INSERT INTO drivers (user_id, phone)
             VALUES (?, ?)`,
            [userId, phone]
        );

        return result.insertId;
    },


    async getAll() {
        const [rows] = await pool.query(`
            SELECT
                drivers.id,
                users.name,
                users.email,
                drivers.phone
            FROM drivers
            JOIN users
                ON drivers.user_id = users.id
            ORDER BY drivers.id DESC
        `);

        return rows;
    },


    async findById(id) {
        const [rows] = await pool.query(`
            SELECT
                drivers.id,
                drivers.user_id,
                users.name,
                users.email,
                drivers.phone
            FROM drivers
            JOIN users
                ON drivers.user_id = users.id
            WHERE drivers.id = ?
        `, [id]);

        return rows[0];
    },


    // =====================================
    // Find Driver By User ID
    // =====================================

    async findByUserId(userId) {
        const [rows] = await pool.query(`
            SELECT
                drivers.id,
                drivers.user_id,
                users.name,
                users.email,
                drivers.phone
            FROM drivers
            JOIN users
                ON drivers.user_id = users.id
            WHERE drivers.user_id = ?
            LIMIT 1
        `, [userId]);

        return rows[0];
    },


    // =====================================
    // Delete Driver User
    // =====================================

    async deleteUserById(userId) {
        const [result] = await pool.query(
            `DELETE FROM users
             WHERE id = ? AND role = 'driver'`,
            [userId]
        );

        return result.affectedRows;
    }

};

module.exports = Driver;