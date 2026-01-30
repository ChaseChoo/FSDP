// controllers/appointmentController.js
import {
  bookAppointment as dbBookAppointment,
  getAppointmentById,
  getUserAppointments,
  cancelAppointment as dbCancelAppointment,
  updateAppointment as dbUpdateAppointment,
  getAppointmentsByDateRange,
} from "../models/appointmentModel.js";

// Book a new appointment
export async function bookAppointment(req, res) {
  try {
    const { bankId, bankName, bankAddress, appointmentDate, appointmentTime } =
      req.body;

    // Validate required fields
    if (
      !bankId ||
      !bankName ||
      !bankAddress ||
      !appointmentDate ||
      !appointmentTime
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Get userId from session (assuming it's stored in req.session)
    const userId = req.session?.userId || req.body.userId || null;

    // Book the appointment
    const appointment = await dbBookAppointment(userId, {
      bankId,
      bankName,
      bankAddress,
      appointmentDate,
      appointmentTime,
    });

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully",
      appointmentId: appointment.id,
      appointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to book appointment",
      error: error.message,
    });
  }
}

// Get appointment details
export async function getAppointment(req, res) {
  try {
    const { appointmentId } = req.params;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    const appointment = await getAppointmentById(parseInt(appointmentId));

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointment",
      error: error.message,
    });
  }
}

// Get all appointments for a user
export async function getUserAppointmentsList(req, res) {
  try {
    const userId = req.session?.userId || req.params.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const appointments = await getUserAppointments(userId);

    res.json({
      success: true,
      appointments,
      count: appointments.length,
    });
  } catch (error) {
    console.error("Error fetching user appointments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
}

// Cancel an appointment
export async function cancelAppointment(req, res) {
  try {
    const { appointmentId } = req.params;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    const appointment = await dbCancelAppointment(parseInt(appointmentId));

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel appointment",
      error: error.message,
    });
  }
}

// Update an appointment
export async function updateAppointment(req, res) {
  try {
    const { appointmentId } = req.params;
    const updateData = req.body;

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: "Appointment ID is required",
      });
    }

    const appointment = await dbUpdateAppointment(
      parseInt(appointmentId),
      updateData
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.json({
      success: true,
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update appointment",
      error: error.message,
    });
  }
}

// Get available time slots for a specific date
export async function getAvailableTimeSlots(req, res) {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "Date is required",
      });
    }

    // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 30) {
        const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(
          2,
          "0"
        )}`;
        slots.push({
          time: timeStr,
          available: true,
        });
      }
    }

    res.json({
      success: true,
      date,
      slots,
      totalSlots: slots.length,
    });
  } catch (error) {
    console.error("Error getting time slots:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get time slots",
      error: error.message,
    });
  }
}

// Get appointments by date range (for admin/dashboard)
export async function getAppointmentsByRange(req, res) {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const appointments = await getAppointmentsByDateRange(startDate, endDate);

    res.json({
      success: true,
      appointments,
      count: appointments.length,
    });
  } catch (error) {
    console.error("Error fetching appointments by range:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch appointments",
      error: error.message,
    });
  }
}
