import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('homefix-dark-mode') === 'true');

    useEffect(() => {
        localStorage.setItem('homefix-dark-mode', String(darkMode));
        document.documentElement.classList.toggle('dark', darkMode);
        document.body.classList.toggle('bg-slate-950', darkMode);
    }, [darkMode]);

    const value = useMemo(() => ({
        darkMode,
        toggleDarkMode: () => setDarkMode((current) => !current),
        setDarkMode
    }), [darkMode]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};
