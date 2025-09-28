import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

// Create __filename and __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const users = [];
const logs = [];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.post("/api/users", (req, res) => {
  const username = req.body.username;
  if (!username) {
    return res.status(400).json({ error: "Username is required" });
  }
  // Save user to database (mock)
  const randomId = crypto.randomUUID();
  users.push({ username, _id: randomId });

  res.json({ username, _id: randomId });
});

app.get("/api/users", (req, res) => {
  res.json(users);
});

app.post("/api/users/:_id/exercises", (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;
  const user = users.find((u) => u._id === userId);

  if (!user) return res.status(404).json({ error: "User not found" });

  const exerciseDate = date ? new Date(date) : new Date();
  if (isNaN(exerciseDate.getTime())) {
    return res.status(400).json({ error: "Invalid date format" });
  }
  const exercise = {
    _id: userId,
    username: user.username,
    description,
    duration: parseInt(duration),
    date: exerciseDate,
  };

  logs.push(exercise);

  res.json({
    _id: userId,
    username: user.username,
    description,
    duration,
    date: exerciseDate.toDateString(),
  });
});

app.get("/api/users/:_id/logs", (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;
  const user = users.find((u) => u._id === userId);

  if (!user) return res.status(404).json({ error: "User not found" });

  let userLogs = logs.filter((log) => log.userId === userId);
  if (from) {
    const fromDate = new Date(from);
    userLogs = userLogs.filter((log) => log.date >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    userLogs = userLogs.filter((log) => log.date <= toDate);
  }
  if (limit) {
    userLogs = userLogs.slice(0, parseInt(limit));
  }

  res.json({
    _id: userId,
    username: user.username,
    count: userLogs.length,
    log: userLogs.map((log) => ({
      description: log.description,
      duration: log.duration,
      date: log.date.toDateString(),
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
