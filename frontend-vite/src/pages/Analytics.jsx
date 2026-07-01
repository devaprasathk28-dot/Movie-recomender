import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BarChart2, Clock, Heart, Award, Star, Library } from "lucide-react";

export default function Analytics() {
  const [watchlist, setWatchlist] = useState([]);
  const [stats, setStats] = useState({
    totalMinutes: 0,
    averageRating: 0,
    topGenres: [],
    decades: {}
  });

  useEffect(() => {
    const list = JSON.parse(localStorage.getItem("watchlist") || "[]");
    setWatchlist(list);

    if (list.length > 0) {
      calculateStats(list);
    }
  }, []);

  const calculateStats = (items) => {
    let totalMinutes = 0;
    let ratingsSum = 0;
    let ratingsCount = 0;
    const genreMap = {};
    const decadeMap = {};

    items.forEach((movie) => {
      // 1. Calculate Runtime Minutes
      if (movie.runtime) {
        const match = movie.runtime.match(/(\d+)/);
        if (match) {
          totalMinutes += parseInt(match[1]);
        }
      } else {
        totalMinutes += 120; // Default estimate
      }

      // 2. Average Rating
      if (movie.rating && movie.rating > 0) {
        ratingsSum += movie.rating;
        ratingsCount++;
      }

      // 3. Genres count
      if (movie.genre) {
        // Support both "Action|Comedy" (from database) and "Action, Comedy" (from OMDb details)
        const separators = /[|,]/;
        movie.genre.split(separators).forEach((g) => {
          const clean = g.trim();
          if (clean && clean !== "(no genres listed)" && clean !== "N/A") {
            genreMap[clean] = (genreMap[clean] || 0) + 1;
          }
        });
      }

      // 4. Decades count
      if (movie.year) {
        const decade = Math.floor(movie.year / 10) * 10;
        const label = `${decade}s`;
        decadeMap[label] = (decadeMap[label] || 0) + 1;
      }
    });

    // Process top genres
    const topGenres = Object.entries(genreMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Process decades
    const decades = Object.entries(decadeMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setStats({
      totalMinutes,
      averageRating: ratingsCount > 0 ? ratingsSum / ratingsCount : 0,
      topGenres,
      decades
    });
  };

  const formatRuntime = (mins) => {
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hrs}h ${remainingMins}m`;
  };

  if (watchlist.length === 0) {
    return (
      <div style={{ padding: "40px 6%", display: "flex", flexDirection: "column", gap: "28px", minHeight: "80vh" }}>
        <div style={{ textAlign: "left" }}>
          <h1 style={{ fontFamily: "var(--heading)", fontWeight: 800, fontSize: "36px", margin: 0 }}>
            Taste Analytics
          </h1>
        </div>

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
            background: "rgba(0, 242, 254, 0.1)",
            color: "var(--accent-cyan)",
            width: "54px",
            height: "54px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <BarChart2 size={26} />
          </div>
          <div style={{ maxWidth: "450px" }}>
            <h3 style={{ fontFamily: "var(--heading)", fontWeight: 600, fontSize: "18px", marginBottom: "6px" }}>
              Analytics Unavailable
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Add movies to your **Watchlist** to view dynamic visual insights about your movie preferences, genres breakdown, and release timelines!
            </p>
          </div>
          <Link to="/discover" className="btn-primary" style={{ fontSize: "14px" }}>
            Start Exploring
          </Link>
        </div>
      </div>
    );
  }

  // Find max genre count for progress bar percentage
  const maxGenreCount = stats.topGenres.length > 0 ? stats.topGenres[0].count : 1;
  const maxDecadeCount = stats.decades.length > 0 ? Math.max(...stats.decades.map(d => d.count)) : 1;

  return (
    <div style={{ padding: "40px 6%", display: "flex", flexDirection: "column", gap: "36px" }}>
      {/* Header */}
      <div style={{ textAlign: "left" }}>
        <h1 style={{ fontFamily: "var(--heading)", fontWeight: 800, fontSize: "36px", margin: 0 }}>
          Taste Analytics
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Dynamic breakdown of your cinema preferences based on your watchlist metadata.
        </p>
      </div>

      {/* Grid of Summary Widgets */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "24px"
      }}>
        {/* Total Runtimes */}
        <div className="glass-panel" style={{ padding: "24px", borderRadius: "16px", display: "flex", gap: "16px", alignItems: "center", textAlign: "left" }}>
          <div style={{ background: "rgba(0, 242, 254, 0.1)", padding: "12px", borderRadius: "12px", color: "var(--accent-cyan)", display: "flex" }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Total Screen Time</div>
            <div style={{ fontSize: "20px", fontWeight: 800, marginTop: "4px", fontFamily: "var(--heading)" }}>{formatRuntime(stats.totalMinutes)}</div>
          </div>
        </div>

        {/* Watchlist Count */}
        <div className="glass-panel" style={{ padding: "24px", borderRadius: "16px", display: "flex", gap: "16px", alignItems: "center", textAlign: "left" }}>
          <div style={{ background: "rgba(127, 0, 255, 0.1)", padding: "12px", borderRadius: "12px", color: "var(--accent-purple)", display: "flex" }}>
            <Library size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Movies Saved</div>
            <div style={{ fontSize: "20px", fontWeight: 800, marginTop: "4px", fontFamily: "var(--heading)" }}>{watchlist.length} Titles</div>
          </div>
        </div>

        {/* Average Ratings */}
        <div className="glass-panel" style={{ padding: "24px", borderRadius: "16px", display: "flex", gap: "16px", alignItems: "center", textAlign: "left" }}>
          <div style={{ background: "rgba(255, 184, 0, 0.1)", padding: "12px", borderRadius: "12px", color: "var(--rating-gold)", display: "flex" }}>
            <Star size={24} fill="var(--rating-gold)" />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Average Rating</div>
            <div style={{ fontSize: "20px", fontWeight: 800, marginTop: "4px", fontFamily: "var(--heading)" }}>
              {stats.averageRating > 0 ? `${stats.averageRating.toFixed(1)} / 10` : "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "32px",
        alignItems: "start"
      }} className="analytics-charts-grid">
        
        {/* Top Genres Breakdown */}
        <div className="glass-panel" style={{ padding: "28px", borderRadius: "16px", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <Award size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontFamily: "var(--heading)", fontSize: "18px", fontWeight: 700 }}>Favorite Genres</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {stats.topGenres.slice(0, 5).map((genre, index) => {
              const percentage = (genre.count / maxGenreCount) * 100;
              return (
                <div key={index} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ fontWeight: 600 }}>{genre.name}</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{genre.count} {genre.count === 1 ? "movie" : "movies"}</span>
                  </div>
                  {/* Progress Bar Container */}
                  <div style={{
                    width: "100%",
                    height: "8px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: "100%",
                      background: "linear-gradient(95deg, var(--accent-cyan) 0%, var(--accent-purple) 100%)",
                      borderRadius: "4px"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline / Decades Breakdown */}
        <div className="glass-panel" style={{ padding: "28px", borderRadius: "16px", textAlign: "left" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
            <BarChart2 size={18} color="var(--accent-purple)" />
            <h3 style={{ fontFamily: "var(--heading)", fontSize: "18px", fontWeight: 700 }}>Release Eras</h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {stats.decades.map((decade, index) => {
              const percentage = (decade.count / maxDecadeCount) * 100;
              return (
                <div key={index} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px" }}>
                    <span style={{ fontWeight: 600 }}>{decade.name}</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{decade.count} {decade.count === 1 ? "movie" : "movies"}</span>
                  </div>
                  {/* Progress Bar Container */}
                  <div style={{
                    width: "100%",
                    height: "8px",
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: "4px",
                    overflow: "hidden"
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: "100%",
                      background: "linear-gradient(95deg, var(--accent-purple) 0%, var(--accent-cyan) 100%)",
                      borderRadius: "4px"
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
