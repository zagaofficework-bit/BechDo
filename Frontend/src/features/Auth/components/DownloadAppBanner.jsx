import React from "react";

//DownloadAppBanner

export default function DownloadAppBanner() {
  return (
    <section className="bg-[#0077b6ff] text-white px-4 md:px-6 py-8 md:py-12 mx-4 md:mx-12 mb-8 md:mb-12 rounded-lg">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-10">
        
        {/* Left: Text + Buttons */}
        <div className="flex-1 text-center lg:text-left">
          <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">
            Download the App
          </h2>

          <p className="text-base md:text-lg mb-4 md:mb-6">
            Sell your old phone | Buy top-quality refurbished phones | Get your phone repaired
          </p>

          <div className="flex gap-4 justify-center lg:justify-start">
            {/* Google Play */}
            <a
              href="https://play.google.com/store/apps/details?id=com.cashify"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src="./assets/img/GooglePlay.png"
                alt="Get it on Google Play"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </a>

            {/* App Store */}
            <a
              href="https://apps.apple.com/in/app/cashify/id123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <img
                src="./assets/img/AppStore.png"
                alt="Download on the App Store"
                className="h-10 md:h-12 w-auto object-contain"
              />
            </a>
          </div>
        </div>

        {/* Right: Image */}
        <div className="flex-1 flex justify-center">
          <img
            src="/images/app-preview.png"
            alt="App Preview"
            className="w-48 md:w-72 h-auto object-contain"
          />
        </div>
      </div>
    </section>
  );
}