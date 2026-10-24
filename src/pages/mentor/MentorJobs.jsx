import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineBriefcase, HiOutlinePlus, HiOutlineTrash, HiOutlineLocationMarker, HiOutlineOfficeBuilding, HiOutlineClock, HiOutlineDocumentText } from 'react-icons/hi';
import { mentorApi } from '../../services/mentorApi';
import { validateJobTitle, validateJobDescription } from '../../utils/validations';

export default function MentorJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('Full-time');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [saving, setSaving] = useState(false);

  // Modal Validation State
  const [formErrors, setFormErrors] = useState({ title: '', description: '', general: '' });
  const [formTouched, setFormTouched] = useState({ title: false, description: false });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const data = await mentorApi.getJobs();
      if (data.jobs) {
        setJobs(data.jobs);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch job descriptions.');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleBlur = () => {
    setFormTouched((prev) => ({ ...prev, title: true }));
    const { valid, message } = validateJobTitle(title);
    setFormErrors((prev) => ({ ...prev, title: valid ? '' : message }));
  };

  const handleDescriptionBlur = () => {
    setFormTouched((prev) => ({ ...prev, description: true }));
    const { valid, message } = validateJobDescription(description);
    setFormErrors((prev) => ({ ...prev, description: valid ? '' : message }));
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setFormErrors({ title: '', description: '', general: '' });

    const titleVal = validateJobTitle(title);
    const descVal = validateJobDescription(description);

    if (!titleVal.valid || !descVal.valid) {
      setFormErrors({
        title: titleVal.message,
        description: descVal.message,
        general: '',
      });
      setFormTouched({ title: true, description: true });
      return;
    }

    setSaving(true);
    try {
      const skillsArray = skills
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const response = await mentorApi.createJob({
        title: title.trim(),
        department: department.trim(),
        location: location.trim(),
        type,
        description: description.trim(),
        skillsRequired: skillsArray,
        experienceRequired: experience.trim(),
      });

      if (response.success) {
        setIsModalOpen(false);
        // Reset Form
        setTitle('');
        setDepartment('');
        setLocation('');
        setType('Full-time');
        setDescription('');
        setSkills('');
        setExperience('');
        setFormErrors({ title: '', description: '', general: '' });
        setFormTouched({ title: false, description: false });
        fetchJobs();
      }
    } catch (err) {
      setFormErrors((prev) => ({
        ...prev,
        general: err.message || 'Failed to create job description. Please try again.',
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job description?')) return;

    try {
      const response = await mentorApi.deleteJob(jobId);
      if (response.success) {
        setJobs(jobs.filter((j) => j._id !== jobId));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete job description.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-10 w-1/4 bg-white/10 rounded animate-pulse"></div>
          <div className="h-10 w-36 bg-white/10 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="h-44 bg-white/5 rounded-2xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold">Job Descriptions</h1>
          <p className="text-slate-400 mt-2">Manage job postings to evaluate candidates against.</p>
        </div>
        <button
          id="job-create-btn"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors shadow-lg hover:shadow-violet-600/20"
        >
          <HiOutlinePlus className="text-lg" />
          Create Job
        </button>
      </header>

      {error && <div className="text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">{error}</div>}

      {jobs.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center space-y-4">
          <HiOutlineBriefcase className="text-5xl text-slate-600" />
          <div>
            <h3 className="text-lg font-bold text-slate-300 font-space">No Jobs Created Yet</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm">Create a job profile first. Once saved, you can compare any candidate's resume match against it.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-violet-600/20 hover:bg-violet-600 text-violetAccent-light hover:text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Create Job Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <motion.div
              layout
              key={job._id}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between hover:border-white/20 transition-all"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-3">
                  <h3 className="text-xl font-bold text-white font-space truncate">{job.title}</h3>
                  <button
                    onClick={() => handleDeleteJob(job._id)}
                    className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    title="Delete Job"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400 mb-4">
                  {job.department && (
                    <span className="flex items-center gap-1">
                      <HiOutlineOfficeBuilding /> {job.department}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <HiOutlineLocationMarker /> {job.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <HiOutlineClock /> {job.type}
                  </span>
                  {job.experienceRequired && (
                    <span className="flex items-center gap-1">
                      <HiOutlineDocumentText /> {job.experienceRequired} Experience
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-300 line-clamp-3 mb-4 leading-relaxed">{job.description}</p>
              </div>

              {job.skillsRequired && job.skillsRequired.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
                  {job.skillsRequired.slice(0, 5).map((skill, idx) => (
                    <span key={idx} className="text-[10px] px-2 py-1 bg-white/10 rounded text-slate-300 font-medium">
                      {skill}
                    </span>
                  ))}
                  {job.skillsRequired.length > 5 && (
                    <span className="text-[10px] px-2 py-1 bg-white/5 rounded text-slate-500 font-medium">
                      +{job.skillsRequired.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Job Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0d122e] border border-white/15 rounded-3xl p-8 overflow-y-auto max-h-[90vh] shadow-2xl text-left"
            >
              <h2 className="text-2xl font-bold font-space text-white mb-6">Create Job Description</h2>

              {formErrors.general && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
                  {formErrors.general}
                </div>
              )}

              <form onSubmit={handleCreateJob} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Title *</label>
                  <input
                    id="job-title"
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (formTouched.title) {
                        const { valid, message } = validateJobTitle(e.target.value);
                        setFormErrors((prev) => ({ ...prev, title: valid ? '' : message }));
                      }
                    }}
                    onBlur={handleTitleBlur}
                    placeholder="e.g. Senior Frontend Developer"
                    className={`w-full bg-black/20 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none transition-all ${
                      formTouched.title && formErrors.title
                        ? 'border-red-500/60 focus:border-red-500'
                        : 'border-white/10 focus:border-violetAccent/50'
                    }`}
                  />
                  {formTouched.title && formErrors.title && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.title}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Department</label>
                    <input
                      id="job-department"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Engineering"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violetAccent/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location</label>
                    <input
                      id="job-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Remote / Boston, MA"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violetAccent/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Type</label>
                    <select
                      id="job-type"
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violetAccent/50"
                    >
                      <option value="Full-time" className="bg-[#0d122e]">Full-time</option>
                      <option value="Part-time" className="bg-[#0d122e]">Part-time</option>
                      <option value="Contract" className="bg-[#0d122e]">Contract</option>
                      <option value="Internship" className="bg-[#0d122e]">Internship</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Experience (Optional)</label>
                    <input
                      id="job-experience"
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      placeholder="e.g. 3+ years"
                      className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violetAccent/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Skills Required (Comma separated)</label>
                  <input
                    id="job-skills"
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="React, TypeScript, Node.js, CSS"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violetAccent/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Job Description *</label>
                  <textarea
                    id="job-description"
                    rows={4}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      if (formTouched.description) {
                        const { valid, message } = validateJobDescription(e.target.value);
                        setFormErrors((prev) => ({ ...prev, description: valid ? '' : message }));
                      }
                    }}
                    onBlur={handleDescriptionBlur}
                    placeholder="Paste full job description details, responsibilities, and required stack here (min. 20 characters)..."
                    className={`w-full bg-black/20 border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none font-sans transition-all ${
                      formTouched.description && formErrors.description
                        ? 'border-red-500/60 focus:border-red-500'
                        : 'border-white/10 focus:border-violetAccent/50'
                    }`}
                  />
                  {formTouched.description && formErrors.description && (
                    <p className="text-xs text-red-400 mt-1">{formErrors.description}</p>
                  )}
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setFormErrors({ title: '', description: '', general: '' });
                      setFormTouched({ title: false, description: false });
                    }}
                    className="flex-1 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium text-sm transition-colors text-center cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="job-submit-btn"
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors text-center disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'Saving...' : 'Save Job'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
