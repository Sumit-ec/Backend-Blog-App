const { Router } = require("express");
const multer = require("multer");
const path = require("path");

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const router = Router();

// 🔧 Multer storage setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve("./public/uploads/"));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage });

router.get("/all", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 2;
  const skip = (page - 1) * limit;

  try {
    const [blogs, totalBlogs] = await Promise.all([
      Blog.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("createdBy"),
      Blog.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalBlogs / limit);

    return res.json({
      blogs,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.post("/like/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ error: "Blog not found" });

  const userId = req.user._id.toString();
  const alreadyLiked = blog.likes.map(id => id.toString()).includes(userId);

  if (alreadyLiked) {
    blog.likes = blog.likes.filter(id => id.toString() !== userId);
  } else {
    blog.likes.push(req.user._id);
  }

  await blog.save();
  return res.json({ success: true, likes: blog.likes, userId });
});

router.post("/dislike/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (!blog) return res.status(404).json({ error: "Blog not found" });

  const userId = req.user._id.toString();
  const alreadyDisliked = blog.dislikes.map(id => id.toString()).includes(userId);
  const alreadyLiked = blog.likes.map(id => id.toString()).includes(userId);

  if (alreadyDisliked) {
    blog.dislikes = blog.dislikes.filter(id => id.toString() !== userId);
  } else {
    blog.dislikes.push(req.user._id);
    if (alreadyLiked) {
      blog.likes = blog.likes.filter(id => id.toString() !== userId);
    }
  }

  await blog.save();
  return res.json({ success: true, dislikes: blog.dislikes });
});

router.get("/add-new", (req, res) => {
  return res.json({ user: req.user });
});

router.post("/add-new", async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    title,
    body,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, blog });
});

router.get("/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .populate("createdBy")
      .populate("likes");

    const comments = await Comment.find({ blogId: req.params.id }).populate("createdBy");

    return res.json({ blog, comments });
  } catch (err) {
    return res.status(404).json({ error: "Blog not found" });
  }
});

router.post("/comment/:blogId", async (req, res) => {
  try {
    const comment = await Comment.create({
      content: req.body.content,
      blogId: req.params.blogId,
      createdBy: req.user._id,
    });
    return res.status(201).json({ success: true, comment });
  } catch (error) {
    return res.status(500).json({ error: "Could not create comment" });
  }
});

// ✅ Route for blog creation with file upload
router.post("/", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;

  try {
    const blog = await Blog.create({
      body,
      title,
      createdBy: req.user._id,
      coverImageURL: req.file ? `/uploads/${req.file.filename}` : null,
    });

    return res.status(201).json({ success: true, blog });
  } catch (err) {
    console.error("Error creating blog:", err.message);
    return res.status(500).json({ error: "Failed to create blog" });
  }
});

module.exports = router;
