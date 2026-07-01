import React from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";

// Components
import Header from "./components/Header";
import Footer from "./components/Footer";

// Pages
import Home from "./pages/Home";
import MovieDetails from "./pages/MovieDetails";
import Discover from "./pages/Discover";
import Watchlist from "./pages/Watchlist";
import Analytics from "./pages/Analytics";
import About from "./pages/About";

// Configure Axios defaults dynamically to support both Dev server (port 5173) and production build (served by backend)
axios.defaults.baseURL =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000/api"
    : "/api";

export default function App() {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
      backgroundColor: "var(--bg-dark)",
      color: "var(--text-primary)"
    }}>
      {/* Navigation Header */}
      <Header />

      {/* Main Pages Router */}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movie/:imdbId" element={<MovieDetails />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/about" element={<About />} />
          {/* Fallback to Home */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}