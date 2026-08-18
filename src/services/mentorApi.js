import { fetchWithAuth } from "./api";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

// ==========================================
// MENTOR API
// ==========================================

export const mentorApi = {
  // ========================================
  // MENTOR LOGIN
  // POST /api/mentor/login
  // ========================================

  login: async (credentials) => {
    const email =
      credentials?.email?.trim() || "";

    const password =
      credentials?.password || "";

    const response = await fetch(
      `${API_URL}/mentor/login`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

    const data = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
        data.message ||
        `Login failed with status ${response.status}`
      );
    }

    return data;
  },

  // ========================================
  // MENTOR REGISTRATION
  // POST /api/mentor/register
  // ========================================

  register: async (data) => {
    const response = await fetch(
      `${API_URL}/mentor/register`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(data),
      }
    );

    const responseData = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        responseData.error ||
        responseData.message ||
        `Registration failed with status ${response.status}`
      );
    }

    return responseData;
  },

  // ========================================
  // GET MENTOR PROFILE
  // GET /api/mentor/profile
  // ========================================

  getProfile: () =>
    fetchWithAuth("/mentor/profile"),

  // ========================================
  // GET MENTOR ACCESS STATUS
  // GET /api/mentor/access
  // ========================================

  getAccessStatus: () =>
    fetchWithAuth("/mentor/access"),

  // ========================================
  // GET CANDIDATES
  // GET /api/mentor/candidates
  // ========================================

  getCandidates: () =>
    fetchWithAuth("/mentor/candidates"),

  // ========================================
  // GET SINGLE CANDIDATE
  // GET /api/mentor/candidates/:id
  // ========================================

  getCandidateById: (id) =>
    fetchWithAuth(
      `/mentor/candidates/${id}`
    ),

  // ========================================
  // GET SUBSCRIPTION
  // GET /api/mentor/subscription
  // ========================================

  getSubscription: () =>
    fetchWithAuth(
      "/mentor/subscription"
    ),

  // ========================================
  // CREATE RAZORPAY ORDER
  // POST /api/mentor/subscription/create-order
  // ========================================

  createSubscriptionOrder: async (plan) => {
    return fetchWithAuth(
      "/mentor/subscription/create-order",
      {
        method: "POST",

        body: JSON.stringify({
          plan,
        }),
      }
    );
  },

  // ========================================
  // VERIFY RAZORPAY PAYMENT
  // POST /api/mentor/subscription/verify-payment
  // ========================================

  verifySubscriptionPayment: async (
    paymentData
  ) => {
    return fetchWithAuth(
      "/mentor/subscription/verify-payment",
      {
        method: "POST",

        body: JSON.stringify(
          paymentData
        ),
      }
    );
  },

  // ========================================
  // JOBS DESCRIPTIONS CRUD & MATCHING
  // ========================================

  getJobs: () =>
    fetchWithAuth("/mentor/jobs"),

  createJob: (jobData) =>
    fetchWithAuth("/mentor/jobs", {
      method: "POST",
      body: JSON.stringify(jobData),
    }),

  deleteJob: (id) =>
    fetchWithAuth(`/mentor/jobs/${id}`, {
      method: "DELETE",
    }),

  matchCandidate: (candidateId, matchData) =>
    fetchWithAuth(`/mentor/candidates/${candidateId}/match`, {
      method: "POST",
      body: JSON.stringify(matchData),
    }),

  // ========================================
  // CANDIDATE SHORTLISTS
  // ========================================

  getShortlistedCandidates: () =>
    fetchWithAuth("/mentor/shortlists"),

  shortlistCandidate: (candidateId, notes = "") =>
    fetchWithAuth(`/mentor/shortlists/${candidateId}`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    }),

  removeFromShortlist: (candidateId) =>
    fetchWithAuth(`/mentor/shortlists/${candidateId}`, {
      method: "DELETE",
    }),

  // ========================================
  // CANDIDATE INVITATIONS (Offline API Stubs)
  // ========================================

  sendCandidateInvitation: (data) =>
    fetchWithAuth("/mentor/invitations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getInvitations: () =>
    fetchWithAuth("/mentor/invitations"),
};