import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { motion } from 'framer-motion';

export default function AdminActivities() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      const data = await adminApi.getActivity();
      setActivities(data.activities || []);
    } catch (err) {
      setError(err.message || 'Failed to load activity');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-white/5 rounded-2xl"></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-space text-white">Platform Activity</h1>
        <p className="text-sm text-slate-400 mt-1">Recent events across the platform.</p>
      </div>

      {error && <div className="text-red-400 bg-red-500/10 p-4 rounded-xl">{error}</div>}

      <div className="bg-[#0a0f1e] rounded-2xl border border-white/5 p-6">
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center text-slate-500 py-8">No activities found.</div>
          ) : (
            activities.map(a => (
              <div key={a.id || a._id} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{a.description}</p>
                  <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">{a.activityType}</p>
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(a.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
