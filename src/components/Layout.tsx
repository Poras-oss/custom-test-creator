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
    <>
    <div className={`flex flex-col min-h-screen ${isDarkTheme ? 'bg-[#1D1E23] text-white' : 'bg-gray-100 text-black'}`}>
    
      <Header isDarkTheme={isDarkTheme} toggleTheme={toggleTheme} />
      <main className="flex-1 w-full p-0">
        {/* <div className="w-full max-w-5xl mx-auto p-6">{children}</div> */}
        <div className="w-full  mx-auto ">{children}</div>
      </main>
    </div>
    </>
  );
};

export default Layout;


// import React, 'react';
// import { useLocation } from 'react-router-dom';
// import Header from './Header';

// interface LayoutProps {
//   children: React.ReactNode;
// }

// const Layout: React.FC<LayoutProps> = ({ children }) => {
//   const location = useLocation();
//   const isHomePage = location.pathname === '/';

//   // NOTE: I've removed isDarkTheme logic for simplicity as HomePage controls its own dark theme.
//   // You can add it back if other pages need it.
  
//   return (
//     <div className="flex flex-col min-h-screen bg-[#111827]"> {/* Default background */}
//       <Header isDarkTheme={true} toggleTheme={() => {}} />
//       <main className="flex-1 w-full">
//         {/* On HomePage, we remove padding to allow the component to fill the screen */}
//         <div className={!isHomePage ? 'max-w-7xl mx-auto p-6' : 'h-full'}>
//           {children}
//         </div>
//       </main>
//     </div>
//   );
// };

// export default Layout;