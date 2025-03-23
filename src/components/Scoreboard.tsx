import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trophy, Medal, Award, Search } from 'lucide-react';

interface TeamScore {
  id: string;
  teamName: string;
  registrationId: string;
  score: number;
  rank: number;
  collegeName: string;
  review: string;
}

const Scoreboard = () => {
  const [scores, setScores] = useState<TeamScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resultsPublished, setResultsPublished] = useState(false);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        setLoading(true);
        
        // Check if results are published
        const configDoc = await getDocs(collection(db, 'config'));
        const resultsConfig = configDoc.docs.find(doc => doc.id === 'phase1Results');
        
        if (resultsConfig?.data()?.published) {
          setResultsPublished(true);
          
          // Fetch all submissions and sort by score
          const submissionsQuery = query(
            collection(db, 'phase1_submissions'),
            orderBy('points', 'desc')
          );
          
          const snapshot = await getDocs(submissionsQuery);
          let rank = 1;
          const scoresData = snapshot.docs
            .filter(doc => doc.data().points !== undefined)
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              rank,
              score: doc.data().points
            })) as TeamScore[];
          
          // Assign ranks (handling ties)
          for (let i = 1; i < scoresData.length; i++) {
            if (scoresData[i].score === scoresData[i-1].score) {
              scoresData[i].rank = scoresData[i-1].rank;
            } else {
              scoresData[i].rank = i + 1;
            }
          }
          
          setScores(scoresData);
        }
      } catch (error) {
        console.error('Error fetching scores:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScores();
  }, []);

  const filteredScores = searchTerm
    ? scores.filter(team => 
        team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        team.collegeName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : scores;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-gray-400 font-mono">{rank}</span>;
    }
  };

  if (!resultsPublished) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-gray-400 text-center">
          Results have not been published yet. Please check back later.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <section className="py-20 bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(120,80,255,0.1),transparent_70%)]" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl p-6 border border-purple-500/20"
        >
          <h2 className="text-3xl font-bold text-center gradient-text mb-8">Phase 1 Scoreboard</h2>
          
          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                placeholder="Search by team name, ID, or college..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 rounded-lg pl-10 focus:ring-2 focus:ring-purple-500 outline-none text-white"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20">
                  <th className="py-4 px-6 text-left text-gray-300">Rank</th>
                  <th className="py-4 px-6 text-left text-gray-300">Team</th>
                  <th className="py-4 px-6 text-left text-gray-300">College</th>
                  <th className="py-4 px-6 text-left text-gray-300">Registration ID</th>
                  <th className="py-4 px-6 text-right text-gray-300">Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredScores.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-400">
                      {searchTerm ? 'No teams match your search criteria.' : 'No scores available yet.'}
                    </td>
                  </tr>
                ) : (
                  filteredScores.map((team, index) => (
                    <motion.tr
                      key={team.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border-b border-purple-500/10 ${
                        index % 2 === 0 ? 'bg-purple-900/10' : ''
                      }`}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          {getRankIcon(team.rank)}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-white font-semibold">{team.teamName}</td>
                      <td className="py-4 px-6 text-gray-300">{team.collegeName}</td>
                      <td className="py-4 px-6 text-gray-300 font-mono">{team.registrationId}</td>
                      <td className="py-4 px-6 text-right">
                        <span className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full">
                          {team.score} pts
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Scoreboard;