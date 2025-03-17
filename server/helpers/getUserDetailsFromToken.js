const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

const getUserDetailsFromToken = async (token) => {
  try {
    if (!token) throw new Error("⛔ टोकन नहीं मिला");

    const decoded = jwt.verify(token, process.env.JWT_SECRET.trim());

    if (!decoded?.id) throw new Error("⛔ टोकन से आईडी नहीं मिली");

    const user = await UserModel.findById(decoded.id).select("-password");

    if (!user) throw new Error("⛔ यूज़र डेटाबेस में नहीं मिला");

    return user;
  } catch (error) {
    console.error("⛔ getUserDetailsFromToken Error:", error.message);
    return null;
  }
};

module.exports = getUserDetailsFromToken;
