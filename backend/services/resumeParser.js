const fs = require("fs");
const mammoth = require("mammoth");
const { PDFParse } = require("pdf-parse");

const extractResumeText = async (filePath, fileType) => {
    try {
        // =========================
        // PDF
        // =========================
        if (fileType === "application/pdf") {
            const fileBuffer = fs.readFileSync(filePath);

            const parser = new PDFParse({
                data: fileBuffer,
            });

            const result = await parser.getText();

            await parser.destroy();

            return result.text.trim();
        }

        // =========================
        // DOCX
        // =========================
        if (
            fileType ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ) {
            const result = await mammoth.extractRawText({
                path: filePath,
            });

            return result.value.trim();
        }

        throw new Error("Unsupported file type. Only PDF and DOCX are allowed.");

    } catch (error) {
        console.error("Resume text extraction error:", error);
        throw error;
    }
};

module.exports = extractResumeText;