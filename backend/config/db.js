const mongoose = require("mongoose");
const dns = require("dns");

// Force Node's c-ares DNS resolver to use Google DNS for SRV record lookups.
// The local router DNS fails to resolve _mongodb._tcp SRV records used by
// the mongodb+srv:// connection string protocol.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "nexthireai",
    });

    console.log("✅ MongoDB Atlas Connected Successfully!");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:");
    console.error(error.message);
    throw error;
  }
};

module.exports = connectDB;