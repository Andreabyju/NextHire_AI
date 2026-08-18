const User = require("../models/User");
const Mentor = require("../models/Mentor");
const Activity = require("../models/Activity");
const ResumeAnalysis = require("../models/ResumeAnalysis");

// ==========================================
// HELPER — LOG ACTIVITY
// ==========================================

const logActivity = async (
  userId,
  activityType,
  description,
  metadata = {}
) => {
  try {
    await Activity.create({
      userId,
      activityType,
      description,
      metadata,
    });
  } catch (err) {
    console.error(
      "Activity log error:",
      err.message
    );
  }
};

// ==========================================
// GET ALL USERS
// GET /api/admin/users
// ==========================================

const getUsers = async (req, res) => {
  try {
    const {
      search = "",
      role = "",
      status = "",
      page = 1,
      limit = 20,
    } = req.query;

    const pageNum = Math.max(
      1,
      parseInt(page) || 1
    );

    const limitNum = Math.min(
      100,
      Math.max(
        1,
        parseInt(limit) || 20
      )
    );

    const filter = {};

    if (role && role !== "all") {
      filter.role = role;
    }

    if (status && status !== "all") {
      filter.accountStatus = status;
    }

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const [users, total] =
      await Promise.all([
        User.find(filter)
          .select("-password")
          .sort({ createdAt: -1 })
          .skip(
            (pageNum - 1) *
            limitNum
          )
          .limit(limitNum),

        User.countDocuments(filter),
      ]);

    return res.json({
      total,
      page: pageNum,
      pages: Math.ceil(
        total / limitNum
      ),
      count: users.length,

      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        accountStatus:
          u.accountStatus,
        lastLogin: u.lastLogin,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
    });
  } catch (error) {
    console.error(
      "Admin getUsers error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Server error fetching users",
    });
  }
};

// ==========================================
// GET SINGLE USER
// GET /api/admin/users/:id
// ==========================================

const getUserById = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.params.id
      ).select("-password");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    const activities =
      await Activity.find({
        userId: user._id,
      })
        .sort({
          createdAt: -1,
        })
        .limit(20);

    return res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      accountStatus:
        user.accountStatus,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      recentActivity:
        activities.map(
          (a) => ({
            id: a._id,
            activityType:
              a.activityType,
            description:
              a.description,
            timestamp:
              a.createdAt,
            metadata:
              a.metadata,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Admin getUserById error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Server error fetching user",
    });
  }
};

// ==========================================
// UPDATE USER STATUS
// PATCH /api/admin/users/:id/status
// ==========================================

const updateUserStatus = async (
  req,
  res
) => {
  try {
    const { status } = req.body;

    if (
      ![
        "active",
        "suspended",
      ].includes(status)
    ) {
      return res.status(400).json({
        error:
          "status must be 'active' or 'suspended'",
      });
    }

    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        error:
          "Cannot modify admin account status",
      });
    }

    user.accountStatus = status;

    await user.save();

    await logActivity(
      req.user._id,
      "PROFILE_UPDATED",
      `Admin ${req.user.name} set account status to '${status}' for ${user.email}`,
      {
        targetUserId: user._id,
        targetEmail: user.email,
        newStatus: status,
      }
    );

    return res.json({
      message:
        `User account ${status === "suspended"
          ? "suspended"
          : "activated"
        } successfully`,

      id: user._id,

      accountStatus:
        user.accountStatus,
    });
  } catch (error) {
    console.error(
      "Admin updateUserStatus error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Server error updating user status",
    });
  }
};

// ==========================================
// DELETE USER
// DELETE /api/admin/users/:id
// ==========================================

const deleteUser = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        error:
          "Cannot delete admin accounts",
      });
    }

    await User.deleteOne({
      _id: user._id,
    });

    await Activity.deleteMany({
      userId: user._id,
    });

    return res.json({
      message:
        "User account deleted successfully",
      id: req.params.id,
    });
  } catch (error) {
    console.error(
      "Admin deleteUser error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Server error deleting user",
    });
  }
};

// ==========================================
// GET ACTIVITY
// GET /api/admin/activity
// ==========================================

