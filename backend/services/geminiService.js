
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

IMPORTANT DATE RULES:
- Use the CURRENT DATE above when evaluating dates.
- Do NOT automatically classify 2025 or 2026 as future dates.
- A date is future only if it occurs after the current date.
- Do not invent, modify, or change dates.
- Treat unusual dates as possible issues, not automatically incorrect.
- Do not assume short internships are fake, invalid, or workshops.
- Evaluate experience according to the candidate's career stage.

SCORING SYSTEM:
Evaluate each category on a quality scale from 0 to 100, then calculate its weighted contribution.

Content: 30%
ATS: 25%
Format: 25%
Grammar: 10%
Completeness: 10%

Returned category scores must be weighted contributions:
contentScore = contentQuality * 0.30
atsScore = atsQuality * 0.25
formatScore = formatQuality * 0.25
grammarScore = grammarQuality * 0.10
completenessScore = completenessQuality * 0.10

Maximum category scores:
contentScore = 30
atsScore = 25
formatScore = 25
grammarScore = 10
completenessScore = 10

overallScore must equal the sum of the five category scores.
Do not independently choose the overallScore.

CONTENT QUALITY:
Evaluate professional summary, skills, projects, experience, education, responsibilities, technology stack, achievements, chronology, and measurable impact.

ATS QUALITY:
Evaluate standard section headings, keyword relevance, contact details, links, readability, tables, columns, icons, special characters, headers, footers, text extraction, and organization.
Penalize only actual ATS problems supported by evidence.

FORMAT QUALITY:
Evaluate page count, font consistency, font size, spacing, alignment, margins, hierarchy, bullets, white space, page balance, and readability.
A two-page student resume is not automatically a formatting error. Recommend one page only when content can be condensed without harming readability.

GRAMMAR QUALITY:
Evaluate grammar, spelling, sentence structure, verb tense, professional wording, and consistency.
If there are no meaningful grammar problems, give a high score.

COMPLETENESS QUALITY:
Check name, email, phone, location, LinkedIn, GitHub, summary, skills, projects, experience, education, dates, technologies, and achievements.
Do not penalize genuinely unnecessary information.

SECTION ANALYSIS:
Give each section a quality score from 0 to 100:
- Professional Summary
- Skills
- Projects
- Experience
- Education

Each feedback message should explain what is good and what can be improved.

IMPORTANT ANALYSIS RULES:
- Never invent information or achievements.
- Never assume dates are wrong.
- Never assume short internships are invalid.
- Do not penalize students simply for limited professional experience.
- Give practical suggestions.
- Distinguish critical issues from minor improvements.
- Do not repeat the same issue across every category.
- Keep scores consistent with the feedback.
- Do not claim a formatting or ATS issue without reasonable evidence.

Return ONLY valid JSON without markdown or explanations.
Use exactly this structure:
{
    "overallScore": 0,
    "contentScore": 0,
    "atsScore": 0,
    "formatScore": 0,
    "grammarScore": 0,
    "completenessScore": 0,
    "sectionAnalysis": {
        "professionalSummary": {"score": 0, "feedback": ""},
        "skills": {"score": 0, "feedback": ""},
        "projects": {"score": 0, "feedback": ""},
        "experience": {"score": 0, "feedback": ""},
        "education": {"score": 0, "feedback": ""}
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

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        let result = (response.text || "").trim();

        result = result
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        const analysis = JSON.parse(result);

        // Validate and clamp weighted scores.
        const clampScore = (value, maximum) =>
            Math.min(Math.max(Number(value) || 0, 0), maximum);

        analysis.contentScore = clampScore(analysis.contentScore, 30);
        analysis.atsScore = clampScore(analysis.atsScore, 25);
        analysis.formatScore = clampScore(analysis.formatScore, 25);
        analysis.grammarScore = clampScore(analysis.grammarScore, 10);
        analysis.completenessScore = clampScore(
            analysis.completenessScore,
            10
        );

        analysis.overallScore = Math.round(
            analysis.contentScore +
            analysis.atsScore +
            analysis.formatScore +
            analysis.grammarScore +
            analysis.completenessScore
        );

        if (!analysis.sectionAnalysis) {
            analysis.sectionAnalysis = {};
        }

        return analysis;
    } catch (error) {
        console.error("Resume Analysis Error:", error);
        throw error;
    }
}

