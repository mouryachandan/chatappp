const getUserDetailsFromToken = require("../helpers/getUserDetailsFromToken");

async function userDetails(request, response) {
  try {
    const token = request.cookies.token || "";
    console.log("Received token:", token);

    if (!token) {
      return response.status(401).json({
        message: "No token provided",
        error: true,
      });
    }

    const user = await getUserDetailsFromToken(token);

    if (!user) {
      return response.status(404).json({
        message: "User not found",
        error: true,
      });
    }

    return response.status(200).json({
      message: "User details fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("🔥 Error in userDetails route:", error.message);
    return response.status(500).json({
      message: error.message || "Internal Server Error",
      error: true,
    });
  }
}

module.exports = userDetails;
