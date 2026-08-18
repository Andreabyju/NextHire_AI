const extractResumeText = require("./services/resumeParser");

const filePath =
    "./uploads/1786380370480-302902313.pdf";

const fileType = "application/pdf";

const test = async () => {
    try {
        const text = await extractResumeText(filePath, fileType);

        console.log("\n========== RESUME TEXT ==========\n");
        console.log(text);
        console.log("\n========== END OF RESUME ==========\n");
    } catch (error) {
        console.error("Test failed:", error.message);
    }
};

test();