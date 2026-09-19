const pool = require("../config/database");

const User = {

    // =====================================
    // Create user
    // =====================================

    async create(
        name,
        email,
        password,
        role = "passenger",
        userId = null,
        dateOfBirth = null
    ) {

        const [result] = await pool.query(
            `INSERT INTO users
                (
                    user_id,
                    name,
                    date_of_birth,
                    email,
                    password,
                    role
                )
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                userId,
                name,
                dateOfBirth,
                email,
                password,
                role
            ]
        );

        return result.insertId;
    },


    // =====================================
    // Create multiple passengers
    // =====================================

    async createPassengersBulk(passengers) {

        const connection =
            await pool.getConnection();

        try {

            await connection.beginTransaction();

            const createdPassengers = [];

            for (const passenger of passengers) {

                const [result] =
                    await connection.query(
                        `INSERT INTO users
                            (
                                user_id,
                                name,
                                date_of_birth,
                                email,
                                password,
                                role
                            )
                         VALUES (?, ?, ?, NULL, ?, 'passenger')`,
                        [
                            passenger.user_id,
                            passenger.name,
                            passenger.date_of_birth,
                            passenger.password
                        ]
                    );

                createdPassengers.push({
                    id: result.insertId,
                    user_id: passenger.user_id,
                    name: passenger.name,
                    date_of_birth:
                        passenger.date_of_birth
                });
            }

            await connection.commit();

            return createdPassengers;

        } catch (error) {

            await connection.rollback();

            throw error;

        } finally {

            connection.release();

        }
    },


    // =====================================
    // Find user by email
    // Existing Admin/Driver login के लिए
    // =====================================

    async findByEmail(email) {

        const [rows] = await pool.query(
            `SELECT *
             FROM users
             WHERE email = ?`,
            [email]
        );

        return rows[0];
    },


    // =====================================
    // Find user by Passenger/User ID
    // =====================================

    async findByUserId(userId) {

        const [rows] = await pool.query(
            `SELECT *
             FROM users
             WHERE user_id = ?`,
            [userId]
        );

        return rows[0];
    },


    // =====================================
    // Find user by database ID
    // =====================================

    async findById(id) {

        const [rows] = await pool.query(
            `SELECT
                id,
                user_id,
                name,
                date_of_birth,
                email,
                role,
                created_at
             FROM users
             WHERE id = ?`,
            [id]
        );

        return rows[0];
    },


    // =====================================
    // Find Master Admin for password recovery
    // Name + Email + DOB verification
    // =====================================

    async findMasterAdminForRecovery(
        name,
        email,
        dateOfBirth
    ) {

        const [rows] = await pool.query(
            `SELECT
                id,
                name,
                email,
                date_of_birth,
                role,
                admin_type
             FROM users
             WHERE role = 'admin'
               AND admin_type = 'master'
               AND name = ?
               AND email = ?
               AND date_of_birth = ?
             LIMIT 1`,
            [
                name,
                email,
                dateOfBirth
            ]
        );

        return rows[0];
    },


    // =====================================
    // Update password
    // Passenger / Driver / Admin
    // =====================================

    async updatePasswordById(
        id,
        hashedPassword
    ) {

        const [result] = await pool.query(
            `UPDATE users
             SET password = ?
             WHERE id = ?`,
            [
                hashedPassword,
                id
            ]
        );

        return result.affectedRows;
    },


    // =====================================
    // Get active passenger session
    // =====================================

    async getActiveSession(id) {

        const [rows] = await pool.query(
            `SELECT
                active_session_id,
                session_expires_at
             FROM users
             WHERE id = ?
               AND role = 'passenger'
             LIMIT 1`,
            [id]
        );

        return rows[0];
    },


    // =====================================
    // Create passenger session
    // =====================================

    async createSession(
        id,
        sessionId,
        expiresAt
    ) {

        const [result] = await pool.query(
            `UPDATE users
             SET
                active_session_id = ?,
                session_expires_at = ?
             WHERE id = ?
               AND role = 'passenger'`,
            [
                sessionId,
                expiresAt,
                id
            ]
        );

        return result.affectedRows;
    },


    // =====================================
    // Clear passenger session
    // =====================================

    async clearSession(id) {

        const [result] = await pool.query(
            `UPDATE users
             SET
                active_session_id = NULL,
                session_expires_at = NULL
             WHERE id = ?
               AND role = 'passenger'`,
            [id]
        );

        return result.affectedRows;
    },


    // =====================================
    // Clear session only if session matches
    // Logout के लिए
    // =====================================

    async clearSessionIfMatches(
        id,
        sessionId
    ) {

        const [result] = await pool.query(
            `UPDATE users
             SET
                active_session_id = NULL,
                session_expires_at = NULL
             WHERE id = ?
               AND role = 'passenger'
               AND active_session_id = ?`,
            [
                id,
                sessionId
            ]
        );

        return result.affectedRows;
    },


    // =====================================
    // Delete multiple passengers
    // =====================================

    async deletePassengersBulk(passengerIds) {

        if (
            !Array.isArray(passengerIds) ||
            passengerIds.length === 0
        ) {
            return 0;
        }

        const connection =
            await pool.getConnection();

        try {

            await connection.beginTransaction();

            const placeholders =
                passengerIds
                    .map(() => "?")
                    .join(", ");

            const [result] =
                await connection.query(
                    `DELETE FROM users
                     WHERE id IN (${placeholders})
                       AND role = 'passenger'`,
                    passengerIds
                );

            await connection.commit();

            return result.affectedRows;

        } catch (error) {

            await connection.rollback();

            throw error;

        } finally {

            connection.release();

        }
    }

};


module.exports = User;