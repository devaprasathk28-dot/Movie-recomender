import React from "react";
import { motion } from "framer-motion";
import { Info, Cpu, Database, Users, Award, Activity } from "lucide-react";

// Custom SVG Icons because brand icons are not exported in this version of lucide-react
const GithubIcon = ({ size = 16, color = "currentColor" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const LinkedinIcon = ({ size = 16, color = "currentColor" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export default function About() {
  return (
    <div style={{
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "40px 24px 80px 24px",
      textAlign: "left",
      display: "flex",
      flexDirection: "column",
      gap: "40px"
    }}>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          textAlign: "center",
          padding: "48px 24px",
          borderRadius: "20px",
          background: "linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(127, 0, 255, 0.05) 100%)",
          border: "1px solid var(--border-color)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)"
        }}
      >
        <h1 style={{
          fontFamily: "var(--heading)",
          fontSize: "clamp(32px, 5vw, 48px)",
          fontWeight: 800,
          margin: 0,
          background: "linear-gradient(to right, #00f2fe, #7f00ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.5px"
        }}>
          About Cineverse
        </h1>
        <p style={{
          color: "var(--text-secondary)",
          fontSize: "16px",
          maxWidth: "600px",
          margin: "16px auto 0 auto",
          lineHeight: "1.6"
        }}>
          An advanced, data-driven movie search and recommendation engine designed to curate your perfect cinema taste.
        </p>
      </motion.div>

      {/* Main Narrative */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "32px"
      }}>
        {/* Left Side: The System */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Cpu size={24} color="var(--accent-cyan)" />
              <h2 style={{ fontFamily: "var(--heading)", fontSize: "22px", fontWeight: 700, margin: 0 }}>
                Recommendation Mechanics
              </h2>
            </div>
            <p style={{ color: "var(--text-secondary)", lineHeight: "1.7", fontSize: "15px" }}>
              Cineverse utilizes a content-based recommendation model powered by vector space analysis. Movies are mapped into a high-dimensional vector space based on textual attributes including genres, release eras, plot metadata, and tags. 
            </p>
            <p style={{ color: "var(--text-secondary)", lineHeight: "1.7", fontSize: "15px", marginTop: "12px" }}>
              When you select a movie, the system calculates the Cosine Similarity between that movie's tag vector and every other title in the database. The linear kernel evaluates this mathematical distance to present the closest matching film recommendations instantly.
            </p>
          </div>

          <div className="glass-panel" style={{
            padding: "20px",
            borderRadius: "16px",
            borderLeft: "4px solid var(--accent-cyan)",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Data Pipeline & OMDb Synergy
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
              The engine references a collection of indexed movies alongside deep poster caches. Missing visual details, official descriptions, ratings, and actors are dynamically aggregated and resolved via integration with the OMDb database, caching results to ensure optimal latency.
            </p>
          </div>
        </motion.div>

        {/* Right Side: Features & Persistency */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ display: "flex", flexDirection: "column", gap: "24px" }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Database size={24} color="var(--accent-purple)" />
              <h2 style={{ fontFamily: "var(--heading)", fontSize: "22px", fontWeight: 700, margin: 0 }}>
                State & Analytics
              </h2>
            </div>
            <p style={{ color: "var(--text-secondary)", lineHeight: "1.7", fontSize: "15px" }}>
              To safeguard user privacy and allow instantaneous personalization, Cineverse maintains your Watchlist and custom Reviews offline using persistent local storage.
            </p>
            <p style={{ color: "var(--text-secondary)", lineHeight: "1.7", fontSize: "15px", marginTop: "12px" }}>
              The interactive Analytics dashboard parses this local dataset to display statistical insights into your cinema history, demonstrating the distribution of genres, rating distributions, and average ratings across your curated lists.
            </p>
          </div>

          <div className="glass-panel" style={{
            padding: "20px",
            borderRadius: "16px",
            borderLeft: "4px solid var(--accent-purple)",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
              Discovery & Refinement
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
              The advanced Discover console allows users to narrow down selections by matching partial keywords, setting dynamic release year ranges, and establishing minimum ratings thresholds.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Developer Connect Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="glass-panel"
        style={{
          padding: "32px",
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
          textAlign: "center",
          marginTop: "20px"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <h2 style={{ fontFamily: "var(--heading)", fontSize: "24px", fontWeight: 800, margin: 0 }}>
            Connect with the Creator
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", maxWidth: "450px", margin: "6px auto 0 auto" }}>
            For collaborations, inquiries, or feedback regarding the Cineverse recommendation system.
          </p>
        </div>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <a
            href="https://github.com/devaprasathk28-dot"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none"
            }}
          >
            <GithubIcon size={16} />
            <span>GitHub</span>
          </a>

          <a
            href="https://www.linkedin.com/in/k-devaprasath-a5079332b"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{
              padding: "10px 20px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textDecoration: "none"
            }}
          >
            <LinkedinIcon size={16} />
            <span>LinkedIn</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
