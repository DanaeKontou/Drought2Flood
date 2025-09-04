import Image from "next/image";
import { FaFacebookF, FaTwitter, FaLinkedinIn, FaInstagram } from "react-icons/fa";

export default function Footer() {
  return (
    <>
      {/* Gradient Fade Overlay */}
      <div className="h-12 w-full bg-gradient-to-b from-transparent to-[#EEF2FF] -mt-10 z-10 relative pointer-events-none" />

      <footer className="bg-[#EEF2FF] text-gray-800 py-12 px-6 md:px-20 shadow-inner transition-all duration-500 ease-in-out">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          <div className="transition-opacity duration-700 ease-in">
            <h2 className="text-xl font-bold mb-3 tracking-tight">PerfectSTORM</h2>
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
              STOrylines of FutuRe ExtreMes. Bridging science, society, and visualization.
            </p>
            <div className="w-32">
              <Image
                src="/logo.png" 
                alt="PerfectSTORM Logo"
                width={128}
                height={64}
                className="object-contain"
              />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-base mb-4 text-gray-900">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Explore Atlas</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Academic Insights</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Watch Stories</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Contact Us</a></li>
            </ul>
          </div>

          {/* Countries */}
          <div>
            <h3 className="font-semibold text-base mb-4 text-gray-900">Countries</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Kenya</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Peru</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Canada</a></li>
            </ul>
          </div>
    
            {/* Resources */}
     <div>
      <h3 className="font-semibold text-base mb-4 text-gray-900">Resources</h3>
      <ul className="space-y-2 text-sm">
        <li><a href="#" className="hover:text-indigo-600 transition-colors">Data Portal</a></li>
        <li><a href="#" className="hover:text-indigo-600 transition-colors">Publications</a></li>
        <li><a href="#" className="hover:text-indigo-600 transition-colors">Docs</a></li>
      </ul>
    </div>

    {/* Social & Contact */}
    <div>
      <h3 className="font-semibold text-base mb-4 text-gray-900">Social & Contact</h3>
      <div className="flex space-x-4">
        <a href="#" aria-label="Facebook" className="text-gray-500 hover:text-indigo-600 transition-transform hover:scale-110"><FaFacebookF size={18} /></a>
        <a href="#" aria-label="Twitter" className="text-gray-500 hover:text-indigo-600 transition-transform hover:scale-110"><FaTwitter size={18} /></a>
        <a href="#" aria-label="LinkedIn" className="text-gray-500 hover:text-indigo-600 transition-transform hover:scale-110"><FaLinkedinIn size={18} /></a>
        <a href="#" aria-label="Instagram" className="text-gray-500 hover:text-indigo-600 transition-transform hover:scale-110"><FaInstagram size={18} /></a>
      </div>
    </div>
        </div>

        <div className="mt-12 text-center text-xs text-gray-500 border-t pt-6 transition-opacity duration-500 ease-in-out">
          © {new Date().getFullYear()} PerfectSTORM. All rights reserved.
        </div>
      </footer>
    </>
  );
}
