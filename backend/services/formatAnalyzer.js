const fs = require("fs");

async function analyzePDFFormat(filePath, resumeText = "") {
    try {
        const pdfjsLib = await import(
            "pdfjs-dist/legacy/build/pdf.mjs"
        );

        const data = new Uint8Array(
            fs.readFileSync(filePath)
        );

        const loadingTask = pdfjsLib.getDocument({
            data: data,
        });

        const pdf = await loadingTask.promise;

        const pageCount = pdf.numPages;

        let totalTextItems = 0;
        let fontSizes = [];
        let pages = [];

        // ==========================================
        // Analyze PDF pages
        // ==========================================

        for (
            let pageNumber = 1;
            pageNumber <= pageCount;
            pageNumber++
        ) {
            const page = await pdf.getPage(pageNumber);

            const textContent =
                await page.getTextContent();

            const items = textContent.items;

            totalTextItems += items.length;

            let pageFontSizes = [];
            let pageTexts = [];

            let minX = Infinity;
            let maxX = -Infinity;

            let minY = Infinity;
            let maxY = -Infinity;

            items.forEach((item) => {

                const text = item.str || "";

                pageTexts.push(text);

                if (
                    item.transform &&
                    item.transform.length >= 6
                ) {
                    const fontSize =
                        Math.abs(item.transform[3]);

                    if (fontSize > 0) {
                        fontSizes.push(fontSize);
                        pageFontSizes.push(fontSize);
                    }

                    const x = item.transform[4];
                    const y = item.transform[5];

                    if (typeof x === "number") {
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                    }

                    if (typeof y === "number") {
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                    }
                }
            });

            let density = "Normal";

            if (items.length > 130) {
                density = "High";
            } else if (items.length < 35) {
                density = "Low";
            }

            pages.push({
                pageNumber,
                textItems: items.length,
                fontSizes: pageFontSizes,
                textDensity: density,
                contentBounds: {
                    minX:
                        minX === Infinity
                            ? null
                            : Number(minX.toFixed(2)),

                    maxX:
                        maxX === -Infinity
                            ? null
                            : Number(maxX.toFixed(2)),

                    minY:
                        minY === Infinity
                            ? null
                            : Number(minY.toFixed(2)),

                    maxY:
                        maxY === -Infinity
                            ? null
                            : Number(maxY.toFixed(2))
                }
            });
        }

        // ==========================================
        // Font analysis
        // ==========================================

        const uniqueFontSizes = [
            ...new Set(
                fontSizes.map((size) =>
                    Number(size.toFixed(1))
                )
            )
        ].sort((a, b) => a - b);

        let fontConsistency = "Good";

        if (uniqueFontSizes.length > 6) {
            fontConsistency = "Needs Review";
        }

        // ==========================================
        // Text-based formatting checks
        // ==========================================

        const detectedIssues = [];

        const text = resumeText || "";

        // ------------------------------------------
        // Page markers
        // ------------------------------------------

        const pageMarkerPatterns = [
            /--\s*\d+\s*of\s*\d+\s*--/gi,
            /\bpage\s+\d+\s+of\s+\d+\b/gi,
            /\b\d+\s*\/\s*\d+\b/g
        ];

        let pageMarkerFound = false;

        for (const pattern of pageMarkerPatterns) {
            if (pattern.test(text)) {
                pageMarkerFound = true;
                break;
            }
        }

        if (pageMarkerFound) {
            detectedIssues.push({
                type: "page_marker",
                severity: "medium",
                message:
                    "Page numbering markers were detected in the resume. These are usually unnecessary for a student resume and may interfere with ATS text extraction."
            });
        }

        // ------------------------------------------
        // Contact information
        // ------------------------------------------

        const hasEmail =
            /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text);

        const hasLinkedIn =
            /linkedin\.com/i.test(text);

        const hasGitHub =
            /github\.com/i.test(text);

        if (!hasEmail) {
            detectedIssues.push({
                type: "missing_email",
                severity: "high",
                message:
                    "No email address was detected in the extracted resume text."
            });
        }

        if (!hasLinkedIn) {
            detectedIssues.push({
                type: "missing_linkedin",
                severity: "low",
                message:
                    "No LinkedIn profile was detected."
            });
        }

        // ------------------------------------------
        // Common resume sections
        // ------------------------------------------

        const sections = {
            summary:
                /professional summary|summary|objective/i.test(text),

            skills:
                /technical skills|skills|core skills/i.test(text),

            projects:
                /projects|academic projects/i.test(text),

            experience:
                /experience|internship experience|work experience/i.test(text),

            education:
                /education|academic background/i.test(text)
        };

        const missingSections = Object.entries(sections)
            .filter(([name, exists]) => !exists)
            .map(([name]) => name);

        if (missingSections.length > 0) {
            detectedIssues.push({
                type: "missing_sections",
                severity: "medium",
                message:
                    `Potentially missing standard resume sections: ${missingSections.join(", ")}.`
            });
        }

        // ------------------------------------------
        // ATS-sensitive characters
        // ------------------------------------------

        const unusualCharacters = (
            text.match(/[^\x00-\x7F]/g) || []
        ).length;

        if (unusualCharacters > 20) {
            detectedIssues.push({
                type: "special_characters",
                severity: "low",
                message:
                    "A relatively high number of special/non-standard characters were detected. Verify that they are ATS-readable."
            });
        }

        // ------------------------------------------
        // Page count
        // ------------------------------------------

        let pageFeedback;

        if (pageCount === 1) {
            pageFeedback =
                "Resume fits on one page.";
        } else if (pageCount === 2) {
            pageFeedback =
                "Resume is two pages long. This can be acceptable depending on experience level.";
        } else {
            pageFeedback =
                "Resume is longer than two pages and should be reviewed for unnecessary content.";

            detectedIssues.push({
                type: "page_count",
                severity: "medium",
                message:
                    "Resume exceeds two pages."
            });
        }

        // ------------------------------------------
        // Text density
        // ------------------------------------------

        pages.forEach((page) => {
            if (page.textDensity === "High") {
                detectedIssues.push({
                    type: "high_text_density",
                    severity: "medium",
                    page: page.pageNumber,
                    message:
                        `Page ${page.pageNumber} contains a high amount of text. Consider improving spacing or reducing unnecessary content.`
                });
            }
        });

        // ==========================================
        // Final result
        // ==========================================

        return {
            pageCount,

            totalTextItems,

            fontAnalysis: {
                uniqueFontSizes,
                fontConsistency
            },

            pageAnalysis: {
                feedback: pageFeedback,
                pages
            },

            contactAnalysis: {
                emailDetected: hasEmail,
                linkedinDetected: hasLinkedIn,
                githubDetected: hasGitHub
            },

            sectionAnalysis: sections,

            atsChecks: {
                specialCharacterCount: unusualCharacters
            },

            detectedIssues
        };

    } catch (error) {
        console.error(
            "PDF format analysis error:",
            error
        );

        throw error;
    }
}

module.exports = {
    analyzePDFFormat
};