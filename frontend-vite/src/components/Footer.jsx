import React from "react";
import { Link } from "react-router-dom";
import { Film } from "lucide-react";

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

export default function Footer() {
  return (
    <footer className="glass-panel" style={{
      marginTop: "auto",
      borderTop: "1px solid var(--border-color)",
      padding: "32px 24px",
      background: "rgba(10, 11, 16, 0.9)"
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "24px"
      }}>
        {/* Brand */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Film size={18} color="var(--accent-cyan)" />
            <span style={{ fontFamily: "var(--heading)", fontWeight: 700, letterSpacing: "0.5px" }}>
              CINEVERSE
            </span>
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Discover and analyze your cinema taste.
          </span>
        </div>

        {/* Developer Connections */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <a
            href="https://github.com/devaprasathk28-dot"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              textDecoration: "none",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent-cyan)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
          >
            <GithubIcon size={16} />
            <span>GitHub</span>
          </a>
          <span style={{ color: "rgba(255,255,255,0.08)" }}>|</span>
          <a
            href="https://www.linkedin.com/in/k-devaprasath-a5079332b"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "13px",
              textDecoration: "none",
              transition: "color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent-cyan)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
          >
            <LinkedinIcon size={16} />
            <span>LinkedIn</span>
          </a>
        </div>

        {/* Legal / Copyright */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: "4px",
          fontSize: "12px",
          color: "var(--text-muted)"
        }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <Link to="/about" style={{ color: "var(--text-secondary)", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--accent-cyan)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}>
              About System
            </Link>
            <span>&copy; {new Date().getFullYear()} Cineverse Recommender.</span>
          </div>
          <span>All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
