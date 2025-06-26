require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://pratikkumarjhavnit:0vh0VaRm7BJlOGdF@cluster0.0zyfpgg.mongodb.net/interviewsathi?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// MongoDB Models

// Middleware
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

// 4. Test Routes (from your existing code)
const mockTests = require('./mock_test.json'); 

app.get("/api/tests", (req, res) => {
  try {
    const testsList = Object.values(mockTests).map((test) => ({
      id: test.id,
      title: test.title,
      description: test.description,
      timeInMinutes: test.timeInMinutes,
      questionCount: test.questions.length,
    }));
    res.json({ success: true, data: testsList });
  } catch (error) {
    handleError(res, error, "Failed to fetch tests list");
  }
});

app.get("/api/tests/:testId", (req, res) => {
  try {
    const { testId } = req.params;
    const test = mockTests[testId];

    if (!test) {
      return res.status(404).json({ error: "Test not found" });
    }

    res.json({ success: true, data: test });
  } catch (error) {
    handleError(res, error, "Failed to fetch test");
  }
});

// Email endpoint (from your existing code)
app.post("/api/send-email", async (req, res) => {
  const { subject, html, text, recipients } = req.body;

  // Validate input
  if (!subject || !html || !text || !recipients || !Array.isArray(recipients)) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields",
    });
  }

  if (recipients.length === 0) {
    return res.status(400).json({
      success: false,
      error: "No valid recipients provided",
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: `"InterviewDost" <${process.env.GMAIL_USER}>`,
      to: recipients.join(", "),
      subject,
      text,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    res.status(200).json({
      success: true,
      message: "Email sent successfully to all recipients",
    });
  } catch (error) {
    handleError(res, error, "Failed to send email");
  }
});

// Profile Schema
const Profile = mongoose.model(
  "Profile",
  new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    firstName: String,
    lastName: String,
    college: String,
    branch: String,
    specialization: String,
    interests: [String],
    year: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  })
);

// Get profile by email
app.get("/api/profile/:email", async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const profile = await Profile.findOne({ email });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.json({
      success: true,
      data: {
        ...profile._doc,
        interests: profile.interests.join(", "), // Convert array to string for the form
      },
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch profile");
  }
});

// Create or update profile
app.post("/api/profile", async (req, res) => {
  try {
    const { email, ...profileData } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Convert interests string to array
    if (profileData.interests && typeof profileData.interests === "string") {
      profileData.interests = profileData.interests
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    const updatedProfile = await Profile.findOneAndUpdate(
      { email },
      {
        ...profileData,
        updatedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    res.json({
      success: true,
      message: "Profile saved successfully",
      data: updatedProfile,
    });
  } catch (error) {
    handleError(res, error, "Failed to save profile");
  }
});

//Interviewer
// Interviewer Schema
const Interviewer = mongoose.model(
  "Interviewer",
  new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    name: String,
    expertise: [String],
    availableSlots: [
      {
        date: Date,
        startTime: String,
        endTime: String,
        booked: { type: Boolean, default: false },
      },
    ],
    createdAt: { type: Date, default: Date.now },
  })
);

const Interview = mongoose.model(
  "Interview",
  new mongoose.Schema({
    studentEmail: { type: String, required: true },
    interviewerEmail: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ["scheduled", "completed", "cancelled"],
      default: "scheduled",
    },
    createdAt: { type: Date, default: Date.now },
  })
);
// Add this right after your Interviewer model definition

// Insert initial interviewer data if none exists
const seedInterviewers = async () => {
  try {
    const count = await Interviewer.countDocuments();
    if (count === 0) {
      const interviewers = [
        {
          email: "pratikkumarjhavnit@gmail.com",
          name: "Pratik Kumar",
          expertise: ["Technical Interviews", "System Design", "DSA"],
          availableSlots: [
            // Available from 6-7 PM daily
            {
              date: new Date(),
              startTime: "18:00",
              endTime: "19:00",
              booked: false,
            },
            {
              date: new Date(Date.now() + 86400000),
              startTime: "18:00",
              endTime: "19:00",
              booked: false,
            },
            {
              date: new Date(Date.now() + 172800000),
              startTime: "18:00",
              endTime: "19:00",
              booked: false,
            },
            // Available from 7-8 PM daily
            {
              date: new Date(),
              startTime: "19:00",
              endTime: "20:00",
              booked: false,
            },
            {
              date: new Date(Date.now() + 86400000),
              startTime: "19:00",
              endTime: "20:00",
              booked: false,
            },
            {
              date: new Date(Date.now() + 172800000),
              startTime: "19:00",
              endTime: "20:00",
              booked: false,
            },
            // Available from 8-9 PM daily
            {
              date: new Date(),
              startTime: "20:00",
              endTime: "21:00",
              booked: false,
            },
            {
              date: new Date(Date.now() + 86400000),
              startTime: "20:00",
              endTime: "21:00",
              booked: false,
            },
            {
              date: new Date(Date.now() + 172800000),
              startTime: "20:00",
              endTime: "21:00",
              booked: false,
            },
            // Available from 9-10 PM daily
            {
              date: new Date(),
              startTime: "21:00",
              endTime: "22:00",
              booked: false,
            },
            {
              date: new Date(Date.now() + 86400000),
              startTime: "21:00",
              endTime: "22:00",
              booked: false,
            },
            {
              date: new Date(Date.now() + 172800000),
              startTime: "21:00",
              endTime: "22:00",
              booked: false,
            },
          ],
        },
        {
          email: "pkj200211@gmail.com",
          name: "Pratik Jha",
          expertise: [
            "Behavioral Interviews",
            "HR Round",
            "Communication Skills",
          ],
          availableSlots: [
            // Available from 10-11 PM daily
            {
              date: new Date(),
              startTime: "22:00",
              endTime: "23:00",
              booked: false,
            },
            {
              date: new Date(Date.now() + 86400000),
              startTime: "22:00",
              endTime: "23:00",
              booked: false,
            },
            {
              date: new Date(Date.now() + 172800000),
              startTime: "22:00",
              endTime: "23:00",
              booked: false,
            },
          ],
        },
      ];

      await Interviewer.insertMany(interviewers);
      console.log("Interviewer data seeded successfully");
    }
  } catch (error) {
    console.error("Error seeding interviewer data:", error);
  }
};