const getActivity = async (
  req,
  res
) => {
  try {
    const limit = Math.min(
      parseInt(
        req.query.limit
      ) || 50,
      100
    );

    const typeFilter =
      req.query.type
        ? {
          activityType:
            req.query
              .type,
        }
        : {};

    const activities =
      await Activity.find(
        typeFilter
      )
        .sort({
          createdAt: -1,
        })
        .limit(limit)
        .populate(
          "userId",
          "name email role"
        );

    return res.json({
      count:
        activities.length,

      activities:
        activities.map(
          (a) => ({
            id: a._id,
            activityType:
              a.activityType,
            description:
              a.description,
            timestamp:
              a.createdAt,
            metadata:
              a.metadata,

            user: a.userId
              ? {
                id: a
                  .userId
                  ._id,

                name: a
                  .userId
                  .name,

                email: a
                  .userId
                  .email,

                role: a
                  .userId
                  .role,
              }
              : null,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Admin getActivity error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Server error fetching activity",
    });
  }
};

// ==========================================
// GET PLATFORM STATS
// GET /api/admin/stats
// ==========================================

const getStats = async (
  req,
  res
) => {
  try {
    const now = new Date();

    const todayStart =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );

    const weekStart =
      new Date(now);

    weekStart.setDate(
      now.getDate() - 7
    );

    const monthStart =
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      );

    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      newUsersToday,
      newUsersThisWeek,
      newUsersThisMonth,
      totalLogins,
      loginsThisWeek,
      loginsToday,
      recentRegistrations,
      registrationsThisWeek,
      totalResumeAnalyses,
      resumeAnalysesToday,
      resumeAnalysesThisWeek,
      recentResumeUploads,
      avgScoreResult,
      totalMentors,
      pendingMentors,
      approvedMentors,
      rejectedMentors,
      activeSubscriptions,
      inactiveSubscriptions,
      expiredSubscriptions,
      mentorsWithAccess,
    ] = await Promise.all([
      User.countDocuments({
        role: "user",
      }),

      User.countDocuments({
        role: "user",
        accountStatus:
          "active",
      }),

      User.countDocuments({
        role: "user",
        accountStatus:
          "suspended",
      }),

      User.countDocuments({
        role: "user",
        createdAt: {
          $gte: todayStart,
        },
      }),

      User.countDocuments({
        role: "user",
        createdAt: {
          $gte: weekStart,
        },
      }),

      User.countDocuments({
        role: "user",
        createdAt: {
          $gte: monthStart,
        },
      }),

      Activity.countDocuments({
        activityType:
          "USER_LOGIN",
      }),

      Activity.countDocuments({
        activityType:
          "USER_LOGIN",
        createdAt: {
          $gte: weekStart,
        },
      }),

      Activity.countDocuments({
        activityType:
          "USER_LOGIN",
        createdAt: {
          $gte: todayStart,
        },
      }),

      User.find({
        role: "user",
      })
        .select(
          "name email createdAt accountStatus"
        )
        .sort({
          createdAt: -1,
        })
        .limit(5),

      User.aggregate([
        {
          $match: {
            role: "user",
            createdAt: {
              $gte: weekStart,
            },
          },
        },

        {
          $group: {
            _id: {
              $dateToString:
              {
                format:
                  "%Y-%m-%d",
                date: "$createdAt",
              },
            },

            count: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            _id: 1,
          },
        },
      ]),

      ResumeAnalysis.countDocuments(
        {}
      ),

      ResumeAnalysis.countDocuments({
        createdAt: {
          $gte: todayStart,
        },
      }),

      ResumeAnalysis.countDocuments({
        createdAt: {
          $gte: weekStart,
        },
      }),

      ResumeAnalysis.find({})
        .sort({
          createdAt: -1,
        })
        .limit(5)
        .populate(
          "userId",
          "name email"
        )
        .select(
          "originalFileName overallScore fileType createdAt userId"
        ),

      ResumeAnalysis.aggregate([
        {
          $group: {
            _id: null,
            avg: {
              $avg: "$overallScore",
            },
          },
        },
      ]),

      Mentor.countDocuments({}),

      Mentor.countDocuments({
        verificationStatus:
          "pending",
      }),

      Mentor.countDocuments({
        verificationStatus:
          "approved",
      }),

      Mentor.countDocuments({
        verificationStatus:
          "rejected",
      }),

      Mentor.countDocuments({
        "subscription.status":
          "active",
      }),

      Mentor.countDocuments({
        "subscription.status":
          "inactive",
      }),

      Mentor.countDocuments({
        "subscription.status":
          "expired",
      }),

      Mentor.countDocuments({
        candidateAccess: true,
      }),
    ]);

    const avgResumeScore =
      avgScoreResult.length > 0
        ? Math.round(
          avgScoreResult[0]
            .avg
        )
        : 0;

    return res.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended:
          suspendedUsers,
        newToday:
          newUsersToday,
        newThisWeek:
          newUsersThisWeek,
        newThisMonth:
          newUsersThisMonth,
      },

      mentors: {
        total: totalMentors,
        pending:
          pendingMentors,
        approved:
          approvedMentors,
        rejected:
          rejectedMentors,
      },

      subscriptions: {
        active:
          activeSubscriptions,
        inactive:
          inactiveSubscriptions,
        expired:
          expiredSubscriptions,
      },

      candidateAccess: {
        active:
          mentorsWithAccess,
      },

      activity: {
        totalLogins,
        loginsThisWeek,
        loginsToday,
      },

      interviews: {
        total: 0,
        completed: 0,
        avgScore: 0,
      },

      resumes: {
        total:
          totalResumeAnalyses,
        today:
          resumeAnalysesToday,
        thisWeek:
          resumeAnalysesThisWeek,
        avgScore:
          avgResumeScore,
      },

      recentRegistrations:
        recentRegistrations.map(
          (u) => ({
            id: u._id,
            name: u.name,
            email: u.email,
            createdAt:
              u.createdAt,
            accountStatus:
              u.accountStatus,
          })
        ),

      recentResumeUploads:
        recentResumeUploads.map(
          (r) => ({
            id: r._id,
            originalFileName:
              r.originalFileName,
            overallScore:
              r.overallScore,
            fileType:
              r.fileType,
            createdAt:
              r.createdAt,

            user: r.userId
              ? {
                id: r
                  .userId
                  ._id,

                name: r
                  .userId
                  .name,

                email: r
                  .userId
                  .email,
              }
              : null,
          })
        ),

      registrationChart:
        registrationsThisWeek,
    });
  } catch (error) {
    console.error(
      "Admin getStats error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Server error fetching stats",
    });
  }
};

