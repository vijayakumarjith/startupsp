import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Send,
  Users,
  Calendar,
  MapPin,
  Award,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { sendWorkshopInvite, sendPhase2Selection } from '../../lib/emailService';

const EmailDashboard = () => {
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'selected' | 'pending'>('all');
  const [workshopDetails, setWorkshopDetails] = useState({
    title: '',
    date: '',
    venue: '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeams();
  }, [searchTerm, filterStatus]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const teamsQuery = query(collection(db, 'teams'));
      const snapshot = await getDocs(teamsQuery);
      let teamsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Apply filters
      if (searchTerm) {
        teamsData = teamsData.filter(team => 
          team.teamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.registrationId?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (filterStatus !== 'all') {
        teamsData = teamsData.filter(team => 
          filterStatus === 'selected' ? team.phase2Selected : !team.phase2Selected
        );
      }

      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Failed to fetch teams');
    } finally {
      setLoading(false);
    }
  };

  const handleSendWorkshopInvites = async () => {
    if (!workshopDetails.title || !workshopDetails.date || !workshopDetails.venue) {
      setError('Please fill in all workshop details');
      return;
    }

    try {
      setSending(true);
      let successCount = 0;
      let failCount = 0;

      for (const team of teams) {
        const success = await sendWorkshopInvite(team, workshopDetails);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      setSuccess(`Successfully sent ${successCount} invites${failCount > 0 ? `, ${failCount} failed` : ''}`);
    } catch (error) {
      console.error('Error sending invites:', error);
      setError('Failed to send invites');
    } finally {
      setSending(false);
    }
  };

  const handleSendPhase2Selections = async () => {
    try {
      setSending(true);
      let successCount = 0;
      let failCount = 0;

      const selectedTeams = teams.filter(team => team.phase2Selected);
      
      for (const team of selectedTeams) {
        const success = await sendPhase2Selection(team);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      setSuccess(`Successfully sent ${successCount} selection emails${failCount > 0 ? `, ${failCount} failed` : ''}`);
    } catch (error) {
      console.error('Error sending selection emails:', error);
      setError('Failed to send selection emails');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold gradient-text mb-6">Email Dashboard</h2>

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

        {/* Workshop Invite Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl p-6 mb-8"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Workshop Invitation
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-gray-300 mb-2">Workshop Title</label>
              <input
                type="text"
                value={workshopDetails.title}
                onChange={(e) => setWorkshopDetails({ ...workshopDetails, title: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                placeholder="Enter workshop title"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Date</label>
              <input
                type="datetime-local"
                value={workshopDetails.date}
                onChange={(e) => setWorkshopDetails({ ...workshopDetails, date: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Venue</label>
              <input
                type="text"
                value={workshopDetails.venue}
                onChange={(e) => setWorkshopDetails({ ...workshopDetails, venue: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                placeholder="Enter venue"
              />
            </div>
          </div>

          <motion.button
            onClick={handleSendWorkshopInvites}
            disabled={sending}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white flex items-center justify-center"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Workshop Invites
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Phase 2 Selection Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl p-6 mb-8"
        >
          <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Phase 2 Selection Notifications
          </h3>

          <motion.button
            onClick={handleSendPhase2Selections}
            disabled={sending}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white flex items-center justify-center"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-2" />
                Send Phase 2 Selection Emails
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Teams List */}
        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Registered Teams
            </h3>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search teams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 rounded-lg pl-10 focus:ring-2 focus:ring-purple-500 outline-none text-white"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    filterStatus === 'all' 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                      : 'bg-white/5 text-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus('selected')}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    filterStatus === 'selected' 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                      : 'bg-white/5 text-gray-300'
                  }`}
                >
                  Selected
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    filterStatus === 'pending' 
                      ? 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white' 
                      : 'bg-white/5 text-gray-300'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-500/20">
                    <th className="text-left py-3 px-4 text-gray-300">Team Name</th>
                    <th className="text-left py-3 px-4 text-gray-300">Registration ID</th>
                    <th className="text-left py-3 px-4 text-gray-300">Members</th>
                    <th className="text-left py-3 px-4 text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-400">
                        No teams found
                      </td>
                    </tr>
                  ) : (
                    teams.map((team, index) => (
                      <tr 
                        key={team.id}
                        className={`border-b border-purple-500/10 ${
                          index % 2 === 0 ? 'bg-purple-900/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-white">{team.teamName}</td>
                        <td className="py-3 px-4 text-gray-300 font-mono">{team.registrationId}</td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            {team.members?.map((member: any, idx: number) => (
                              <div key={idx} className="text-sm text-gray-300">
                                {member.name} ({member.email})
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            team.phase2Selected
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {team.phase2Selected ? 'Selected' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailDashboard;