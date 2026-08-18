const express = require("express");
const router = express.Router();

const { testGemini } = require("../services/geminiService");

router.get("/test", async (req, res) => {
    try {
        const response = await testGemini();

        res.status(200).json({
            success: true,
            message: "Gemini connected successfully!",
            response: response
        });
    } catch (error) {
        console.error("Gemini test failed:", error);

        res.status(500).json({
            success: false,
            message: "Gemini connection failed.",
            error: error.message
        });
    }
});

module.exports = router;