const jwt = require("jsonwebtoken");

module.exports = (socket, next) => {
    try {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(
                new Error("Authentication token is required")
            );
        }

        const user = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        socket.user = user;

        next();

    } catch (error) {

        console.error(
            "Socket authentication error:",
            error.message
        );

        next(
            new Error("Invalid or expired token")
        );
    }
};