const bcrypt = require("bcryptjs");
const pool = require("./src/config/database");

const resetPassword = async () => {
    try {

        const email = "driver1@bustracking.com";
        const newPassword = "Driver@12345";

        const hashedPassword =
            await bcrypt.hash(newPassword, 10);

        const [result] = await pool.query(
            `
            UPDATE users
            SET password = ?
            WHERE email = ?
              AND role = 'driver'
            `,
            [
                hashedPassword,
                email
            ]
        );

        if (result.affectedRows === 0) {

            console.log(
                "Driver not found"
            );

        } else {

            console.log(
                "================================"
            );

            console.log(
                "Driver password updated"
            );

            console.log(
                "Email:",
                email
            );

            console.log(
                "Password:",
                newPassword
            );

            console.log(
                "================================"
            );
        }

        process.exit(0);

    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );

        process.exit(1);
    }
};

resetPassword();