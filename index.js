require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connection = require("./db");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const passwordResetRoutes = require("./routes/passwordReset");
const CustomError = require("./utils/customError");
const globalErrorHandler = require("./controllers/errorController");

const app = express();

//db
connection();

//middleware

app.use(express.json());
app.use(cors());

//routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
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
app.listen(port, () => console.log(`Listening on port ${port}`));
