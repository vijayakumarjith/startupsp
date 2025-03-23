import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

const RegistrationButtons = () => {
  return (
    <div className="flex flex-wrap justify-center gap-4">
      <motion.a
        href="https://forms.gle/9yGtcQb7aJ9vGJ2z6"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg hover:scale-105 transition-transform duration-300 hover:shadow-lg hover:shadow-purple-500/25"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Register Now <ExternalLink className="w-5 h-5 ml-2" />
      </motion.a>
    </div>
  );
};

export default RegistrationButtons;