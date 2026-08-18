require("dotenv").config();

const mongoose = require("mongoose");
const User = require("./models/User");

const resetMentorPassword = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("✅ MongoDB connected");

        // Find mentor
        const mentor = await User.findOne({
            email: "mentor@technova.com",
            role: "mentor",
        }).select("+password");

        if (!mentor) {
            console.log("❌ Mentor account not found");
            process.exit(1);
        }

        // Set new password
        mentor.password = "Mentor@123";

        // Save → User model bcrypt hook hashes password
        await mentor.save();

        console.log("✅ Mentor password reset successfully");
        console.log("");
        console.log("Email: mentor@technova.com");
        console.log("Password: Mentor@123");

        await mongoose.connection.close();

        process.exit(0);

    } catch (error) {
        console.error(
            "❌ Password reset failed:",
            error.message
        );

        await mongoose.connection.close();

        process.exit(1);
    }
};

resetMentorPassword();