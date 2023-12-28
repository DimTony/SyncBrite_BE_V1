require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connection = require("./db");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const eventRoutes = require("./routes/events");
const profileRoutes = require("./routes/profiles");
const passwordResetRoutes = require("./routes/passwordReset");
const CustomError = require("./utils/customError");
const globalErrorHandler = require("./controllers/errorController");

process.on("uncaughtException", (err) => {
  console.log(err.name, ":", err.message);
  console.log("Uncaught Exception Occured! Shutting Down...");

  process.exit(1);
});

const app = express();

//db
connection();

//middleware

app.use(express.json());
app.use(
  cors({
    origin: [
      "https://syncbrite-8spasbtj9-dimtony.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());

//routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/password-reset", passwordResetRoutes);

app.all("*", (req, res, next) => {
  const err = new CustomError(
    404,
    `Welcome To SyncBrite. Can't find ${req.originalUrl} on the server`
  );

  next(err);
});

app.use(globalErrorHandler);

const port = process.env.PORT || 8080;
const server = app.listen(port, () => console.log(`Listening on port ${port}`));

process.on("unhandledRejection", (err) => {
  console.log(err.name, ":", err.message);
  console.log("Unhandled Rejection Occured! Shutting Down...");
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
