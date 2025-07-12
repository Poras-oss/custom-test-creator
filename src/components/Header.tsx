import React, { useState, useEffect, useRef } from 'react';
import { useUser, SignInButton, UserButton } from "@clerk/clerk-react";
import { Moon, Sun } from "lucide-react";
import { FaBars, FaTimes } from "react-icons/fa";
import { Button } from "./ui/button";
import { FaFacebook, FaInstagram, FaLinkedin, FaWhatsapp, FaYoutube, FaDiscord } from "react-icons/fa";
import { IoIosNotifications } from "react-icons/io";
import { useLocation, useNavigate } from 'react-router-dom';
import logo from '../assets/logo_main.png';

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
  
  // Check if we're on any quiz page
  const isQuizPage = 
    location.pathname === '/quiz' || 
    location.pathname === '/python-coding-quiz' || 
    location.pathname === '/mcq-quiz';

  const handleBackToHome = () => {
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 w-full bg-[#008B8B] shadow-lg z-50">
      <div className="container mx-auto px-0">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <img
              className="h-10 w-auto cursor-pointer"
              src={logo}
              alt="Datasense"
              onClick={handleBackToHome}
            />
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
          <nav className="flex-1 flex justify-center items-center space-x-8">
            <a
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
            </a>
            {isLoaded && isSignedIn && (
              <a
                href="/history"
                className="bg-[#096c6c] hover:bg-[#279999] text-white px-4 py-2 rounded-md transition-colors duration-200"
                onClick={e => {
                  e.preventDefault();
                  navigate('/history');
                }}
              >
                History
              </a>
            )}
          </nav>

          {/* User/Theme/Community Section (right) */}
          <div className="flex items-center space-x-4">
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
            {isLoaded && isSignedIn ? (
              <>
                <span className="text-white text-sm">
                  Welcome, {user.firstName || user.username}
                </span>
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
          className={`${
            isMenuOpen ? "block" : "hidden"
          } md:hidden bg-[#008B8B] border-t border-teal-600`}
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
                  <span className="text-white text-sm">
                    Welcome, {user.firstName || user.username}
                  </span>
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
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;