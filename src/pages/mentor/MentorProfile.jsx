import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { mentorApi } from '../../services/mentorApi';

export default function MentorProfile() {
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await mentorApi.getProfile();
        setProfile(data.mentor);
        setUserData(data.user);
      } catch (err) {
        setError(err.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-64 bg-white/5 rounded-xl border border-white/10"></div>;
  }

  if (error) {
    return <div className="text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</div>;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-3xl">
      <header>
        <h1 className="text-3xl font-space font-bold">Company Profile</h1>
        <p className="text-slate-400 mt-2">Manage your company information.</p>
      </header>

      <div className="p-8 rounded-2xl bg-white/5 border border-white/10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoField label="Mentor Name" value={profile?.mentorName} />
          <InfoField label="Account Email" value={userData?.email} />
          <InfoField label="Company Name" value={profile?.companyName} />
          <InfoField label="Industry" value={profile?.industry} />
          <InfoField label="Location" value={profile?.location} />
          <InfoField label="Company Size" value={profile?.companySize} />
          <InfoField label="Website" value={profile?.website} />
          <InfoField label="Phone" value={profile?.phone} />
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-slate-400 mb-2">Company Description</h3>
          <p className="text-white bg-black/20 p-4 rounded-xl border border-white/10 whitespace-pre-wrap">
          {profile?.companyDescription || <span className="text-slate-600 italic">No description provided.</span>}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-400 mb-1">{label}</h3>
      <div className="text-white bg-black/20 px-4 py-3 rounded-xl border border-white/10">
        {value || <span className="text-slate-600 italic">Not specified</span>}
      </div>
    </div>
  );
}
