import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Transition } from '@headlessui/react';
import { 
  ArrowRightIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  MicrophoneIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const [hoverFeature, setHoverFeature] = useState<number | null>(null);
  
  return (
    <main className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 md:pt-32 md:pb-40">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 to-white dark:from-neutral-900 dark:to-neutral-800 -z-10"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-32 right-0 w-56 h-56 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl -z-10 opacity-60"></div>
        <div className="absolute bottom-0 left-10 w-72 h-72 bg-accent-100 dark:bg-accent-900/20 rounded-full blur-3xl -z-10 opacity-50"></div>
        
        <div className="container-custom">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-900 dark:text-white">
              <span className="text-primary-500">AI-Powered</span> Medical Documentation
            </h1>
            
            <p className="mt-8 text-xl md:text-2xl text-neutral-600 dark:text-neutral-300 max-w-3xl">
              Reduce documentation time by 40% and focus on what matters most — your patients.
            </p>
            
            <div className="mt-12">
              <Link
                to="/chat"
                className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 duration-300"
              >
                Start Consultation
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>
            
            <div className="mt-24 relative w-full max-w-5xl">
              {/* Chat interface mockup */}
              <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                <div className="h-14 bg-primary-500 flex items-center px-6">
                  <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <div className="ml-4 text-white font-medium">Healio Consultation</div>
                </div>
                
                <div className="p-6 flex flex-col space-y-4">
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center flex-shrink-0">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-500" />
                    </div>
                    <div className="ml-4 bg-primary-50 dark:bg-primary-900/30 p-4 rounded-2xl rounded-tl-none">
                      <p className="text-neutral-800 dark:text-neutral-200">What is the chief complaint of the patient?</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start justify-end">
                    <div className="mr-4 bg-neutral-100 dark:bg-neutral-700 p-4 rounded-2xl rounded-tr-none max-w-md">
                      <p className="text-neutral-800 dark:text-neutral-200">Patient presents with acute lower back pain that started 3 days ago after lifting heavy furniture. Pain is rated 7/10 and radiates to the right leg.</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-600 flex items-center justify-center flex-shrink-0">
                      <span className="font-medium text-neutral-700 dark:text-neutral-300">MD</span>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center flex-shrink-0">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-500" />
                    </div>
                    <div className="ml-4 bg-primary-50 dark:bg-primary-900/30 p-4 rounded-2xl rounded-tl-none">
                      <p className="text-neutral-800 dark:text-neutral-200">Thank you. Any associated symptoms like numbness, tingling, or weakness in the legs?</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating badge */}
              <div className="absolute -right-6 -top-6 md:right-0 md:-top-12 bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-4 transform rotate-3">
                <div className="flex items-center">
                  <ClockIcon className="h-6 w-6 text-primary-500 mr-2" />
                  <span className="font-medium text-neutral-800 dark:text-neutral-200">40% less documentation time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white">
              Designed for healthcare professionals
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: <ChatBubbleLeftRightIcon className="h-8 w-8" />,
                title: "Guided Consultations",
                description: "Follow a standardized consultation structure that ensures comprehensive documentation."
              },
              {
                icon: <MicrophoneIcon className="h-8 w-8" />,
                title: "Voice & Text Input",
                description: "Document hands-free during patient encounters with advanced speech recognition."
              },
              {
                icon: <DocumentTextIcon className="h-8 w-8" />,
                title: "Automated Documentation",
                description: "Generate standardized clinical documentation with a single click."
              },
              {
                icon: <ClockIcon className="h-8 w-8" />,
                title: "Continuous Context",
                description: "Maintain conversation context throughout the consultation process."
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="relative overflow-hidden group"
                onMouseEnter={() => setHoverFeature(index)}
                onMouseLeave={() => setHoverFeature(null)}
              >
                <div className="h-full p-8 border border-neutral-200 dark:border-neutral-700 rounded-2xl bg-white dark:bg-neutral-800 transition-all duration-300 hover:shadow-xl">
                  <div className="absolute inset-0 bg-primary-500 transform origin-bottom transition-all duration-500 ease-out scale-y-0 group-hover:scale-y-100 -z-10 opacity-[0.03] dark:opacity-[0.07]"></div>
                  
                  <div className="flex flex-col h-full">
                    <div className="p-4 bg-primary-50 dark:bg-primary-900/30 rounded-xl inline-flex items-center justify-center w-16 h-16 mb-6 text-primary-500">
                      {feature.icon}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                      {feature.title}
                    </h3>
                    
                    <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-800/50 relative">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-4">
              Simple 3-step process
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">
              Streamlined workflow designed for busy healthcare providers
            </p>
          </div>
          
          <div className="relative">
            {/* Connection line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary-200 dark:bg-primary-800 -translate-y-1/2 hidden md:block"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  step: '01',
                  title: 'Select Provider & Patient',
                  description: 'Choose your profile and select a patient from your records.'
                },
                {
                  step: '02',
                  title: 'Complete Guided Consultation',
                  description: 'Follow the structured consultation flow with AI guidance.'
                },
                {
                  step: '03',
                  title: 'Generate Documentation',
                  description: 'Download the automatically generated clinical documentation.'
                }
              ].map((item, index) => (
                <div key={index} className="relative z-10">
                  <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-8 h-full flex flex-col items-center text-center">
                    <div className="bg-primary-500 text-white w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mb-6">
                      {item.step}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                      {item.title}
                    </h3>
                    
                    <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 relative">
        <div className="container-custom">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold text-neutral-900 dark:text-white mb-8">
                  Trusted by healthcare professionals
                </h2>
                
                <div className="space-y-8">
                  {[
                    {
                      quote: "Healio has reduced my documentation time by 40%, allowing me to focus more on patient care rather than paperwork.",
                      name: "Dr. Sarah Johnson",
                      title: "Family Medicine"
                    },
                    {
                      quote: "The structured consultation flow ensures I never miss important information. My notes are now consistently detailed and organized.",
                      name: "Dr. Michael Chen",
                      title: "Internal Medicine"
                    }
                  ].map((testimonial, index) => (
                    <div key={index} className="bg-white dark:bg-neutral-800 rounded-xl shadow p-6 border-l-4 border-primary-500">
                      <p className="text-neutral-700 dark:text-neutral-300 mb-4 italic">
                        "{testimonial.quote}"
                      </p>
                      
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-800 flex items-center justify-center">
                          <span className="text-primary-700 dark:text-primary-300 font-semibold">
                            {testimonial.name.charAt(0)}
                          </span>
                        </div>
                        
                        <div className="ml-3">
                          <p className="font-medium text-neutral-900 dark:text-white">
                            {testimonial.name}
                          </p>
                          
                          <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {testimonial.title}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl p-8 md:p-12 relative">
                  <div className="absolute -top-4 -left-4 bg-primary-500 text-white rounded-full w-16 h-16 flex items-center justify-center">
                    <span className="text-2xl font-bold">96%</span>
                  </div>
                  
                  <h3 className="text-3xl font-bold text-neutral-900 dark:text-white mb-8 mt-4">
                    User satisfaction
                  </h3>
                  
                  <div className="space-y-8">
                    {[
                      { text: "40% time saved on documentation", value: 40 },
                      { text: "Improved accuracy of clinical notes", value: 93 },
                      { text: "Reduced admin burnout", value: 78 }
                    ].map((stat, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-2">
                          <span className="text-neutral-800 dark:text-neutral-200 font-medium">
                            {stat.text}
                          </span>
                          <span className="text-primary-500 font-bold">
                            {stat.value}%
                          </span>
                        </div>
                        
                        <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                          <div 
                            className="bg-primary-500 h-2 rounded-full" 
                            style={{ width: `${stat.value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-500 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary-400 rounded-full opacity-20 blur-3xl -translate-y-1/2 -translate-x-1/3"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-600 rounded-full opacity-20 blur-3xl translate-y-1/2 translate-x-1/3"></div>
        
        <div className="container-custom relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
              Ready to transform your patient documentation?
            </h2>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                to="/chat"
                className="px-8 py-4 rounded-xl bg-white text-primary-600 font-medium hover:bg-primary-50 transition-colors shadow-lg text-lg w-full sm:w-auto flex items-center justify-center"
              >
                Start consultation
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              
              <a
                href="#features"
                className="px-8 py-4 rounded-xl bg-transparent border-2 border-white text-white font-medium hover:bg-white/10 transition-colors w-full sm:w-auto flex items-center justify-center"
              >
                Learn more
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-16">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <div className="flex items-center">
                <svg 
                  width="40" 
                  height="40" 
                  viewBox="0 0 40 40" 
                  className="h-8 w-auto mr-3"
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="40" height="40" rx="8" fill="#00A0FF" />
                  <path d="M12 14H28M12 20H28M12 26H20" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="28" cy="26" r="3" fill="white" />
                </svg>
                <span className="text-xl font-semibold text-white">
                  Healio
                </span>
              </div>
              
              <p className="mt-4 max-w-xs">
                AI-powered medical documentation assistant for healthcare professionals.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-white font-medium mb-4">Product</h3>
                <ul className="space-y-2">
                  <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-medium mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-white font-medium mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>© {new Date().getFullYear()} Healio Health Technologies. All rights reserved.</p>
            
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                Twitter
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                LinkedIn
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;