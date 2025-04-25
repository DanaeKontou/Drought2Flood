"use client";
import { Search, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function SecondNavbar() {
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  
  return (
    <div className="border-t border-gray-200 shadow-sm" style={{ backgroundColor: "#F2F2FD" }}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Desktop Layout */}
        <div className="hidden md:flex flex-wrap items-center justify-between gap-3">
          {/* Left Links */}
          <div className="flex gap-6 text-sm font-medium">
            <a href="#" className="text-gray-700 hover:text-indigo-600 transition duration-150">
              Multimedia Portal
            </a>
            <a href="#" className="text-gray-700 hover:text-indigo-600 transition duration-150">
              Resource Library
            </a>
          </div>
  
          {/* Search Input - Centered with Icon */}
          <div className="flex-1 flex justify-center max-w-md mx-auto w-full">
            <form className="relative w-full" action='/search' method='get'>
              <input
                type="search"
                name="q"
                placeholder="Search by region | year..."
                className="w-full px-4 py-2 pr-10 border bg-white border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 placeholder-gray-400"
              />
              <button 
                type="submit" 
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>
  
          {/* Country Selector */}
          <div className="relative">
            <select 
              className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 cursor-pointer"
            >
              <option value="">Select Country</option>
              <option value="kenya">Kenya</option>
              <option value="canada">Canada</option>
              <option value="peru">Peru</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
        
        {/* Mobile Layout - Only shows search and country selector centered */}
        <div className="flex flex-col md:hidden space-y-3">
          {/* Search Input */}
          <form className="relative w-full" action='/search' method='get'>
            <input
              type="search"
              name="q"
              placeholder="Search by region | year..."
              className="w-full px-4 py-2 pr-10 border bg-white border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 placeholder-gray-400"
            />
            <button 
              type="submit" 
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-indigo-600 focus:outline-none transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5" />
            </button>
          </form>
          
          {/* Country Selector */}
          <div className="relative w-full">
            <select 
              className="w-full appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-4 pr-10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 cursor-pointer"
              onChange={(e) => setIsCountryOpen(false)}
            >
              <option value="">Select Country</option>
              <option value="kenya">Kenya</option>
              <option value="canada">Canada</option>
              <option value="peru">Peru</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}