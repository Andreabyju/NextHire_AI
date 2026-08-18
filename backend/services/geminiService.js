const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

// ==========================================
// Gemini Connection Test
// ==========================================
async function testGemini() {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents:
                "Hello from NextHire AI. Please confirm that Gemini is connected successfully."
        });

        return response.text;

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}

// ==========================================
// Resume Analysis using Gemini
// ==========================================
async function analyzeResume(resumeText) {

    try {

        const currentDate = new Date().toISOString().split("T")[0];

        const prompt = `
You are an expert AI Resume Analyzer for an application called NextHire AI.

CURRENT DATE:
${currentDate}

Analyze the resume carefully and objectively.

==================================================
IMPORTANT DATE RULES
==================================================

- Use the CURRENT DATE above when evaluating dates.
- Do NOT automatically classify 2025 or 2026 as future dates.
- A date is "future" ONLY if it occurs after the current date.
- Do not invent, modify, or change any dates.
- If a date appears unusual, mention it as a possible issue rather than assuming it is wrong.
- Do not assume short internships are fake, invalid, or workshops.
- Evaluate experience according to the candidate's apparent career stage.

==================================================
SCORING SYSTEM
==================================================

Each category must first be evaluated on a QUALITY SCALE from 0 to 100.

Then convert each category into its weighted contribution.

CONTENT:
30% of total score

ATS:
25% of total score

FORMAT:
25% of total score

GRAMMAR:
10% of total score

COMPLETENESS:
10% of total score

The returned scores MUST be the weighted contributions.

Therefore:

contentScore = contentQuality × 0.30

atsScore = atsQuality × 0.25

formatScore = formatQuality × 0.25

grammarScore = grammarQuality × 0.10

completenessScore = completenessQuality × 0.10

The maximum values are:

contentScore = 30
atsScore = 25
formatScore = 25
grammarScore = 10
completenessScore = 10

The final score MUST be:

overallScore =
contentScore +
atsScore +
formatScore +
grammarScore +
completenessScore

DO NOT independently choose the overallScore.

The overallScore MUST equal the sum of the five component scores.

Example:

If:

contentQuality = 80
atsQuality = 90
formatQuality = 70
grammarQuality = 90
completenessQuality = 80

Then:

contentScore = 24
atsScore = 22.5
formatScore = 17.5
grammarScore = 9
completenessScore = 8

overallScore = 81

==================================================
1. CONTENT QUALITY - 30%
==================================================

Evaluate:

Professional Summary:

- Clear professional identity
- Relevant technical profile
- Career direction
- Concise and effective wording

Skills:

- Relevant technical skills
- Programming languages
- Frameworks
- Databases
- Tools
- Soft skills
- Appropriate categorization

Projects:

- Number of relevant projects
- Technical complexity
- Technology stack
- Clear responsibilities
- Problem solved
- Results or measurable impact

Experience:

- Internships
- Work experience
- Responsibilities
- Technologies used
- Achievements
- Correct chronology

Education:

- Degree
- Institution
- CGPA/percentage
- Expected graduation if applicable

Do not penalize legitimate short internships simply because they are short.

==================================================
2. ATS QUALITY - 25%
==================================================

Evaluate:

- Standard section headings
- Keyword relevance
- Contact information
- Email
- LinkedIn
- GitHub
- Simple readable structure
- Tables
- Columns
- Icons
- Special characters
- Headers and footers
- Page markers
- Text extraction quality
- Section organization
- ATS-readable formatting

Penalize only actual ATS problems.

Do not claim something is ATS-unfriendly without reasonable evidence.

==================================================
3. FORMAT QUALITY - 25%
==================================================

Evaluate:

- Page count
- Font consistency
- Font size
- Spacing
- Alignment
- Margins
- Section hierarchy
- Bullet consistency
- White space
- Page balance
- Visual readability

IMPORTANT:

A two-page student resume is NOT automatically a formatting error.

Only recommend one page if the content can reasonably be condensed without damaging readability.

==================================================
4. GRAMMAR QUALITY - 10%
==================================================

Evaluate:

- Grammar
- Spelling
- Sentence structure
- Verb tense
- Professional wording
- Consistency

If there are no meaningful grammar problems, give a high score.

==================================================
5. COMPLETENESS QUALITY - 10%
==================================================

Check whether the resume contains:

- Name
- Email
- Phone
- Location
- LinkedIn
- GitHub
- Professional summary
- Skills
- Projects
- Experience
- Education
- Dates
- Technologies
- Achievements or measurable results

Do not penalize information that is genuinely not required for the candidate's profile.

==================================================
SECTION ANALYSIS
==================================================

For sectionAnalysis, give each section a QUALITY score from 0-100.

Analyze:

- Professional Summary
- Skills
- Projects
- Experience
- Education

Each feedback message should explain:

1. What is good.
2. What can be improved.

==================================================
FORMAT AND ATS CHECKS
==================================================

Pay attention to:

- Page markers such as "1 of 2"
- Unusual characters
- Excessive text density
- Very small fonts
- Very large fonts
- Inconsistent fonts
- Inconsistent dates
- Excessive white space
- Poor section organization
- Missing contact information
- ATS-unfriendly structures

Do not call something an error unless there is reasonable evidence.

==================================================
IMPORTANT ANALYSIS RULES
==================================================

- Never invent information.
- Never assume missing achievements happened.
- Never assume dates are wrong.
- Never assume short internships are invalid.
- Never penalize a student simply for having limited professional experience.
- Evaluate the resume according to the candidate's apparent career stage.
- Give practical suggestions.
- Distinguish between CRITICAL issues and minor improvements.
- Do not repeat the same issue in every category.
- Do not randomly assign scores.
- Keep scores consistent with the feedback.

==================================================
OUTPUT FORMAT
==================================================

Return ONLY valid JSON.

Do not include markdown.
Do not include code fences.
Do not include explanations outside the JSON.

Use exactly this structure:

{
    "overallScore": 0,
    "contentScore": 0,
    "atsScore": 0,
    "formatScore": 0,
    "grammarScore": 0,
    "completenessScore": 0,

    "sectionAnalysis": {
        "professionalSummary": {
            "score": 0,
            "feedback": ""
        },
        "skills": {
            "score": 0,
            "feedback": ""
        },
        "projects": {
            "score": 0,
            "feedback": ""
        },
        "experience": {
            "score": 0,
            "feedback": ""
        },
        "education": {
            "score": 0,
            "feedback": ""
        }
    },

    "strengths": [],

    "contentIssues": [],

    "formatIssues": [],

    "atsIssues": [],

    "grammarIssues": [],

    "suggestions": []
}

Resume to analyze:

${resumeText}
`;

        // ==========================================
        // Send Resume to Gemini
        // ==========================================

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        let result = response.text;

        // ==========================================
        // Clean Gemini Response
        // ==========================================

        result = result
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        // ==========================================
        // Convert JSON String to JavaScript Object
        // ==========================================

        const analysis = JSON.parse(result);

        // ==========================================
        // Validate Scores
        // ==========================================

        analysis.contentScore = Number(analysis.contentScore) || 0;
        analysis.atsScore = Number(analysis.atsScore) || 0;
        analysis.formatScore = Number(analysis.formatScore) || 0;
        analysis.grammarScore = Number(analysis.grammarScore) || 0;
        analysis.completenessScore =
            Number(analysis.completenessScore) || 0;

        // ==========================================
        // Keep Scores Within Their Allowed Ranges
        // ==========================================

        analysis.contentScore = Math.min(
            Math.max(analysis.contentScore, 0),
            30
        );

        analysis.atsScore = Math.min(
            Math.max(analysis.atsScore, 0),
            25
        );

        analysis.formatScore = Math.min(
            Math.max(analysis.formatScore, 0),
            25
        );

        analysis.grammarScore = Math.min(
            Math.max(analysis.grammarScore, 0),
            10
        );

        analysis.completenessScore = Math.min(
            Math.max(analysis.completenessScore, 0),
            10
        );

        // ==========================================
        // Calculate Overall Score
        // ==========================================

        analysis.overallScore =
            analysis.contentScore +
            analysis.atsScore +
            analysis.formatScore +
            analysis.grammarScore +
            analysis.completenessScore;

        // Round final score
        analysis.overallScore = Math.round(
            analysis.overallScore
        );

        // ==========================================
        // Ensure Section Analysis Exists
        // ==========================================

        if (!analysis.sectionAnalysis) {
            analysis.sectionAnalysis = {};
        }

        // ==========================================
        // Return Final Analysis
        // ==========================================

        return analysis;

    } catch (error) {

        console.error(
            "Resume Analysis Error:",
            error
        );

        throw error;
    }
}

