import TopNavbar from "@/components/TopNavbar"
import SecondNavbar from "@/components/SecondNavbar"
import HeroSection from "@/components/HeroSection"
import MapComponent from "@/components/MapSection"
import Footer from "@/components/FooterSection"
export default function Home(){
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <TopNavbar />
      <SecondNavbar />
     
      {/* Main Content */}
      <main className="p-4">  
        {/* More content... */}
         <HeroSection />
         <section className="mt-4">
         <MapComponent />
         
       </section>
       <Footer/>
        </main>
    </div>
  )
}