// ==========================================
// Match Candidate with Job Description
// ==========================================
async function matchCandidateWithJob(resumeData, jobDescription) {
    try {
        const prompt = `
You are an expert AI Technical Recruiter. Compare the candidate's qualifications and skills against the job description.

JOB DESCRIPTION:
${jobDescription}

CANDIDATE RESUME ANALYSIS SUMMARY:
Overall Resume Score: ${resumeData.overallScore}/100
Strengths: ${JSON.stringify(resumeData.strengths)}
Completeness Score: ${resumeData.completenessScore}/100
ATS Score: ${resumeData.atsScore}/100
Detailed Section Evaluations:
${JSON.stringify(resumeData.sectionAnalysis)}

EVALUATION RULES:
1. Compare candidate strengths, skills, and section evaluations against the job description.
2. Determine an overall match percentage from 0 to 100.
3. List 2 to 4 key matches.
4. List missing skills or gaps supported by the available information.
5. Provide a short, constructive recruiting verdict.

Return ONLY valid JSON without markdown:
{
  "matchPercentage": 85,
  "keyMatches": ["Strong React expertise", "Experience with Node.js REST APIs"],
  "missingSkills": ["AWS deployment", "GraphQL experience"],
  "verdict": "Candidate alignment summary."
}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        const rawText = (response.text || "").trim();
        const cleanedText = rawText
            .replace(/^```json\s*/i, "")
            .replace(/```$/, "")
            .trim();

        try {
            const result = JSON.parse(cleanedText);

            return {
                matchPercentage: Math.max(
                    0,
                    Math.min(100, Number(result.matchPercentage) || 0)
                ),
                keyMatches: Array.isArray(result.keyMatches)
                    ? result.keyMatches
                    : [],
                missingSkills: Array.isArray(result.missingSkills)
                    ? result.missingSkills
                    : [],
                verdict: result.verdict || "Review the candidate profile manually."
            };
        } catch (parseError) {
            console.error("JSON parsing failed for job matching:", parseError);

            return {
                matchPercentage: 50,
                keyMatches: ["Technical matching performed"],
                missingSkills: [],
                verdict: "AI matching completed. Review candidate profile details manually."
            };
        }
    } catch (error) {
        console.error("AI Matching Error:", error);
        throw error;
    }
}

// ==========================================
// Fallback Question Bank
// ==========================================
const FALLBACK_QUESTIONS = {
    "Web Developer": {
        Technical: [
            "Explain the difference between CSS Grid and Flexbox, and when you would choose one over the other.",
            "How does the browser event loop handle microtasks versus macrotasks in JavaScript?",
            "What strategies can you use to optimize the initial page load time of a web application?",
            "Explain RESTful APIs and how HTTP status codes should be used.",
            "How do WebSockets differ from HTTP long-polling?",
            "What is the difference between frontend and backend development?",
            "How do you make a website responsive?",
            "What is the purpose of React components?",
            "How does a browser communicate with a web server?",
            "What is the purpose of client-side form validation?"
        ],
        HR: [
            "Tell me about a challenging bug you encountered and how you solved it.",
            "How do you prioritize accessibility and responsive design under tight deadlines?",
            "Describe a time you collaborated with people who had conflicting requirements."
        ]
    },
    "Python Developer": {
        Technical: [
            "What are Python's main data types, and when would you use a list instead of a tuple?",
            "Explain the difference between a shallow copy and a deep copy in Python.",
            "What are Python decorators, and where might you use them?",
            "How do generators and the yield keyword help process large datasets?",
            "How would you connect a Python application to a database?",
            "What is the difference between a list and a dictionary in Python?",
            "Explain the purpose of functions in Python.",
            "What is exception handling, and how do try and except work?",
            "What is the difference between == and is in Python?",
            "How do you read a file in Python?"
        ],
        HR: [
            "Describe a project where you improved code quality or maintainability.",
            "How do you keep up with Python ecosystem updates and best practices?",
            "Tell me about a time you received constructive code review feedback."
        ]
    },
    "Software Developer": {
        Technical: [
            "Explain the core principles of object-oriented programming.",
            "What are the differences between relational and non-relational databases?",
            "How can caching improve application performance?",
            "Explain the difference between monolithic and microservices architectures.",
            "How do you ensure data integrity in an application?",
            "What is the difference between a compiler and an interpreter?",
            "What are data structures, and why are they important?",
            "Explain the difference between a process and a thread.",
            "What is an API, and why do applications use APIs?",
            "How do you approach debugging a software application?"
        ],
        HR: [
            "Tell me about a project that did not go according to plan and how you adapted.",
            "How do you approach learning a new programming language or framework?",
            "Give an example of how you resolved a technical disagreement."
        ]
    }
};

const GENERIC_TECHNICAL = [
    "Explain how database indexing works and how it affects read and write performance.",
    "Describe the lifecycle of an HTTP request from entering a URL to rendering a page.",
    "What is the difference between synchronous and asynchronous execution?",
    "How do you write effective unit tests?",
    "How does JWT authentication work, and how should tokens be protected?"
];

const GENERIC_HR = [
    "Describe a challenging project you worked on and your contribution.",
    "How do you handle working under tight deadlines?",
    "Tell me about a mistake you made on a project and what you learned.",
    "Where do you see yourself professionally in the next three to five years?",
    "How do you respond to constructive feedback?"
];

function getFallbackQuestions(
    category = "Mixed",
    jobRole = "Software Developer",
    count = 5
) {
    const normalizedRole = String(jobRole).toLowerCase();

    const roleKey = Object.keys(FALLBACK_QUESTIONS).find(key =>
        normalizedRole.includes(key.toLowerCase())
    ) || "Software Developer";

    const roleData = FALLBACK_QUESTIONS[roleKey];

    const techPool = [
        ...(roleData.Technical || []),
        ...GENERIC_TECHNICAL
    ];

    const hrPool = [
        ...(roleData.HR || []),
        ...GENERIC_HR
    ];

    const result = [];
    let techIndex = 0;
    let hrIndex = 0;

    for (let i = 0; i < count; i++) {
        let question;

        if (category === "HR") {
            question = {
                category: "HR",
                question: hrPool[hrIndex % hrPool.length]
            };
            hrIndex++;
        } else if (category === "Technical") {
            question = {
                category: "Technical",
                question: techPool[techIndex % techPool.length]
            };
            techIndex++;
        } else if (i % 2 === 0) {
            question = {
                category: "Technical",
                question: techPool[techIndex % techPool.length]
            };
            techIndex++;
        } else {
            question = {
                category: "HR",
                question: hrPool[hrIndex % hrPool.length]
            };
            hrIndex++;
        }

        result.push({
            id: i + 1,
            ...question
        });
    }

    return result;
}

// ==========================================
// Generate Interview Questions using Gemini
// First question is ALWAYS self-introduction
// ==========================================
async function generateInterviewQuestions({
    category = "Mixed",
    jobRole = "Software Developer",
    difficulty = "Intermediate",
    count = 5,
    resumeContext = null
}) {
    const qCount = Math.max(
        1,
        Math.min(parseInt(count, 10) || 5, 10)
    );

    const introductionQuestion = {
        id: 1,
        category: "HR",
        question: "Tell me about yourself and your background."
    };

    if (qCount === 1) {
        return [introductionQuestion];
    }

    const remainingCount = qCount - 1;

    try {
        const resumeSection = resumeContext
            ? `
CANDIDATE'S VERIFIED RESUME CONTEXT:
- Key Skills: ${resumeContext.skillsFeedback || (resumeContext.strengths && resumeContext.strengths.join(", ")) || "Standard profile"}
- Projects & Experience: ${resumeContext.projectsFeedback || "Standard profile"}
Please personalize at least 1-2 of the remaining questions around these actual skills or project experiences.
`
            : "";

        const prompt = `
You are an expert, encouraging technical recruiter and hiring manager conducting an interactive AI mock interview for the position "${jobRole}".

Difficulty: "${difficulty}".
Selected category: "${category}".
${resumeSection}

Generate exactly ${remainingCount} ADDITIONAL questions.
The first question has already been set to:
"Tell me about yourself and your background."

Do not generate another self-introduction question.

Rules:
1. For HR, all additional questions must be behavioral, situational,
   teamwork, communication, or career-oriented questions.
2. For Technical, all additional questions must focus on technical
   concepts and skills relevant to "${jobRole}".
3. For Mixed, alternate between technical and HR questions.
4. Beginner: fundamentals and basic concepts.
5. Intermediate: practical problem-solving and debugging.
6. Advanced: complex problem-solving, architecture, and trade-offs.
7. Keep questions clear, concise, and realistic.
8. Return exactly ${remainingCount} questions.

Return ONLY valid JSON in this format:
{
  "questions": [
    {
      "id": 1,
      "category": "Technical",
      "question": "Your question here"
    }
  ]
}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        const rawText = (response.text || "").trim();
        const cleanedText = rawText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        try {
            const parsed = JSON.parse(cleanedText);

            if (Array.isArray(parsed.questions)) {
                const additionalQuestions = parsed.questions
                    .filter(q =>
                        q &&
                        typeof q.question === "string" &&
                        q.question.trim()
                    )
                    .slice(0, remainingCount)
                    .map((q, index) => {
                        let questionCategory = q.category;

                        if (category === "Technical") {
                            questionCategory = "Technical";
                        } else if (category === "HR") {
                            questionCategory = "HR";
                        } else if (
                            !["Technical", "HR"].includes(questionCategory)
                        ) {
                            questionCategory = index % 2 === 0
                                ? "Technical"
                                : "HR";
                        }

                        return {
                            id: index + 2,
                            category: questionCategory,
                            question: q.question.trim()
                        };
                    });

                if (additionalQuestions.length === remainingCount) {
                    return [
                        introductionQuestion,
                        ...additionalQuestions
                    ];
                }

                console.warn(
                    "Gemini returned an unexpected question count. Using fallback questions."
                );
            }
        } catch (jsonError) {
            console.warn(
                "Gemini question JSON parsing failed. Using fallback questions:",
                jsonError.message
            );
        }
    } catch (error) {
        console.error(
            "Gemini question generation failed. Using fallback questions:",
            error.message
        );
    }

    // Fallback also guarantees the introduction is question 1.
    const fallbackQuestions = getFallbackQuestions(
        category,
        jobRole,
        remainingCount
    ).map((question, index) => ({
        ...question,
        id: index + 2
    }));

    return [
        introductionQuestion,
        ...fallbackQuestions
    ];
}

