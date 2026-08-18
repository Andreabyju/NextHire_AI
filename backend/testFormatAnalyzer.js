const { analyzePDFFormat } = require("./services/formatAnalyzer");
const extractResumeText = require("./services/resumeParser");

const filePath =
    "./uploads/1786381604450-599822673.pdf";

const test = async () => {
    try {

        console.log("\n📖 Extracting resume text...\n");

        const resumeText = await extractResumeText(
            filePath,
            "application/pdf"
        );

        console.log("✅ Text extracted.");

        console.log("\n📄 Analyzing PDF format...\n");

        const result = await analyzePDFFormat(
            filePath,
            resumeText
        );

        console.log(
            "\n========== FORMAT ANALYSIS ==========\n"
        );

        console.log(
            JSON.stringify(result, null, 2)
        );

        console.log(
            "\n========== END FORMAT ANALYSIS ==========\n"
        );

    } catch (error) {

        console.error(
            "Format analysis failed:",
            error.message
        );
    }
};

test();