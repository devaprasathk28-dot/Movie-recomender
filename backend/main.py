import json
import os
import re
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Optional

import pandas as pd
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from requests.adapters import HTTPAdapter
from scipy.sparse import csr_matrix
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel
from urllib3.util.retry import Retry


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
FRONTEND_DIST_DIR = PROJECT_ROOT / "frontend-vite" / "dist"
FRONTEND_ASSETS_DIR = FRONTEND_DIST_DIR / "assets"
CACHE_FILE = BASE_DIR / "cache.json"

OMDB_API_URL = "http://www.omdbapi.com/"
OMDB_API_KEY = os.getenv("OMDB_API_KEY", "c6ac3547").strip()
POSTER_PLACEHOLDER = "https://placehold.co/300x450?text=No+Poster"
REQUEST_TIMEOUT = (3.05, 6)
MAX_RESULTS = 10


def create_session() -> requests.Session:
    retry = Retry(
        total=2,
        connect=2,
        read=2,
        backoff_factor=0.5,
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=frozenset(["GET"]),
        raise_on_status=False,
    )
    adapter = HTTPAdapter(max_retries=retry)

    http = requests.Session()
    http.mount("http://", adapter)
    http.mount("https://", adapter)
    return http


session = create_session()
cache_lock = Lock()


def normalize_title(value: str) -> str:
    text = str(value or "").lower()
    text = re.sub(r"\(\d{4}\)", " ", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def extract_year(title: str) -> int:
    match = re.search(r"\((\d{4})\)", str(title))
    return int(match.group(1)) if match else 0


def format_imdb_id(imdb_value: Any) -> Optional[str]:
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


def load_cache() -> Dict[str, Dict[str, Any]]:
    if not CACHE_FILE.exists():
        return {}

    try:
        with CACHE_FILE.open("r", encoding="utf-8") as handle:
            raw_cache = json.load(handle)
    except (json.JSONDecodeError, OSError):
        return {}

    normalized_cache: Dict[str, Dict[str, Any]] = {}
    for imdb_id, value in raw_cache.items():
        if isinstance(value, dict):
            normalized_cache[imdb_id] = {
                "poster": value.get("poster") or POSTER_PLACEHOLDER,
                "rating": value.get("rating"),
                "overview": value.get("overview") or "",
                "director": value.get("director") or "",
                "actors": value.get("actors") or "",
                "runtime": value.get("runtime") or "",
                "genre": value.get("genre") or "",
                "released": value.get("released") or "",
                "youtube_trailer_id": value.get("youtube_trailer_id"),
            }
        elif isinstance(value, list):
            poster = value[0] if len(value) > 0 else POSTER_PLACEHOLDER
            rating = value[1] if len(value) > 1 else None
            overview = value[2] if len(value) > 2 else ""
            normalized_cache[imdb_id] = {
                "poster": poster or POSTER_PLACEHOLDER,
                "rating": rating,
                "overview": overview or "",
                "director": "",
                "actors": "",
                "runtime": "",
                "genre": "",
                "released": "",
                "youtube_trailer_id": None,
            }

    return normalized_cache


cache: Dict[str, Dict[str, Any]] = load_cache()


def save_cache() -> None:
    with cache_lock:
        with CACHE_FILE.open("w", encoding="utf-8") as handle:
            json.dump(cache, handle, ensure_ascii=True, indent=2)


def normalize_rating(value: Any) -> Optional[float]:
    if value in (None, "", "N/A", "Not Rated"):
        return None

    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def fetch_youtube_trailer(title: str) -> Optional[str]:
    query = f"{title} official trailer"
    url = f"https://www.youtube.com/results?search_query={requests.utils.quote(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    try:
        response = session.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        html = response.text
        video_ids = re.findall(r'"videoId":"([^"]+)"', html)
        if video_ids:
            return video_ids[0]
        match = re.search(r'/watch\?v=([a-zA-Z0-9_-]{11})', html)
        if match:
            return match.group(1)
    except Exception:
        pass
    return None


def fallback_movie_details() -> Dict[str, Any]:
    return {
        "poster": POSTER_PLACEHOLDER,
        "rating": None,
        "overview": "",
        "director": "",
        "actors": "",
        "runtime": "",
        "genre": "",
        "released": "",
        "youtube_trailer_id": None,
    }


def fetch_movie_details(imdb_id: Optional[str]) -> Dict[str, Any]:
    if not imdb_id:
        return fallback_movie_details()

    imdb_id = format_imdb_id(imdb_id)
    if not imdb_id:
        return fallback_movie_details()

    cached = cache.get(imdb_id)
    if cached:
        if "youtube_trailer_id" not in cached or cached.get("youtube_trailer_id") is None:
            try:
                match = movies[movies["imdbId"] == imdb_id]
                if not match.empty:
                    title = match.iloc[0]["title"]
                    cached["youtube_trailer_id"] = fetch_youtube_trailer(title)
                    save_cache()
            except Exception:
                pass
        return {
            "poster": cached.get("poster") or POSTER_PLACEHOLDER,
            "rating": normalize_rating(cached.get("rating")),
            "overview": cached.get("overview") or "",
            "director": cached.get("director") or "",
            "actors": cached.get("actors") or "",
            "runtime": cached.get("runtime") or "",
            "genre": cached.get("genre") or "",
            "released": cached.get("released") or "",
            "youtube_trailer_id": cached.get("youtube_trailer_id"),
        }

    details = fallback_movie_details()

    if OMDB_API_KEY:
        try:
            response = session.get(
                OMDB_API_URL,
                params={"apikey": OMDB_API_KEY, "i": imdb_id},
                timeout=REQUEST_TIMEOUT,
            )
            data = response.json()

            if data.get("Response") == "True":
                poster = data.get("Poster")
                details = {
                    "poster": poster if poster and poster != "N/A" else POSTER_PLACEHOLDER,
                    "rating": normalize_rating(data.get("imdbRating")),
                    "overview": data.get("Plot") if data.get("Plot") not in (None, "N/A") else "",
                    "director": data.get("Director") if data.get("Director") not in (None, "N/A") else "",
                    "actors": data.get("Actors") if data.get("Actors") not in (None, "N/A") else "",
                    "runtime": data.get("Runtime") if data.get("Runtime") not in (None, "N/A") else "",
                    "genre": data.get("Genre") if data.get("Genre") not in (None, "N/A") else "",
                    "released": data.get("Released") if data.get("Released") not in (None, "N/A") else "",
                    "youtube_trailer_id": None,
                }
        except (requests.RequestException, ValueError, json.JSONDecodeError):
            pass

    try:
        match = movies[movies["imdbId"] == imdb_id]
        if not match.empty:
            title = match.iloc[0]["title"]
            details["youtube_trailer_id"] = fetch_youtube_trailer(title)
    except Exception:
        pass

    cache[imdb_id] = details
    save_cache()
    return details


def load_movies() -> pd.DataFrame:
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

    return merged


movies = load_movies()
vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), min_df=1)
from scipy.sparse import csr_matrix as _csr
tfidf_matrix: csr_matrix = _csr(vectorizer.fit_transform(movies["tags"]))


