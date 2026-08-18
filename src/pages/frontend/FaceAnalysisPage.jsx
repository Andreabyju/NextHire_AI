import React, { useEffect, useRef, useState } from "react";

function FaceAnalysisPage() {
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    const [cameraActive, setCameraActive] = useState(false);
    const [analysisStarted, setAnalysisStarted] = useState(false);
    const [error, setError] = useState("");

    // Start camera
    const startCamera = async () => {
        try {
            setError("");

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: "user",
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }

            setCameraActive(true);
        } catch (err) {
            console.error("Camera error:", err);

            setError(
                "Unable to access your camera. Please allow camera permission and try again."
            );
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }

        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }

        setCameraActive(false);
        setAnalysisStarted(false);
    };

    // Start AI analysis
    const startAnalysis = () => {
        if (!cameraActive) {
            setError("Please start the camera first.");
            return;
        }

        setError("");
        setAnalysisStarted(true);
    };

    // Stop analysis
    const stopAnalysis = () => {
        setAnalysisStarted(false);
    };

    // Cleanup when leaving the page
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());
            }
        };
    }, []);

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#0b1020",
                color: "white",
                padding: "40px",
                fontFamily: "Arial, sans-serif",
            }}
        >
            {/* Header */}
            <div
                style={{
                    maxWidth: "1100px",
                    margin: "0 auto 30px",
                }}
            >
                <h1
                    style={{
                        fontSize: "32px",
                        marginBottom: "10px",
                    }}
                >
                    AI Face Analysis
                </h1>

                <p
                    style={{
                        color: "#aeb7cc",
                        fontSize: "16px",
                    }}
                >
                    Analyze your facial expressions, eye contact, head
                    position and interview presence using AI.
                </p>
            </div>

            {/* Main Content */}
            <div
                style={{
                    maxWidth: "1100px",
                    margin: "0 auto",
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr",
                    gap: "25px",
                }}
            >
                {/* Camera Section */}
                <div
                    style={{
                        background: "#151c30",
                        borderRadius: "16px",
                        padding: "20px",
                        border: "1px solid #28324d",
                    }}
                >
                    <div
                        style={{
                            position: "relative",
                            width: "100%",
                            aspectRatio: "16 / 9",
                            background: "#050811",
                            borderRadius: "12px",
                            overflow: "hidden",
                        }}
                    >
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                transform: "scaleX(-1)",
                            }}
                        />

                        {!cameraActive && (
                            <div
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexDirection: "column",
                                    color: "#8993aa",
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: "50px",
                                        marginBottom: "15px",
                                    }}
                                >
                                    📷
                                </div>

                                <p>
                                    Camera preview will appear here
                                </p>
                            </div>
                        )}

                        {analysisStarted && (
                            <div
                                style={{
                                    position: "absolute",
                                    top: "15px",
                                    left: "15px",
                                    background: "#16a34a",
                                    padding: "8px 14px",
                                    borderRadius: "20px",
                                    fontSize: "13px",
                                    fontWeight: "bold",
                                }}
                            >
                                ● AI ANALYSIS ACTIVE
                            </div>
                        )}
                    </div>

                    {/* Buttons */}
                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            marginTop: "20px",
                        }}
                    >
                        {!cameraActive ? (
                            <button
                                onClick={startCamera}
                                style={{
                                    flex: 1,
                                    padding: "13px",
                                    border: "none",
                                    borderRadius: "8px",
                                    background: "#2563eb",
                                    color: "white",
                                    fontSize: "15px",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                }}
                            >
                                Start Camera
                            </button>
                        ) : (
                            <button
                                onClick={stopCamera}
                                style={{
                                    flex: 1,
                                    padding: "13px",
                                    border: "none",
                                    borderRadius: "8px",
                                    background: "#dc2626",
                                    color: "white",
                                    fontSize: "15px",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                }}
                            >
                                Stop Camera
                            </button>
                        )}

                        {!analysisStarted ? (
                            <button
                                onClick={startAnalysis}
                                disabled={!cameraActive}
                                style={{
                                    flex: 1,
                                    padding: "13px",
                                    border: "none",
                                    borderRadius: "8px",
                                    background: cameraActive
                                        ? "#7c3aed"
                                        : "#343b4d",
                                    color: "white",
                                    fontSize: "15px",
                                    fontWeight: "bold",
                                    cursor: cameraActive
                                        ? "pointer"
                                        : "not-allowed",
                                }}
                            >
                                Start AI Analysis
                            </button>
                        ) : (
                            <button
                                onClick={stopAnalysis}
                                style={{
                                    flex: 1,
                                    padding: "13px",
                                    border: "none",
                                    borderRadius: "8px",
                                    background: "#f59e0b",
                                    color: "white",
                                    fontSize: "15px",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                }}
                            >
                                Stop Analysis
                            </button>
                        )}
                    </div>

                    {error && (
                        <p
                            style={{
                                color: "#f87171",
                                marginTop: "15px",
                                fontSize: "14px",
                            }}
                        >
                            {error}
                        </p>
                    )}
                </div>

                {/* Analysis Results */}
                <div
                    style={{
                        background: "#151c30",
                        borderRadius: "16px",
                        padding: "25px",
                        border: "1px solid #28324d",
                    }}
                >
                    <h2
                        style={{
                            marginTop: 0,
                            fontSize: "21px",
                        }}
                    >
                        Analysis Results
                    </h2>

                    <p
                        style={{
                            color: "#8993aa",
                            fontSize: "14px",
                            marginBottom: "25px",
                        }}
                    >
                        Your AI interview performance will appear here.
                    </p>

                    {/* Metrics */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "15px",
                        }}
                    >
                        <Metric
                            title="Eye Contact"
                            value="--"
                        />

                        <Metric
                            title="Head Position"
                            value="--"
                        />

                        <Metric
                            title="Facial Engagement"
                            value="--"
                        />

                        <Metric
                            title="Confidence"
                            value="--"
                        />
                    </div>

                    {/* Overall Score */}
                    <div
                        style={{
                            marginTop: "25px",
                            padding: "20px",
                            background: "#0d1324",
                            borderRadius: "12px",
                            textAlign: "center",
                        }}
                    >
                        <p
                            style={{
                                color: "#8993aa",
                                margin: 0,
                            }}
                        >
                            Overall Face Analysis Score
                        </p>

                        <div
                            style={{
                                fontSize: "42px",
                                fontWeight: "bold",
                                marginTop: "8px",
                            }}
                        >
                            --
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Metric({ title, value }) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px",
                background: "#0d1324",
                borderRadius: "10px",
            }}
        >
            <span
                style={{
                    color: "#c4ccdd",
                    fontSize: "14px",
                }}
            >
                {title}
            </span>

            <span
                style={{
                    fontWeight: "bold",
                    fontSize: "15px",
                }}
            >
                {value}
            </span>
        </div>
    );
}

export default FaceAnalysisPage;