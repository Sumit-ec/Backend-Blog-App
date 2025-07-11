const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const userRoute = require("./routes/user");
const blogRoute = require("./routes/blog");
const { checkForAuthenticationCookie } = require("./middleware/authentication");
const Blog = require("./models/blog");

const app = express();
const PORT = process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log(" Connected to MongoDB Atlas"))
  .catch((err) => console.error(" MongoDB connection error:", err));

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://startling-cucurucho-73b8a1.netlify.app"
  ],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.resolve("./public")));

app.use(checkForAuthenticationCookie("token"));

app.use("/user", userRoute);
app.use("/blog", blogRoute);

app.get("/home", async (req, res) => {
  let userBlogs = [];

  if (req.user) {
    userBlogs = await Blog.find({ createdBy: req.user._id }).populate("createdBy");
  }

  res.json({
    user: req.user,
    blogs: userBlogs,
  });
});

app.listen(PORT, () => console.log(` Server Started at PORT: ${PORT}`));