def resolve_movie_index(query: str) -> Optional[int]:
    normalized_query = normalize_title(query)
    if not normalized_query:
        return None

    exact = movies[movies["normalized_title"] == normalized_query]
    if not exact.empty:
        return int(exact.sort_values(["year", "movieId"], ascending=[False, True]).index[0])

    starts_with = movies[movies["normalized_title"].str.startswith(normalized_query)]
    if not starts_with.empty:
        return int(starts_with.sort_values(["year", "movieId"], ascending=[False, True]).index[0])

    contains = movies[movies["normalized_title"].str.contains(re.escape(normalized_query), regex=True)]
    if not contains.empty:
        return int(contains.sort_values(["year", "movieId"], ascending=[False, True]).index[0])

    return None


def serialize_movie(row: pd.Series) -> Dict[str, Any]:
    details = fetch_movie_details(row["imdbId"])
    rating = details["rating"]

    return {
        "movieId": int(row["movieId"]),
        "title": row["title"],
        "poster": details["poster"],
        "backdrop": details["poster"],
        "rating": rating if rating is not None else -1,
        "year": int(row["year"]) if pd.notna(row["year"]) else 0,
        "overview": details["overview"],
        "director": details.get("director") or "",
        "actors": details.get("actors") or "",
        "runtime": details.get("runtime") or "",
        "genre": details.get("genre") or row["genres"],
        "released": details.get("released") or "",
        "imdbId": row["imdbId"],
        "youtube_trailer_id": details.get("youtube_trailer_id"),
    }


