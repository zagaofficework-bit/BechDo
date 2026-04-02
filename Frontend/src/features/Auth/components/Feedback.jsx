import React, { useState, useRef } from "react";

export default function Feedback() {
  const [mobileIndex, setMobileIndex] = useState(0);
  const touchStartX = useRef(null);

  const metrics = [
    { label: "₹13052.48Cr. Cash Given" },
    { label: "193.37Lac Gadgets Encashed" },
  ];

  const feedback = [
    { name: "Karan Sharma", location: "Delhi NCR", text: "Well trained staff. Overall a positive experience in selling my phone at Phonify." },
    { name: "Abhiyash", location: "New Delhi", text: "No complaints, sold my phone very easily here. Definitely worth a try." },
    { name: "Vinit Kumar", location: "New Delhi", text: "Payment was very instant and the whole process was quick. Will recommend it." },
    { name: "Satheesh Kumaram", location: "Bengaluru", text: "It was a wonderful experience with Phonify. I got a reasonable price and their response was very quick!" },
  ];

  const next = () => { if (mobileIndex < feedback.length - 1) setMobileIndex(mobileIndex + 1); };
  const prev = () => { if (mobileIndex > 0) setMobileIndex(mobileIndex - 1); };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 40) next();
    else if (diff < -40) prev();
    touchStartX.current = null;
  };

  return (
    <section className="bg-black text-white px-4 md:px-6 py-8 md:py-12">
      <h2 className="text-center text-xl sm:text-2xl md:text-3xl font-bold mb-6 md:mb-8">
        Trusted by <span className="text-teal-400">174.03 Lac +</span> Happy Users since 2015
      </h2>

      <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-6 mb-8 md:mb-12">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-gray-900 border border-teal-500 rounded-lg px-4 md:px-6 py-3 md:py-4 text-center font-semibold text-sm md:text-base">
            {metric.label}
          </div>
        ))}
      </div>

      {/* Mobile carousel */}
      <div className="md:hidden">
        <div
          className="overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ transform: `translateX(-${mobileIndex * 100}%)` }}
          >
            {feedback.map((t, index) => (
              <div key={index} className="w-full flex-shrink-0 px-2">
                <div className="bg-white rounded-lg p-5 shadow-md">
                  <p className="text-sm italic text-black mb-4">"{t.text}"</p>
                  <p className="font-semibold text-teal-500">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-4">
          <button onClick={prev} disabled={mobileIndex === 0}
            className="bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-30 text-white">←</button>
          <div className="flex gap-2">
            {feedback.map((_, i) => (
              <button key={i} onClick={() => setMobileIndex(i)}
                className={`h-2 rounded-full transition-all ${mobileIndex === i ? "bg-teal-400 w-4" : "bg-gray-600 w-2"}`} />
            ))}
          </div>
          <button onClick={next} disabled={mobileIndex === feedback.length - 1}
            className="bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center disabled:opacity-30 text-white">→</button>
        </div>
      </div>

      {/* Desktop grid */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
        {feedback.map((t, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-md">
            <p className="text-sm italic text-black mb-6">"{t.text}"</p>
            <p className="font-semibold text-teal-400">{t.name}</p>
            <p className="text-xs text-gray-400">{t.location}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
