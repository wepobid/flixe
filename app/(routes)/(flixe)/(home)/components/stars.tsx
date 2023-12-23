'use client'

import { motion } from 'framer-motion';
import React from 'react';

const Stars: React.FC = () => {
  return (
    <div className="fixed w-screen h-screen top-0 left-0 overflow-hidden pointer-events-none" style={{ maskImage: "url('/stars.svg')", WebkitMaskImage: "url('/stars.svg')" }}>
      <motion.div
        className="w-full h-full bg-blue-500" // Cover the full container
        animate={{ opacity: [0.7, 1, 0.7] }} // Create a breathing effect by adjusting the opacity
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }} // Slow down the transition for a more gentle breathing effect
      />
    </div>
  );
};

export default Stars;
