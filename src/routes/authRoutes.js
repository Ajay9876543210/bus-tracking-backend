const express = require("express");

const {
    adminLogin,
    masterAdminForgotPassword,
    driverLogin,
    passengerLogin,
    passengerForgotPassword,
    passengerLogout
} = require("../controllers/authController");

const {
    authenticate
} = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================
// Admin Login
// =====================================

router.post(
    "/admin/login",
    adminLogin
);


// =====================================
// Master Admin Forgot Password
// =====================================

router.post(
    "/admin/forgot-password",
    masterAdminForgotPassword
);


// =====================================
// Driver Login
// =====================================

router.post(
    "/driver/login",
    driverLogin
);


// =====================================
// Passenger Login
// =====================================

router.post(
    "/passenger/login",
    passengerLogin
);


// =====================================
// Passenger Forgot Password
// =====================================

router.post(
    "/passenger/forgot-password",
    passengerForgotPassword
);


// =====================================
// Passenger Logout
// =====================================

router.post(
    "/passenger/logout",
    authenticate,
    passengerLogout
);


module.exports = router;