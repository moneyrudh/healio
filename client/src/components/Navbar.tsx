import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThemeContext } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const Navbar: React.FC = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);

  // Animation variants
  const navbarVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.6, 0.05, 0.01, 0.9],
        staggerChildren: 0.1
      }
    }
  };

  const linkVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800"
      initial="hidden"
      animate="visible"
      variants={navbarVariants}
    >
      <div className="container-custom py-5">
        <div className="flex items-center justify-between">
          <motion.div 
            variants={linkVariants}
            className="flex items-center"
          >
            <Link to="/" className="flex items-center group">
              <motion.svg 
                width="40" 
                height="40" 
                viewBox="0 0 40 40" 
                className="h-10 w-auto mr-4"
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                whileHover={{ rotate: 5, scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <rect width="40" height="40" rx="8" fill="#00A0FF" />
                <path d="M12 14H28M12 20H28M12 26H20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="28" cy="26" r="3" fill="white" />
              </motion.svg>
              <span className="text-xl md:text-2xl lg:text-3xl font-extralight tracking-tighter text-primary-600 dark:text-primary-400">
                healio
              </span>
            </Link>
          </motion.div>

          <div className="flex items-center space-x-8">
            {[
              { path: '/chat', label: 'Start Consultation' },
              { path: '/summary', label: 'Patient History' }
            ].map((link, index) => (
              <motion.div
                key={link.path}
                variants={linkVariants}
                custom={index}
                onHoverStart={() => setHoveredLink(link.path)}
                onHoverEnd={() => setHoveredLink(null)}
              >
                <Link
                  to={link.path}
                  className="relative text-lg font-light text-neutral-600 dark:text-neutral-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors duration-300 py-2"
                >
                  {link.label}
                  <motion.span 
                    className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 dark:bg-primary-400 rounded-full"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ 
                      scaleX: hoveredLink === link.path ? 1 : 0,
                      opacity: hoveredLink === link.path ? 1 : 0
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </Link>
              </motion.div>
            ))}
            
            <motion.div variants={linkVariants}>
              <motion.button
                onClick={toggleDarkMode}
                className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                aria-label="Toggle dark mode"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {darkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;