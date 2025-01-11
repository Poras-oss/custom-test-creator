import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { UserButton, SignInButton, useUser } from '@clerk/clerk-react';
import logo from '../assets/dslogo.png';

interface HeaderProps {
  isDarkTheme: boolean;
  toggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDarkTheme, toggleTheme }) => {
  const { isLoaded, isSignedIn, user } = useUser();

  return (
    <header className={`${isDarkTheme ? 'bg-[#1d1d1d]' : 'bg-[#002147]'} relative`}>
      <div className="container mx-auto px-4 py-4">
        {/* Mobile View */}
        <div className="md:hidden flex flex-col items-center">
          <div className="w-full flex justify-between items-center">
            <div className="invisible">
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0"
              >
                <Sun className="h-5 w-5" />
              </Button>
            </div>
            <img 
              src={logo} 
              
              alt="Quiz App Logo" 
              className="h-12 w-auto object-contain"
            />
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className={`${isDarkTheme ? 'text-white hover:bg-[#2f2f2f]' : 'text-gray-700 hover:bg-gray-300'}`}
              >
                {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5 text-white" />}
              </Button>
              
            </div>
          </div>
 
        </div>

        {/* Desktop View */}
        <div className="hidden md:flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img 
              src={logo} 
              alt="Quiz App Logo" 
              className="h-12 w-auto object-contain"
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className={`${isDarkTheme ? 'text-white hover:bg-[#2f2f2f]' : 'text-gray-700 hover:bg-gray-300'}`}
            >
              {isDarkTheme ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5 text-white" />}
            </Button>
            {user && (
                <div className={`mt-3 text-md font-medium mb-3 text-white`}>
                  Welcome, {user.firstName || user.username}!
                </div>
              )}
            {isLoaded && isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal" fallbackRedirectUrl="/">
                <Button size="sm" className={`${isDarkTheme ? 'bg-green-600 hover:bg-green-700' : 'bg-green-600 hover:bg-green-700'} text-white`}>
                  Log In
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;