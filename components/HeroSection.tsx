"use client";
import { motion } from "framer-motion";

export default function HeroSection(){
    return (
        <section className="w-full bg-gradient-to-br from-[#999DF0] to-indigo-400 dark:from-[#7C81DC] dark:to-indigo-500 text-white py-24 px-4 sm:px-6 lg:px-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight drop-shadow-md">
          Visualizing Risk, Empowering Action
        </h1>
        <p className="mt-6 italic text-base sm:text-lg text-white/90 max-w-2xl mx-auto">
          An interactive atlas for drought and flood events.
        </p>
          <div className="mt-10 flex justify-center gap-4">
            <a
              href="#"
              className="px-6 py-3 bg-[#EA916EF5] hover:bg-[#e57e59] text-white rounded-xl text-sm font-semibold transition"
            >
              Explore Atlas
            </a>
            <a
              href="#"
              className="px-6 py-3 border border-white hover:bg-white hover:text-indigo-600 rounded-xl text-sm font-semibold transition"
            >
              Watch Stories
            </a>
          </div>
        </motion.div>
  
        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8, ease: "easeOut" }}
          className="absolute bottom-6 left-1/2 transform -translate-x-1/2"
        >
          <div className="animate-bounce text-white/70 text-sm">
            <span>↓ Scroll to explore</span>
          </div>
        </motion.div>
      </section>
    )
}