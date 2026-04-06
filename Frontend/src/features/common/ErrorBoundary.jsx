import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center text-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function RouteErrorBoundary({ children, fallbackPath = "/" }) {
  return (
    <ErrorBoundary
      fallback={
        <div style={{
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          fontFamily: "sans-serif"
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1e293b" }}>
            Something went wrong
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            This section crashed. Rest of the app is fine.
          </p>
          <a href={fallbackPath} style={{
            padding: "8px 20px",
            background: "#1132d4",
            color: "#fff",
            borderRadius: 10,
            fontSize: 14,
            textDecoration: "none"
          }}>
            Go Back
          </a>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}