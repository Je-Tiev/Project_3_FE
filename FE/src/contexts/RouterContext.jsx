import React, { createContext, useContext, useState, useEffect } from 'react';

const RouterContext = createContext(null);

export const Router = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(() => {
    const hash = window.location.hash.slice(1);
    return hash || '/login';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setCurrentPath(hash || '/login');
    };
    
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (path) => {
    window.location.hash = path;
  };

  const value = { currentPath, navigate };

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within Router');
  }
  return context;
};

export const Route = ({ path, component: Component }) => {
  const { currentPath } = useRouter();
  if (currentPath !== path) return null;
  return <Component />;
};

export const Link = ({ to, children, className = '' }) => {
  const handleClick = (e) => {
    e.preventDefault();
    window.location.hash = to;
  };

  return (
    <a href={`#${to}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};