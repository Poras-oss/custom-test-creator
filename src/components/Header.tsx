import React, { useState, useEffect, useRef } from 'react';
import { useUser, SignInButton, UserButton } from "@clerk/clerk-react";
import { Moon, Sun } from "lucide-react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Button } from "./ui/button";
import { FaFacebook, FaInstagram, FaLinkedin, FaWhatsapp, FaYoutube, FaDiscord } from "react-icons/fa";
import { IoIosNotifications } from "react-icons/io";
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo_main.png';
import logoNew from "../assets/coderpadLogo.png"

interface HeaderProps {
  isDarkTheme: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkTheme, toggleTheme }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const communityRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (communityRef.current && !communityRef.current.contains(event.target as Node)) {
        setIsCommunityOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const isLearningActive = currentUrl.includes("view=courses");
  const isGamingActive = currentUrl.includes("games-arena");
  const isCareersActive = currentUrl.includes("view=career-builder");
  const isDashboardPage = (currentUrl.endsWith("dashboard.datasenseai.com/") || currentUrl.includes("dashboard.datasenseai.com/dashboard")) && !isLearningActive && !isCareersActive;
  const isPracticePage = currentUrl.includes("/practice-area");
  const isLiveQuizPage = currentUrl.includes("/live-events");
  const isCreateQuizPage = location.pathname === '/' || currentUrl.includes("assessment.datasenseai.com");
  const isPracticeDropdownActive = isPracticePage || isLiveQuizPage || isCreateQuizPage;
  const isHistoryPage = location.pathname === '/history';

  // Check if we're on any quiz page
  const isQuizPage =
    location.pathname === '/quiz' ||
    location.pathname === '/python-coding-quiz' ||
    location.pathname === '/mcq-quiz';

  const handleBackToHome = () => {
    window.location.href = "https://datasenseai.com";
  };

  return (
    <header className="sticky top-0 w-full bg-[#00897B] dark:bg-teal-900 shadow-lg z-50 transition-colors duration-300">
      <div className="pr-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-6 pl-6">
            <div className="flex items-center gap-2">
              <div
                className="w-38 h-10 bg-white/1 rounded-lg flex items-center justify-center overflow-hidden p-1 cursor-pointer"
                onClick={handleBackToHome}
              >
                <img
                  className="w-full h-full object-contain pr-4"
                  src={logo}
                  alt="Datasense"
                />
              </div>
            </div>

            <div className="hidden md:flex items-baseline space-x-6 text-sm font-medium">
              {/* Dashboard Link */}
              <a
                className={`relative transition-colors duration-200 hover:text-white after:content-[''] after:absolute after:w-0 after:h-[2px] after:left-0 after:-bottom-1 after:bg-[#03E9E9] after:transition-all after:duration-300 ${isDashboardPage ? 'text-white after:w-full' : 'text-white/90 hover:after:w-full'}`}
                href="https://dashboard.datasenseai.com/"
              >
                Dashboard
              </a>

              {/* Practice Dropdown */}
              <div className="relative group cursor-pointer h-16 flex items-center">
                <div className={`flex items-center gap-1 relative transition-colors duration-200 hover:text-white after:content-[''] after:absolute after:w-0 after:h-[2px] after:left-0 after:-bottom-1 after:bg-[#03E9E9] after:transition-all after:duration-300 ${isPracticeDropdownActive ? 'text-white after:w-full' : 'text-white/90 hover:after:w-full'}`}>
                  Practice
                  <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </div>
                <div className="absolute top-16 left-0 w-48 bg-[#00897B] dark:bg-teal-900 shadow-xl border border-teal-600 dark:border-teal-800 rounded-b-md overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <a href="https://practice.datasenseai.com/practice-area?subject=sql" className={`block px-4 py-3 text-sm transition-colors ${isPracticePage ? 'text-[#03E9E9] font-bold bg-teal-700/50 dark:bg-teal-800/50' : 'text-white hover:bg-teal-700/50 dark:hover:bg-teal-800/50'}`}>
                    Practice Lab
                  </a>
                  <a href="https://practice.datasenseai.com/live-events" className={`block px-4 py-3 text-sm transition-colors border-t border-teal-600/50 ${isLiveQuizPage ? 'text-[#03E9E9] font-bold bg-teal-700/50 dark:bg-teal-800/50' : 'text-white hover:bg-teal-700/50 dark:hover:bg-teal-800/50'}`}>
                    Live Quiz
                  </a>
                  <a href="/" className={`block px-4 py-3 text-sm transition-colors border-t border-teal-600/50 ${isCreateQuizPage ? 'text-[#03E9E9] font-bold bg-teal-700/50 dark:bg-teal-800/50' : 'text-white hover:bg-teal-700/50 dark:hover:bg-teal-800/50'}`}>
                    Create Quiz
                  </a>
                </div>
              </div>

              {/* Learning Link */}
              <a
                className={`relative transition-colors duration-200 hover:text-white after:content-[''] after:absolute after:w-0 after:h-[2px] after:left-0 after:-bottom-1 after:bg-[#03E9E9] after:transition-all after:duration-300 cursor-pointer ${isLearningActive ? 'text-white after:w-full' : 'text-white/90 hover:after:w-full'}`}
                href="https://dashboard.datasenseai.com/?view=courses"
              >
                Learning
              </a>

              {/* Gaming Link */}
              <a
                className={`relative transition-colors duration-200 hover:text-white after:content-[''] after:absolute after:w-0 after:h-[2px] after:left-0 after:-bottom-1 after:bg-[#03E9E9] after:transition-all after:duration-300 cursor-pointer ${isGamingActive ? 'text-white after:w-full' : 'text-white/90 hover:after:w-full'}`}
                href="https://datasenseai.com/games-arena"
              >
                Gaming
              </a>

              {/* Careers Link */}
              <a
                className={`relative transition-colors duration-200 hover:text-white after:content-[''] after:absolute after:w-0 after:h-[2px] after:left-0 after:-bottom-1 after:bg-[#03E9E9] after:transition-all after:duration-300 cursor-pointer ${isCareersActive ? 'text-white after:w-full' : 'text-white/90 hover:after:w-full'}`}
                href="https://dashboard.datasenseai.com/?view=career-builder"
              >
                Careers
              </a>

              {isLoaded && isSignedIn && (
                <a
                  href="/history"
                  className={`relative transition-colors duration-200 hover:text-white after:content-[''] after:absolute after:w-0 after:h-[2px] after:left-0 after:-bottom-1 after:bg-[#03E9E9] after:transition-all after:duration-300 ${isHistoryPage ? 'text-white after:w-full' : 'text-white/90 hover:after:w-full'}`}
                  onClick={e => {
                    e.preventDefault();
                    navigate('/history');
                  }}
                >
                  History
                </a>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-white hover:bg-teal-600 transition-colors"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? (
                <FaTimes className="h-6 w-6" />
              ) : (
                <FaBars className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Centered Navigation Links */}
          {/* <nav className="flex-1 flex justify-center items-center space-x-8"> */}
          {/* <a
              href="https://practice.datasenseai.com/"
              rel="noopener noreferrer"
              className="bg-[#096c6c] hover:bg-[#279999] text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              Practice
            </a>
            <a
              href="https://dashboard.datasenseai.com/"
              rel="noopener noreferrer"
              className="bg-[#096c6c] hover:bg-[#279999] text-white px-4 py-2 rounded-md transition-colors duration-200"
            >
              Dashboard
            </a> */}
          {/* {isLoaded && isSignedIn && (
              <a
                href="/history"
                className="bg-[#096c6c] hover:bg-[#279999] text-white px-4 py-2 rounded-md transition-colors duration-200"
                onClick={e => {
                  e.preventDefault();
                  navigate('/history');
                }}
              >
                History
              </a> */}
          {/* )
          </nav> */}


          {/* User/Theme/Community Section (right) */}
          <div className="flex items-center space-x-2">
            <div
              ref={communityRef}
              className="relative flex items-center cursor-pointer"
              // onMouseEnter={() => setIsCommunityOpen(true)}
              // onMouseLeave={() => setIsCommunityOpen(false)}
              onClick={() => setIsCommunityOpen(!isCommunityOpen)}
            >
              <div className="relative bg-white hover:bg-teal-600 rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300 group">
                <IoIosNotifications className="text-[#008B8B] hover:text-white text-2xl transition-transform duration-300 hover:scale-110" />
                <span className="absolute top-0 right-0 bg-red-500 h-3 w-3 rounded-full animate-pulse"></span>
              </div>


              {isCommunityOpen && (
                <div
                  className="absolute top-12 right-0 bg-[#00897B] dark:bg-teal-900 border border-teal-600 dark:border-teal-800 p-4 rounded-xl shadow-2xl flex flex-col items-center z-50 origin-top-right"
                  style={{
                    animation: "fadeInScale 0.3s ease-out forwards",
                  }}
                >
                  <style>{`
                    @keyframes fadeInScale {
                      0% {
                        opacity: 0;
                        transform: translateY(-10px) scale(0.95);
                      }
                      100% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                      }
                    }
                    @keyframes glowPulse {
                      0% {
                        box-shadow: 0 0 5px rgba(0, 139, 139, 0.4);
                      }
                      50% {
                        box-shadow: 0 0 15px rgba(0, 139, 139, 0.6);
                      }
                      100% {
                        box-shadow: 0 0 5px rgba(0, 139, 139, 0.4);
                      }
                    }
                    @keyframes floatIcon {
                      0% {
                        transform: translateY(0) scale(1);
                      }
                      50% {
                        transform: translateY(-3px) scale(1.1);
                      }
                      100% {
                        transform: translateY(0) scale(1);
                      }
                    }
                    .social-icon {
                      transition: all 0.3s ease;
                      position: relative;
                    }
                    .social-icon:hover {
                      transform: scale(1.2);
                      animation: floatIcon 1s ease infinite;
                    }
                    .social-icon:hover::after {
                      content: '';
                      position: absolute;
                      top: 50%;
                      left: 50%;
                      width: 140%;
                      height: 140%;
                      border-radius: 50%;
                      background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
                      transform: translate(-50%, -50%);
                      z-index: -1;
                      animation: glowPulse 1.5s infinite;
                    }
                  `}</style>
                  <p
                    className="text-white font-semibold mb-3 relative pb-2"
                    style={{
                      borderBottom: "2px solid rgba(0, 139, 139, 0.3)",
                      textShadow: "0 0 1px rgba(0, 139, 139, 0.3)"
                    }}
                  >
                    Join Community
                  </p>
                  <div className="flex space-x-4 p-2 rounded-xl bg-gradient-to-r from-teal-50 to-white">
                    <a href="https://www.youtube.com/@Senseofdata" target="_blank" rel="noopener noreferrer" className="social-icon">
                      <FaYoutube className="text-teal-600 text-2xl" />
                    </a>
                    <a href="https://www.linkedin.com/company/data-sense-lms/?viewAsMember=true" target="_blank" rel="noopener noreferrer" className="social-icon">
                      <FaLinkedin className="text-teal-600 text-2xl" />
                    </a>
                    <a href="https://www.instagram.com/senseofdata/" target="_blank" rel="noopener noreferrer" className="social-icon">
                      <FaInstagram className="text-teal-600 text-2xl" />
                    </a>
                    <a href="https://chat.whatsapp.com/DYgDxOA8nBvJp4tPz5J6ox" target="_blank" rel="noopener noreferrer" className="social-icon">
                      <FaWhatsapp className="text-teal-600 text-2xl" />
                    </a>
                    <a href="https://www.facebook.com/people/Data-Sense/61550202884240/?mibextid=LQQJ4d" target="_blank" rel="noopener noreferrer" className="social-icon">
                      <FaFacebook className="text-teal-600 text-2xl" />
                    </a>
                    <a href="https://discord.gg/your-invite-link" target="_blank" rel="noopener noreferrer" className="social-icon">
                      <FaDiscord className="text-teal-600 text-2xl" />
                    </a>
                  </div>
                </div>
              )}
            </div>
            {/* Add Upgrade to Pro button here */}
            {/* <button 
              className="hidden md:flex items-center gap-2 hover:bg-[#03E9E9] hover:text-gray-900 text-white font-medium py-2 px-4 rounded-lg transition-colors" 
              onClick={() => (window.location.href = '/pricing')}
            >
              <img className="h-6 w-6" src={logoNew} alt="Logo" />
              <span>Upgrade to Pro</span>
            </button> */}

            {/* Only show theme toggle on non-quiz pages */}
            {!isQuizPage && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-white hover:bg-teal-600 transition-colors"
              >
                {isDarkTheme ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            )}
            <button
              className="bg-white text-teal-800 px-6 py-2 rounded-lg font-bold text-sm hover:bg-teal-50 transition-all shadow-sm hidden md:flex items-center gap-2"
              onClick={() => (window.location.href = 'https://datasenseai.com/pricing')}
            >
              <img className="h-5 w-5" src={logoNew} alt="Logo" />
              <span>Upgrade to Pro</span>
            </button>
            {isLoaded && isSignedIn ? (
              <>
                {/* <span className="text-white text-sm">
                  Welcome, {user.firstName || user.username}
                </span> */}
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              <SignInButton
                mode="modal"
                fallbackRedirectUrl="/"
              >
                <button className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                  Log In
                </button>
              </SignInButton>
            )}
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div
          className={`${isMenuOpen ? "block" : "hidden"
            } md:hidden bg-[#00897B] dark:bg-teal-900 border-t border-teal-600`}
        >
          <div className="px-4 py-3 space-y-3">
            <div className="flex flex-col items-center space-y-3">
              {/* Join Community Button in mobile menu */}
              <div className="relative w-full">
                <button
                  onClick={() => setIsCommunityOpen(!isCommunityOpen)}
                  className="w-full flex items-center justify-center space-x-2 bg-white hover:bg-teal-600 text-[#008B8B] font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  <span>Join Community</span>
                  <div className="relative">
                    <IoIosNotifications className="text-[#008B8B] text-xl" />
                    <span className="absolute top-0 right-0 bg-red-500 h-2 w-2 rounded-full animate-pulse"></span>
                  </div>
                </button>

                {isCommunityOpen && (
                  <div
                    className="mt-2 p-3 bg-white rounded-lg shadow-md"
                    style={{
                      animation: "fadeInScale 0.3s ease-out forwards",
                    }}
                  >
                    <div className="flex justify-center space-x-4 p-2 rounded-xl bg-gradient-to-r from-teal-50 to-white">
                      <a href="https://www.youtube.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                        <FaYoutube className="text-teal-600 text-2xl" />
                      </a>
                      <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                        <FaLinkedin className="text-teal-600 text-2xl" />
                      </a>
                      <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                        <FaInstagram className="text-teal-600 text-2xl" />
                      </a>
                      <a href="https://www.whatsapp.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                        <FaWhatsapp className="text-teal-600 text-2xl" />
                      </a>
                      <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                        <FaFacebook className="text-teal-600 text-2xl" />
                      </a>
                      <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                        <FaDiscord className="text-teal-600 text-2xl" />
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {isLoaded && isSignedIn ? (
                <>
                  {/* <span className="text-white text-sm">
                    Welcome, {user.firstName || user.username}
                  </span> */}
                  <UserButton afterSignOutUrl="/" />
                </>
              ) : (
                <SignInButton
                  mode="modal"
                  fallbackRedirectUrl="/"
                >
                  <button className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                    Log In
                  </button>
                </SignInButton>
              )}

              {/* Only show theme toggle on non-quiz pages in mobile view */}
              {!isQuizPage && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-white hover:bg-teal-600 transition-colors mt-2"
                >
                  {isDarkTheme ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              )}
              <button
                className="bg-white w-full text-teal-800 px-6 py-2 rounded-lg font-bold text-sm hover:bg-teal-50 transition-all shadow-sm flex items-center justify-center gap-2"
                onClick={() => (window.location.href = 'https://datasenseai.com/pricing')}
              >
                <img className="h-5 w-5" src={logoNew} alt="Logo" />
                Upgrade to Pro
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;