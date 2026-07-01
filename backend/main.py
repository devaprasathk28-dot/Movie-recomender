import json
import os
import re
from pathlib import Path
from threading import Lock
from typing import Any, Dict, Optional

import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
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
    if imdb_value is None:
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
                movie_item = movies_by_imdb.get(imdb_id)
                if movie_item:
                    title = movie_item["title"]
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
        movie_item = movies_by_imdb.get(imdb_id)
        if movie_item:
            title = movie_item["title"]
            details["youtube_trailer_id"] = fetch_youtube_trailer(title)
    except Exception:
        pass

    cache[imdb_id] = details
    save_cache()
    return details


# Load precomputed movies metadata
def load_movies_metadata() -> list:
    movies_json_path = BASE_DIR / "movies.json"
    if not movies_json_path.exists():
        return []
    with open(movies_json_path, "r", encoding="utf-8") as f:
        return json.load(f)


movies_list = load_movies_metadata()
movies_by_id = {m["movieId"]: m for m in movies_list}
movies_by_imdb = {m["imdbId"]: m for m in movies_list if m["imdbId"]}


# Load precomputed recommendations
def load_recommendations() -> dict:
    recs_json_path = BASE_DIR / "recommendations.json"
    if not recs_json_path.exists():
        return {}
    with open(recs_json_path, "r", encoding="utf-8") as f:
        raw_recs = json.load(f)
        return {int(k): v for k, v in raw_recs.items()}


recommendations_map = load_recommendations()


def resolve_movie(query: str) -> Optional[dict]:
    normalized_query = normalize_title(query)
    if not normalized_query:
        return None

    # Exact matches
    exact = [m for m in movies_list if m["normalized_title"] == normalized_query]
    if exact:
        exact.sort(key=lambda x: (-x["year"], x["movieId"]))
        return exact[0]

    # Starts with matches
    starts_with = [m for m in movies_list if m["normalized_title"].startswith(normalized_query)]
    if starts_with:
        starts_with.sort(key=lambda x: (-x["year"], x["movieId"]))
        return starts_with[0]

    # Contains matches
    contains = [m for m in movies_list if normalized_query in m["normalized_title"]]
    if contains:
        contains.sort(key=lambda x: (-x["year"], x["movieId"]))
        return contains[0]

    return None


def serialize_movie(row: dict) -> Dict[str, Any]:
    details = fetch_movie_details(row["imdbId"])
    rating = details["rating"]

    return {
        "movieId": int(row["movieId"]),
        "title": row["title"],
        "poster": details["poster"],
        "backdrop": details["poster"],
        "rating": rating if rating is not None else -1,
        "year": int(row["year"]) if row.get("year") is not None else 0,
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
    movie_item = resolve_movie(query)
    if movie_item is None:
        return {"error": "Movie not found"}

    limit = max(1, min(int(limit), MAX_RESULTS))
    movie_id = movie_item["movieId"]
    rec_ids = recommendations_map.get(movie_id, [])

    recommendations = []
    for rec_id in rec_ids:
        cand_movie = movies_by_id.get(rec_id)
        if cand_movie:
            recommendations.append(serialize_movie(cand_movie))

    if sort_by == "rating":
        recommendations.sort(key=lambda item: item["rating"], reverse=True)
    elif sort_by == "alphabet":
        recommendations.sort(key=lambda item: item["title"])
    elif sort_by == "year":
        recommendations.sort(key=lambda item: item["year"], reverse=True)

    trimmed = []
    seen_output_titles = set()
    for item in recommendations:
        if item["title"] in seen_output_titles:
            continue
        seen_output_titles.add(item["title"])
        trimmed.append(item)
        if len(trimmed) >= limit:
            break

    return {"recommendations": trimmed}


def get_trending_movies(limit: int = 10) -> Dict[str, Any]:
    # Sort movies by year descending, movieId ascending
    sorted_movies = sorted(movies_list, key=lambda x: (-x["year"], x["movieId"]))
    trending = []
    seen_titles = set()

    for row in sorted_movies:
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

FRONTEND_DIST_DIR = PROJECT_ROOT / "frontend-vite" / "dist"
FRONTEND_ASSETS_DIR = FRONTEND_DIST_DIR / "assets"

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
    for m in movies_list:
        item = m.get("genres")
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

    matches = [m for m in movies_list if q_norm in m["normalized_title"]]
    matches.sort(key=lambda x: x["year"], reverse=True)

    results = []
    for row in matches[:limit]:
        results.append({
            "movieId": int(row["movieId"]),
            "title": row["title"],
            "year": int(row["year"]) if row.get("year") is not None else 0,
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
    filtered = list(movies_list)

    if genre:
        genre_lower = genre.lower()
        filtered = [m for m in filtered if genre_lower in m["genres"].lower()]

    if year_start:
        filtered = [m for m in filtered if m["year"] >= year_start]

    if year_end:
        filtered = [m for m in filtered if m["year"] <= year_end]

    if min_rating is not None:
        def get_rating(imdb_id):
            cached = cache.get(imdb_id)
            if cached:
                r = normalize_rating(cached.get("rating"))
                return r if r is not None else 0.0
            return 0.0
        filtered = [m for m in filtered if get_rating(m["imdbId"]) >= min_rating]

    total_results = len(filtered)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit

    subset = filtered[start_idx:end_idx]

    results = []
    for row in subset:
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

    row = movies_by_imdb.get(imdb_id)
    if not row:
        return {"error": "Movie not found in dataset"}

    return serialize_movie(row)

