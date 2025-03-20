const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: String, unique: true, required: true }, // String for custom format
  Name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  companyName: { type: String, required: true },
  Location: { type: String, required: true }, // Changed from 'address' to 'location'
  photo: { type: String },
});

module.exports = mongoose.model("Employee", EmployeeSchema);
