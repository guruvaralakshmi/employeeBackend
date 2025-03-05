
const Employee = require("../models/employeeModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");

// Multer Config for File Upload
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});
const upload = multer({ storage: storage });

// Function to generate a unique numeric employee ID
const generateEmployeeID = async () => {
    let isUnique = false;
    let newID;

    while (!isUnique) {
        newID = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit random number

        // Check if this ID already exists in the database
        const existingEmployee = await Employee.findOne({ employeeId: newID });
        if (!existingEmployee) {
            isUnique = true; // ID is unique, break the loop
        }
    }
    return newID;
};

// Register Employee
const registerEmployee = async (req, res) => {
  try {
    const { FullName, age, gender, phone, EmailID, password, companyName, salary, address } = req.body;

    // Check if the email already exists
    const existingUser = await Employee.findOne({ EmailID });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique Employee ID
    const employeeId = await generateEmployeeID();

    // Get uploaded photo path
    const photo = req.file ? req.file.path : "";  // Store file path

    // Create new employee
    const newEmployee = new Employee({
      employeeId,
      FullName,
      age,
      gender,
      phone,
      EmailID,
      password: hashedPassword,
      companyName,
      salary,
      address,
      photo,  // Add photo
    });

    await newEmployee.save();
    res.status(201).json({ message: "Employee registered successfully", employeeId, photo });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Login Employee
const loginEmployee = async (req, res) => {
  try {
    const { EmailID, password } = req.body;

    // Find employee by email
    const employee = await Employee.findOne({ EmailID });
    if (!employee) return res.status(401).json({ message: "Invalid email or password" });

    // Compare password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    // Generate JWT token
    const token = jwt.sign(
      { employeeId: employee.employeeId },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Exclude password from response
    const { password: _, ...employeeData } = employee.toObject();

    res.json({ message: "Login successful", token, employeeData });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Get All Employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
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
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update Employee
const updateEmployee = async (req, res) => {
  try {
    const { name, age, gender, phone, companyName, salary, address } = req.body;

    // Update data object
    const updateData = { name, age, gender, phone, companyName, salary, address };
    
    // If new photo is uploaded, update it
    if (req.file) updateData.photo = req.file.path; 

    // Find and update employee
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

module.exports = {
  registerEmployee,
  loginEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  upload,  // Make sure multer is exported
};