// ==========================================
// GET ALL MENTORS
// GET /api/admin/mentors
// ==========================================

const getMentors = async (
  req,
  res
) => {
  try {
    const mentors =
      await Mentor.find()
        .populate(
          "userId",
          "name email role accountStatus lastLogin createdAt updatedAt"
        )
        .sort({
          createdAt: -1,
        });

    return res.json({
      count:
        mentors.length,

      mentors:
        mentors.map(
          (mentor) => ({
            id: mentor._id,

            userId:
              mentor
                .userId
                ? mentor
                  .userId
                  ._id
                : null,

            mentorName:
              mentor.mentorName,

            companyName:
              mentor.companyName,

            companyEmail:
              mentor.companyEmail,

            phone:
              mentor.phone,

            website:
              mentor.website,

            industry:
              mentor.industry,

            companyDescription:
              mentor.companyDescription,

            location:
              mentor.location,

            companySize:
              mentor.companySize,

            verificationStatus:
              mentor.verificationStatus,

            verifiedAt:
              mentor.verifiedAt,

            verificationNotes:
              mentor.verificationNotes,

            subscription:
              mentor.subscription,

            candidateAccess:
              mentor.candidateAccess,

            candidateViews:
              mentor.candidateViews,

            lastCandidateSearch:
              mentor.lastCandidateSearch,

            createdAt:
              mentor.createdAt,

            updatedAt:
              mentor.updatedAt,

            user: mentor.userId
              ? {
                id: mentor
                  .userId
                  ._id,

                name: mentor
                  .userId
                  .name,

                email:
                  mentor
                    .userId
                    .email,

                role:
                  mentor
                    .userId
                    .role,

                accountStatus:
                  mentor
                    .userId
                    .accountStatus,

                lastLogin:
                  mentor
                    .userId
                    .lastLogin,
              }
              : null,
          })
        ),
    });
  } catch (error) {
    console.error(
      "Admin getMentors error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Server error fetching mentors",
    });
  }
};

