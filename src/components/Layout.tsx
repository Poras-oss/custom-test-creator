import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, History, Trophy, Menu, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { UserButton, useUser, SignInButton } from '@clerk/clerk-react';
import Header from './Header';
import { DarkModeContext } from '../App';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDarkTheme, toggleTheme } = useContext(DarkModeContext);
  const { isLoaded, isSignedIn, user } = useUser();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme);
  }, [isDarkTheme]);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'History', href: '/history', icon: History },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  return (
    <div className={`flex flex-col min-h-screen ${isDarkTheme ? 'bg-[#2a2a2a] text-white' : 'bg-gray-100 text-black'}`}>
      <Header isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
      
      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className={`hidden lg:flex lg:w-64 lg:flex-col ${isDarkTheme ? 'bg-[#1a1a1a] text-white' : 'bg-white text-black'}`}>
          <div className="flex flex-col gap-2 border-r p-6">
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
          </div>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden absolute top-4 left-4 text-white mt-1">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64">
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
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

