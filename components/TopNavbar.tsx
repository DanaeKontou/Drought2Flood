"use client";
import { Sun, User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import "../app/globals.css";

export default function TopNavbar() {
  const [showMenu, setShowMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    // Prevent scrolling when sidebar is open
    if (!sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  return (
    <div className={`bg-white ${darkMode ? "dark:bg-gray-900 text-white" : "bg-white text-black"} shadow-sm border-b border-gray-200 w-full`}>
      <div className="px-4 sm:px-6 py-3 flex items-center justify-between w-full">
        {/* Logo - left-aligned on all screen sizes */}
        <div className="flex items-center gap-8">
          <a href="/" className="flex">
            <img src="/logo.png" style={{ width: '100px', height: '40px' }} alt="PerfectSTORM logo" className="h-8" />
          </a>
          {/* Desktop Nav Links */}
        <nav className={`hidden md:flex items-center gap-6 text-sm font-medium ${darkMode ? "dark:text-gray-300" : "text-gray-700"}`}>
          <a href="#" className="hover:text-red-600 dark:hover:text-red-400">Explore Atlas</a>
          <a href="#" className="hover:text-indigo-400">Watch Stories</a>
          <a href="#" className="hover:text-indigo-400">Academic Insights</a>
          <a href="#" className="hover:text-indigo-400">About</a>
          <a href="#" className="hover:text-indigo-400">Contact</a>
        </nav>
        </div>

        {/* Right: Theme Toggle + User Dropdown - Only visible on desktop */}
        <div className="hidden md:flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-full ${darkMode ? "dark:bg-gray-700 hover:bg-gray-600" : "bg-teal-500 hover:bg-teal-400"}`}
            aria-label="Toggle theme"
          >
            <Sun className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu((prev) => !prev)}
              className={`p-2 rounded-full ${darkMode ? "dark:bg-gray-700 hover:bg-gray-600" : "bg-indigo-500 hover:bg-indigo-300"}`}
            >
              <User className="h-5 w-5 text-gray-700 dark:text-gray-300" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md z-50"
                onMouseLeave={() => setShowMenu(false)}
              >
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Profile</a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Account Settings</a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Login</a>
                <a href="#" className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-100">Logout</a>
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile menu button - Only visible on mobile */}
        <div className="md:hidden">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar - on the right */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-transparent backdrop-blur bg-opacity-50"
            onClick={toggleSidebar}
          ></div>
          
          {/* Sidebar -on the right side */}
          <div className={`fixed inset-y-0 right-0 w-64 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"} shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className={`p-4 flex justify-between items-center border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
              <a href="/" className="flex-1">
                <img src="/logo.png" alt="PerfectSTORM logo" className="h-8" />
              </a>
              <button 
                onClick={toggleSidebar}
                className={`p-2 rounded-md ${darkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="px-2 py-4 space-y-1">
              {/* Top Nav Links */}
              <div className={`py-2 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <p className={`px-4 text-xs uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} font-semibold mb-2`}>Main Navigation</p>
                <a href="#" className={`block px-4 py-2 text-sm rounded-md ${darkMode ? "text-gray-200 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}>Explore Atlas</a>
                <a href="#" className={`block px-4 py-2 text-sm rounded-md ${darkMode ? "text-gray-200 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}>Watch Stories</a>
                <a href="#" className={`block px-4 py-2 text-sm rounded-md ${darkMode ? "text-gray-200 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}>Academic Insights</a>
                <a href="#" className={`block px-4 py-2 text-sm rounded-md ${darkMode ? "text-gray-200 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}>About</a>
                <a href="#" className={`block px-4 py-2 text-sm rounded-md ${darkMode ? "text-gray-200 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}>Contact</a>
              </div>
              
              {/* Second Nav Links */}
              <div className={`py-2 border-b ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <p className={`px-4 text-xs uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} font-semibold mb-2`}>Features</p>
                <a href="#" className={`block px-4 py-2 text-sm rounded-md ${darkMode ? "text-gray-200 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}>Multimedia Portal</a>
                <a href="#" className={`block px-4 py-2 text-sm rounded-md ${darkMode ? "text-gray-200 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}>Resource Library</a>
              </div>
              
              {/* Theme Toggle in Sidebar - Fixed to not close sidebar */}
              <div className="px-4 py-2">
                <button 
                  onClick={() => setDarkMode(!darkMode)}
                  className={`flex items-center text-sm ${darkMode ? "text-gray-200" : "text-gray-700"}`}
                >
                  <Sun className="h-5 w-5 mr-2" />
                  Toggle {darkMode ? "Light" : "Dark"} Mode
                </button>
              </div>
              
              {/* User Links */}
              <div className={`py-2 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                <p className={`px-4 text-xs uppercase ${darkMode ? "text-gray-400" : "text-gray-500"} font-semibold mb-2`}>Account</p>
                <a href="#" className={`block px-4 py-2 text-sm rounded-md ${darkMode ? "text-gray-200 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}>Profile</a>
                <a href="#" className={`block px-4 py-2 text-sm rounded-md ${darkMode ? "text-gray-200 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}>Account Settings</a>
                <a href="#" className={`block px-4 py-2 text-sm rounded-md ${darkMode ? "text-gray-200 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-100"}`}>Login</a>
                <a href="#" className={`block px-4 py-2 text-sm rounded-md ${darkMode ? "text-red-400 hover:bg-red-800" : "text-red-600 hover:bg-red-100"}`}>Logout</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}