import React, { useContext } from 'react';
import Header from './Header';
import { DarkModeContext } from '../App';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isDarkTheme, toggleTheme } = useContext(DarkModeContext);

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkTheme);
  }, [isDarkTheme]);

  return (
    <div className={`flex flex-col min-h-screen ${isDarkTheme ? 'bg-[#2a2a2a] text-white' : 'bg-gray-100 text-black'}`}>
      <Header isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
      <main className="flex-1 w-full p-0">
        <div className="w-full max-w-5xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
};

export default Layout;