// ==========================================
// Evaluate Candidate Answer using Gemini
// Returns score, conversational spokenFeedback, and detailed tips
// ==========================================
async function evaluateInterviewAnswer({
    questionText,
    candidateAnswer = "",
    jobRole = "Software Developer",
    difficulty = "Intermediate",
    category = "Technical"
}) {
    const trimmed = (candidateAnswer || "").trim();

    if (!trimmed || trimmed.length < 5) {
        return {
            score: 0,
            spokenFeedback: "I didn't quite catch a substantive answer to that question. Make sure to express your thoughts or approach, even if you are unsure.",
            strengths: [],
            weaknesses: [
                "No substantive answer provided to the interview question."
            ],
            suggestions: [
                "Attempt an answer by breaking the problem down or explaining your initial thoughts.",
                "Use the STAR method for behavioral questions, or define the core concept first for technical questions."
            ],
            modelAnswer: `For this question (${questionText}), a strong answer would define the primary concept, provide a practical example, and explain relevant considerations.`
        };
    }

    try {
        const prompt = `
You are an expert, encouraging senior interviewer conducting a realistic voice interview for a "${jobRole}" position.
Difficulty: "${difficulty}"
Category: "${category}"

QUESTION:
${questionText}

CANDIDATE'S SPOKEN/WRITTEN ANSWER:
${trimmed}

Evaluate the response objectively. Also provide a natural, conversational 1-2 sentence "spokenFeedback" response that an interviewer would say aloud in a real voice call (e.g., "Thank you for explaining that. You gave a clear summary of your background and technical stack. Let's move on to our next question.").

Return ONLY valid JSON without markdown fences:
{
  "score": 82,
  "spokenFeedback": "Thank you for that response. You articulated the core concept clearly with a solid real-world example.",
  "strengths": ["Clear definition of the concept", "Good practical example"],
  "weaknesses": ["Could mention performance trade-offs"],
  "suggestions": ["Structure with concrete outcomes"],
  "modelAnswer": "An example of a high-scoring answer."
}
`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });

        const rawText = (response.text || "").trim();
        const cleanedText = rawText
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        try {
            const parsed = JSON.parse(cleanedText);

            const parsedScore = Number(parsed.score);
            const score = Number.isFinite(parsedScore)
                ? Math.max(0, Math.min(100, Math.round(parsedScore)))
                : 65;

            return {
                score,
                spokenFeedback: parsed.spokenFeedback || (score >= 75 ? "Thank you, that was a clear and well-structured answer. Let's move to the next question." : "Thank you for explaining your perspective. Let's proceed to the next question."),
                strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0
                    ? parsed.strengths
                    : ["Addressed the question constructively"],
                weaknesses: Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0
                    ? parsed.weaknesses
                    : ["Could provide deeper technical detail and metrics"],
                suggestions: Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0
                    ? parsed.suggestions
                    : ["Practice using concrete examples and the STAR method"],
                modelAnswer: parsed.modelAnswer ||
                    "Define the core concept and provide a practical example."
            };
        } catch (jsonError) {
            console.warn(
                "Answer evaluation JSON parsing failed:",
                jsonError.message
            );
        }

        return {
            score: 70,
            spokenFeedback: "Thank you for that answer. Let's proceed to the next question.",
            strengths: [
                "Candidate provided a response addressing the topic."
            ],
            weaknesses: [
                "Answer could include more structured detail."
            ],
            suggestions: [
                "Structure behavioral answers using Situation, Task, Action, and Result."
            ],
            modelAnswer: `A comprehensive answer to "${questionText}" should explain the key concept and include practical examples.`
        };
    } catch (error) {
        console.error("Gemini answer evaluation error:", error.message);

        return {
            score: 65,
            spokenFeedback: "Thank you. Let's move on to our next question.",
            strengths: [
                "A response was provided for evaluation."
            ],
            weaknesses: [
                "The AI evaluation service encountered a temporary network delay."
            ],
            suggestions: [
                "Review the relevant concepts for this role."
            ],
            modelAnswer: `For "${questionText}", explain the key concept clearly and support it with a practical example.`
        };
    }
}

// ==========================================
// Export Functions
// ==========================================
module.exports = {
    testGemini,
    analyzeResume,
    matchCandidateWithJob,
    generateInterviewQuestions,
    evaluateInterviewAnswer
};
