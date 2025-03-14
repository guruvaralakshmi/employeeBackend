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
    const existingEmployee = await Employee.findOne({ employeeId: newID });
    if (!existingEmployee) {
      isUnique = true;
    }
  }
  return newID;
};
 
// Register Employee
const registerEmployee = async (req, res) => {
  try {
    const { FullName, age, gender, phone, email, password, companyName, salary, address } = req.body;
    if (!email || email.trim() === "") {
      return res.status(400).json({ message: "Email is required" });
    }
   
    const existingUser = await Employee.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }
 
    const hashedPassword = await bcrypt.hash(password, 10);
    const employeeId = await generateEmployeeID();
    const photo = req.file ? req.file.path : "";
 
    const newEmployee = new Employee({
      employeeId,
      FullName,
      age,
      gender,
      phone,
      email,
      password: hashedPassword,
      companyName,
      salary,
      address,
      photo,
    });
 
    await newEmployee.save();
    res.status(201).json({ message: "Employee registered successfully", employeeId, photo });
  } catch (err) {
    console.error("Error saving employee:", err);
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
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
        FullName: employee.FullName,
        email: employee.email,
        photo: employee.photo ? `https://employeebackend-5qt6.onrender.com/${employee.photo.replace(/\\/g, "/")}` : "", // Fix path format
        age: employee.age,
        gender: employee.gender,
        phone: employee.phone,
        companyName: employee.companyName,
        salary: employee.salary,
        address: employee.address
      }
    });
    
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
 
// Get All Employees
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().select("-password"); // Exclude passwords
    res.json({ message: "Employees retrieved successfully", employees });
  } catch (err) {
    console.error("Error fetching employees:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

 
// Get Employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findOne({ employeeId: req.params.id }).select("+password");
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
    const { FullName, age, gender, phone, email, companyName, salary, address } = req.body;
    const updateData = { FullName, age, gender, phone, email, companyName, salary, address };
    if (req.file) updateData.photo = req.file.path;
 
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
 
// 🔥 Search Employee by Name (Updated Route)
const searchEmployeeByName = async (req, res) => {
  try {
    const { name } = req.params; // Using req.params instead of req.query
 
    if (!name) {
      return res.status(400).json({ message: "Name parameter is required" });
    }
 
    const employees = await Employee.find({ FullName: { $regex: name, $options: "i" } });
 
    if (employees.length === 0) {
      return res.status(404).json({ message: "No employees found" });
    }
 
    res.json(employees[0]); // Send the first matching employee
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