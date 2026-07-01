import React from "react";

export function SkeletonCard() {
  return (
    <div style={{
      position: "relative",
      background: "var(--bg-surface)",
      borderRadius: "12px",
      overflow: "hidden",
      border: "1px solid var(--border-color)",
      aspectRatio: "2/3",
      display: "flex",
      flexDirection: "column",
      padding: "16px",
      justifyContent: "flex-end",
      gap: "8px"
    }}>
      {/* Poster shimmer */}
      <div 
        className="shimmer" 
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 1
        }} 
      />

      {/* Title shimmer */}
      <div 
        className="shimmer" 
        style={{
          height: "18px",
          width: "80%",
          borderRadius: "4px",
          position: "relative",
          zIndex: 2
        }} 
      />

      {/* Info shimmer */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        position: "relative",
        zIndex: 2
      }}>
        <div className="shimmer" style={{ height: "14px", width: "30%", borderRadius: "4px" }} />
        <div className="shimmer" style={{ height: "14px", width: "40%", borderRadius: "4px" }} />
      </div>
    </div>
  );
}

export default function SkeletonLoader({ count = 8 }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
      gap: "24px",
      width: "100%"
    }}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
