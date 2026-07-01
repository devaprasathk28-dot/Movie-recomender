import json
import os
import re
from pathlib import Path
import pandas as pd
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent / "data"

def format_imdb_id(imdb_value):
    if pd.isna(imdb_value):
        return None
    raw = str(imdb_value).strip()
    if not raw:
        return None
    if raw.startswith("tt"):
        digits = re.sub(r"\D", "", raw[2:])
    else:
        digits = re.sub(r"\D", "", raw)
    if not digits:
        return None
    return f"tt{digits.zfill(7)}"

def extract_year(title):
    match = re.search(r"\((\d{4})\)", str(title))
    return int(match.group(1)) if match else 0

def normalize_title(value):
    text = str(value or "").lower()
    text = re.sub(r"\(\d{4}\)", " ", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def precompute():
    print("Loading movies and links...")
    movies_path = DATA_DIR / "movies.csv"
    links_path = DATA_DIR / "links.csv"
    
    movies_df = pd.read_csv(movies_path)
    links_df = pd.read_csv(links_path)
    
    links_df["imdbId"] = links_df["imdbId"].apply(format_imdb_id)
    merged = movies_df.merge(links_df[["movieId", "imdbId"]], on="movieId", how="left")
    merged = merged.dropna(subset=["imdbId"]).copy()
    
    merged["title"] = merged["title"].fillna("").str.strip()
    merged["genres"] = merged["genres"].fillna("").replace("(no genres listed)", "", regex=False)
    merged["genres_text"] = merged["genres"].str.replace("|", " ", regex=False)
    merged["year"] = merged["title"].apply(extract_year)
    merged["normalized_title"] = merged["title"].apply(normalize_title)
    
    merged = merged[merged["normalized_title"] != ""].copy()
    merged = merged.sort_values(["normalized_title", "year", "movieId"], ascending=[True, False, True])
    merged = merged.drop_duplicates(subset=["movieId"]).reset_index(drop=True)
    
    merged["tags"] = (
        merged["normalized_title"]
        + " "
        + merged["genres_text"]
        + " "
        + merged["genres_text"]
        + " "
        + merged["year"].astype(str)
    ).str.strip()
    
    print(f"Total processed movies: {len(merged)}")
    
    # Save movies.json
    print("Saving movies.json...")
    movies_list = []
    for _, row in merged.iterrows():
        movies_list.append({
            "movieId": int(row["movieId"]),
            "title": row["title"],
            "genres": row["genres"],
            "year": int(row["year"]),
            "normalized_title": row["normalized_title"],
            "imdbId": row["imdbId"]
        })
        
    with open(BASE_DIR / "movies.json", "w", encoding="utf-8") as f:
        json.dump(movies_list, f, ensure_ascii=False, indent=2)
        
    # Run TF-IDF
    print("Computing similarity matrix...")
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), min_df=1)
    tfidf_matrix = vectorizer.fit_transform(merged["tags"])
    
    recommendations_dict = {}
    total = len(merged)
    
    # We will slice and calculate similarity in chunks to save memory
    chunk_size = 1000
    for start in range(0, total, chunk_size):
        end = min(start + chunk_size, total)
        print(f"Processing chunk {start} to {end} / {total}...")
        
        # similarity of chunk against all
        chunk_sim = linear_kernel(tfidf_matrix[start:end], tfidf_matrix)
        
        for idx in range(start, end):
            movie_id = int(merged.iloc[idx]["movieId"])
            sim_scores = chunk_sim[idx - start]
            
            # get top 41 (including itself, which we will filter out when loading or precomputing)
            ranked_indices = sim_scores.argsort()[::-1]
            
            # Collect top 40 recommendations (excluding self)
            recs = []
            seed_imdb = merged.iloc[idx]["imdbId"]
            seed_norm_title = merged.iloc[idx]["normalized_title"]
            
            seen_imdb_ids = {seed_imdb}
            seen_titles = {seed_norm_title}
            
            for candidate_idx in ranked_indices:
                if candidate_idx == idx:
                    continue
                
                row = merged.iloc[candidate_idx]
                cand_movie_id = int(row["movieId"])
                cand_imdb = row["imdbId"]
                cand_norm_title = row["normalized_title"]
                
                if not cand_imdb or cand_imdb in seen_imdb_ids or cand_norm_title in seen_titles:
                    continue
                    
                recs.append(cand_movie_id)
                seen_imdb_ids.add(cand_imdb)
                seen_titles.add(cand_norm_title)
                
                if len(recs) >= 30: # 30 is plenty since UI displays 10
                    break
                    
            recommendations_dict[movie_id] = recs
            
    print("Saving recommendations.json...")
    with open(BASE_DIR / "recommendations.json", "w", encoding="utf-8") as f:
        json.dump(recommendations_dict, f, ensure_ascii=True)
        
    print("Done!")

if __name__ == "__main__":
    precompute()