// ==========================================
// GET SINGLE MENTOR
// GET /api/admin/mentors/:id
// ==========================================

const getMentorById = async (
  req,
  res
) => {
  try {
    const mentor =
      await Mentor.findById(
        req.params.id
      ).populate(
        "userId",
        "name email role accountStatus lastLogin createdAt updatedAt"
      );

    if (!mentor) {
      return res.status(404).json({
        error: "Mentor not found",
      });
    }

    return res.json({
      id: mentor._id,

      mentorName:
        mentor.mentorName,

      companyName:
        mentor.companyName,

      companyEmail:
        mentor.companyEmail,

      phone: mentor.phone,

      website:
        mentor.website,

      industry:
        mentor.industry,

      companyDescription:
        mentor.companyDescription,

      location:
        mentor.location,

      companySize:
        mentor.companySize,

      verificationStatus:
        mentor.verificationStatus,

      verifiedAt:
        mentor.verifiedAt,

      verificationNotes:
        mentor.verificationNotes,

      subscription:
        mentor.subscription,

      candidateAccess:
        mentor.candidateAccess,

      candidateViews:
        mentor.candidateViews,

      lastCandidateSearch:
        mentor.lastCandidateSearch,

      createdAt:
        mentor.createdAt,

      updatedAt:
        mentor.updatedAt,

      user: mentor.userId
        ? {
          id: mentor
            .userId
            ._id,

          name: mentor
            .userId
            .name,

          email: mentor
            .userId
            .email,

          role: mentor
            .userId
            .role,

          accountStatus:
            mentor.userId
              .accountStatus,

          lastLogin:
            mentor.userId
              .lastLogin,

          createdAt:
            mentor.userId
              .createdAt,
        }
        : null,
    });
  } catch (error) {
    console.error(
      "Admin getMentorById error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Server error fetching mentor",
    });
  }
};

// ==========================================
// APPROVE MENTOR
// PATCH /api/admin/mentors/:id/approve
// ==========================================

const approveMentor = async (
  req,
  res
) => {
  try {
    const mentor =
      await Mentor.findById(
        req.params.id
      );

    if (!mentor) {
      return res.status(404).json({
        error: "Mentor not found",
      });
    }

    const {
      verificationNotes = "Mentor approved by administrator",
    } = req.body || {};

    mentor.verificationStatus =
      "approved";

    mentor.verifiedAt =
      new Date();

    mentor.verificationNotes =
      verificationNotes;

    // Approval alone does NOT
    // unlock candidate access.
    mentor.candidateAccess =
      mentor.subscription?.status ===
      "active";

    await mentor.save();

    await logActivity(
      req.user._id,
      "MENTOR_APPROVED",
      `Admin approved mentor ${mentor.mentorName} from ${mentor.companyName}`,
      {
        mentorId:
          mentor._id,
        companyName:
          mentor.companyName,
      }
    );

    return res.json({
      message:
        "Mentor approved successfully",

      mentor: {
        id: mentor._id,

        mentorName:
          mentor.mentorName,

        companyName:
          mentor.companyName,

        verificationStatus:
          mentor.verificationStatus,

        verifiedAt:
          mentor.verifiedAt,

        subscription:
          mentor.subscription,

        candidateAccess:
          mentor.candidateAccess,
      },
    });
  } catch (error) {
    console.error(
      "Admin approveMentor error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Server error approving mentor",
    });
  }
};

// ==========================================
// REJECT MENTOR
// PATCH /api/admin/mentors/:id/reject
// ==========================================

