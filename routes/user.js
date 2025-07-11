const { Router } = require("express");
const User = require("../models/user");
const {
  checkForAuthenticationCookie,
} = require("../middleware/authentication");

const router = Router();

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    const user = await User.findOne({ email }).select("-password");

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "None",
      secure: true,
    });

    return res.json({ success: true, user });
  } catch (error) {
    console.error("Login failed:", error.message);
    return res.status(401).json({ error: "Incorrect Email or Password" });
  }
});

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const user = await User.create({ fullName, email, password });
    const cleanUser = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
    };
    return res.status(201).json({ success: true, user: cleanUser });
  } catch (error) {
    console.error("Signup failed:", error.message);
    return res.status(400).json({ error: "User creation failed" });
  }
});

// GET /user/logout
router.get("/logout", (req, res) => {
  res.clearCookie("token").json({ success: true });
});

// GET /user/me
router.get("/me", checkForAuthenticationCookie("token"), async (req, res) => {
  if (!req.user) return res.status(401).json({ user: null });

  const cleanUser = {
    _id: req.user._id,
    email: req.user.email,
    fullName: req.user.fullName,
  };

  res.json(cleanUser);
});

module.exports = router;
