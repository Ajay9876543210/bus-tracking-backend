
const Bus = require("../models/Bus");
const Trip = require("../models/Trip");


// =====================================
// Create a new bus
// =====================================

const createBus = async (req, res) => {

    try {

        const { bus_number } = req.body || {};


        // Validation
        if (
            typeof bus_number !== "string" ||
            !bus_number.trim()
        ) {

            return res.status(400).json({
                success: false,
                message: "Bus number is required"
            });

        }


        const normalizedBusNumber =
            bus_number.trim();


        const busId =
            await Bus.create(normalizedBusNumber);


        return res.status(201).json({

            success: true,

            message: "Bus created successfully",

            data: {
                bus_id: busId,
                bus_number: normalizedBusNumber
            }

        });

    } catch (error) {

        console.error(
            "Create bus error:",
            error
        );


        // Duplicate bus number
        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({
                success: false,
                message: "Bus number already exists"
            });

        }


        return res.status(500).json({

            success: false,

            message: "Failed to create bus"

        });

    }
};


// =====================================
// Get all buses
// =====================================

const getAllBuses = async (req, res) => {

    try {

        const buses = await Bus.getAll();


        return res.json({

            success: true,

            data: buses

        });

    } catch (error) {

        console.error(
            "Get buses error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to fetch buses"

        });

    }
};


// =====================================
// Get bus by ID
// =====================================

const getBusById = async (req, res) => {

    try {

        const { id } = req.params;
        const busId = Number(id);


        // ID validation
        if (
            !Number.isInteger(busId) ||
            busId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid bus ID"
            });

        }


        const bus =
            await Bus.findById(busId);


        if (!bus) {

            return res.status(404).json({

                success: false,

                message: "Bus not found"

            });

        }


        return res.json({

            success: true,

            data: bus

        });

    } catch (error) {

        console.error(
            "Get bus error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to fetch bus"

        });

    }
};


// =====================================
// Update bus status
// =====================================

const updateBusStatus = async (req, res) => {

    try {

        const { id } = req.params;
        const { status } = req.body || {};

        const busId = Number(id);


        // ID validation
        if (
            !Number.isInteger(busId) ||
            busId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid bus ID"
            });

        }


        // Status validation
        if (
            typeof status !== "string" ||
            !["active", "inactive"].includes(status)
        ) {

            return res.status(400).json({

                success: false,

                message: "Status must be active or inactive"

            });

        }


        const bus =
            await Bus.findById(busId);


        if (!bus) {

            return res.status(404).json({

                success: false,

                message: "Bus not found"

            });

        }


        await Bus.updateStatus(
            busId,
            status
        );


        return res.json({

            success: true,

            message: "Bus status updated successfully"

        });

    } catch (error) {

        console.error(
            "Update bus status error:",
            error
        );


        return res.status(500).json({

            success: false,

            message: "Failed to update bus status"

        });

    }
};


// =====================================
// Delete bus
// =====================================

const deleteBus = async (req, res) => {

    try {

        const { id } = req.params;
        const busId = Number(id);


        // ID validation
        if (
            !Number.isInteger(busId) ||
            busId <= 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid bus ID"
            });

        }


        // Check bus exists
        const bus =
            await Bus.findById(busId);


        if (!bus) {

            return res.status(404).json({

                success: false,

                message: "Bus not found"

            });

        }


        // Check active trip
        const activeTrip =
            await Trip.findActiveByBus(busId);


        if (activeTrip) {

            return res.status(409).json({

                success: false,

                message:
                    "Cannot delete bus because it has an active trip"

            });

        }


        // Delete bus
        await Bus.deleteById(busId);


        return res.json({

            success: true,

            message: "Bus deleted successfully",

            data: {
                bus_id: busId,
                bus_number: bus.bus_number
            }

        });

    } catch (error) {

        console.error(
            "Delete bus error:",
            error
        );


        // Bus still referenced by old trip records
        if (error.code === "ER_ROW_IS_REFERENCED_2") {

            return res.status(409).json({

                success: false,

                message:
                    "Cannot delete bus because trip history still exists. The old trip data must be cleaned up first."

            });

        }


        return res.status(500).json({

            success: false,

            message: "Failed to delete bus"

        });

    }
};


module.exports = {
    createBus,
    getAllBuses,
    getBusById,
    updateBusStatus,
    deleteBus
};
