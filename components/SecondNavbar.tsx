"use client"
import { Search, ChevronDown, Globe, Library } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function SecondNavbar() {
  const [isCountryOpen, setIsCountryOpen] = useState(false); // For desktop
  const [isMobileCountryOpen, setIsMobileCountryOpen] = useState(false); // For mobile
  const [selectedCountry, setSelectedCountry] = useState("");
  
  // Refs for dropdown containers
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target as Node)) {
        setIsCountryOpen(false);
      }
      
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setIsMobileCountryOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCountryOpen, isMobileCountryOpen]);

  const handleCountrySelect = (countryName: string) => {
    setSelectedCountry(countryName);
    setIsCountryOpen(false);
    setIsMobileCountryOpen(false);
  };

  const countries = [
    { name: "Kenya", value: "kenya" },
    { name: "Canada", value: "canada" },
    { name: "Peru", value: "peru" }
  ];
  
  return (
    <div className="border-t border-slate-200 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 backdrop-blur-sm z-10 relative">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Desktop Layout */}
        <div className="hidden md:flex flex-wrap items-center justify-between gap-3">
          {/* Left Links */}
          <div className="flex gap-6 text-sm font-medium">
            <a href="#" className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition-all">
              <div className="bg-indigo-100 rounded-full p-1.5">
                <Globe className="h-4 w-4 text-indigo-600" />
              </div>
              <span>Multimedia Portal</span>
            </a>
            <a href="#" className="flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition-all">
              <div className="bg-indigo-100 rounded-full p-1.5">
                <Library className="h-4 w-4 text-red-600" />
              </div>
              <span>Resource Library</span>
            </a>
          </div>
  
          {/* Search Input - Centered with Icon */}
          <div className="flex-1 flex justify-center max-w-md mx-auto w-full">
            <div className="relative w-full">
              <input
                type="search"
                placeholder="Search by region | year..."
                className="w-full px-5 py-2.5 pr-12 border bg-white border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent shadow-sm hover:shadow-md transition-all placeholder-slate-400"
              />
              <button 
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-600 focus:outline-none transition-all"
                aria-label="Search"
              >
                <div className="bg-indigo-50 hover:bg-indigo-100 rounded-full p-1.5 transition-colors">
                  <Search className="h-4 w-4" />
                </div>
              </button>
            </div>
          </div>
  
          {/* Country Selector - Custom Dropdown */}
          <div className="relative" ref={desktopDropdownRef}>
            <button
              onClick={() => setIsCountryOpen(!isCountryOpen)}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 py-2.5 pl-5 pr-10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:shadow-md transition-all"
              aria-label="Select Country"
              aria-expanded={isCountryOpen}
              aria-controls="country-dropdown"
            >
              <span className="min-w-24 inline-block font-medium">
                {selectedCountry || "Select Country"}
              </span>
              <ChevronDown className={`h-4 w-4 ml-1 text-slate-500 transition-transform ${isCountryOpen ? "transform rotate-180" : ""}`} />
            </button>
            
            {isCountryOpen && (
              <div id="country-dropdown" className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 overflow-hidden">
                {countries.map((country) => (
                  <button
                    key={country.value}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                    onClick={() => handleCountrySelect(country.name)}
                  >
                    <span className={`h-2 w-2 rounded-full ${selectedCountry === country.name ? "bg-indigo-500" : "bg-slate-200"}`}></span>
                    {country.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Layout */}
        <div className="flex flex-col md:hidden space-y-3">
          {/* Search Input */}
          <div className="relative w-full">
            <input
              type="search"
              placeholder="Search by region | year..."
              className="w-full px-5 py-2.5 pr-12 border bg-white border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent shadow-sm hover:shadow-md transition-all placeholder-slate-400"
            />
            <button 
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-600 focus:outline-none transition-all"
              aria-label="Search"
            >
              <div className="bg-indigo-50 hover:bg-indigo-100 rounded-full p-1.5 transition-colors">
                <Search className="h-4 w-4" />
              </div>
            </button>
          </div>
          
          {/* Country Selector - Custom Dropdown */}
          <div className="relative w-full" ref={mobileDropdownRef}>
            <button
              onClick={() => setIsMobileCountryOpen(!isMobileCountryOpen)}
              className="flex items-center justify-between w-full bg-white border border-slate-200 text-slate-700 py-2.5 px-5 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 hover:shadow-md transition-all"
              aria-label="Select Country"
              aria-expanded={isMobileCountryOpen}
              aria-controls="country-dropdown-mobile"
            >
              <span className="flex-1 text-left font-medium">
                {selectedCountry || "Select Country"}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isMobileCountryOpen ? "transform rotate-180" : ""}`} />
            </button>
            
            {isMobileCountryOpen && (
              <div id="country-dropdown-mobile" className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 overflow-hidden">
                {countries.map((country) => (
                  <button
                    key={country.value}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-indigo-50 transition-colors flex items-center gap-2"
                    onClick={() => handleCountrySelect(country.name)}
                  >
                    <span className={`h-2 w-2 rounded-full ${selectedCountry === country.name ? "bg-indigo-500" : "bg-slate-200"}`}></span>
                    {country.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}