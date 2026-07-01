import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Film, Search, Heart, BarChart2, Home, Sparkles, Info } from "lucide-react";
import axios from "axios";

export default function Header() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const suggestRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load watchlist count
  useEffect(() => {
    const updateCount = () => {
      const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
      setWatchlistCount(watchlist.length);
    };
    updateCount();
    window.addEventListener("storage", updateCount);
    // Custom event listener for local changes
    window.addEventListener("watchlistUpdated", updateCount);
    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("watchlistUpdated", updateCount);
    };
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    if (query.trim().length > 1) {
      const delayDebounce = setTimeout(async () => {
        try {
          const res = await axios.get(`/search?q=${encodeURIComponent(query)}`);
          setSuggestions(res.data.results || []);
        } catch (err) {
          console.error("Suggestions error:", err);
        }
      }, 300);
      return () => clearTimeout(delayDebounce);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (suggestRef.current && !suggestRef.current.contains(event.target)) {
        setShowSuggest(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (movie) => {
    setQuery("");
    setShowSuggest(false);
    navigate(`/movie/${movie.imdbId}`);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/discover?q=${encodeURIComponent(query.trim())}`);
      setShowSuggest(false);
    }
  };

  return (
    <header className="glass-panel" style={{
      position: "sticky",
      top: 0,
      zIndex: 100,
      borderBottom: "1px solid var(--border-color)",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "20px"
    }}>
      {/* Logo */}
      <Link to="/" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{
          background: "linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)",
          padding: "8px",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <Film size={22} color="#000" />
        </div>
        <span className="glow-text" style={{
          fontFamily: "var(--heading)",
          fontSize: "22px",
          fontWeight: 800,
          background: "linear-gradient(to right, #00f2fe, #7f00ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.5px"
        }}>
          CINEVERSE
        </span>
      </Link>

      {/* Global Search Bar */}
      <form onSubmit={handleSearchSubmit} ref={suggestRef} style={{
        position: "relative",
        flex: "0 1 400px",
        display: "flex",
        alignItems: "center"
      }}>
        <div style={{
          position: "absolute",
          left: "14px",
          color: "var(--text-secondary)",
          display: "flex",
          alignItems: "center"
        }}>
          <Search size={16} />
        </div>
        <input
          type="text"
          placeholder="Search movies by title..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggest(true);
          }}
          onFocus={() => setShowSuggest(true)}
          className="form-input"
          style={{
            width: "100%",
            paddingLeft: "42px",
            paddingRight: "16px",
            background: "rgba(255,255,255,0.03)",
            fontSize: "14px",
            border: "1px solid rgba(255,255,255,0.08)"
          }}
        />

        {/* Search Suggestions */}
        {showSuggest && suggestions.length > 0 && (
          <div className="glass-panel" style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.1)",
            zIndex: 110
          }}>
            {suggestions.map((movie) => (
              <div
                key={movie.movieId}
                onClick={() => handleSelectSuggestion(movie)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  transition: "background 0.2s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <div>
                  <div style={{ fontWeight: 500, fontSize: "14px", color: "var(--text-primary)" }}>
                    {movie.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {movie.genres.replace(/\|/g, ", ")}
                  </div>
                </div>
                <div style={{ fontSize: "12px", color: "var(--accent-cyan)", fontWeight: 500 }}>
                  {movie.year}
                </div>
              </div>
            ))}
          </div>
        )}
      </form>

      {/* Navigation */}
      <nav style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            color: location.pathname === "/" ? "var(--accent-cyan)" : "var(--text-secondary)",
            background: location.pathname === "/" ? "rgba(0, 242, 254, 0.08)" : "transparent",
            fontSize: "14px",
            fontWeight: 500,
            transition: "all 0.2s ease"
          }}
        >
          <Home size={16} />
          <span>Home</span>
        </Link>
        <Link
          to="/discover"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            color: location.pathname === "/discover" ? "var(--accent-cyan)" : "var(--text-secondary)",
            background: location.pathname === "/discover" ? "rgba(0, 242, 254, 0.08)" : "transparent",
            fontSize: "14px",
            fontWeight: 500,
            transition: "all 0.2s ease"
          }}
        >
          <Sparkles size={16} />
          <span>Discover</span>
        </Link>
        <Link
          to="/watchlist"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            color: location.pathname === "/watchlist" ? "var(--accent-cyan)" : "var(--text-secondary)",
            background: location.pathname === "/watchlist" ? "rgba(0, 242, 254, 0.08)" : "transparent",
            fontSize: "14px",
            fontWeight: 500,
            position: "relative",
            transition: "all 0.2s ease"
          }}
        >
          <Heart size={16} />
          <span>Watchlist</span>
          {watchlistCount > 0 && (
            <span style={{
              position: "absolute",
              top: "-5px",
              right: "-2px",
              background: "linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)",
              color: "#000",
              fontSize: "10px",
              fontWeight: "700",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--bg-dark)"
            }}>
              {watchlistCount}
            </span>
          )}
        </Link>
        <Link
          to="/analytics"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            color: location.pathname === "/analytics" ? "var(--accent-cyan)" : "var(--text-secondary)",
            background: location.pathname === "/analytics" ? "rgba(0, 242, 254, 0.08)" : "transparent",
            fontSize: "14px",
            fontWeight: 500,
            transition: "all 0.2s ease"
          }}
        >
          <BarChart2 size={16} />
          <span>Analytics</span>
        </Link>
        <Link
          to="/about"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            color: location.pathname === "/about" ? "var(--accent-cyan)" : "var(--text-secondary)",
            background: location.pathname === "/about" ? "rgba(0, 242, 254, 0.08)" : "transparent",
            fontSize: "14px",
            fontWeight: 500,
            transition: "all 0.2s ease"
          }}
        >
          <Info size={16} />
          <span>About</span>
        </Link>
      </nav>
    </header>
  );
}
