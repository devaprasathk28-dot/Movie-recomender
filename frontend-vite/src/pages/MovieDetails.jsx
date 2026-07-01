import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Plus, Check, Play, User, Calendar, Clock, Compass, ShieldAlert, Award } from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import MovieCard from "../components/MovieCard";
import SkeletonLoader from "../components/SkeletonLoader";

export default function MovieDetails() {
  const { imdbId } = useParams();
  const [movie, setMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [error, setError] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);

  // Reviews and ratings state
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [reviews, setReviews] = useState([]);

  // Fetch movie details
  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`/movie/${imdbId}`)
      .then((res) => {
        if (res.data.error) {
          setError(res.data.error);
          setLoading(false);
          return;
        }
        setMovie(res.data);
        setLoading(false);
        
        // Check watchlist
        const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
        setInWatchlist(watchlist.some((m) => m.imdbId === res.data.imdbId));

        // Load reviews from local storage
        const key = `reviews_${res.data.imdbId}`;
        const storedReviews = JSON.parse(localStorage.getItem(key) || "[]");
        if (storedReviews.length === 0) {
          // Add default premium mockup review
          const mockReviews = [
            {
              author: "Elena Rostova",
              rating: 5,
              comment: `Absolutely brilliant! The narrative depth and visual effects are breathtaking. A landmark in modern cinema.`,
              date: "2 days ago"
            },
            {
              author: "Marcus Vance",
              rating: 4,
              comment: `Highly engaging with stellar performances. The soundtrack complements the pacing perfectly. Well worth a watch!`,
              date: "1 week ago"
            }
          ];
          localStorage.setItem(key, JSON.stringify(mockReviews));
          setReviews(mockReviews);
        } else {
          setReviews(storedReviews);
        }

        // Fetch recommendations for this movie title
        setLoadingRecs(true);
        axios
          .get(`/recommend/${encodeURIComponent(res.data.title)}?limit=6`)
          .then((recRes) => {
            setRecommendations(recRes.data.recommendations || []);
            setLoadingRecs(false);
          })
          .catch((err) => {
            console.error("Recs fetch error:", err);
            setLoadingRecs(false);
          });
      })
      .catch((err) => {
        console.error("Movie fetch error:", err);
        setError("Error fetching movie details. Please try again.");
        setLoading(false);
      });
  }, [imdbId]);

  const toggleWatchlist = () => {
    if (!movie) return;
    const watchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    let updated;
    if (inWatchlist) {
      updated = watchlist.filter((m) => m.imdbId !== movie.imdbId);
    } else {
      updated = [...watchlist, movie];
    }
    localStorage.setItem("watchlist", JSON.stringify(updated));
    setInWatchlist(!inWatchlist);
    window.dispatchEvent(new Event("watchlistUpdated"));
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    const newReview = {
      author: "You (Local User)",
      rating: Number(ratingInput),
      comment: commentInput.trim(),
      date: "Just now"
    };

    const key = `reviews_${movie.imdbId}`;
    const updatedReviews = [newReview, ...reviews];
    localStorage.setItem(key, JSON.stringify(updatedReviews));
    setReviews(updatedReviews);
    setCommentInput("");
  };

  if (loading) {
    return (
      <div style={{ padding: "40px 6%" }}>
        <div style={{ height: "400px", borderRadius: "16px", marginBottom: "32px" }} className="shimmer" />
        <SkeletonLoader count={4} />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div style={{
        padding: "80px 24px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px"
      }}>
        <ShieldAlert size={48} color="var(--accent-purple)" />
        <h2 style={{ fontFamily: "var(--heading)" }}>Movie Details Error</h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: "450px" }}>
          {error || "We couldn't retrieve information for this specific title. It might not be available in our MovieLens dataset."}
        </p>
        <Link to="/discover" className="btn-primary" style={{ marginTop: "12px" }}>
          Go to Discover
        </Link>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* 🎬 Hero Banner / Backdrop */}
      <div style={{
        position: "relative",
        height: "45vh",
        minHeight: "300px",
        overflow: "hidden"
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `url(${movie.backdrop})`,
          backgroundSize: "cover",
          backgroundPosition: "center 20%",
          filter: "blur(2px) brightness(0.4)"
        }} />
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to top, var(--bg-dark) 0%, rgba(8, 9, 12, 0.4) 100%)"
        }} />
      </div>

      {/* 🎬 Split Content Layout */}
      <div style={{
        padding: "0 6% 60px 6%",
        marginTop: "-180px",
        position: "relative",
        zIndex: 5,
        display: "grid",
        gridTemplateColumns: "300px 1fr",
        gap: "40px",
        alignItems: "start"
      }} className="movie-details-grid">
        {/* Left Column: Poster & Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid var(--border-color)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
              aspectRatio: "2/3"
            }}
          >
            <img
              src={movie.poster !== "N/A" ? movie.poster : "https://placehold.co/300x450?text=No+Poster"}
              alt={movie.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </motion.div>

          <button onClick={toggleWatchlist} className={inWatchlist ? "btn-secondary" : "btn-primary"} style={{ width: "100%", justifyContent: "center" }}>
            {inWatchlist ? <Check size={18} /> : <Plus size={18} />}
            <span>{inWatchlist ? "In Watchlist" : "Add to Watchlist"}</span>
          </button>
        </div>

        {/* Right Column: Information & Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {/* Metadata Block */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
            <h1 style={{
              fontFamily: "var(--heading)",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 800,
              textAlign: "left",
              margin: 0,
              lineHeight: "1.1"
            }}>
              {movie.title}
            </h1>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px", fontSize: "14px", color: "var(--text-secondary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Star size={16} fill="var(--rating-gold)" color="var(--rating-gold)" />
                <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                  {movie.rating > 0 ? movie.rating.toFixed(1) : "N/A"}
                </span>
                <span style={{ fontSize: "12px" }}>/ 10</span>
              </div>
              <span>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={14} /> {movie.released || movie.year}</span>
              <span>•</span>
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14} /> {movie.runtime || "N/A"}</span>
            </div>

            {/* Genres Row */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
              {movie.genre.split("|").map((g, i) => (
                <span key={i} style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "20px",
                  padding: "4px 14px",
                  fontSize: "12px",
                  fontWeight: 500,
                  color: "var(--text-secondary)"
                }}>
                  {g.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Synopsis */}
          <div style={{ textAlign: "left" }}>
            <h2 style={{ fontFamily: "var(--heading)", fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>Synopsis</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: "1.7", fontSize: "15px" }}>
              {movie.overview || "Plot outline is not currently available for this selection. Connect to OMDb API or browse suggestions below."}
            </p>
          </div>

          {/* Director & Cast Panel */}
          {(movie.director || movie.actors) && (
            <div className="glass-panel" style={{
              padding: "20px",
              borderRadius: "12px",
              textAlign: "left",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px"
            }}>
              {movie.director && (
                <div>
                  <h4 style={{ color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Director</h4>
                  <p style={{ fontSize: "15px", fontWeight: 600, marginTop: "4px" }}>{movie.director}</p>
                </div>
              )}
              {movie.actors && (
                <div>
                  <h4 style={{ color: "var(--text-muted)", fontSize: "12px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Starring Cast</h4>
                  <p style={{ fontSize: "15px", fontWeight: 500, marginTop: "4px", color: "var(--text-secondary)" }}>{movie.actors}</p>
                </div>
              )}
            </div>
          )}

          {/* 🎬 Watch Trailer Embed */}
          <div style={{ textAlign: "left" }}>
            <h2 style={{ fontFamily: "var(--heading)", fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>Official Trailer</h2>
            <div className="glass-panel" style={{
              position: "relative",
              paddingBottom: "56.25%", /* 16:9 Aspect Ratio */
              height: 0,
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 10px 20px rgba(0,0,0,0.3)"
            }}>
              <iframe
                src={
                  movie.youtube_trailer_id
                    ? `https://www.youtube.com/embed/${movie.youtube_trailer_id}`
                    : `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(movie.title + " trailer")}`
                }
                title="Official Trailer"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  border: 0
                }}
                allowFullScreen
              />
            </div>
          </div>

          {/* 🔮 WHY RECOMMENDED EXPLANATION */}
          <div className="glass-panel" style={{
            padding: "20px",
            borderRadius: "12px",
            textAlign: "left",
            borderLeft: "4px solid var(--accent-cyan)",
            display: "flex",
            alignItems: "flex-start",
            gap: "14px"
          }}>
            <Award size={24} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <h4 style={{ fontSize: "15px", fontWeight: 700, marginBottom: "4px" }}>Why Cineverse Recommends This</h4>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                This film features high-affinity vector similarities with other {movie.genre.split("|")[0].trim()} titles in our ML indexing engine. It shares core thematic characteristics and tags, specifically matching the genre profiles of: {movie.genre.replace(/\|/g, ", ")}.
              </p>
            </div>
          </div>

          {/* 💬 Ratings & Reviews Section */}
          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2 style={{ fontFamily: "var(--heading)", fontSize: "20px", fontWeight: 700 }}>Ratings & Reviews</h2>

            {/* Review Form */}
            <form onSubmit={handleAddReview} className="glass-panel" style={{
              padding: "20px",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-secondary)" }}>Your Rating:</span>
                <select
                  value={ratingInput}
                  onChange={(e) => setRatingInput(e.target.value)}
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid var(--border-color)",
                    color: "#fff",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    outline: "none"
                  }}
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                  <option value={3}>⭐⭐⭐ (3/5)</option>
                  <option value={2}>⭐⭐ (2/5)</option>
                  <option value={1}>⭐ (1/5)</option>
                </select>
              </div>

              <textarea
                placeholder="Share your thoughts about this movie..."
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                rows={3}
                required
                className="form-input"
                style={{
                  width: "100%",
                  resize: "none",
                  background: "rgba(0,0,0,0.2)",
                  fontSize: "14px",
                  lineHeight: "1.5"
                }}
              />

              <button type="submit" className="btn-primary" style={{ width: "max-content", fontSize: "14px" }}>
                Submit Review
              </button>
            </form>

            {/* Reviews Timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {reviews.map((rev, index) => (
                <div key={index} className="glass-panel" style={{
                  padding: "16px",
                  borderRadius: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        background: "rgba(255,255,255,0.06)",
                        padding: "6px",
                        borderRadius: "50%",
                        color: "var(--text-secondary)",
                        display: "flex"
                      }}>
                        <User size={14} />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: "14px" }}>{rev.author}</span>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{rev.date}</span>
                  </div>

                  <div style={{ display: "flex", gap: "2px" }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={12}
                        fill={i < rev.rating ? "var(--rating-gold)" : "transparent"}
                        color={i < rev.rating ? "var(--rating-gold)" : "var(--border-color)"}
                      />
                    ))}
                  </div>

                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5", marginTop: "4px" }}>
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Similar Movies Carousel / Grid */}
          <div style={{ textAlign: "left", marginTop: "20px" }}>
            <h2 style={{ fontFamily: "var(--heading)", fontSize: "20px", fontWeight: 700, marginBottom: "16px" }}>Similar Movies</h2>
            {loadingRecs ? (
              <SkeletonLoader count={4} />
            ) : recommendations.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No similar recommendations found.</p>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "24px"
              }}>
                {recommendations.map((recMovie, idx) => (
                  <MovieCard key={idx} movie={recMovie} />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
