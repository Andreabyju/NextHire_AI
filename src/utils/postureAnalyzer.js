import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";

let poseLandmarkerInstance = null;
let isLoadingLandmarker = false;

/**
 * Initializes and caches the MediaPipe PoseLandmarker instance.
 * Uses the lightweight float16 model for fast, local in-browser inference.
 */
export async function initPoseLandmarker() {
  if (poseLandmarkerInstance) return poseLandmarkerInstance;
  if (isLoadingLandmarker) {
    // Wait until loading finishes
    while (isLoadingLandmarker) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return poseLandmarkerInstance;
  }

  isLoadingLandmarker = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
        delegate: "GPU",
      },
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    return poseLandmarkerInstance;
  } catch (error) {
    console.warn("MediaPipe GPU initialization failed, attempting CPU fallback:", error);
    try {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });
      return poseLandmarkerInstance;
    } catch (cpuError) {
      console.error("MediaPipe PoseLandmarker could not be initialized:", cpuError);
      return null;
    }
  } finally {
    isLoadingLandmarker = false;
  }
}

/**
 * Analyzes posture from a single video frame.
 * Returns geometric indicators, posture score (0-100), status, and actionable cue.
 */
export function analyzePostureFrame(landmarker, videoElement, timestamp = performance.now()) {
  if (!landmarker || !videoElement || videoElement.readyState < 2) {
    return {
      ready: false,
      score: 85,
      status: "idle",
      feedback: "Initializing camera and posture engine...",
      issues: [],
    };
  }

  try {
    const result = landmarker.detectForVideo(videoElement, timestamp);

    if (!result || !result.landmarks || result.landmarks.length === 0) {
      return {
        ready: true,
        detected: false,
        score: 50,
        status: "warning",
        feedback: "Please position yourself in front of the camera.",
        issues: ["no_person_detected"],
      };
    }

    const landmarks = result.landmarks[0];

    // Relevant MediaPipe landmarks:
    // 0: nose, 7: left_ear, 8: right_ear, 11: left_shoulder, 12: right_shoulder
    const nose = landmarks[0];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];

    // Check visibility / presence
    const shouldersVisible =
      leftShoulder &&
      rightShoulder &&
      (leftShoulder.visibility === undefined || leftShoulder.visibility > 0.4) &&
      (rightShoulder.visibility === undefined || rightShoulder.visibility > 0.4);

    if (!shouldersVisible || !nose) {
      return {
        ready: true,
        detected: false,
        score: 55,
        status: "warning",
        feedback: "Please adjust camera so your head and both shoulders are visible.",
        issues: ["shoulders_not_visible"],
      };
    }

    let score = 100;
    const issues = [];
    const cues = [];

    // 1. Horizontal Centering
    const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2;
    if (midShoulderX < 0.32) {
      score -= 15;
      issues.push("leaning_left");
      cues.push("Center yourself in the camera frame");
    } else if (midShoulderX > 0.68) {
      score -= 15;
      issues.push("leaning_right");
      cues.push("Center yourself in the camera frame");
    }

    // 2. Shoulder Level / Alignment (Tilt)
    const shoulderDeltaY = Math.abs(leftShoulder.y - rightShoulder.y);
    if (shoulderDeltaY > 0.075) {
      score -= 20;
      issues.push("uneven_shoulders");
      cues.push("Level your shoulders and sit upright");
    } else if (shoulderDeltaY > 0.045) {
      score -= 10;
    }

    // 3. Head Tilt (Ear alignment)
    if (leftEar && rightEar) {
      const earDeltaY = Math.abs(leftEar.y - rightEar.y);
      if (earDeltaY > 0.065) {
        score -= 15;
        issues.push("head_tilt");
        cues.push("Keep your head upright");
      }
    }

    // 4. Distance / Framing
    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    if (shoulderWidth < 0.16) {
      score -= 12;
      issues.push("too_far");
      cues.push("Move slightly closer to the camera");
    } else if (shoulderWidth > 0.72) {
      score -= 12;
      issues.push("too_close");
      cues.push("Move slightly further back");
    }

    // 5. Forward Slouch / Hunching
    const avgShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
    const headToShoulderDist = avgShoulderY - nose.y;
    if (headToShoulderDist < 0.11) {
      score -= 18;
      issues.push("slouching");
      cues.push("Avoid hunching forward; sit tall");
    }

    // Clamp score
    const finalScore = Math.max(20, Math.min(100, Math.round(score)));

    let status = "good";
    let feedback = "Good posture. Keep your shoulders relaxed and aligned.";

    if (finalScore < 65) {
      status = "warning";
      feedback = cues.length > 0 ? cues[0] : "Adjust your seating position to sit comfortably upright.";
    } else if (finalScore < 82) {
      status = "fair";
      feedback = cues.length > 0 ? cues[0] : "Posture is fair. Stay upright and focused on the screen.";
    }

    return {
      ready: true,
      detected: true,
      score: finalScore,
      status,
      feedback,
      issues,
      metrics: {
        shoulderSlope: parseFloat(shoulderDeltaY.toFixed(3)),
        centering: parseFloat(midShoulderX.toFixed(2)),
        distance: parseFloat(shoulderWidth.toFixed(2)),
      },
    };
  } catch (error) {
    console.error("Frame posture analysis error:", error);
    return {
      ready: true,
      detected: false,
      score: 75,
      status: "fair",
      feedback: "Monitoring posture...",
      issues: [],
    };
  }
}