// ==========================================
// Match Candidate with Job Description
// ==========================================
async function matchCandidateWithJob(resumeData, jobDescription) {
    try {
        const prompt = `
You are an expert AI Technical Recruiter. Compare the candidate's qualifications and skills against the job description provided below.

==================================================
JOB DESCRIPTION:
==================================================
${jobDescription}

==================================================
CANDIDATE RESUME ANALYSIS SUMMARY:
==================================================
Overall Resume Score: ${resumeData.overallScore}/100
Strengths: ${JSON.stringify(resumeData.strengths)}
Completeness Score: ${resumeData.completenessScore}/100
ATS Score: ${resumeData.atsScore}/100
Detailed Section Evaluations:
${JSON.stringify(resumeData.sectionAnalysis)}

==================================================
EVALUATION RULES:
==================================================
1. Compare candidate strengths, skills, and section evaluations against the Job Description.
2. Determine an overall Match Percentage (0-100) based on alignment of technical skills and experience.
3. List 2 to 4 key matches where the candidate aligns well.
4. List missing skills or gaps where the candidate does not align or lacks specified qualifications.
5. Provide a short, constructive recruiting verdict/summary of the alignment.

You MUST respond with a valid JSON object matching the following structure. Do not include markdown formatting, backticks, or "json" prefix:
{
  "matchPercentage": 85,
  "keyMatches": ["Strong React expertise", "Experience with Node.js REST APIs"],
  "missingSkills": ["AWS deployment", "GraphQL experience"],
  "verdict": "Highly Recommended candidate with strong technical alignment."
}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        const rawText = response.text.trim();
        const cleanedText = rawText.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
        
        try {
            return JSON.parse(cleanedText);
        } catch (_) {
            console.error("JSON parsing failed, raw response:", rawText);
            return {
                matchPercentage: 50,
                keyMatches: ["Technical matching performed"],
                missingSkills: [],
                verdict: "AI matching completed. Review candidate profile details for manual evaluation."
            };
        }

    } catch (error) {
        console.error("AI Matching Error:", error);
        throw error;
    }
}

// ==========================================
// Export Functions
// ==========================================

module.exports = {
    testGemini,
    analyzeResume,
    matchCandidateWithJob
};