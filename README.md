# 🎬 Cineverse Recommender

Cineverse is a modern, data-driven movie search and recommendation engine designed to curate your perfect cinema taste. Built with a FastAPI backend and a React + Vite frontend, the system calculates content-based vector similarities using mathematical alignment to match search profiles instantly.

---

## 🌟 Key Features

- **Content-Based Recommendations**: Powered by a TF-IDF Vectorizer and a Cosine Similarity linear kernel that processes genres, titles, release years, and movie tags to calculate exact movie affinities.
- **Dynamic Discover Console**: Filter the entire database by selecting genres, restricting release year ranges, and establishing minimum ratings thresholds.
- **Live Search & Autocomplete**: Fast query prefix matching provides instant suggestions as you type.
- **Persistency**: Keep track of your movie interests using an offline Watchlist and submit custom Reviews, safely persisted in browser Local Storage.
- **Analytics Dashboard**: Get statistical insights into your cinema history, demonstrating the distribution of genres, rating distributions, and average ratings across your curated lists.
- **Professional Design**: A premium responsive layout featuring glassmorphism elements, custom SVG iconography, smooth transitions, and a clean dark theme.

---

## 🛠️ System Architecture

### 1. Vector Space Recommendation Model
Cineverse parses movie data to build structured tags for each movie (a combination of title, genres, and release year). 
- The system feeds these tags into a `TfidfVectorizer` (Term Frequency-Inverse Document Frequency) from `scikit-learn` to construct a high-dimensional sparse vector representation.
- When recommendations are requested for a movie, a linear kernel computes the **Cosine Similarity** matrix between that movie's vector and the rest of the corpus. The system then returns the top highest-affinity films, filtered to exclude duplicates and self-similarity.

### 2. OMDb Metadata Synergy
The system references a collection of indexed movies alongside cached details to ensure low latency. Missing posters, synopsis plots, directors, ratings, and cast members are dynamically aggregated via the OMDb API at runtime and saved in the JSON caching layer.

---

## 📁 Repository Structure

```
├── backend/                  # FastAPI Backend Application
│   ├── main.py               # API Endpoints, Loader, & Vector Matrix calculations
│   ├── requirements.txt      # Python Dependencies for backend development
│   └── cache.json            # Dynamic poster & metadata cache
├── frontend-vite/            # Vite + React Frontend Application
│   ├── src/
│   │   ├── components/       # Header, Footer, MovieCard, SkeletonLoader
│   │   ├── pages/            # Home, MovieDetails, Discover, Watchlist, Analytics, About
│   │   ├── App.jsx           # App wrapper & client routing configuration
│   │   └── main.jsx          # Entry point
│   ├── package.json          # Node dependencies and scripts
│   └── vite.config.js        # Vite compilation configurations
├── api/                      # Vercel Serverless Function entry point
│   └── index.py              # Handler linking FastAPI to Vercel
├── vercel.json               # Vercel Monorepo deployment configurations
├── requirements.txt          # Root-level Vercel Python runtime dependencies
└── README.md                 # Project documentation
```

---

## 🚀 Running Locally

### 1. Backend Server Setup
Ensure Python 3.9+ is installed on your system.

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment (optional but recommended)
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install Python requirements
pip install -r requirements.txt

# Launch uvicorn dev server
uvicorn main:app --reload --port 8000
```
The API documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 2. Frontend Setup
Ensure Node.js is installed.

```bash
# Navigate to the frontend directory
cd frontend-vite

# Install npm dependencies
npm install

# Launch Vite development server
npm run dev
```
The client application will run on [http://localhost:5173/](http://localhost:5173/).

---

## ☁️ Deploying to Vercel

Cineverse is pre-configured for serverless hosting on Vercel:

1. Push your code to your GitHub repository.
2. Link your repository in the [Vercel Dashboard](https://vercel.com/dashboard).
3. Set the following project configuration settings:
   - **Root Directory**: `.` (do **NOT** select `frontend-vite`, keep it as the repo root)
   - **Build Command**: `cd frontend-vite && npm install && npm run build`
   - **Output Directory**: `frontend-vite/dist`
4. Click **Deploy**. Vercel will build the React files and host the FastAPI backend serverlessly using Python Serverless Functions!

---

## 🤝 Connect with the Developer

For collaborations, feedback, or custom inquiries:

- **GitHub**: [devaprasathk28-dot](https://github.com/devaprasathk28-dot)
- **LinkedIn**: [K Devaprasath](https://www.linkedin.com/in/k-devaprasath-a5079332b)

---
*Created by Devaprasath. © 2026 Cineverse Recommender.*
