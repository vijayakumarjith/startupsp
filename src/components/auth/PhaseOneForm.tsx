import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  Youtube,
  AlertCircle,
  CheckCircle,
  Calendar,
  Info,
  Trophy,
  Download,
} from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import Scoreboard from '../Scoreboard';

interface PhaseOneFormProps {
  userId: string;
  userName: string;
}

const PhaseOneForm: React.FC<PhaseOneFormProps> = ({ userId, userName }) => {
  const [formData, setFormData] = useState({
    teamName: '',
    collegeName: '',
    whatsappNumber: '',
    productDescription: '',
    solution: '',
    fileUrl: '',
    youtubeLink: '',
    registrationId: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [results, setResults] = useState<any>(null);
  const [showScoreboard, setShowScoreboard] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [recStudent, setRecStudent] = useState({
    rollNumber: '',
    department: '',
    year: ''
  });

  useEffect(() => {
    const loadSubmissionData = async () => {
      try {
        // Get team data first to get registration ID
        const teamDoc = await getDoc(doc(db, 'teams', userId));
        if (teamDoc.exists()) {
          const teamData = teamDoc.data();
          setFormData(prev => ({
            ...prev,
            teamName: teamData.teamName || '',
            registrationId: teamData.registrationId || '',
          }));
        }

        // Check if results are published
        const configDoc = await getDoc(doc(db, 'config', 'phase1Results'));
        if (configDoc.exists() && configDoc.data()?.published) {
          setShowScoreboard(true);
        }

        // Then get submission data if it exists
        const submissionDoc = await getDoc(doc(db, 'phase1_submissions', userId));
        if (submissionDoc.exists()) {
          const data = submissionDoc.data();
          setFormData(prev => ({
            ...prev,
            ...data,
          }));
          setIsSubmitted(true);

          // If results are published and submission has points, show results
          if (configDoc.exists() && configDoc.data()?.published && data.points !== undefined) {
            setResults({
              points: data.points,
              review: data.review,
              reviewedAt: data.reviewedAt,
            });
          }
        }

        // Load REC student data if exists
        const recStudentDoc = await getDoc(doc(db, 'rec_students', userId));
        if (recStudentDoc.exists()) {
          setRecStudent(recStudentDoc.data());
        }

      } catch (err) {
        console.error('Error loading submission data:', err);
        setError('Failed to load your submission data');
      } finally {
        setInitialLoading(false);
      }
    };

    loadSubmissionData();
  }, [userId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isSubmitted) {
      setError('You cannot modify your submission after initial submission');
      return;
    }
    
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        setError('Please upload a PowerPoint file (.pptx)');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSubmitted) {
        // If already submitted, only allow YouTube link update
        if (formData.youtubeLink === '') {
          throw new Error('Please provide a YouTube video link');
        }

        await updateDoc(doc(db, 'phase1_submissions', userId), {
          youtubeLink: formData.youtubeLink,
          updatedAt: new Date().toISOString(),
        });

        setSuccess('YouTube link updated successfully!');
        setTimeout(() => setSuccess(''), 5000);
        return;
      }

      // Validate required fields for initial submission
      if (!formData.collegeName || !formData.whatsappNumber || !formData.productDescription || !formData.solution) {
        throw new Error('Please fill in all required fields');
      }

      if (!file) {
        throw new Error('Please upload your presentation file');
      }

      let updatedFormData = { ...formData };

      // Handle file upload
      const fileRef = ref(storage, `presentations/${userId}_${file.name}`);
      await uploadBytes(fileRef, file);
      const fileUrl = await getDownloadURL(fileRef);
      updatedFormData.fileUrl = fileUrl;

      // Save submission data
      await setDoc(doc(db, 'phase1_submissions', userId), {
        ...updatedFormData,
        userId,
        userName,
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setSuccess('Your submission has been saved successfully!');
      setIsSubmitted(true);
      
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to submit your entry');
    } finally {
      setLoading(false);
    }
  };

  const handleRecStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'rec_students', userId), recStudent);
      setSuccess('REC student details saved successfully!');
    } catch (err) {
      setError('Failed to save REC student details');
    }
  };

  const downloadTemplate = (type: 'proposal' | 'evaluation') => {
    const templates = {
      proposal: '/templates/phase2_proposal_template.pdf',
      evaluation: '/templates/evaluation_criteria.pdf'
    };
    
    window.open(templates[type], '_blank');
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl p-6 mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Your Results</h3>
          <Trophy className="w-8 h-8 text-yellow-400" />
        </div>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-purple-900/30 p-4 rounded-lg">
            <span className="text-gray-300">Your Score:</span>
            <span className="text-3xl font-bold gradient-text">{results.points}/100</span>
          </div>
          
          <div className="bg-blue-900/30 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-white mb-2">Reviewer's Feedback</h4>
            <p className="text-gray-300">{results.review}</p>
            <p className="text-gray-400 text-sm mt-4">
              Reviewed on: {new Date(results.reviewedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  const renderRecStudentForm = () => (
    <motion.div className="mb-8 bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">REC Student Details</h3>
      <form onSubmit={handleRecStudentSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-2">Roll Number</label>
          <input
            type="text"
            value={recStudent.rollNumber}
            onChange={(e) => setRecStudent({ ...recStudent, rollNumber: e.target.value })}
            className="w-full px-4 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2">Department</label>
          <input
            type="text"
            value={recStudent.department}
            onChange={(e) => setRecStudent({ ...recStudent, department: e.target.value })}
            className="w-full px-4 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
            required
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2">Year</label>
          <select
            value={recStudent.year}
            onChange={(e) => setRecStudent({ ...recStudent, year: e.target.value })}
            className="w-full px-4 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
            required
          >
            <option value="">Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold"
        >
          Save Details
        </button>
      </form>
    </motion.div>
  );

  const renderTemplates = () => (
    <motion.div className="mb-8 bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Templates & Guidelines</h3>
      <div className="space-y-4">
        <button
          onClick={() => downloadTemplate('proposal')}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg text-white font-semibold flex items-center justify-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Phase 2 Proposal Template
        </button>
        <button
          onClick={() => downloadTemplate('evaluation')}
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg text-white font-semibold flex items-center justify-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Download Evaluation Criteria
        </button>
      </div>
    </motion.div>
  );

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {results && renderResults()}
        {showScoreboard && <Scoreboard />}
        {!recStudent.rollNumber && renderRecStudentForm()}
        {renderTemplates()}
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 backdrop-blur-xl rounded-xl p-6 sm:p-8 border border-purple-500/20"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-4">Phase 1 Submission</h2>
            <p className="text-gray-300">Submit your project details and presentation</p>
          </div>

          {/* Important Notice */}
          <div className="bg-blue-900/30 border border-blue-500/20 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-400 mt-1 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-blue-400 font-semibold mb-2">Important Notice</h3>
                <p className="text-gray-300 text-sm">
                  {isSubmitted 
                    ? 'You can only update your YouTube video link after initial submission. All other fields are locked.'
                    : 'Please submit your PPT presentation first. You can add your YouTube video link later, but it must be submitted by April 2nd, 2025.'}
                </p>
              </div>
            </div>
          </div>

          {/* Submission Status */}
          {isSubmitted && (
            <div className="bg-green-900/30 border border-green-500/20 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-green-400">Initial submission complete!</span>
              </div>
              <p className="text-gray-300 text-sm mt-2">
                You can still update your YouTube video link until April 2nd, 2025.
              </p>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-900/30 text-red-400 p-4 rounded-lg mb-6 flex items-center"
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-900/30 text-green-400 p-4 rounded-lg mb-6 flex items-center"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              {success}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-300 mb-2">Team Name</label>
                <input
                  type="text"
                  value={formData.teamName}
                  className="w-full px-4 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                  disabled
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Registration ID</label>
                <input
                  type="text"
                  value={formData.registrationId}
                  className="w-full px-4 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                  disabled
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">College Name</label>
                <input
                  type="text"
                  value={formData.collegeName}
                  onChange={(e) => !isSubmitted && setFormData({ ...formData, collegeName: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                  required
                  disabled={isSubmitted}
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">WhatsApp Number</label>
                <input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => !isSubmitted && setFormData({ ...formData, whatsappNumber: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                  required
                  disabled={isSubmitted}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Product Description</label>
              <textarea
                value={formData.productDescription}
                onChange={(e) => !isSubmitted && setFormData({ ...formData, productDescription: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                rows={4}
                required
                disabled={isSubmitted}
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Solution Overview</label>
              <textarea
                value={formData.solution}
                onChange={(e) => !isSubmitted && setFormData({ ...formData, solution: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white"
                rows={4}
                required
                disabled={isSubmitted}
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">
                Upload Presentation (PPT)
                <span className="text-purple-400 ml-2 text-sm">Max size: 10MB</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pptx"
                  className="hidden"
                  id="ppt-upload"
                  disabled={isSubmitted}
                />
                <label
                  htmlFor="ppt-upload"
                  className={`flex items-center justify-center px-4 py-2 bg-white/5 rounded-lg border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 cursor-pointer ${
                    isSubmitted ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Upload className="w-5 h-5 text-purple-400 mr-2" />
                  <span className="text-gray-300">
                    {file ? file.name : formData.fileUrl ? 'Presentation uploaded' : 'Choose PPT file'}
                  </span>
                </label>
              </div>
              {formData.fileUrl && !file && (
                <div className="mt-2 flex items-center text-green-400">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm">Presentation uploaded</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-gray-300 mb-2">
                YouTube Video Link
                <span className="text-purple-400 ml-2 text-sm">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Submit by April 2nd, 2025
                </span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.youtubeLink}
                  onChange={(e) => setFormData({ ...formData, youtubeLink: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-4 py-2 bg-white/5 rounded-lg pl-10 focus:ring-2 focus:ring-purple-500 outline-none text-white"
                />
                <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold flex items-center justify-center ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  {isSubmitted ? 'Update YouTube Link' : 'Submit Entry'}
                  <Upload className="w-5 h-5 ml-2" />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default PhaseOneForm;