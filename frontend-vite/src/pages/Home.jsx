import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Plus, Check, Star, Film, Sparkles, TrendingUp, Info } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import MovieCard from "../components/MovieCard";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Home() {
  const [trending, setTrending] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistEmpty, setWatchlistEmpty] = useState(true);
  const [seedMovie, setSeedMovie] = useState("");
  const navigate = useNavigate();

  // Load trending
  useEffect(() => {
    setLoadingTrending(true);
    axios
      .get("/trending")
      .then((res) => {
        const trendingList = res.data.trending || [];
        setTrending(trendingList);
        if (trendingList.length > 0) {
          // Select a random movie or the first movie for the Hero Banner
          setHeroMovie(trendingList[0]);
        }
        setLoadingTrending(false);
      })
      .catch((err) => {
        console.error("Trending fetch error:", err);
        setLoadingTrending(false);
      });
  }, []);

  // Check watchlist & load personalized recommendations
  useEffect(() => {
    const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    setWatchlistEmpty(watchlist.length === 0);

    if (watchlist.length > 0) {
      // Pick the latest added movie to the watchlist as the seed
      const latestSeed = watchlist[watchlist.length - 1];
      setSeedMovie(latestSeed.title);
      setLoadingRecs(true);

      axios
        .get(`/recommend/${encodeURIComponent(latestSeed.title)}?limit=6`)
        .then((res) => {
          setRecommended(res.data.recommendations || []);
          setLoadingRecs(false);
        })
        .catch((err) => {
          console.error("Personalized recommendations fetch error:", err);
          setLoadingRecs(false);
        });
    } else {
      setRecommended([]);
    }
  }, []);

  // Update inWatchlist for heroMovie
  useEffect(() => {
    if (heroMovie) {
      const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
      setInWatchlist(watchlist.some((m) => m.imdbId === heroMovie.imdbId));
    }
  }, [heroMovie]);

  const toggleHeroWatchlist = () => {
    if (!heroMovie) return;
    const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    let updated;
    if (inWatchlist) {
      updated = watchlist.filter((m) => m.imdbId !== heroMovie.imdbId);
    } else {
      updated = [...watchlist, heroMovie];
    }
    localStorage.setItem("watchlist", JSON.stringify(updated));
    setInWatchlist(!inWatchlist);
    window.dispatchEvent(new Event("watchlistUpdated"));
  };

  const handleHeroClick = () => {
    if (heroMovie) navigate(`/movie/${heroMovie.imdbId}`);
  };

  return (
    <div style={{ padding: "0 0 60px 0" }}>
      {/* 🎬 HERO BANNER */}
      {heroMovie && (
        <div style={{
          position: "relative",
          width: "100%",
          height: "70vh",
          minHeight: "450px",
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
          borderBottom: "1px solid var(--border-color)"
        }}>
          {/* Backdrop Image */}
          <div style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${heroMovie.backdrop})`,
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
            zIndex: 1
          }} />

          {/* Overlay Gradient */}
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, var(--bg-dark) 0%, rgba(8, 9, 12, 0.4) 60%, rgba(8, 9, 12, 0.8) 100%)",
            zIndex: 2
          }} />

          {/* Hero Content */}
          <div style={{
            position: "relative",
            zIndex: 3,
            maxWidth: "800px",
            padding: "40px 6%",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            alignItems: "flex-start"
          }}>
            {/* Tagline */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0, 242, 254, 0.15)",
              color: "var(--accent-cyan)",
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "1px"
            }}>
              <TrendingUp size={12} />
              <span>FEATURED MOVIE</span>
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: "var(--heading)",
              fontSize: "clamp(32px, 6vw, 54px)",
              fontWeight: 800,
              lineHeight: "1.1",
              margin: 0,
              color: "#fff",
              textAlign: "left",
              textShadow: "0 2px 10px rgba(0,0,0,0.5)"
            }}>
              {heroMovie.title}
            </h1>

            {/* Rating & Metadata */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Star size={16} fill="var(--rating-gold)" color="var(--rating-gold)" />
                <span style={{ fontWeight: 700 }}>{heroMovie.rating > 0 ? heroMovie.rating.toFixed(1) : "N/A"}</span>
              </div>
              <span style={{ color: "var(--text-muted)" }}>•</span>
              <span>{heroMovie.year}</span>
              <span style={{ color: "var(--text-muted)" }}>•</span>
              <span style={{
                color: "var(--accent-cyan)",
                background: "rgba(0, 242, 254, 0.08)",
                padding: "2px 8px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: 600
              }}>
                {heroMovie.genre ? heroMovie.genre.split("|")[0] : "Cinema"}
              </span>
            </div>

            {/* Description */}
            <p style={{
              color: "var(--text-secondary)",
              lineHeight: "1.6",
              fontSize: "16px",
              textAlign: "left",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textShadow: "0 1px 4px rgba(0,0,0,0.5)"
            }}>
              {heroMovie.overview || "No overview available for this title. Tap details to discover more information about cast, writers, and ratings."}
            </p>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
              <button onClick={handleHeroClick} className="btn-primary">
                <Info size={18} />
                <span>View Details</span>
              </button>
              <button onClick={toggleHeroWatchlist} className="btn-secondary">
                {inWatchlist ? <Check size={18} /> : <Plus size={18} />}
                <span>{inWatchlist ? "In Watchlist" : "Watchlist"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ padding: "40px 6% 0 6%", display: "flex", flexDirection: "column", gap: "48px" }}>
        
        {/* 🎬 TRENDING SECTION */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <TrendingUp size={20} color="var(--accent-cyan)" />
            <h2 style={{ fontFamily: "var(--heading)", fontWeight: 700, margin: 0 }}>
              Trending Now
            </h2>
          </div>

          {loadingTrending ? (
            <SkeletonLoader count={6} />
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "24px"
            }}>
              {trending.slice(0, 6).map((movie, index) => (
                <MovieCard key={index} movie={movie} />
              ))}
            </div>
          )}
        </section>

        {/* 🔮 PERSONALIZED RECOMMENDATIONS SECTION */}
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <Sparkles size={20} color="var(--accent-purple)" />
            <h2 style={{ fontFamily: "var(--heading)", fontWeight: 700, margin: 0 }}>
              Recommended For You
            </h2>
          </div>

          {watchlistEmpty ? (
            /* Watchlist Empty Helper Panel */
            <div className="glass-panel" style={{
              padding: "40px 24px",
              borderRadius: "16px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              marginTop: "16px",
              border: "1px dashed rgba(255, 255, 255, 0.15)"
            }}>
              <div style={{
                background: "rgba(127, 0, 255, 0.1)",
                color: "var(--accent-purple)",
                width: "54px",
                height: "54px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Sparkles size={26} />
              </div>
              <div style={{ maxWidth: "480px" }}>
                <h3 style={{ fontFamily: "var(--heading)", fontWeight: 600, fontSize: "18px", marginBottom: "6px" }}>
                  Unlock Personalized Recommendations
                </h3>
                <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                  Add movies to your **Watchlist**! Cineverse analyzes your saved films and generates customized suggestions based on vector similarities.
                </p>
              </div>
              <Link to="/discover" className="btn-primary" style={{ fontSize: "14px" }}>
                <Film size={16} /> Explore Movies
              </Link>
            </div>
          ) : (
            /* Recommendations Grid */
            <div>
              <p style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                marginBottom: "20px",
                textAlign: "left"
              }}>
                Based on your interest in <span style={{ color: "var(--accent-cyan)", fontWeight: 600 }}>{seedMovie}</span>:
              </p>
              {loadingRecs ? (
                <SkeletonLoader count={6} />
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                  gap: "24px"
                }}>
                  {recommended.map((movie, index) => (
                    <MovieCard key={index} movie={movie} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
