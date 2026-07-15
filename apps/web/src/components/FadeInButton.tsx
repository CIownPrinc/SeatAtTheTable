import { motion } from 'framer-motion';
import React from 'react';

export const FadeInButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: 'easeOut' }}
    className="rounded bg-primary-600 px-4 py-2 text-white shadow-md"
    onClick={onClick}
  >
    {children}
  </motion.button>
);
