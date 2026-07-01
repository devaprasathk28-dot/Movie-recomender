import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, Film, Star } from "lucide-react";
import MovieCard from "../components/MovieCard";

export default function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("watchlist") || "[]");
    setWatchlist(list);
  }, []);

  const handleClearWatchlist = () => {
    if (window.confirm("Are you sure you want to clear your entire watchlist?")) {
      localStorage.setItem("watchlist", "[]");
      setWatchlist([]);
      window.dispatchEvent(new Event("watchlistUpdated"));
    }
  };

  return (
    <div style={{ padding: "40px 6%", display: "flex", flexDirection: "column", gap: "28px", minHeight: "80vh" }}>
      {/* Page Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
        textAlign: "left"
      }}>
        <div>
          <h1 style={{ fontFamily: "var(--heading)", fontWeight: 800, fontSize: "36px", margin: 0 }}>
            My Watchlist
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
            Manage your personal cinema collection and review your saved movies.
          </p>
        </div>

        {watchlist.length > 0 && (
          <button
            onClick={handleClearWatchlist}
            className="btn-secondary"
            style={{
              borderColor: "rgba(244, 63, 94, 0.2)",
              color: "#f43f5e",
              fontSize: "14px",
              padding: "8px 16px"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(244, 63, 94, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
            }}
          >
            <Trash2 size={16} />
            <span>Clear Watchlist</span>
          </button>
        )}
      </div>

      {/* Grid Content */}
      {watchlist.length === 0 ? (
        <div className="glass-panel" style={{
          padding: "80px 24px",
          borderRadius: "16px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
          border: "1px dashed rgba(255, 255, 255, 0.15)"
        }}>
          <div style={{
            background: "rgba(244, 63, 94, 0.1)",
            color: "#f43f5e",
            width: "54px",
            height: "54px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Heart size={26} fill="#f43f5e" color="#f43f5e" />
          </div>
          <div style={{ maxWidth: "450px" }}>
            <h3 style={{ fontFamily: "var(--heading)", fontWeight: 600, fontSize: "18px", marginBottom: "6px" }}>
              Your Watchlist is Empty
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Keep track of movies you want to watch by clicking the plus icon (+) on any movie card or checking details.
            </p>
          </div>
          <Link to="/discover" className="btn-primary" style={{ fontSize: "14px" }}>
            <Film size={16} /> Discover Movies
          </Link>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "24px"
        }}>
          {watchlist.map((movie, idx) => (
            <MovieCard key={idx} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
