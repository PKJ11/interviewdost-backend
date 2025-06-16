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
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// MongoDB Models
const Department = mongoose.model(
  "Department",
  new mongoose.Schema({
    name: String,
    description: String,
    createdAt: { type: Date, default: Date.now },
  })
);

const Subject = mongoose.model(
  "Subject",
  new mongoose.Schema({
    departmentId: mongoose.Schema.Types.ObjectId,
    name: String,
    description: String,
    color: String,
    icon: String,
    createdAt: { type: Date, default: Date.now },
  })
);

const Chapter = mongoose.model(
  "Chapter",
  new mongoose.Schema({
    subjectId: mongoose.Schema.Types.ObjectId,
    title: String,
    description: String,
    content: String,
    pdfUrl: String,
    tests: Array,
    createdAt: { type: Date, default: Date.now },
  })
);

// Middleware
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

// 4. Test Routes (from your existing code)
const mockTests = {
  "test-1": {
    id: "test-1",
    title: "Chopper Basics Quiz",
    description:
      "Assess your understanding of the fundamentals of choppers in power electronics.",
    timeInMinutes: 25,
    questions: [
      {
        id: "q1",
        text: "What is a chopper in power electronics?",
        explanation:
          "A chopper is a DC-DC converter used to step up or step down DC voltage.",
        options: [
          { id: "a", text: "AC-AC converter", isCorrect: false },
          { id: "b", text: "DC-AC converter", isCorrect: false },
          { id: "c", text: "DC-DC converter", isCorrect: true },
          { id: "d", text: "AC-DC converter", isCorrect: false },
        ],
      },
      {
        id: "q2",
        text: "Which type of chopper is used to step down voltage?",
        explanation: "Step-down choppers are also known as buck converters.",
        options: [
          { id: "a", text: "Step-up", isCorrect: false },
          { id: "b", text: "Step-down", isCorrect: true },
          { id: "c", text: "Step-up/step-down", isCorrect: false },
          { id: "d", text: "Bidirectional", isCorrect: false },
        ],
      },
      {
        id: "q3",
        text: "In chopper control, what does 'duty cycle' refer to?",
        explanation:
          "Duty cycle is the ratio of ON time to the total time period.",
        options: [
          { id: "a", text: "Total period", isCorrect: false },
          { id: "b", text: "OFF time", isCorrect: false },
          { id: "c", text: "ON time / total time", isCorrect: true },
          { id: "d", text: "Voltage ratio", isCorrect: false },
        ],
      },
      {
        id: "q4",
        text: "Which device is commonly used as a switch in choppers?",
        explanation:
          "Power MOSFETs or IGBTs are commonly used in high-speed switching applications.",
        options: [
          { id: "a", text: "SCR", isCorrect: false },
          { id: "b", text: "MOSFET", isCorrect: true },
          { id: "c", text: "Zener diode", isCorrect: false },
          { id: "d", text: "LED", isCorrect: false },
        ],
      },
      {
        id: "q5",
        text: "What is the output voltage of a step-down chopper with 60% duty cycle and input of 100V?",
        explanation: "Vout = D × Vin = 0.6 × 100V = 60V",
        options: [
          { id: "a", text: "40V", isCorrect: false },
          { id: "b", text: "60V", isCorrect: true },
          { id: "c", text: "100V", isCorrect: false },
          { id: "d", text: "160V", isCorrect: false },
        ],
      },
      {
        id: "q6",
        text: "Choppers operate in which domain?",
        explanation:
          "Choppers are time-domain controlled devices using switching.",
        options: [
          { id: "a", text: "Frequency", isCorrect: false },
          { id: "b", text: "Time", isCorrect: true },
          { id: "c", text: "Phase", isCorrect: false },
          { id: "d", text: "None", isCorrect: false },
        ],
      },
      {
        id: "q7",
        text: "Which chopper configuration allows current flow in both directions?",
        explanation:
          "Bidirectional choppers allow current and power flow in both directions.",
        options: [
          { id: "a", text: "Type A", isCorrect: false },
          { id: "b", text: "Type C", isCorrect: false },
          { id: "c", text: "Bidirectional", isCorrect: true },
          { id: "d", text: "Unipolar", isCorrect: false },
        ],
      },
      {
        id: "q8",
        text: "Which chopper is used for regenerative braking?",
        explanation:
          "Type B chopper allows power flow from the load to the source.",
        options: [
          { id: "a", text: "Type A", isCorrect: false },
          { id: "b", text: "Type B", isCorrect: true },
          { id: "c", text: "Type C", isCorrect: false },
          { id: "d", text: "Type D", isCorrect: false },
        ],
      },
      {
        id: "q9",
        text: "What is the main disadvantage of choppers?",
        explanation:
          "Choppers cause electromagnetic interference due to high-frequency switching.",
        options: [
          { id: "a", text: "Large size", isCorrect: false },
          { id: "b", text: "Low efficiency", isCorrect: false },
          { id: "c", text: "EMI generation", isCorrect: true },
          {
            id: "d",
            text: "Inability to work at low voltages",
            isCorrect: false,
          },
        ],
      },
      {
        id: "q10",
        text: "In a chopper, increasing the duty cycle will:",
        explanation: "Increasing duty cycle increases average output voltage.",
        options: [
          { id: "a", text: "Decrease output voltage", isCorrect: false },
          { id: "b", text: "Have no effect", isCorrect: false },
          { id: "c", text: "Increase output voltage", isCorrect: true },
          { id: "d", text: "Only change frequency", isCorrect: false },
        ],
      },
    ],
  },
  "test-2": {
    id: "test-2",
    title: "Chopper Advanced Quiz",
    description:
      "Challenge your advanced knowledge of chopper circuits and applications.",
    timeInMinutes: 30,
    questions: [
      {
        id: "q1",
        text: "Which type of chopper can operate in all four quadrants?",
        explanation:
          "Type E chopper (four-quadrant) can control both voltage and current directions.",
        options: [
          { id: "a", text: "Type A", isCorrect: false },
          { id: "b", text: "Type C", isCorrect: false },
          { id: "c", text: "Type E", isCorrect: true },
          { id: "d", text: "Type B", isCorrect: false },
        ],
      },
      {
        id: "q2",
        text: "In a Type D chopper, current can flow:",
        explanation:
          "In Type D chopper, both source and load can deliver or receive current.",
        options: [
          { id: "a", text: "Only in one direction", isCorrect: false },
          { id: "b", text: "From load to source only", isCorrect: false },
          {
            id: "c",
            text: "From source to load and vice versa",
            isCorrect: true,
          },
          { id: "d", text: "Never", isCorrect: false },
        ],
      },
      {
        id: "q3",
        text: "Which modulation technique is NOT used in choppers?",
        explanation:
          "Pulse Amplitude Modulation is not typically used; PWM is common.",
        options: [
          { id: "a", text: "Pulse Width Modulation", isCorrect: false },
          { id: "b", text: "Frequency Modulation", isCorrect: false },
          { id: "c", text: "Current Limit Control", isCorrect: false },
          { id: "d", text: "Pulse Amplitude Modulation", isCorrect: true },
        ],
      },
      {
        id: "q4",
        text: "Which is NOT an application of choppers?",
        explanation:
          "Choppers are not used in high-frequency RF signal generation.",
        options: [
          { id: "a", text: "Electric traction", isCorrect: false },
          { id: "b", text: "Trolley cars", isCorrect: false },
          { id: "c", text: "RF signal generation", isCorrect: true },
          { id: "d", text: "Battery-operated vehicles", isCorrect: false },
        ],
      },
      {
        id: "q5",
        text: "Which device allows reverse current flow in choppers?",
        explanation:
          "Freewheeling diode provides a path for reverse current when the switch is OFF.",
        options: [
          { id: "a", text: "Zener diode", isCorrect: false },
          { id: "b", text: "Freewheeling diode", isCorrect: true },
          { id: "c", text: "LED", isCorrect: false },
          { id: "d", text: "MOV", isCorrect: false },
        ],
      },
      {
        id: "q6",
        text: "A chopper's switching frequency affects:",
        explanation:
          "Higher frequency leads to smoother output but more switching losses.",
        options: [
          { id: "a", text: "Only voltage", isCorrect: false },
          { id: "b", text: "Output ripple and efficiency", isCorrect: true },
          { id: "c", text: "Current alone", isCorrect: false },
          { id: "d", text: "Nothing", isCorrect: false },
        ],
      },
      {
        id: "q7",
        text: "In Type C chopper, current can flow:",
        explanation:
          "Type C chopper supports current in both directions with positive voltage.",
        options: [
          { id: "a", text: "Only positive", isCorrect: false },
          { id: "b", text: "Only negative", isCorrect: false },
          { id: "c", text: "Both directions", isCorrect: true },
          { id: "d", text: "Only during ON state", isCorrect: false },
        ],
      },
      {
        id: "q8",
        text: "Which topology is commonly used in chopper circuits?",
        explanation: "Buck, boost, and buck-boost topologies are standard.",
        options: [
          { id: "a", text: "Buck", isCorrect: false },
          { id: "b", text: "Boost", isCorrect: false },
          { id: "c", text: "Buck-boost", isCorrect: false },
          { id: "d", text: "All of the above", isCorrect: true },
        ],
      },
      {
        id: "q9",
        text: "What is the typical range of chopper switching frequencies?",
        explanation:
          "Chopper frequencies typically range from a few kHz to hundreds of kHz.",
        options: [
          { id: "a", text: "10–100 Hz", isCorrect: false },
          { id: "b", text: "1–10 kHz", isCorrect: false },
          { id: "c", text: "20–200 kHz", isCorrect: true },
          { id: "d", text: "Above 1 MHz", isCorrect: false },
        ],
      },
      {
        id: "q10",
        text: "Which effect is minimized by using snubber circuits in choppers?",
        explanation:
          "Snubber circuits reduce voltage spikes due to inductive loads.",
        options: [
          { id: "a", text: "Switching speed", isCorrect: false },
          { id: "b", text: "Power gain", isCorrect: false },
          { id: "c", text: "Voltage spikes", isCorrect: true },
          { id: "d", text: "PWM frequency", isCorrect: false },
        ],
      },
    ],
  },
};

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
    console.log('Converted date:', interviewDate.toISOString());

    const interviewer = await Interviewer.findOneAndUpdate(
      {
        email: interviewerEmail,
        'availableSlots': {
          $elemMatch: {
            date: {
              $gte: new Date(interviewDate),
              $lt: new Date(interviewDate.getTime() + 24 * 60 * 60 * 1000) // Next day
            },
            startTime: time,
            booked: false
          }
        }
      },
      { $set: { 'availableSlots.$.booked': true } },
      { new: true }
    );

    if (!interviewer) {
      // Enhanced error reporting
      const slots = await Interviewer.findOne({ email: interviewerEmail });
      return res.status(404).json({
        success: false,
        message: 'No available slot found',
        details: {
          requested: { date: interviewDate, time },
          availableSlots: slots?.availableSlots?.filter(s => 
            s.date.toISOString().includes(date) && 
            !s.booked
          )
        }
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

    const {emailDetails} = req.body

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
