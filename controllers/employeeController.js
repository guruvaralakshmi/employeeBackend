
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
    const { FullName, age, gender, phone, email, password, companyName, salary, address } = req.body;

    if (!email || email.trim() === "") {
      return res.status(400).json({ message: "Email is required" });
    }
    
    
    // Check if email already exists
    const existingUser = await Employee.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique Employee ID
    const employeeId = await generateEmployeeID();

    // Get uploaded photo path
    const photo = req.file ? req.file.path : "";

    // Create and save employee
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
  } 
  catch (err) {  // Ensure there is a 'catch' block
    console.error("Error saving employee:", err);

    // Handle MongoDB duplicate key error
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

    // Validate input fields
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find employee by email
    const employee = await Employee.findOne({ email }).select("+password"); 
    if (!employee || !employee.password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { employeeId: employee.employeeId },
      process.env.JWT_SECRET || "defaultSecretKey",
      { expiresIn: "1h" }
    );

    // Remove password before sending response
    const employeeData = employee.toObject();
    delete employeeData.password;

    res.json({ message: "Login successful", token, employeeData });
  } catch (err) {
    console.error("Login Error:", err);
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
    const employee = await Employee.findOne({ employeeId: req.params.id }).select("+password"); // 🔥 Force fetch password

    if (!employee) return res.status(404).json({ message: "Employee not found" });

    console.log("Fetched Employee:", employee);  
    res.json(employee); // Return employee data with password
  } catch (err) {
    console.error("Error fetching employee:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};


// Update Employee
const updateEmployee = async (req, res) => {
  try {
    const { FullName, age, gender, phone,email, companyName, salary, address } = req.body;

    // Update data object
    const updateData = { FullName, age, gender, phone,email, companyName, salary, address };
    
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