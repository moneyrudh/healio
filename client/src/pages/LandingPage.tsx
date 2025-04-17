import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform, useAnimation, AnimatePresence } from 'framer-motion';
import { 
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  MicrophoneIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Import custom font
const ModernLandingPage: React.FC = () => {
  // For scroll-triggered animations
  const controls = useAnimation();
  const { scrollY } = useScroll();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Track mouse position for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Track scroll position to trigger animations
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;
      
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      // Determine active section based on scroll position
      const heroSection = document.getElementById('hero-section');
      const featuresSection = document.getElementById('features-section');
      const processSection = document.getElementById('process-section');
      const testimonialsSection = document.getElementById('testimonials-section');
      
      if (heroSection && scrollPosition < heroSection.offsetHeight) {
        setActiveSection(0);
      } else if (featuresSection && scrollPosition < featuresSection.offsetTop + featuresSection.offsetHeight) {
        setActiveSection(1);
      } else if (processSection && scrollPosition < processSection.offsetTop + processSection.offsetHeight) {
        setActiveSection(2);
      } else if (testimonialsSection) {
        setActiveSection(3);
      }
      
      // Trigger animations when sections come into view
      const sections = document.querySelectorAll('.animate-section');
      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const isInView = rect.top < windowHeight * 0.75 && rect.bottom > 0;
        
        if (isInView) {
          section.classList.add('in-view');
          if (index === activeSection) {
            controls.start('visible');
          }
        } else {
          section.classList.remove('in-view');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [controls, activeSection]);

  // Parallax effect values based on mouse position
  const moveX = useTransform(scrollY, [0, 1000], [0, -50]);
  const moveY = useTransform(scrollY, [0, 1000], [0, -100]);
  const rotate = useTransform(scrollY, [0, 1000], [0, 10]);
  const scale = useTransform(scrollY, [0, 500], [1, 0.8]);
  const opacity = useTransform(scrollY, [0, 300, 500], [1, 0.8, 0]);
  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.95]);

  // Animation variants for different elements
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.6, 0.05, 0.01, 0.9]
      }
    }
  };

  const fadeInLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.6, 0.05, 0.01, 0.9]
      }
    }
  };

  const fadeInRight = {
    hidden: { opacity: 0, x: 60 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        duration: 0.8, 
        ease: [0.6, 0.05, 0.01, 0.9]
      }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const floatingAnimation = {
    y: [0, -15, 0],
    transition: {
      duration: 6,
      ease: "easeInOut",
      repeat: Infinity,
    }
  };

  // Animation variants for the gradient background
  const gradientBgVariants = {
    animate: {
      backgroundImage: [
        'linear-gradient(120deg, rgba(79, 70, 229, 0.1) 0%, rgba(0, 160, 255, 0.1) 100%)',
        'linear-gradient(120deg, rgba(0, 160, 255, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
      ],
      transition: {
        duration: 15,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "linear"
      }
    }
  };

  return (
    <div ref={scrollRef} className="bg-white dark:bg-neutral-900 min-h-screen overflow-hidden font-thin">
      {/* Cursor effect - large circle following cursor */}
      <motion.div 
        className="fixed w-40 h-40 rounded-full bg-primary-500/5 dark:bg-primary-500/10 pointer-events-none z-0 hidden md:block"
        style={{ 
          x: mousePosition.x - 80, 
          y: mousePosition.y - 80,
          mixBlendMode: "difference"
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      />

      {/* Hero Section */}
      <motion.section 
        id="hero-section"
        variants={gradientBgVariants}
        animate="animate"
        className="min-h-screen relative flex flex-col justify-center items-start overflow-hidden animate-section"
        style={{ 
          opacity: heroOpacity,
          scale: heroScale 
        }}
      >
        {/* Background decorative elements */}
        <motion.div 
          className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10"
          style={{ 
            x: moveX, 
            y: moveY 
          }}
        >
          {/* <motion.div 
            className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-primary-400/10 dark:bg-primary-500/10"
            animate={floatingAnimation}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-accent-400/10 dark:bg-accent-500/10"
            animate={{
              ...floatingAnimation,
              transition: {
                ...floatingAnimation.transition,
                delay: 1.5
              }
            }}
          /> */}
          <motion.div 
            className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full bg-neutral-400/10 dark:bg-neutral-500/10"
            animate={{
              ...floatingAnimation,
              transition: {
                ...floatingAnimation.transition,
                delay: 2.5
              }
            }}
          />
        </motion.div>

        <div className="container-custom flex flex-col h-full justify-center relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left column - Hero text */}
            <motion.div 
              className="lg:col-span-7 pt-20 lg:pt-0"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div variants={fadeInLeft} className="mb-4 inline-block">
                <span className="inline-block py-1 px-3 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                  AI-Powered Healthcare
                </span>
              </motion.div>
              
              <motion.h1 
                variants={fadeInLeft}
                className="text-7xl md:text-8xl lg:text-[110px] font-extralight tracking-tighter mb-6 leading-none text-neutral-900 dark:text-white"
              >
                Medical<br />
                <span className="text-primary-500">Documentation</span><br />
                <span className="text-4xl md:text-6xl">Reimagined</span>
              </motion.h1>
              
              <motion.p 
                variants={fadeInLeft}
                className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-300 max-w-2xl mb-10 font-light"
              >
                Reduce documentation time by 40% and elevate your patient care experience with our revolutionary AI assistant.
              </motion.p>
              
              <motion.div 
                variants={fadeInUp}
                className="flex flex-wrap gap-4"
              >
                <Link
                  to="/chat"
                  className="group relative px-8 py-4 text-lg font-light rounded-full bg-primary-500 text-white hover:bg-primary-600 transition-all overflow-hidden"
                >
                  <span className="relative z-10 flex items-center">
                    Start Consultation
                    <motion.span 
                      className="ml-2"
                      animate={{
                        x: [0, 5, 0],
                        transition: { repeat: Infinity, duration: 1.5 }
                      }}
                    >
                      <ArrowRightIcon className="h-5 w-5" />
                    </motion.span>
                  </span>
                  <span className="absolute inset-0 bg-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></span>
                </Link>
                
                <a
                  href="#features-section"
                  className="group px-8 py-4 text-lg font-light rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all relative overflow-hidden"
                >
                  <span className="relative z-10">Explore Features</span>
                  <span className="absolute inset-0 bg-neutral-100 dark:bg-neutral-800 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></span>
                </a>
              </motion.div>
            </motion.div>
            
            {/* Right column - Animated demo */}
            <motion.div 
              className="lg:col-span-5 relative"
              variants={fadeInRight}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                className="bg-white dark:bg-neutral-800 rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700 relative"
                whileHover={{ y: -10, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
                transition={{ duration: 0.4 }}
              >
                <div className="h-14 bg-primary-500 flex items-center px-6">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <div className="ml-4 text-white font-medium">Healio Consultation</div>
                </div>
                
                <div className="p-6 flex flex-col space-y-4">
                  <motion.div 
                    className="flex items-start"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center flex-shrink-0">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-500" />
                    </div>
                    <div className="ml-4 bg-primary-50 dark:bg-primary-900/30 p-4 rounded-2xl rounded-tl-none">
                      <p className="text-neutral-800 dark:text-neutral-200">What is the chief complaint of the patient?</p>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-start justify-end"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <div className="mr-4 bg-neutral-100 dark:bg-neutral-700 p-4 rounded-2xl rounded-tr-none">
                      <p className="text-neutral-800 dark:text-neutral-200">Patient presents with acute lower back pain that started 3 days ago after lifting heavy furniture.</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center flex-shrink-0">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">MD</span>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    className="flex items-start"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                  >
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center flex-shrink-0">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-500" />
                    </div>
                    <div className="ml-4 bg-primary-50 dark:bg-primary-900/30 p-4 rounded-2xl rounded-tl-none">
                      <p className="text-neutral-800 dark:text-neutral-200">Thank you. Any associated symptoms like numbness or tingling?</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Floating badge */}
              <motion.div 
                className="absolute -right-6 -top-6 md:right-0 md:-top-12 bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-4 transform rotate-3"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 2.0, duration: 0.5 }}
                whileHover={{ scale: 1.05, rotate: 0 }}
              >
                <div className="flex items-center">
                  <ClockIcon className="h-6 w-6 text-primary-500 mr-2" />
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">40% less documentation time</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        {/* <motion.div 
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.8 }}
        >
          <p className="text-neutral-500 dark:text-neutral-400 mb-2 text-sm">Scroll to explore</p>
          <motion.div 
            className="w-6 h-10 border-2 border-neutral-400 dark:border-neutral-600 rounded-full flex justify-center pt-2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div 
              className="w-1.5 h-1.5 bg-primary-500 rounded-full"
              animate={{ y: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </motion.div> */}
      </motion.section>

      {/* Features Section */}
      <section 
        id="features-section" 
        className="py-32 relative animate-section"
      >
        <div className="container-custom">
          <motion.div 
            className="max-w-3xl mx-auto mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-6xl font-extralight tracking-tighter text-neutral-900 dark:text-white mb-6"
            >
              Designed for <span className="text-primary-500">healthcare</span> professionals
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-neutral-600 dark:text-neutral-400 font-light"
            >
              Our platform enhances your clinical workflow with intelligent features that adapt to your practice.
            </motion.p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[
              {
                icon: <ChatBubbleLeftRightIcon className="h-8 w-8" />,
                title: "Guided Consultations",
                description: "Follow a standardized consultation structure that ensures comprehensive documentation across all patient encounters."
              },
              {
                icon: <MicrophoneIcon className="h-8 w-8" />,
                title: "Voice & Text Input",
                description: "Document hands-free during patient encounters with advanced speech recognition optimized for medical terminology."
              },
              {
                icon: <DocumentTextIcon className="h-8 w-8" />,
                title: "Automated Documentation",
                description: "Generate standardized clinical documentation with a single click, formatted according to your preferred templates."
              },
              {
                icon: <ClockIcon className="h-8 w-8" />,
                title: "Continuous Context",
                description: "Maintain conversation context throughout the consultation process for a natural, coherent documentation experience."
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="group relative overflow-hidden h-96"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeInUp}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div className="h-full p-10 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg transition-all duration-500 group-hover:shadow-2xl relative overflow-hidden">
                  {/* Background animation on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-transparent dark:from-primary-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Decorative circle */}
                  <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-primary-100/50 dark:bg-primary-900/10 transform scale-0 group-hover:scale-100 transition-transform duration-700"></div>
                  
                  <div className="flex flex-col h-full relative z-10">
                    <motion.div 
                      className="p-5 bg-primary-50 dark:bg-primary-900/30 rounded-2xl inline-flex items-center justify-center w-16 h-16 mb-8 text-primary-500"
                      whileHover={{ rotate: [0, -10, 10, -5, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      {feature.icon}
                    </motion.div>
                    
                    <h3 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-white mb-4">
                      {feature.title}
                    </h3>
                    
                    <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                      {feature.description}
                    </p>
                    
                    <div className="mt-auto pt-6">
                      <motion.div 
                        className="inline-flex items-center text-primary-500 font-medium"
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.2 }}
                      >
                        Learn more
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section 
        id="process-section" 
        className="py-32 bg-neutral-50 dark:bg-neutral-800/30 relative animate-section"
      >
        <div className="container-custom">
          <motion.div 
            className="max-w-3xl mx-auto mb-20"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={staggerContainer}
          >
            <motion.span 
              variants={fadeInUp} 
              className="inline-block py-1 px-3 rounded-full text-sm font-medium bg-accent-100 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 mb-4"
            >
              Simple Workflow
            </motion.span>
            
            <motion.h2 
              variants={fadeInUp}
              className="text-6xl font-extralight tracking-tighter text-neutral-900 dark:text-white mb-6"
            >
              Three steps to <span className="text-accent-500">better</span> documentation
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-xl text-neutral-600 dark:text-neutral-400 font-light"
            >
              Our streamlined process saves time and reduces administrative burden
            </motion.p>
          </motion.div>
          
          <div className="relative mt-32">
            {/* Connection line */}
            <motion.div 
              className="absolute top-24 left-[10%] right-[10%] h-0.5 bg-accent-200 dark:bg-accent-800 hidden lg:block"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-20 relative z-10">
              {[
                {
                  step: '01',
                  title: 'Select Provider & Patient',
                  description: 'Choose your profile and select a patient from your existing records.',
                  delay: 0
                },
                {
                  step: '02',
                  title: 'Complete Guided Consultation',
                  description: 'Follow the structured consultation flow with AI guidance and suggestions.',
                  delay: 0.2
                },
                {
                  step: '03',
                  title: 'Generate Documentation',
                  description: 'Download the automatically generated clinical documentation in your preferred format.',
                  delay: 0.4
                }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  className="relative"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.3 }}
                  variants={fadeInUp}
                  transition={{ delay: item.delay }}
                >
                  <motion.div 
                    className="bg-white dark:bg-neutral-800 rounded-3xl shadow-xl p-10 h-full relative overflow-hidden"
                    whileHover={{ y: -10, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
                  >
                    {/* Step number - large in background */}
                    <div className="absolute -right-6 -top-10 text-9xl font-extralight text-accent-100 dark:text-accent-900/20 select-none pointer-events-none">
                      {item.step}
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10">
                      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-500 text-white text-xl font-light mb-6">
                        {item.step}
                      </div>
                      
                      <h3 className="text-3xl font-light tracking-tight text-neutral-900 dark:text-white mb-4">
                        {item.title}
                      </h3>
                      
                      <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        id="testimonials-section" 
        className="py-32 relative animate-section"
      >
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={staggerContainer}
            >
              <motion.span 
                variants={fadeInLeft} 
                className="inline-block py-1 px-3 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 mb-4"
              >
                Trusted Healthcare Solution
              </motion.span>
              
              <motion.h2 
                variants={fadeInLeft}
                className="text-5xl font-extralight tracking-tighter text-neutral-900 dark:text-white mb-10"
              >
                What medical professionals are saying
              </motion.h2>
              
              <div className="space-y-10">
                {[
                  {
                    quote: "Healio has reduced my documentation time by 40%, allowing me to focus more on patient care rather than paperwork.",
                    name: "Dr. Sarah Johnson",
                    title: "Family Medicine",
                    delay: 0.1
                  },
                  {
                    quote: "The structured consultation flow ensures I never miss important information. My notes are now consistently detailed and organized.",
                    name: "Dr. Michael Chen",
                    title: "Internal Medicine",
                    delay: 0.3
                  }
                ].map((testimonial, index) => (
                  <motion.div 
                    key={index}
                    className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-8 border-l-4 border-primary-500 relative overflow-hidden"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={fadeInLeft}
                    transition={{ delay: testimonial.delay }}
                    whileHover={{ x: 10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  >
                    {/* Large quote mark in background */}
                    <div className="absolute -right-2 -bottom-8 text-9xl font-serif text-primary-100 dark:text-primary-900/20 select-none pointer-events-none">
                      "
                    </div>
                    
                    <div className="relative z-10">
                      <p className="text-neutral-700 dark:text-neutral-300 mb-6 text-lg italic">
                        "{testimonial.quote}"
                      </p>
                      
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                          <span className="text-primary-700 dark:text-primary-300 font-medium text-lg">
                            {testimonial.name.charAt(0)}
                          </span>
                        </div>
                        
                        <div className="ml-4">
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {testimonial.name}
                          </p>
                          
                          <p className="text-neutral-500 dark:text-neutral-400">
                            {testimonial.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              className="relative h-full flex items-center"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={fadeInRight}
            >
              <motion.div 
                className="bg-white dark:bg-neutral-800 rounded-3xl shadow-xl p-12 relative overflow-hidden"
                whileHover={{ y: -10, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
              >
                <motion.div 
                  className="absolute -top-4 -left-4 bg-primary-500 text-white rounded-full w-24 h-24 flex items-center justify-center"
                  whileHover={{ rotate: 10 }}
                >
                  <span className="text-4xl font-light">96%</span>
                </motion.div>
                
                <h3 className="text-4xl font-light tracking-tight text-neutral-900 dark:text-white mb-10 mt-8 ml-8">
                  User satisfaction
                </h3>
                
                <div className="space-y-10">
                  {[
                    { text: "Time saved on documentation", value: 40 },
                    { text: "Improved accuracy of clinical notes", value: 93 },
                    { text: "Reduced admin burnout", value: 78 }
                  ].map((stat, index) => (
                    <div key={index} className="relative">
                      <div className="flex justify-between mb-4">
                        <span className="text-neutral-800 dark:text-neutral-200 font-light text-xl">
                          {stat.text}
                        </span>
                        <span className="text-primary-500 font-medium text-xl">
                          {stat.value}%
                        </span>
                      </div>
                      
                      <div className="relative w-full h-3 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                        <motion.div 
                          className="absolute top-0 left-0 h-full bg-primary-500 rounded-full"
                          initial={{ width: 0 }}
                          whileInView={{ width: `${stat.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.5, delay: 0.2 * index, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
              
              {/* Floating badges */}
              <motion.div 
                className="absolute -top-10 -right-5 bg-white dark:bg-neutral-700 rounded-xl shadow-lg p-4 z-20"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                whileHover={{ rotate: -5 }}
              >
                <div className="flex items-center text-primary-500">
                  <CheckCircleIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">HIPAA Compliant</span>
                </div>
              </motion.div>
              
              <motion.div 
                className="absolute -bottom-5 -left-5 bg-white dark:bg-neutral-700 rounded-xl shadow-lg p-4 z-20"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.7 }}
                whileHover={{ rotate: 5 }}
              >
                <div className="flex items-center text-accent-500">
                  <DocumentTextIcon className="h-5 w-5 mr-2" />
                  <span className="font-medium">EMR Compatible</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        className="py-32 relative overflow-hidden animate-section"
      >
        {/* Dynamic background - now with better contrast in both modes */}
        <div className="absolute inset-0 -z-10">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-br from-primary-600 to-accent-600 dark:from-primary-500 dark:to-accent-500"
            animate={{
              backgroundImage: [
                'linear-gradient(120deg, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%)',
                'linear-gradient(120deg, var(--tw-gradient-to) 0%, var(--tw-gradient-from) 100%)',
              ],
              transition: { 
                duration: 10, 
                repeat: Infinity, 
                repeatType: "reverse" as const 
              }
            }}
          />
          
          {/* Animated shapes */}
          <motion.div 
            className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              x: [0, -30, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
          />
          
          <motion.div 
            className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
            animate={{
              x: [0, 30, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
          />
        </div>
        
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              variants={fadeInUp}
              className="inline-block mb-6 rounded-full px-6 py-2 bg-white/20 backdrop-blur-sm"
            >
              <span className="text-white font-medium">Ready to transform your practice?</span>
            </motion.div>
            
            <motion.h2 
              variants={fadeInUp}
              className="text-6xl font-extralight tracking-tighter text-white mb-8"
            >
              Experience the future<br />of medical documentation
            </motion.h2>
            
            <motion.p
              variants={fadeInUp}
              className="text-xl text-white/80 mb-12 max-w-2xl mx-auto font-light"
            >
              Join thousands of healthcare professionals who have already streamlined their documentation process.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
            >
              <Link
                to="/chat"
                className="group relative px-8 py-4 rounded-full bg-white text-primary-600 font-medium hover:bg-primary-50 transition-colors shadow-lg text-lg w-full sm:w-auto flex items-center justify-center overflow-hidden"
              >
                <span className="relative z-10 flex items-center">
                  Start consultation
                  <motion.span 
                    className="ml-2"
                    animate={{
                      x: [0, 5, 0],
                      transition: { repeat: Infinity, duration: 1.5 }
                    }}
                  >
                    <ArrowRightIcon className="h-5 w-5" />
                  </motion.span>
                </span>
                <span className="absolute inset-0 bg-primary-50 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></span>
              </Link>
              
              <a
                href="#features-section"
                className="group relative px-8 py-4 rounded-full border-2 border-white text-white font-medium hover:bg-white/10 transition-colors w-full sm:w-auto flex items-center justify-center overflow-hidden"
              >
                <span className="relative z-10">Watch demo</span>
                <span className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left"></span>
              </a>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      {/* <footer className="bg-neutral-900 text-neutral-400 py-20">
        <div className="container-custom">
          <motion.div 
            className="flex flex-col md:flex-row justify-between"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-10 md:mb-0">
              <div className="flex items-center">
                <svg 
                  width="40" 
                  height="40" 
                  viewBox="0 0 40 40" 
                  className="h-10 w-auto mr-3"
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="40" height="40" rx="8" fill="#00A0FF" />
                  <path d="M12 14H28M12 20H28M12 26H20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="28" cy="26" r="3" fill="white" />
                </svg>
                <span className="text-2xl font-light text-white tracking-tight">
                  Healio
                </span>
              </div>
              
              <p className="mt-4 max-w-xs text-neutral-500">
                AI-powered medical documentation assistant for healthcare professionals.
              </p>
              
              <div className="mt-6 flex space-x-4">
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-10">
              <div>
                <h3 className="text-white font-medium mb-4 text-lg">Product</h3>
                <ul className="space-y-3">
                  <li><a href="#features-section" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-medium mb-4 text-lg">Company</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-medium mb-4 text-lg">Legal</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                </ul>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="border-t border-neutral-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <p>© {new Date().getFullYear()} Healio Health Technologies. All rights reserved.</p>
            
            <div className="flex space-x-6 mt-4 md:mt-0 text-sm">
              <a href="#" className="text-neutral-500 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-neutral-500 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-neutral-500 hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </motion.div>
        </div>
      </footer> */}
    </div>
  );
};

export default ModernLandingPage;