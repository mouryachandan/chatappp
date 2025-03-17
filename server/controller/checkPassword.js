const UserModel = require("../models/UserModel");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function checkPassword(request, response) {
  try {
    const { password, userId } = request.body;

    // Check user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return response.status(404).json({
        message: "User not found",
        error: true,
      });
    }

    // Verify password
    const verifyPassword = await bcryptjs.compare(password, user.password);
    if (!verifyPassword) {
      return response.status(400).json({
        message: "Please check password",
        error: true,
      });
    }

    // Generate JWT token
    const tokenData = {
      id: user._id,
      email: user.email,
    };

    const token = jwt.sign(tokenData, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // Set secure cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    };

    return response
      .cookie("token", token, cookieOptions)
      .status(200)
      .json({
        message: "Login successfully",
        token: token,
        success: true,
      });
  } catch (error) {
    console.error("Error in checkPassword:", error);
    return response.status(500).json({
      message: error.message || "Internal Server Error",
      error: true,
    });
  }
}

module.exports = checkPassword;
