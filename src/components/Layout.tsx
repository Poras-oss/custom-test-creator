import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, History, Trophy, Menu, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { UserButton, useUser, SignInButton } from '@clerk/clerk-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const { isLoaded, isSignedIn, user } = useUser() // Get the current user from Clerk

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkTheme(savedTheme === 'dark');
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  // Toggle theme and save preference to localStorage
  const toggleTheme = () => {
    const newTheme = !isDarkTheme ? 'dark' : 'light';
    setIsDarkTheme(!isDarkTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'History', href: '/history', icon: History },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  return (
    <div className={`flex min-h-screen ${isDarkTheme ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col gap-2 border-r p-6">
          <div className="flex h-16 items-center px-4">
            {/* <h1 className="text-2xl font-bold">Quiz Platform</h1> */}
                 {/* Welcome message */}
          {user && (
            <div className="mt-3 text-lg font-medium">
              Welcome, {user.firstName || user.username}!
            </div>
          )}
               {/* Clerk User Button */}
               <div className="mt-auto flex justify-center mb-4">
               {isLoaded && isSignedIn ? (
            <UserButton afterSignOutUrl={'/'} />
          ) : (
            <SignInButton mode="modal" fallbackRedirectUrl={'/'} signUpForceRedirectUrl={'/'}>
              <Button>Log In</Button>
            </SignInButton>
          )}
          </div>
          </div>
          
          <ScrollArea className="flex-1">
            <nav className="flex flex-col h-screen gap-2 p-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} to={item.href}>
                    <span
                      className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${
                        location.pathname === item.href ? 'bg-accent' : 'transparent'
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
    
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="fixed bottom-0 flex items-center mb-2 gap-2 rounded-md p-2 text-sm font-medium hover:bg-accent"
          >
            {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDarkTheme ? "Use Light Mode" : "Use Dark Mode"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-6 w-6" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64">
          <div className="flex h-16 items-center">
            <h1 className="text-2xl font-bold">Quiz Platform</h1>
          </div>
          <ScrollArea className="flex-1">
            <nav className="flex flex-col gap-2 p-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} to={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <span
                      className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground ${
                        location.pathname === item.href ? 'bg-accent' : 'transparent'
                      }`}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
          {/* Theme Toggle Button for Mobile */}
          <button
            onClick={toggleTheme}
            className="mt-4 flex items-center gap-2 rounded-md p-2 text-sm font-medium hover:bg-accent"
          >
            {isDarkTheme ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDarkTheme ? "Use Light Mode" : "Use Dark Mode"}
          </button>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
