//Home.jsx

import { useEffect, useRef } from "react";
import Feedback from "../components/Feedback";
import FAQ from "../components/FAQ";
import DownloadAppBanner from "../components/DownloadAppBanner";
import Info from "../components/Info";
import NavMenu from "../components/NavMenu";
import SlidingAnimation from "../components/SlidingAnimation";
import Footer from "../components/Footer";
import Productcarousel from "../../Products/components/Productcarousel";
import NearByDevices from "../../Auth/components/NearbyDevices"
import Chatbot from "../components/Chatbot";

export default function Home() {

   useEffect(() => {
    const btn = document.getElementById("scroll-top-btn");
    const onScroll = () => {
      if (btn) btn.style.opacity = window.scrollY > 500 ? "1" : "0";
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
     <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700&family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');

        body {
          font-family: 'Sora', 'DM Sans', sans-serif;
        }

        .home-root {
          background: linear-gradient(175deg, #fafaf8 0%, #f5f3ef 50%, #faf8f4 100%);
          min-height: 100vh;
        }

        /* Scroll-to-top button */
        #scroll-top-btn {
          background: #1132d4;
          border: none;
          box-shadow: 0 4px 20px rgba(201,122,10,0.35);
          transition: transform 0.25s ease, box-shadow 0.25s ease, opacity 0.3s ease;
        }
        #scroll-top-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(201,122,10,0.45);
        }
      `}</style>
      <div className="home-root overflow-x-hidden">
    
      <SlidingAnimation />
      <NearByDevices radius={10}/>
      <Productcarousel title="Buy Refurbished Mobiles" category="mobile" />
      <Productcarousel title="Refurbished Laptops" category="laptop" />
      <Feedback />
      <FAQ />
      <DownloadAppBanner />
      <Info />
      <Footer />

      {/* Chatbot */}
      <Chatbot/>


      {/* Scroll-to-top button */}
        <button
          id="scroll-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{ opacity: 0 }}
          className="fixed bottom-6 left-172 z-50 w-11 h-11 text-white rounded-full flex items-center justify-center"
          aria-label="Scroll to top"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>
    </>
  );
}