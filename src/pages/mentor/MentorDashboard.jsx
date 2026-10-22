import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineBadgeCheck, HiOutlineBan, HiOutlineClock, HiOutlineCreditCard, HiOutlineUserGroup, HiOutlineLockClosed } from 'react-icons/hi';
import { mentorApi } from '../../services/mentorApi';
import { useAuth } from '../../context/AuthContext';

export default function MentorDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [access, setAccess] = useState(null);
  const [candidatesCount, setCandidatesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileData, accessData] = await Promise.all([
          mentorApi.getProfile(),
          mentorApi.getAccessStatus(),
        ]);
        setProfile(profileData.mentor);
        setAccess(accessData);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
        return;
      } finally {
        setLoading(false);
      }

      // Candidate count is only available to approved + subscribed mentors.
      // Fetch it separately so a 403 does not crash the dashboard for pending mentors.
      try {
        const candidatesData = await mentorApi.getCandidates();
        setCandidatesCount(candidatesData.total ?? candidatesData.candidates?.length ?? 0);
      } catch {
        // Access denied (pending / no subscription) — count stays at 0
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 w-1/4 bg-white/10 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/10"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</div>;
  }

  const { verificationStatus, subscription, candidateAccess } = access;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header>
        <h1 className="text-3xl font-space font-bold">Welcome back, {user?.name}</h1>
        <p className="text-slate-400 mt-2">{profile?.companyName} • Mentor / Recruiter Portal</p>
      </header>

      {verificationStatus === 'pending' && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-4 items-start">
          <HiOutlineClock className="text-blue-400 text-2xl flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-100">Verification Pending</h3>
            <p className="text-blue-200/70 text-sm mt-1">Your company is currently being reviewed by the administrator. Candidate access will become available after approval and subscription activation.</p>
          </div>
        </div>
      )}

      {verificationStatus === 'rejected' && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-4 items-start">
          <HiOutlineBan className="text-red-400 text-2xl flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-100">Verification Rejected</h3>
            <p className="text-red-200/70 text-sm mt-1">Please review the administrator's verification notes or contact support.</p>
          </div>
        </div>
      )}

      {verificationStatus === 'approved' && !candidateAccess && (
        <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-4 items-start">
          <HiOutlineLockClosed className="text-orange-400 text-2xl flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-orange-100">Candidate Access Locked</h3>
            <p className="text-orange-200/70 text-sm mt-1">Activate an eligible subscription to explore candidates.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatusCard 
          title="Verification" 
          value={verificationStatus.toUpperCase()} 
          icon={verificationStatus === 'approved' ? HiOutlineBadgeCheck : (verificationStatus === 'pending' ? HiOutlineClock : HiOutlineBan)} 
          color={verificationStatus === 'approved' ? 'text-green-400' : (verificationStatus === 'pending' ? 'text-blue-400' : 'text-red-400')}
        />
        <StatusCard 
          title="Subscription" 
          value={(subscription?.plan || 'None').toUpperCase()} 
          icon={HiOutlineCreditCard} 
          color="text-violet-400"
        />
        <StatusCard 
          title="Subscription Status" 
          value={(subscription?.status || 'Inactive').toUpperCase()} 
          icon={HiOutlineCreditCard} 
          color={subscription?.status === 'active' ? 'text-green-400' : 'text-slate-400'}
        />
        <StatusCard 
          title="Candidate Access" 
          value={candidateAccess ? 'ACTIVE' : 'LOCKED'} 
          icon={candidateAccess ? HiOutlineUserGroup : HiOutlineLockClosed} 
          color={candidateAccess ? 'text-green-400' : 'text-orange-400'}
        />
        <StatusCard 
          title="Candidate Count" 
          value={candidatesCount} 
          icon={HiOutlineUserGroup} 
          color="text-blue-400"
        />
      </div>

    </motion.div>
  );
}

function StatusCard({ title, value, icon: Icon, color }) {
  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-center">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-lg bg-white/5 ${color}`}>
          <Icon className="text-xl" />
        </div>
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
