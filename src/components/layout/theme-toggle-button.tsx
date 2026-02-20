
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggleButton() {
  const [theme, setTheme] = useState<string | null>(null);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    // Check if the server-rendered HTML has 'dark' class as a default
    const initialHtmlHasDark = document.documentElement.classList.contains('dark');
    
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // If no theme in localStorage, respect the server-rendered default (dark)
      // or fall back to system preference if for some reason 'dark' isn't on html tag.
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(initialHtmlHasDark ? 'dark' : (systemPrefersDark ? 'dark' : 'light'));
    }
  }, []);

  useEffect(() => {
    if (theme) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  if (theme === null) {
    // Render a placeholder or nothing until theme is determined to avoid flash of incorrect icon
    return <div className="h-9 w-9 px-0 md:ml-2" />; // Maintain layout space
  }

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme} 
      aria-label="Toggle theme"
      className="md:ml-2"
    >
      {theme === 'light' ? (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
      )}
    </Button>
  );
}
