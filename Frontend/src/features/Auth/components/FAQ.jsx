import React, { useState } from "react";

export default function FAQ() {
  const [activeTab, setActiveTab] = useState("SellSmart");
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = {
    SellSmart: [
      {
        question: "What should I do if my Amazon voucher shows Already Redeemed ?",
        answer: "If your voucher shows as already redeemed, please contact Cashify support with your voucher details. They will verify and issue a replacement if applicable.",
      },
      {
        question: "What documents do you need to sell old mobile phone on Cashify?",
        answer: "You typically need a valid government ID proof and address proof. These documents help verify ownership and ensure a smooth transaction.",
      },
      {
        question: "What if my pickup is delayed?",
        answer: "If your pickup is delayed, you can reschedule through the app or website. Cashify support will also notify you of any changes.",
      },
    ],
    SmartBuy: [
      {
        question: "What is a refurbished product?",
        answer: "A refurbished product is a pre-owned device that has been tested, repaired if necessary, and certified to work like new.",
      },
      {
        question: "What is the Return policy?",
        answer: "Cashify offers a return policy within a specified period. Check the product page for exact details before purchase.",
      },
      {
        question: "Do you have delivery in all places or only in particular locations?",
        answer: "Delivery is available in most major cities. You can check availability by entering your pin code at checkout.",
      },
    ],
    "Repair/Others": [
      {
        question: "Can I place another exchange order if my previous one was cancelled?",
        answer: "Yes, you can place a new exchange order if your previous one was cancelled. Ensure your device meets the eligibility criteria.",
      },
      {
        question: "What happens if my exchange order is cancelled by Cashify?",
        answer: "If Cashify cancels your order, you will be notified with the reason. You can then place a new order or contact support for clarification.",
      },
      {
        question: "Can I appeal Cashify's decision to cancel my order?",
        answer: "Yes, you can appeal by contacting customer support. They will review your case and provide further assistance.",
      },
    ],
  };

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const tabIcons = {
    SellSmart: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    SmartBuy: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    "Repair/Others": (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" />
      </svg>
    ),
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700&family=DM+Sans:wght@400;500&display=swap');
        .faq-section * { box-sizing: border-box; }
        .faq-tab-btn { transition: all 0.2s ease; }
        .faq-tab-btn:hover { transform: translateY(-1px); }
        .faq-item { transition: box-shadow 0.2s ease, border-color 0.2s ease; }
        .faq-item:hover { border-color: #d1fae5 !important; box-shadow: 0 4px 16px rgba(5,150,105,0.07) !important; }
        .faq-toggle-btn { transition: background 0.18s ease; }
        .faq-toggle-btn:hover { background: #f0fdf4 !important; }
        .faq-answer { animation: slidedown 0.22s ease; }
        @keyframes slidedown { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
        .load-more-btn { transition: all 0.18s ease; }
        .load-more-btn:hover { background: #ecfdf5 !important; border-color: #00b4d8ff !important; color: #0077b6ff !important; }
      `}</style>

      <section className="faq-section" style={{ padding: "56px 0", background: "#f8faf9", fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#1132d4", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" fill="none" stroke="#ffffff" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#1132d4", textTransform: "uppercase", fontFamily: "'Sora', sans-serif" }}>
                Help Centre
              </span>
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: "0 0 8px", letterSpacing: "-0.02em", lineHeight: 1.2, fontFamily: "'Sora', sans-serif" }}>
              Frequently Asked Questions
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
              Find quick answers to the most common questions about our services.
            </p>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
            {Object.keys(faqData).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  className="faq-tab-btn"
                  onClick={() => { setActiveTab(tab); setOpenIndex(null); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "9px 18px", borderRadius: 30,
                    fontSize: 13, fontWeight: 600,
                    fontFamily: "'Sora', sans-serif",

                    cursor: "pointer", outline: "none",
                    border: isActive ? "1.5px solid #0077b6ff" : "1.5px solid #e2e8f0",
                    background: isActive ? "#1132d4" : "#ffffff",
                    color: isActive ? "#ffffff" : "#475569",
                    boxShadow: isActive ? "0 4px 14px hsla(190, 77%, 88%, 1)" : "0 1px 3px rgba(0,0,0,0.05)",
                  }}
                >
                  <span style={{ opacity: isActive ? 1 : 0.6 }}>{tabIcons[tab]}</span>
                  {tab}
                </button>
              );
            })}
          </div>

          {/* FAQ Items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {faqData[activeTab].map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="faq-item"
                  style={{
                    background: "#ffffff",
                    borderRadius: 14,
                    border: isOpen ? "1.5px solid #0077b6ff" : "1.5px solid #e8f0ec",
                    overflow: "hidden",
                    boxShadow: isOpen ? "0 4px 20px rgba(5,150,105,0.08)" : "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <button
                    className="faq-toggle-btn"
                    onClick={() => toggleQuestion(index)}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "18px 20px",
                      background: isOpen ? "#caf0f8ff4" : "transparent",
                      border: "none", cursor: "pointer", outline: "none",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{
                      fontSize: 14, fontWeight: 600, color: "#1e293b",
                      lineHeight: 1.5, fontFamily: "'Sora', sans-serif",
                    }}>
                      {faq.question}
                    </span>

                    {/* +/- icon */}
                    <span style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: isOpen ? "#1132d4" : "#f1f5f9",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}>
                      <svg
                        width="14" height="14"
                        fill="none" stroke={isOpen ? "#fff" : "#64748b"}
                        strokeWidth="2.5" viewBox="0 0 24 24"
                        style={{ transition: "transform 0.25s ease", transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>

                  {isOpen && (
                    <div
                      className="faq-answer"
                      style={{
                        padding: "0 20px 20px",
                        fontSize: 13.5, color: "#475569", lineHeight: 1.75,
                        borderTop: "1px solid #00b4d8ff",
                        paddingTop: 14,
                      }}
                    >
                      <div style={{ display: "flex", gap: 10 }}>
                        <div style={{ width: 3, borderRadius: 4, background: "#0077b6ff", flexShrink: 0, alignSelf: "stretch" }} />
                        <p style={{ margin: 0 }}>{faq.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Load More */}
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <button
              className="load-more-btn"
              style={{
                display: "inline-flex", alignItems: "center", gap: 7,
                padding: "11px 28px", borderRadius: 30,
                fontSize: 13, fontWeight: 600, color: "#0f172a",
                background: "#ffffff", border: "1.5px solid #1132d4",
                cursor: "pointer", outline: "none",
                fontFamily: "'Sora', sans-serif",
                boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
              Load More FAQs
            </button>
          </div>

        </div>
      </section>
    </>
  );
}