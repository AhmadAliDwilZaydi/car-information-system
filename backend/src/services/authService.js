const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const Admin = require("../models/Admin");
const env = require("../config/env");
const ApiError = require("../utils/apiError");

function signToken(admin) {
  return jwt.sign(
    {
      sub: admin._id.toString(),
      role: admin.role,
      email: admin.email
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

async function login(email, password) {
  const admin = await Admin.findOne({ email: email.toLowerCase() });
  if (!admin) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid credentials");
  }

  return {
    token: signToken(admin),
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    }
  };
}

module.exports = {
  login
};
