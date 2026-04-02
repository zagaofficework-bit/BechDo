import { useState } from "react";
import { FaTwitter, FaFacebookF, FaInstagram, FaYoutube } from "react-icons/fa";

const footerSections = [
  { title: "Services", links: ["Sell Phone", "Sell Television", "Sell Smart Watch", "Sell Smart Speakers", "Sell DSLR Camera", "Sell Earbuds", "Repair Phone", "Buy Gadgets", "Recycle Phone", "Find New Phone", "Partner With Us"] },
  { title: "Company", links: ["About Us", "Careers", "Articles", "Press Releases", "Become Phonify Partner", "Become Supersale Partner", "Corporate Information"] },
  { title: "Sell Device", links: ["Mobile Phone", "Laptop", "Tablet", "iMac", "Gaming Consoles"] },
  { title: "Help & Support", links: ["FAQ", "Contact Us", "Warranty Policy", "Refund Policy"] },
  { title: "More Info", links: ["Terms & Conditions", "Privacy Policy", "Terms of Use", "E-Waste Policy", "Cookie Policy", "What is Refurbished", "Device Safety"] },
];

const FooterAccordion = ({ title, links }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-300 sm:border-0">
      <button
        className="sm:hidden w-full flex items-center justify-between py-3 text-sm font-semibold"
        onClick={() => setOpen(!open)}
      >
        {title}
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      <h3 className="hidden sm:block font-semibold mb-3 text-sm md:text-base">{title}</h3>
      <ul className={`space-y-2 text-xs sm:text-sm pb-3 sm:pb-0 ${open ? "block" : "hidden"} sm:block`}>
        {links.map((item) => (
          <li key={item}>
            <a href="#" className="hover:text-[#00b4d8]">{item}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-700 pt-8 md:pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-6 md:pb-10">

        {/* Mobile-only header */}
        <div className="sm:hidden mb-6">
          <a href="/" className="text-3xl font-bold text-[#0077B6] block mb-4">PHONIFY</a>
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-gray-600 whitespace-nowrap">Follow us on</p>
            <div className="flex gap-3">
              {[FaTwitter, FaFacebookF, FaInstagram, FaYoutube].map((Icon, i) => (
                <a key={i} href="#" className="bg-gray-300 p-2 rounded-full"><Icon /></a>
              ))}
            </div>
          </div>
          <a href="/chat" className="mt-4 flex justify-center items-center gap-2 bg-[#0077B6] text-white px-4 py-3 rounded-lg text-sm w-full">
            💬 Chat with Us
          </a>
        </div>

        {/* Tablet: logo + 3-col sections */}
        <div className="hidden sm:grid md:hidden grid-cols-3 gap-6 mb-6">
          <div className="col-span-3 flex items-center justify-between mb-2">
            <a href="/" className="text-2xl font-bold text-[#0077B6]">PHONIFY</a>
            <div className="flex gap-2">
              {[FaTwitter, FaFacebookF, FaInstagram, FaYoutube].map((Icon, i) => (
                <a key={i} href="#" className="bg-gray-300 p-2 rounded-full hover:bg-[#00b4d8] hover:text-white transition"><Icon /></a>
              ))}
            </div>
            <a href="/chat" className="flex items-center gap-2 bg-[#0077B6] text-white px-3 py-2 rounded-lg text-sm hover:bg-[#00b4d8] transition">
              💬 Chat with Us
            </a>
          </div>
          {footerSections.map((section) => (
            <FooterAccordion key={section.title} {...section} />
          ))}
        </div>

        {/* Desktop: 6-col grid */}
        <div className="hidden md:grid grid-cols-6 gap-8 lg:gap-10">
          <div>
            <a href="/" className="text-3xl font-bold text-[#0077B6] block mb-4">PHONIFY</a>
            <p className="mb-2 text-sm font-medium">Follow us on</p>
            <div className="flex gap-3 mb-4">
              {[FaTwitter, FaFacebookF, FaInstagram, FaYoutube].map((Icon, i) => (
                <a key={i} href="#" className="bg-gray-300 p-2 rounded-full hover:bg-[#00b4d8] hover:text-white transition"><Icon /></a>
              ))}
            </div>
            <button
              onClick={() => window.dispatchEvent(new Event("open-chatbot"))}
              className="inline-flex items-center gap-2 bg-[#0077B6] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#00b4d8] transition"
            >
              💬 Chat with Us
            </button>
          </div>
          {footerSections.map((section) => (
            <FooterAccordion key={section.title} {...section} />
          ))}
        </div>

        {/* Mobile accordion only */}
        <div className="sm:hidden">
          {footerSections.map((section) => (
            <FooterAccordion key={section.title} {...section} />
          ))}
        </div>
      </div>

      <div className="border-t border-gray-300" />

      {/* Bottom section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8 grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 items-start">
        <div className="sm:col-span-1 md:col-span-2 text-xs sm:text-sm text-gray-600 space-y-2">
          <p className="font-medium text-gray-700">Registered Office:</p>
          <p>Manak Waste Management Pvt Ltd, 55, 2nd Floor, Lane-2, Westend Marg, Saidulajab, Near Saket Metro Station, New Delhi–110030, India, Support-7290068900 | CIN: U46524DL2009PTC190441</p>
          <p>Manak Waste Management Pvt Ltd. is ISO 27001 & 27701 Compliance Certified.</p>
          <p className="text-xs">** All product names, logos, and brands are property of their respective owners.</p>
        </div>
        <div className="bg-white border rounded-lg p-3 md:p-4 flex gap-3 items-start shadow-sm">
          <img src="/device-safety.png" alt="Device Safety" className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-xs md:text-sm">Safeguarded by DeviceSafety.org</h4>
            <p className="text-xs text-gray-600 mt-1">All devices are data-wiped using DeviceSafety.org certified tools.</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-300 py-4 text-center text-xs sm:text-sm text-gray-600">
        Copyright © 2026 Phonify All rights reserved
      </div>
    </footer>
  );
}