/**
 * Creates an aggregator session to summarize posture over an entire interview.
 */
export function createPostureSession() {
  const samples = [];
  const issueCounts = {
    leaning: 0,
    head_tilt: 0,
    uneven_shoulders: 0,
    framing: 0,
    slouching: 0,
  };

  return {
    recordFrame(analysis) {
      if (!analysis || !analysis.detected) return;

      samples.push(analysis.score);

      (analysis.issues || []).forEach((issue) => {
        if (issue === "leaning_left" || issue === "leaning_right") issueCounts.leaning++;
        if (issue === "head_tilt") issueCounts.head_tilt++;
        if (issue === "uneven_shoulders") issueCounts.uneven_shoulders++;
        if (issue === "too_far" || issue === "too_close") issueCounts.framing++;
        if (issue === "slouching") issueCounts.slouching++;
      });
    },

    getSummary() {
      if (samples.length === 0) {
        return {
          averagePostureScore: null,
          postureSummary: {
            stabilityRating: "Insufficient Camera Data",
            headTiltIssuesCount: 0,
            leaningIssuesCount: 0,
            framingIssuesCount: 0,
            goodPosturePercentage: 100,
            feedback: [
              "Camera was inactive or candidate was not visible during the session.",
            ],
          },
        };
      }

      const total = samples.reduce((acc, s) => acc + s, 0);
      const avg = Math.round(total / samples.length);
      const goodCount = samples.filter((s) => s >= 75).length;
      const goodPercentage = Math.round((goodCount / samples.length) * 100);

      const feedback = [];
      if (issueCounts.uneven_shoulders > 5 || issueCounts.leaning > 5) {
        feedback.push("Noticeable tendency to lean sideways or tilt shoulders.");
      }
      if (issueCounts.slouching > 5) {
        feedback.push("Occasional forward slouching detected — remember to keep your back straight.");
      }
      if (issueCounts.head_tilt > 5) {
        feedback.push("Frequent head tilt detected; aim to keep your eye line level with the webcam.");
      }
      if (issueCounts.framing > 5) {
        feedback.push("Check camera distance to ensure consistent head-and-shoulders framing.");
      }
      if (feedback.length === 0) {
        feedback.push("Excellent posture throughout the interview. Maintained professional upright alignment.");
      }

      let stabilityRating = "Good";
      if (avg < 65) stabilityRating = "Needs Improvement";
      else if (avg < 80) stabilityRating = "Fair";

      return {
        averagePostureScore: avg,
        postureSummary: {
          stabilityRating,
          headTiltIssuesCount: issueCounts.head_tilt,
          leaningIssuesCount: issueCounts.leaning + issueCounts.uneven_shoulders,
          framingIssuesCount: issueCounts.framing,
          goodPosturePercentage: goodPercentage,
          feedback,
        },
      };
    },
  };
}
