const bcrypt = require("bcryptjs");
const pool = require("./src/config/database");

const createAdmin = async () => {
    try {

        const name = "Main Admin";
        const email = "admin@bustracking.com";
        const password = "Admin@12345";

        // Check existing admin
        const [existing] = await pool.query(
            `SELECT id
             FROM users
             WHERE email = ?`,
            [email]
        );

        if (existing.length > 0) {

            console.log("Admin already exists");

            process.exit(0);
        }


        // Hash password
        const hashedPassword =
            await bcrypt.hash(password, 10);


        // Create admin
        const [result] = await pool.query(
            `INSERT INTO users
             (name, email, password, role)
             VALUES (?, ?, ?, 'admin')`,
            [
                name,
                email,
                hashedPassword
            ]
        );


        console.log("================================");
        console.log("Admin created successfully");
        console.log("Admin ID:", result.insertId);
        console.log("Email:", email);
        console.log("Password:", password);
        console.log("================================");

        process.exit(0);

    } catch (error) {

        console.error(
            "Create admin error:",
            error
        );

        process.exit(1);
    }
};


createAdmin();