// =====================================
// Global Error Middleware
// =====================================

const errorMiddleware = (err, req, res, next) => {

    console.error("================================");
    console.error("GLOBAL ERROR");
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    console.error("================================");


    // ---------------------------------
    // Default values
    // ---------------------------------

    let statusCode =
        err.statusCode || 500;

    let message =
        err.message || "Internal Server Error";


    // ---------------------------------
    // MySQL Duplicate Entry
    // ---------------------------------

    if (err.code === "ER_DUP_ENTRY") {

        statusCode = 409;

        message =
            "Duplicate entry. This record already exists.";

    }


    // ---------------------------------
    // MySQL Foreign Key Error
    // ---------------------------------

    else if (
        err.code === "ER_NO_REFERENCED_ROW_2"
    ) {

        statusCode = 400;

        message =
            "Referenced record does not exist.";

    }


    // ---------------------------------
    // MySQL Data Too Long
    // ---------------------------------

    else if (
        err.code === "ER_DATA_TOO_LONG"
    ) {

        statusCode = 400;

        message =
            "One or more values are too long.";

    }


    // ---------------------------------
    // MySQL Invalid Data
    // ---------------------------------

    else if (
        err.code === "ER_TRUNCATED_WRONG_VALUE"
    ) {

        statusCode = 400;

        message =
            "Invalid data format.";

    }


    // ---------------------------------
    // JSON Parse Error
    // ---------------------------------

    else if (
        err instanceof SyntaxError &&
        err.status === 400 &&
        "body" in err
    ) {

        statusCode = 400;

        message =
            "Invalid JSON request body.";

    }


    // ---------------------------------
    // Development Error Details
    // ---------------------------------

    const response = {
        success: false,
        message: message
    };


    if (process.env.NODE_ENV === "development") {

        response.error = {
            name: err.name,
            code: err.code || null,
            stack: err.stack
        };

    }


    // ---------------------------------
    // Send Response
    // ---------------------------------

    res.status(statusCode).json(response);

};


module.exports = errorMiddleware;