// Call this function after MongoDB connection is established
mongoose.connection.once("open", () => {
  seedInterviewers();
});

function handleError(res, error, message = "An error occurred") {
  console.error(message, error);
  res.status(500).json({
    success: false,
    message,
    error: error.message,
  });
}
// Get available interviewers
app.get("/api/interviewers/available", async (req, res) => {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: "Date and time are required",
      });
    }

    // Convert the date string to a Date object at midnight UTC
    const requestedDate = new Date(date);
    requestedDate.setUTCHours(0, 0, 0, 0);

    const interviewers = await Interviewer.find({
      availableSlots: {
        $elemMatch: {
          // Compare dates by day only (ignoring time)
          date: {
            $gte: requestedDate,
            $lt: new Date(requestedDate.getTime() + 86400000), // Next day
          },
          startTime: { $lte: time },
          endTime: { $gte: time },
          booked: false,
        },
      },
    });

    res.json({ success: true, data: interviewers });
  } catch (error) {
    console.log(error);
    handleError(res, error, "Failed to fetch interviewers");
  }
});

// Schedule interview endpoint
app.post("/api/interviews/schedule", async (req, res) => {
  console.log("Scheduling request received:", req.body);

  try {
    const { studentEmail, interviewerEmail, date, time } = req.body;

    // Convert input date to match stored format (UTC midnight)
    const interviewDate = new Date(date);
    interviewDate.setUTCHours(0, 0, 0, 0);

    // Debug log to verify the date conversion
    console.log("Converted date:", interviewDate.toISOString());

    const interviewer = await Interviewer.findOneAndUpdate(
      {
        email: interviewerEmail,
        availableSlots: {
          $elemMatch: {
            date: {
              $gte: new Date(interviewDate),
              $lt: new Date(interviewDate.getTime() + 24 * 60 * 60 * 1000), // Next day
            },
            startTime: time,
            booked: false,
          },
        },
      },
      { $set: { "availableSlots.$.booked": true } },
      { new: true }
    );

    if (!interviewer) {
      // Enhanced error reporting
      const slots = await Interviewer.findOne({ email: interviewerEmail });
      return res.status(404).json({
        success: false,
        message: "No available slot found",
        details: {
          requested: { date: interviewDate, time },
          availableSlots: slots?.availableSlots?.filter(
            (s) => s.date.toISOString().includes(date) && !s.booked
          ),
        },
      });
    }
    // Book the slot
    const updatedInterviewer = await Interviewer.findOneAndUpdate(
      {
        email: interviewerEmail,
        "availableSlots.date": interviewDate,
        "availableSlots.startTime": time,
      },
      { $set: { "availableSlots.$.booked": true } },
      { new: true }
    );

    // Create interview record
    const interview = await Interview.create({
      studentEmail,
      interviewerEmail,
      date: interviewDate,
      time,
      status: "scheduled",
    });

    const { emailDetails } = req.body;

    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_PASSWORD,
        },
      });

      const { subject, html, text, recipients } = emailDetails;
      const info = await transporter.sendMail({
        from: `"InterviewDost" <${process.env.GMAIL_USER}>`,
        to: recipients.join(", "),
        subject,
        text,
        html,
      });

      console.log("Message sent: %s", info.messageId);
      res.status(200).json({
        success: true,
        message: "Email sent successfully to all recipients",
      });
    } catch (error) {
      handleError(res, error, "Failed to send email");
    }

    console.log("Interview scheduled successfully");
    res.json({
      success: true,
      message: "Interview scheduled successfully",
      data: { interview, interviewer: updatedInterviewer },
    });
  } catch (error) {
    console.error("Scheduling error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "InterviewDost backend is running ✅",
    port: PORT,
    environment: process.env.NODE_ENV || "development",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// Test data