def get_recommendations(query: str, limit: int = MAX_RESULTS, sort_by: str = "none") -> Dict[str, Any]:
    movie_index = resolve_movie_index(query)
    if movie_index is None:
        return {"error": "Movie not found"}

    limit = max(1, min(int(limit), MAX_RESULTS))
    similarity_scores = linear_kernel(tfidf_matrix[movie_index : movie_index + 1], tfidf_matrix).flatten()
    ranked_indices = similarity_scores.argsort()[::-1]

    seed_row = movies.iloc[movie_index]
    seen_imdb_ids = {seed_row["imdbId"]}
    seen_titles = {seed_row["normalized_title"]}
    recommendations = []

    for candidate_index in ranked_indices:
        if int(candidate_index) == movie_index:
            continue

        row = movies.iloc[int(candidate_index)]
        imdb_id = row["imdbId"]
        normalized_title = row["normalized_title"]

        if not imdb_id or imdb_id in seen_imdb_ids or normalized_title in seen_titles:
            continue

        recommendations.append(
            {
                **serialize_movie(row),
                "similarity": float(similarity_scores[int(candidate_index)]),
            }
        )
        seen_imdb_ids.add(imdb_id)
        seen_titles.add(normalized_title)

        if len(recommendations) >= limit * 3:
            break

    if sort_by == "rating":
        recommendations.sort(key=lambda item: item["rating"], reverse=True)
    elif sort_by == "alphabet":
        recommendations.sort(key=lambda item: item["title"])
    elif sort_by == "year":
        recommendations.sort(key=lambda item: item["year"], reverse=True)
    else:
        recommendations.sort(key=lambda item: item["similarity"], reverse=True)

    trimmed = []
    seen_output_titles = set()
    for item in recommendations:
        if item["title"] in seen_output_titles:
            continue
        seen_output_titles.add(item["title"])
        item.pop("similarity", None)
        trimmed.append(item)
        if len(trimmed) >= limit:
            break

    return {"recommendations": trimmed}


def get_trending_movies(limit: int = 10) -> Dict[str, Any]:
    recent_movies = movies.sort_values(["year", "movieId"], ascending=[False, True])
    trending = []
    seen_titles = set()

    for _, row in recent_movies.iterrows():
        if row["normalized_title"] in seen_titles:
            continue

        seen_titles.add(row["normalized_title"])
        trending.append(serialize_movie(row))

        if len(trending) >= limit:
            break

    return {"trending": trending}


app = FastAPI(title="Movie Recommender API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if FRONTEND_ASSETS_DIR.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS_DIR), name="assets")


@app.get("/")
def serve_react() -> FileResponse:
    index_file = FRONTEND_DIST_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return FileResponse(PROJECT_ROOT / "README.md")


@app.get("/api/recommend/{movie}")
def recommend(movie: str, limit: int = MAX_RESULTS, sort_by: str = "none") -> Dict[str, Any]:
    return get_recommendations(movie, limit=limit, sort_by=sort_by)


@app.get("/api/trending")
def trending() -> Dict[str, Any]:
    return get_trending_movies()


@app.get("/api/genres")
def get_genres() -> Dict[str, Any]:
    genre_set = set()
    for item in movies["genres"].dropna():
        if item:
            for g in item.split("|"):
                g = g.strip()
                if g and g != "(no genres listed)":
                    genre_set.add(g)
    return {"genres": sorted(list(genre_set))}


@app.get("/api/search")
def search_movies(q: str, limit: int = 10) -> Dict[str, Any]:
    q_norm = normalize_title(q)
    if not q_norm:
        return {"results": []}

    matches = movies[movies["normalized_title"].str.contains(re.escape(q_norm), regex=True)]
    matches = matches.sort_values(["year"], ascending=False).head(limit)

    results = []
    for _, row in matches.iterrows():
        results.append({
            "movieId": int(row["movieId"]),
            "title": row["title"],
            "year": int(row["year"]) if pd.notna(row["year"]) else 0,
            "genres": row["genres"],
            "imdbId": row["imdbId"],
        })
    return {"results": results}


@app.get("/api/discover")
def discover_movies(
    genre: Optional[str] = None,
    year_start: Optional[int] = None,
    year_end: Optional[int] = None,
    min_rating: Optional[float] = None,
    limit: int = 20,
    page: int = 1
) -> Dict[str, Any]:
    filtered = movies.copy()

    if genre:
        filtered = filtered[filtered["genres"].str.contains(re.escape(genre), case=False, na=False)]

    if year_start:
        filtered = filtered[filtered["year"] >= year_start]

    if year_end:
        filtered = filtered[filtered["year"] <= year_end]

    if min_rating is not None:
        def get_rating(imdb_id):
            cached = cache.get(imdb_id)
            if cached:
                r = normalize_rating(cached.get("rating"))
                return r if r is not None else 0.0
            return 0.0
        filtered["cached_rating"] = filtered["imdbId"].apply(get_rating)
        filtered = filtered[filtered["cached_rating"] >= min_rating]

    total_results = len(filtered)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit

    subset = filtered.iloc[start_idx:end_idx]

    results = []
    for _, row in subset.iterrows():
        results.append(serialize_movie(row))

    return {
        "movies": results,
        "total": total_results,
        "page": page,
        "pages": (total_results + limit - 1) // limit
    }


@app.get("/api/movie/{imdb_id}")
def get_movie(imdb_id: str) -> Dict[str, Any]:
    imdb_id = format_imdb_id(imdb_id)
    if not imdb_id:
        return {"error": "Invalid IMDb ID"}

    match = movies[movies["imdbId"] == imdb_id]
    if match.empty:
        return {"error": "Movie not found in dataset"}

    row = match.iloc[0]
    return serialize_movie(row)
