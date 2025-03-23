import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

const CountdownTimer = () => {
  const targetDate = new Date('2025-03-20T21:00:00').getTime();
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date().getTime();
    const difference = targetDate - now;

    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      ),
      minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((difference % (1000 * 60)) / 1000),
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const timeUnits = [
    { label: 'Days', value: timeLeft.days },
    { label: 'Hours', value: timeLeft.hours },
    { label: 'Minutes', value: timeLeft.minutes },
    { label: 'Seconds', value: timeLeft.seconds },
  ];

  return (
    <div className="mb-12">
      <h3 className="text-xl text-purple-300 mb-6">Registration Ends In:</h3>
      <div className="flex flex-wrap justify-center gap-4">
        {timeUnits.map((unit, index) => (
          <motion.div
            key={unit.label}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 w-20 sm:w-24 hover:bg-white/20 transition-colors duration-300">
              <div className="text-2xl sm:text-3xl font-bold text-white">
                {String(unit.value).padStart(2, '0')}
              </div>
              <div className="text-sm text-purple-300">{unit.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