const rejectMentor = async (
  req,
  res
) => {
  try {
    const mentor =
      await Mentor.findById(
        req.params.id
      );

    if (!mentor) {
      return res.status(404).json({
        error: "Mentor not found",
      });
    }

    const {
      verificationNotes = "Mentor rejected by administrator",
    } = req.body || {};

    mentor.verificationStatus =
      "rejected";

    mentor.verifiedAt = null;

    mentor.verificationNotes =
      verificationNotes;

    // Rejected mentor cannot
    // access candidates.
    mentor.candidateAccess =
      false;

    await mentor.save();

    await logActivity(
      req.user._id,
      "MENTOR_REJECTED",
      `Admin rejected mentor ${mentor.mentorName} from ${mentor.companyName}`,
      {
        mentorId:
          mentor._id,
        companyName:
          mentor.companyName,
        reason:
          verificationNotes,
      }
    );

    return res.json({
      message:
        "Mentor rejected successfully",

      mentor: {
        id: mentor._id,

        mentorName:
          mentor.mentorName,

        companyName:
          mentor.companyName,

        verificationStatus:
          mentor.verificationStatus,

        verificationNotes:
          mentor.verificationNotes,

        candidateAccess:
          mentor.candidateAccess,
      },
    });
  } catch (error) {
    console.error(
      "Admin rejectMentor error:",
      error.message
    );

    return res.status(500).json({
      error:
        "Server error rejecting mentor",
    });
  }
};

// ==========================================
// UPDATE MENTOR SUBSCRIPTION
// PATCH /api/admin/mentors/:id/subscription
// ==========================================

const updateMentorSubscription =
  async (req, res) => {
    try {
      const mentor =
        await Mentor.findById(
          req.params.id
        );

      if (!mentor) {
        return res.status(404).json({
          error:
            "Mentor not found",
        });
      }

      const {
        plan,
        status,
        expiresAt,
        candidateAccess,
      } = req.body || {};

      const allowedPlans = [
        "none",
        "basic",
        "professional",
        "premium",
      ];

      const allowedStatuses = [
        "inactive",
        "active",
        "expired",
        "cancelled",
      ];

      if (
        plan &&
        !allowedPlans.includes(
          plan
        )
      ) {
        return res.status(400).json({
          error:
            "Invalid subscription plan",
        });
      }

      if (
        status &&
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          error:
            "Invalid subscription status",
        });
      }

      if (plan) {
        mentor.subscription.plan =
          plan;
      }

      if (status) {
        mentor.subscription.status =
          status;
      }

      if (
        expiresAt !==
        undefined
      ) {
        mentor.subscription.expiresAt =
          expiresAt
            ? new Date(expiresAt)
            : null;
      }

      // Candidate access should normally
      // require BOTH:
      // approved mentor + active subscription

      mentor.candidateAccess =
        mentor.verificationStatus ===
        "approved" &&
        mentor.subscription.status ===
        "active";

      await mentor.save();

      await logActivity(
        req.user._id,
        "MENTOR_SUBSCRIPTION_UPDATED",
        `Admin updated subscription for ${mentor.companyName}`,
        {
          mentorId:
            mentor._id,
          plan:
            mentor.subscription
              .plan,
          status:
            mentor.subscription
              .status,
          candidateAccess:
            mentor.candidateAccess,
        }
      );

      return res.json({
        message:
          "Mentor subscription updated successfully",

        subscription:
          mentor.subscription,

        candidateAccess:
          mentor.candidateAccess,
      });
    } catch (error) {
      console.error(
        "Admin updateMentorSubscription error:",
        error.message
      );

      return res.status(500).json({
        error:
          "Server error updating mentor subscription",
      });
    }
  };

// ==========================================
// EXPORT
// ==========================================

module.exports = {
  // User management
  getUsers,
  getUserById,
  updateUserStatus,
  deleteUser,

  // Activity
  getActivity,

  // Statistics
  getStats,

  // Mentor management
  getMentors,
  getMentorById,
  approveMentor,
  rejectMentor,
  updateMentorSubscription,
};