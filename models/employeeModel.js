const mongoose = require("mongoose");

const EmployeeSchema = new mongoose.Schema({
  employeeId: { type: Number, unique: true, required: true },
  FullName: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  companyName: { type: String, required: true },
  salary: { type: Number, required: true },
  address: { type: String, required: true },
  photo: { type: String },
});

module.exports = mongoose.model("Employee", EmployeeSchema);
