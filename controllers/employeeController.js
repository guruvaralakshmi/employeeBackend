const Employee = require("../models/employeeModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

// Multer Config for File Upload
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Register Employee (Manual Employee ID)
const registerEmployee = async (req, res) => {
  try {
    const { employeeId, Name, phone, email, password, companyName, Location } = req.body;

    // Validate Employee ID (Must start with LNRS + 9 digits)
    const idPattern = /^LNRS\d{9}$/;
    if (!employeeId || !idPattern.test(employeeId)) {
      return res.status(400).json({ message: "Invalid Employee ID. It must start with 'LNRS' followed by 9 digits." });
    }

    // Check if Employee ID already exists
    const existingId = await Employee.findOne({ employeeId });
    if (existingId) {
      return res.status(400).json({ message: "Employee ID already exists. Please choose a different ID." });
    }

    // Check if email already exists
    const existingUser = await Employee.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const photo = req.file ? `/uploads/${req.file.filename}` : "";

    const newEmployee = new Employee({
      employeeId,
      Name,
      phone,
      email,
      password: hashedPassword,
      companyName,
      Location,
      photo,
    });

    await newEmployee.save();
    res.status(201).json({ message: "Employee registered successfully", employeeId, photo });
  } catch (err) {
    console.error("Error saving employee:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Login Employee
const loginEmployee = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const employee = await Employee.findOne({ email }).select("+password");
    if (!employee || !employee.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { employeeId: employee.employeeId },
      process.env.JWT_SECRET || "defaultSecretKey",
      { expiresIn: "1h" }
    );

    const employeeData = employee.toObject();
    delete employeeData.password;

    res.json({
      message: "Login successful",
      token,
      employee: {
        employeeId: employee.employeeId,
        Name: employee.Name,
        email: employee.email,
        photo: employee.photo || "",
        phone: employee.phone,
        companyName: employee.companyName,
        Location: employee.Location,
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get All Employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select("-password");
    res.json({ message: "Employees retrieved successfully", employees });
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get Employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.id }).select("-password");
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    console.error("Error fetching employee:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update Employee
const updateEmployee = async (req, res) => {
  try {
    const { Name, phone, email, companyName, Location } = req.body;
    const updateData = { Name, phone, email, companyName, Location };
    if (req.file) updateData.photo = `/uploads/${req.file.filename}`;

    const employee = await Employee.findOneAndUpdate(
      { employeeId: req.params.id },
      updateData,
      { new: true }
    );

    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Delete Employee
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findOneAndDelete({ employeeId: req.params.id });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Search Employee by Name
const searchEmployeeByName = async (req, res) => {
  try {
    const { name } = req.params;
    if (!name) {
      return res.status(400).json({ message: "Name parameter is required" });
    }
    const employees = await Employee.find({ Name: { $regex: name, $options: "i" } });
    if (employees.length === 0) {
      return res.status(404).json({ message: "No employees found" });
    }
    res.json(employees[0]);
  } catch (err) {
    console.error("Search Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = {
  registerEmployee,
  loginEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  searchEmployeeByName,
  upload,
};
