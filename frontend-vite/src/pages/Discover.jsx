import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import axios from "axios";
import MovieCard from "../components/MovieCard";
import SkeletonLoader from "../components/SkeletonLoader";

export default function Discover() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  // Filter States
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [yearStart, setYearStart] = useState(1950);
  const [yearEnd, setYearEnd] = useState(2020);
  const [minRating, setMinRating] = useState(0);
  const [query, setQuery] = useState(initialQuery);

  // Result and Pagination States
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Load genres list
  useEffect(() => {
    axios
      .get("/genres")
      .then((res) => setGenres(res.data.genres || []))
      .catch((err) => console.error("Genres fetch error:", err));
  }, []);

  // Sync query from searchParams URL changes (e.g., searching from header)
  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    setPage(1); // Reset page on new search
  }, [searchParams]);

  // Load movies from `/discover` when filters, query, or page changes
  useEffect(() => {
    setLoading(true);
    
    // We fetch from /discover. If there is a text query, we search first
    // Note: since our discover endpoint handles discover filters, and `/search` handles fast prefix queries.
    // Let's implement discover filters. But wait, if they have typed a query, does `/discover` handle text search?
    // In our backend `/discover` does NOT handle text query.
    // Wait! Let's check how to filter by text query if present!
    // In backend, `/search` returns autocomplete matches. But wait, what if they want discover results matching text?
    // We can fetch from `/search?q=query` if query is present, OR we can let discover page query it.
    // Actually, to make text search support filters, let's look at how we can filter results.
    // If query is present, we can first call `/search?q=query`, then apply the frontend filters!
    // But wait! If the user searched via the header or discover input, they want to see movies matching that query.
    // If they have filters AND query:
    // Let's query `/discover` with filters, and if query is present, also filter by query in the frontend, OR query `/search` first.
    // Wait! Let's make `/discover` handle title parameter in the backend!
    // Wait, let's check: did we add `q` parameter to `/discover` in the backend? No, the `/discover` endpoint in `backend/main.py` is:
    // `def discover_movies(genre: Optional[str] = None, year_start: Optional[int] = None, year_end: Optional[int] = None, min_rating: Optional[float] = None, limit: int = 20, page: int = 1)`
    // Wait, we can easily query and filter it. If query is active, let's fetch matching movies from `/search?q=query`, and then filter them by genre/year/rating in the frontend! This is extremely fast because `/search` is lightweight!
    // Let's check:
    const fetchFilteredMovies = async () => {
      try {
        if (query.trim()) {
          // Fetch from /search
          const res = await axios.get(`/search?q=${encodeURIComponent(query.trim())}&limit=100`);
          const searchResults = res.data.results || [];
          
          // Now fetch full serialized details for these matches from cache/OMDb so they have rating/year
          const detailedPromises = searchResults.map(async (m) => {
            try {
              const detailRes = await axios.get(`/movie/${m.imdbId}`);
              return detailRes.data;
            } catch {
              return {
                ...m,
                rating: -1,
                genre: m.genres,
                year: m.year
              };
            }
          });
          
          const detailedMovies = await Promise.all(detailedPromises);
          
          // Apply filters in frontend
          let filtered = detailedMovies.filter((m) => {
            if (selectedGenre && !m.genre.toLowerCase().includes(selectedGenre.toLowerCase())) return false;
            if (m.year && (m.year < yearStart || m.year > yearEnd)) return false;
            if (minRating > 0 && m.rating < minRating) return false;
            return true;
          });
          
          setTotalResults(filtered.length);
          setTotalPages(Math.max(1, Math.ceil(filtered.length / 12)));
          
          // Paginate
          const start = (page - 1) * 12;
          const end = start + 12;
          setMovies(filtered.slice(start, end));
          setLoading(false);
        } else {
          // No query: Fetch from discover endpoint
          let url = `/discover?limit=12&page=${page}`;
          if (selectedGenre) url += `&genre=${encodeURIComponent(selectedGenre)}`;
          if (yearStart) url += `&year_start=${yearStart}`;
          if (yearEnd) url += `&year_end=${yearEnd}`;
          if (minRating > 0) url += `&min_rating=${minRating}`;
          
          const res = await axios.get(url);
          setMovies(res.data.movies || []);
          setTotalResults(res.data.total || 0);
          setTotalPages(res.data.pages || 1);
          setLoading(false);
        }
      } catch (err) {
        console.error("Discover load error:", err);
        setLoading(false);
      }
    };
    
    fetchFilteredMovies();
  }, [query, selectedGenre, yearStart, yearEnd, minRating, page]);

  const handleResetFilters = () => {
    setSelectedGenre("");
    setYearStart(1950);
    setYearEnd(2026);
    setMinRating(0);
    setQuery("");
    setSearchParams({});
    setPage(1);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setPage(1);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div style={{ padding: "40px 6%", display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Title */}
      <div style={{ textAlign: "left" }}>
        <h1 style={{ fontFamily: "var(--heading)", fontWeight: 800, fontSize: "36px", margin: 0 }}>
          Discover Cinema
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
          Filter movies by genre, release era, and average ratings to find your next watch.
        </p>
      </div>

      {/* Main Discover Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: "40px",
        alignItems: "start"
      }} className="discover-grid">
        
        {/* Left Side: Filter Sidebar */}
        <aside className="glass-panel" style={{
          padding: "24px",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          textAlign: "left",
          border: "1px solid var(--border-color)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700 }}>
              <Filter size={16} color="var(--accent-cyan)" />
              <span>Filters</span>
            </div>
            <button
              onClick={handleResetFilters}
              style={{
                fontSize: "12px",
                color: "var(--accent-cyan)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                fontWeight: 600
              }}
            >
              Reset All
            </button>
          </div>

          {/* Genre Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>Genre</label>
            <select
              value={selectedGenre}
              onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
              style={{
                width: "100%",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid var(--border-color)",
                color: "#fff",
                padding: "10px 14px",
                borderRadius: "8px",
                outline: "none"
              }}
            >
              <option value="">All Genres</option>
              {genres.map((g, idx) => (
                <option key={idx} value={g}>{g}</option>
              ))}
            </select>
          </div>

          {/* Release Year Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>
              Release Year ({yearStart} - {yearEnd})
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <input
                type="number"
                min="1900"
                max="2026"
                value={yearStart}
                onChange={(e) => { setYearStart(Number(e.target.value)); setPage(1); }}
                className="form-input"
                style={{ width: "50%", padding: "8px", fontSize: "13px", textAlign: "center" }}
              />
              <input
                type="number"
                min="1900"
                max="2026"
                value={yearEnd}
                onChange={(e) => { setYearEnd(Number(e.target.value)); setPage(1); }}
                className="form-input"
                style={{ width: "50%", padding: "8px", fontSize: "13px", textAlign: "center" }}
              />
            </div>
          </div>

          {/* Min Rating Filter */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>
              <span style={{ textTransform: "uppercase" }}>Min Rating</span>
              <span style={{ color: "var(--accent-cyan)" }}>⭐ {minRating > 0 ? minRating.toFixed(1) : "All"}</span>
            </div>
            <input
              type="range"
              min="0"
              max="9"
              step="0.5"
              value={minRating}
              onChange={(e) => { setMinRating(parseFloat(e.target.value)); setPage(1); }}
              style={{
                width: "100%",
                accentColor: "var(--accent-cyan)",
                background: "rgba(255,255,255,0.1)",
                borderRadius: "4px",
                height: "6px",
                cursor: "pointer"
              }}
            />
          </div>
        </aside>

        {/* Right Side: Search Results */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Inner Search Box */}
          <div style={{
            position: "relative",
            display: "flex",
            alignItems: "center"
          }}>
            <input
              type="text"
              placeholder="Search by keywords inside filters..."
              value={query}
              onChange={handleSearchChange}
              className="form-input"
              style={{
                width: "100%",
                paddingLeft: "42px",
                paddingRight: "40px"
              }}
            />
            <div style={{
              position: "absolute",
              left: "14px",
              color: "var(--text-secondary)",
              display: "flex"
            }}>
              <Search size={16} />
            </div>
            {query && (
              <button
                onClick={() => { setQuery(""); setSearchParams({}); }}
                style={{
                  position: "absolute",
                  right: "14px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex"
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Results Summary */}
          {!loading && (
            <div style={{ fontSize: "13px", color: "var(--text-secondary)", textAlign: "left" }}>
              Showing <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{movies.length}</span> of {totalResults} movies
            </div>
          )}

          {/* Grid / Loader */}
          {loading ? (
            <SkeletonLoader count={8} />
          ) : movies.length === 0 ? (
            <div className="glass-panel" style={{
              padding: "80px 24px",
              borderRadius: "16px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "12px"
            }}>
              <p style={{ fontSize: "16px", color: "var(--text-secondary)" }}>
                No movies match your selected discover criteria.
              </p>
              <button onClick={handleResetFilters} className="btn-secondary" style={{ fontSize: "14px" }}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "24px"
            }}>
              {movies.map((movie, idx) => (
                <MovieCard key={idx} movie={movie} />
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              marginTop: "24px"
            }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary"
                style={{
                  padding: "8px 12px",
                  opacity: page === 1 ? 0.5 : 1,
                  cursor: page === 1 ? "not-allowed" : "pointer"
                }}
              >
                <ChevronLeft size={16} />
              </button>
              
              <span style={{ fontSize: "14px", fontWeight: 500 }}>
                Page {page} of {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary"
                style={{
                  padding: "8px 12px",
                  opacity: page === totalPages ? 0.5 : 1,
                  cursor: page === totalPages ? "not-allowed" : "pointer"
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
