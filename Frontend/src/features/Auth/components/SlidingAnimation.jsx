import React, { useState, useEffect, useRef } from "react";

const SlidingAnimation = () => {
    const images = [
        { src: "https://external-preview.redd.it/samsung-galaxy-s26-ultra-first-official-promotional-poster-v0-tL7dNLnE8quh_1Dd_6Gh1vfWKNMZWqSisbF-oR-NziA.jpeg?width=1080&crop=smart&auto=webp&s=129da99e1a72d8e73acd76cbea38d0a736fdc877", alt: "Samsung Galaxy S26 Ultra 1" },
        { src:"https://external-preview.redd.it/samsung-galaxy-s26-ultra-first-official-promotional-poster-v0-tL7dNLnE8quh_1Dd_6Gh1vfWKNMZWqSisbF-oR-NziA.jpeg?width=1080&crop=smart&auto=webp&s=129da99e1a72d8e73acd76cbea38d0a736fdc877", alt: "Samsung Galaxy S26 Ultra 2" },
        { src: "https://external-preview.redd.it/samsung-galaxy-s26-ultra-first-official-promotional-poster-v0-tL7dNLnE8quh_1Dd_6Gh1vfWKNMZWqSisbF-oR-NziA.jpeg?width=1080&crop=smart&auto=webp&s=129da99e1a72d8e73acd76cbea38d0a736fdc877", alt: "Samsung Galaxy S26 Ultra 3" },
        { src: "https://external-preview.redd.it/samsung-galaxy-s26-ultra-first-official-promotional-poster-v0-tL7dNLnE8quh_1Dd_6Gh1vfWKNMZWqSisbF-oR-NziA.jpeg?width=1080&crop=smart&auto=webp&s=129da99e1a72d8e73acd76cbea38d0a736fdc877", alt: "Samsung Galaxy S26 Ultra 4" },
    ];



    const [currentIndex, setCurrentIndex] = useState(0);
    const timeoutRef = useRef(null);

    useEffect(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
        }, 4000);
        return () => clearTimeout(timeoutRef.current);
    }, [currentIndex]);

    const goTo = (idx) => { clearTimeout(timeoutRef.current); setCurrentIndex(idx); };
    const prev = () => goTo(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
    const next = () => goTo(currentIndex === images.length - 1 ? 0 : currentIndex + 1);

    return (
        <div className="relative w-full max-w-7xl mx-auto overflow-hidden rounded-lg select-none mt-4 md:mt-10 mb-4 md:mb-10 h-[200px] sm:h-[280px] md:h-[400px]">
            <div className="flex transition-transform duration-700 ease-in-out h-full"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {images.map(({ src, alt }, idx) => (
                    <img key={idx} src={src} alt={alt} className="w-full h-full flex-shrink-0 object-cover" />
                ))}
            </div>
            <button onClick={prev} className="absolute top-1/2 left-2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-1.5 md:p-2 rounded-full hover:bg-opacity-80">&#10094;</button>
            <button onClick={next} className="absolute top-1/2 right-2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-1.5 md:p-2 rounded-full hover:bg-opacity-80">&#10095;</button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                {images.map((_, idx) => (
                    <button key={idx} onClick={() => goTo(idx)}
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${currentIndex === idx ? "bg-white" : "bg-gray-400"}`} />
                ))}
            </div>
        </div>
    );
};

export default SlidingAnimation;
