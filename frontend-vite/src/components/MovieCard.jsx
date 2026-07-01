import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Plus, Check, Play } from "lucide-react";
import { motion } from "framer-motion";

export default function MovieCard({ movie }) {
  const [inWatchlist, setInWatchlist] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    setInWatchlist(watchlist.some((m) => m.imdbId === movie.imdbId));
  }, [movie.imdbId]);

  const toggleWatchlist = (e) => {
    e.stopPropagation();
    const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    let updated;
    if (inWatchlist) {
      updated = watchlist.filter((m) => m.imdbId !== movie.imdbId);
    } else {
      updated = [...watchlist, movie];
    }
    localStorage.setItem("watchlist", JSON.stringify(updated));
    setInWatchlist(!inWatchlist);

    // Dispatch a custom event to notify Header
    window.dispatchEvent(new Event("watchlistUpdated"));
  };

  const handleCardClick = () => {
    navigate(`/movie/${movie.imdbId}`);
  };

  const posterSrc = movie.poster && movie.poster !== "N/A"
    ? movie.poster
    : "https://placehold.co/300x450?text=No+Poster";

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={handleCardClick}
      style={{
        position: "relative",
        background: "var(--bg-surface)",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid var(--border-color)",
        cursor: "pointer",
        aspectRatio: "2/3",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
      }}
    >
      {/* Poster Image */}
      <img
        src={posterSrc}
        alt={movie.title}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "filter 0.3s ease"
        }}
        loading="lazy"
      />

      {/* Floating Rating Badge */}
      <div style={{
        position: "absolute",
        top: "12px",
        left: "12px",
        background: "rgba(10, 11, 16, 0.85)",
        backdropFilter: "blur(4px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "6px",
        padding: "4px 8px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        zIndex: 2,
        fontSize: "12px",
        fontWeight: "600",
        color: "var(--text-primary)"
      }}>
        <Star size={12} fill="var(--rating-gold)" color="var(--rating-gold)" />
        <span>{movie.rating > 0 ? movie.rating.toFixed(1) : "N/A"}</span>
      </div>

      {/* Hover Overlay */}
      <div
        className="card-overlay"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, rgba(8, 9, 12, 0.95) 20%, rgba(8, 9, 12, 0.6) 60%, transparent 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "16px",
          opacity: 0,
          transition: "opacity 0.3s ease",
          zIndex: 3
        }}
        onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
        onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
      >
        {/* Play Icon */}
        <div style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 15px rgba(0, 242, 254, 0.4)"
        }}>
          <Play size={18} color="#000" fill="#000" style={{ marginLeft: "2px" }} />
        </div>

        {/* Watchlist Toggle */}
        <button
          onClick={toggleWatchlist}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: inWatchlist ? "var(--accent-cyan)" : "rgba(10, 11, 16, 0.85)",
            backdropFilter: "blur(4px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: inWatchlist ? "#000" : "var(--text-primary)",
            transition: "all 0.2s ease"
          }}
        >
          {inWatchlist ? <Check size={16} strokeWidth={2.5} /> : <Plus size={16} />}
        </button>

        {/* Title, Year & Genres */}
        <h3 style={{
          fontSize: "15px",
          fontWeight: "700",
          fontFamily: "var(--heading)",
          lineHeight: "1.2",
          marginBottom: "4px",
          color: "var(--text-primary)"
        }}>
          {movie.title}
        </h3>
        
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "var(--text-secondary)",
          marginBottom: "6px"
        }}>
          <span>{movie.year}</span>
          <span style={{
            fontSize: "11px",
            color: "var(--accent-cyan)",
            fontWeight: "500"
          }}>
            {movie.runtime || "N/A"}
          </span>
        </div>

        <p style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis"
        }}>
          {movie.genre ? movie.genre.replace(/\|/g, ", ") : ""}
        </p>
      </div>
    </motion.div>
  );
}
