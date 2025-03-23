import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, LogIn } from 'lucide-react';
import { slideIn } from '../../utils/animations';

const HeroButtons = () => {
  return (
    <motion.div
      variants={slideIn('up')}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center gap-4"
    >
      <motion.button
        onClick={() => window.dispatchEvent(new CustomEvent('open-auth'))}
        className="w-full sm:w-auto inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-8 rounded-full text-lg hover:scale-105 transition-transform duration-300 hover:shadow-lg hover:shadow-purple-500/25"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <LogIn className="w-5 h-5 mr-2" />
        Sign in to Register
      </motion.button>

      <motion.a
        href="https://chat.whatsapp.com/JVfjSOxUEPB7avK8nbiHrK"
        target="_blank"
        rel="noopener noreferrer"
        className="w-full sm:w-auto inline-flex items-center justify-center bg-green-600 text-white font-bold py-4 px-8 rounded-full text-lg hover:scale-105 transition-transform duration-300 hover:shadow-lg hover:shadow-green-500/25"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-5 h-5 mr-2" />
        Join Community
      </motion.a>
    </motion.div>
  );
};

export default HeroButtons;