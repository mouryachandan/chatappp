const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log("⏳ Trying to connect to MongoDB...");

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("✅ Connected to MongoDB!");
    } catch (error) {
        console.error("❌ MongoDB connection failed:", error.message);
        process.exit(1); // फेल होने पर ऐप बंद कर दो
    }
};

module.exports = connectDB;
