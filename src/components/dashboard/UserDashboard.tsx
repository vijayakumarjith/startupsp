import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  FileText,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  User,
  Clock,
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';

interface UserDashboardProps {
  userId: string;
  userName: string;
}

interface TeamMember {
  name: string;
  email: string;
  phone: string;
  rollNumber?: string;
  department?: string;
  year?: string;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ userId, userName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [phase1Data, setPhase1Data] = useState<any>(null);
  const [phase2Data, setPhase2Data] = useState<any>(null);
  const [teamData, setTeamData] = useState<any>(null);
  const [businessProposal, setBusinessProposal] = useState<File | null>(null);
  const [youtubeVideoUrl, setYoutubeVideoUrl] = useState('');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [timeRemaining, setTimeRemaining] = useState('');

  // Phase 2 submission deadline: April 2nd
  const phase2Deadline = new Date('April 2, 2025 23:59:59').getTime();

  useEffect(() => {
    loadDashboardData();
    startCountdown();
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load Phase 1 submission data
      const phase1Doc = await getDoc(doc(db, 'phase1_submissions', userId));
      if (phase1Doc.exists()) {
        setPhase1Data(phase1Doc.data());
      }

      // Load Phase 2 submission data
      const phase2Doc = await getDoc(doc(db, 'phase2_submissions', userId));
      if (phase2Doc.exists()) {
        setPhase2Data(phase2Doc.data());
        setYoutubeVideoUrl(phase2Doc.data().youtubeVideoUrl || '');
      }

      // Load team data
      const teamDoc = await getDoc(doc(db, 'teams', userId));
      if (teamDoc.exists()) {
        const team = teamDoc.data();
        setTeamData(team);
        setTeamMembers(team.members || []);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberUpdate = async (index: number, data: Partial<TeamMember>) => {
    try {
      const updatedMembers = [...teamMembers];
      updatedMembers[index] = { ...updatedMembers[index], ...data };
      setTeamMembers(updatedMembers);

      await setDoc(doc(db, 'teams', userId), {
        members: updatedMembers,
      });

      setSuccess('Team member details updated successfully');
    } catch (err) {
      setError('Failed to update team member details');
    }
  };

  const handleProposalUpload = async () => {
    if (!businessProposal) return;

    try {
      setLoading(true);

      // Upload proposal PDF
      const fileRef = ref(storage, `proposals/${userId}_${businessProposal.name}`);
      await uploadBytes(fileRef, businessProposal);
      const fileUrl = await getDownloadURL(fileRef);

      // Save proposal data
      await setDoc(doc(db, 'phase2_submissions', userId), {
        proposalUrl: fileUrl,
        youtubeVideoUrl,
        submittedAt: new Date().toISOString(),
        status: 'pending',
      }, { merge: true });

      setSuccess('Business proposal and YouTube video uploaded successfully');
      loadDashboardData(); // Refresh data
    } catch (err) {
      setError('Failed to upload business proposal');
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = phase2Deadline - now;

      if (distance <= 0) {
        clearInterval(interval);
        setTimeRemaining('Submission Closed');
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);
  };

  const isSubmissionClosed = () => {
    return new Date().getTime() > phase2Deadline;
  };

  const renderPhase1Status = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl p-6 mb-8"
    >
      <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
        <Trophy className="w-6 h-6 mr-2 text-yellow-400" />
        Phase 1 Results
      </h3>

      {phase1Data ? (
        <div className="space-y-4">
          <div className="bg-purple-900/30 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-300">Score:</span>
              <span className="text-2xl font-bold gradient-text">{phase1Data.points}/100</span>
            </div>
            <p className="text-gray-300">{phase1Data.review}</p>
          </div>

          <div className="flex items-center text-green-400">
            <CheckCircle className="w-5 h-5 mr-2" />
            Submission Complete
          </div>
        </div>
      ) : (
        <div className="text-gray-400">No Phase 1 submission found</div>
      )}
    </motion.div>
  );

  const renderTeamMembers = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl p-6 mb-8"
    >
      <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
        <User className="w-6 h-6 mr-2 text-blue-400" />
        Team Members
      </h3>

      <div className="space-y-6">
        {teamMembers.map((member, index) => (
          <div key={index} className="bg-black/30 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">
              {index === 0 ? 'Team Lead' : `Member ${index + 1}`}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-gray-300 mb-1">Name</label>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => handleMemberUpdate(index, { name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={member.email}
                  onChange={(e) => handleMemberUpdate(index, { email: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-gray-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={member.phone}
                  onChange={(e) => handleMemberUpdate(index, { phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                />
              </div>

              {/* Roll Number */}
              <div>
                <label className="block text-gray-300 mb-1">Roll Number</label>
                <input
                  type="text"
                  value={member.rollNumber || ''}
                  onChange={(e) => handleMemberUpdate(index, { rollNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                />
              </div>

              {/* Department */}
              {teamData?.isRECTeam && (
                <div>
                  <label className="block text-gray-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={member.department || ''}
                    onChange={(e) => handleMemberUpdate(index, { department: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                  />
                </div>
              )}

              {/* Year */}
              {teamData?.isRECTeam && (
                <div>
                  <label className="block text-gray-300 mb-1">Year</label>
                  <select
                    value={member.year || ''}
                    onChange={(e) => handleMemberUpdate(index, { year: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderPhase2Submission = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl p-6"
    >
      <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
        <FileText className="w-6 h-6 mr-2 text-green-400" />
        Phase 2 Submission
      </h3>

      <div className="space-y-6">
        {/* Timer */}
        <div className="bg-black/30 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Time Remaining: {timeRemaining}
          </h4>
        </div>

        {/* YouTube Video URL */}
        <div className="bg-black/30 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-3">YouTube Video URL</h4>
          <input
            type="url"
            value={youtubeVideoUrl}
            onChange={(e) => setYoutubeVideoUrl(e.target.value)}
            placeholder="Enter YouTube video URL"
            className="w-full px-3 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
            disabled={isSubmissionClosed()}
          />
        </div>

        {/* Upload Business Proposal */}
        <div className="bg-black/30 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-3">Upload Business Proposal</h4>
          <div className="space-y-4">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && setBusinessProposal(e.target.files[0])}
              className="hidden"
              id="proposal-upload"
              disabled={isSubmissionClosed()}
            />
            <label
              htmlFor="proposal-upload"
              className="block w-full px-4 py-3 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-purple-400 text-center cursor-pointer"
            >
              <Upload className="w-5 h-5 inline-block mr-2" />
              {businessProposal ? businessProposal.name : 'Choose PDF file'}
            </label>
            {businessProposal && (
              <button
                onClick={handleProposalUpload}
                disabled={loading || isSubmissionClosed()}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Proposal
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Submission Status */}
        {phase2Data && (
          <div className="bg-black/30 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-3">Status</h4>
            <div className="flex items-center text-green-400">
              <CheckCircle className="w-5 h-5 mr-2" />
              Proposal Submitted
            </div>
            <p className="text-gray-300 mt-2">
              Submitted on: {new Date(phase2Data.submittedAt).toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-lg flex items-center"
          >
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-500/10 text-green-400 rounded-lg flex items-center"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            {success}
          </motion.div>
        )}

        {renderPhase1Status()}
        {renderTeamMembers()}
        {renderPhase2Submission()}
      </div>
    </div>
  );
};

export default UserDashboard;