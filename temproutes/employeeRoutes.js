const express = require("express");
const multer = require("multer");
const path = require("path");
const {
  registerEmployee,
  loginEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  searchEmployeeByName,
} = require("../controllers/employeeController");

const router = express.Router();

// Multer Setup for Image Uploads
const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Routes
router.post("/register", upload.single("photo"), registerEmployee);
router.post("/login", loginEmployee);
router.get("/", getAllEmployees);
router.get("/employee/:id", getEmployeeById);
router.put("/employee/:id", upload.single("photo"), updateEmployee);
router.delete("/employee/:id", deleteEmployee);
router.get("/search/:name", searchEmployeeByName); // 🔥 Correct Search Route
router.get("/uploads/:filename", (req, res) => {
  res.sendFile(path.join(__dirname, "../uploads", req.params.filename));
});

module.exports = router;
