import TopNavbar from "@/components/TopNavbar"
import SecondNavbar from "@/components/SecondNavbar"
import HeroSection from "@/components/HeroSection"
export default function Home(){
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <TopNavbar />
      <SecondNavbar />
     
      {/* Main Content */}
      <main className="p-4">  
        {/* More content... */}
         <HeroSection />
      </main>
    </div>
  )
}