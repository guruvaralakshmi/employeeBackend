const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  employeeId: { type: Number, unique: true, required: true },
  FullName: String,
  age: Number,
  gender: String,
  phone: String,
  EmailID: { type: String, unique: true, required: true },
  password: String,
  companyName: String,
  salary: Number,
  address: String,
  photo: String,  // Added photo field
});

module.exports = mongoose.model("Employee", employeeSchema);
