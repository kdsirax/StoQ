
# StoQ — AI Stock Intelligence Platform
Live Demo Link: https://stoq-five.vercel.app

> **Real-time financial news → AI pipeline → Actionable BUY / HOLD / SELL signals for NSE equities**

StoQ ingests financial news, runs it through a multi-stage AI pipeline (OpenAI GPT-4o-mini + FinBERT + Model Stacking), and delivers trading signals with confidence scores on a personalized portfolio dashboard.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [System Architecture](#system-architecture)
3. [AI Pipeline Workflow](#ai-pipeline-workflow)
4. [Repository Structure](#repository-structure)
5. [Environment Variables](#environment-variables)
6. [Running the Client/Server (Next.js)](#running-the-clientserver-nextjs)
7. [Running the ML Service (Python / FastAPI)](#running-the-ml-service-python--fastapi)
8. [API Reference](#api-reference)
9. [Data Models](#data-models)
10. [Known Issues](#known-issues)

---

## Tech Stack

### Client / Server (`client-server/`)

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Auth | NextAuth.js — Google OAuth 2.0 |
| Database ORM | Mongoose (MongoDB) |
| Database | MongoDB Atlas |
| HTTP Client | Axios |
| News Source | NewsAPI |
| Language | TypeScript |

### ML Service (`ML/`)

| Layer | Technology |
|---|---|
| API Framework | FastAPI |
| LLM | OpenAI GPT-4o-mini |
| NLP / Sentiment | FinBERT (via HuggingFace Transformers) |
| ML Model | XGBoost (v3), CatBoost, LightGBM — Model Stacking |
| Data | yfinance (RSI, MACD, volume, volatility) |
| Validation | Pydantic |
| Concurrency | `concurrent.futures` (multi-threading) |
| Language | Python |
| Containerization | Docker |

---

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                      │
│  Google OAuth | NewsAPI | OpenAI GPT-4o-mini | MongoDB Atlas │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐           ┌────────▼────────┐
│  NEXT.JS APP   │  ◄──────► │  PYTHON ML      │
│                │  HTTP/JSON │  (FastAPI)      │
│ • Auth & OAuth │           │                 │
│ • Portfolio UI │           │ • OpenAI Agent  │
│ • API Routes   │           │ • Quant Brain   │
│ • MongoDB ODM  │           │ • FinBERT NLP   │
│ • News Ingest  │           │ • Model Stack   │
└────────────────┘           └─────────────────┘
```

The system is split into two completely independent runtimes that communicate over HTTP:

- **`client-server/`** — Next.js app handles the UI, authentication, MongoDB persistence, and news ingestion. It forwards raw articles to the ML service and stores enriched results.
- **`ML/`** — Python FastAPI service receives raw articles, runs the full AI pipeline, and returns structured trading signals.

---

## AI Pipeline Workflow

This is the core intelligence engine that converts raw news into trading signals.

```
[1] INGESTION
    Frontend sends a batch of 50 news articles via Axios POST to FastAPI.

[2] VALIDATION
    Pydantic (schemas.py) validates each article.
    Missing title or date → HTTP 422, article rejected.

[3] ORCHESTRATION
    main.py loops over articles, combines title + description
    into a single analysis block per article.

[4] READER  (openai_agent.py)
    GPT-4o-mini scans text against 138 known NSE tickers.
    Returns impacted stocks with relevance weights.
    Example → { "ZOMATO": 1.0, "SWIGGY": 0.9 }

[5] MULTI-THREADING  (concurrent.futures)
    main.py spawns parallel threads — one per impacted stock —
    for maximum throughput.

[6] QUANT BRAIN  (quant_agent.py)  — per stock:
    ├── GPT-4o-mini  → one-sentence context (how news affects this stock)
    ├── FinBERT      → sentiment score  (-1.0 bearish … +1.0 bullish)
    ├── yfinance     → RSI, MACD, volume change, volatility
    ├── Model Stack  → base price-jump probability (XGBoost features)
    └── Signal Blend → STRONG BUY / BUY / HOLD / SELL + confidence score

[7] FORMATTER  (presenter_agent.py)
    Sorts stocks by confidence score.
    Groups results by sector (Banking, FMCG, Technology, etc.).

[8] DELIVERY
    FastAPI packages everything into BatchArticleResult schema.
    Sends JSON response back to Next.js pipeline route.
    Next.js upserts enriched documents into MongoDB.
```

### XGBoost Feature Groups

| Feature Group | Features |
|---|---|
| NLP / Sentiment | `sentiment_score`, `finbert_score`, `finbert_label_encoded` |
| Technical Indicators | `RSI` (14-period), `MACD`, `volume`, `volatility` |
| Price Trend | `MA5` (5-day moving avg), `MA20` (20-day moving avg) |
| Categorical | `sector_onehot` (one-hot encoded), `source_credibility` |

### Technical Indicators

| Indicator | Range | Interpretation |
|---|---|---|
| RSI | 0 – 100 | > 70 Overbought \| < 30 Oversold |
| MACD | Positive / Negative | Positive = bullish momentum |
| Sentiment Score (FinBERT) | -1.0 to +1.0 | +1.0 = strongly bullish |

---

## Repository Structure

```
StoQ/
├── client-server/
│   └── src/
│       ├── app/
│       │   ├── layout.tsx                        # Root shell, SessionProvider
│       │   ├── page.tsx                          # Home/starter page
│       │   ├── login/page.tsx                    # Google OAuth entry
│       │   ├── portfolio/page.tsx                # Core dashboard (client component)
│       │   └── api/
│       │       ├── pipeline/route.ts             # Triggers news ingestion pipeline
│       │       ├── portfolio/route.ts            # GET holdings / POST new holding
│       │       ├── portfolio/[ticker]/route.ts   # PATCH qty / DELETE holding
│       │       ├── portfolio/news/route.ts       # Paginated news for portfolio tickers
│       │       ├── portfolio/suggested/route.ts  # AI-suggested BUY stocks
│       │       └── health/route.ts               # MongoDB health check
│       ├── components/                           # Dashboard panels, login form, UI primitives
│       ├── lib/                                  # DB connection, news fetcher, ML client, pipeline
│       └── models/                               # Mongoose schemas: News, Portfolio, User
│
└── ML/
    ├── main.py                                   # FastAPI app, orchestration loop, threading
    ├── openai_agent.py                           # GPT-4o-mini stock identification
    ├── quant_agent.py                            # FinBERT + technicals + Model Stacking
    ├── presenter_agent.py                        # Sort + group results by sector
    ├── schemas.py                                # Pydantic input/output contracts
    └── Dockerfile                                # Container definition for ML service
```

---

## Environment Variables

### `client-server/` — create a `.env.local` file

```env
# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<your-nextauth-secret>

# Google OAuth
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>

# NewsAPI
NEWS_API_KEY=<your-newsapi-key>

# ML Service URL (where your FastAPI is running)
ML_SERVICE_URL=http://localhost:8000
```

### `ML/` — create a `.env` file

```env
OPENAI_API_KEY=<your-openai-api-key>
```

---

## Running the Client/Server (Next.js)

> **Prerequisites:** Node.js 18+, npm / yarn, a running MongoDB Atlas cluster, Google OAuth credentials, NewsAPI key.

### Step 1 — Install dependencies

```bash
cd client-server
npm install
```

### Step 2 — Set up environment variables

Create `client-server/.env.local` with the variables listed in the [Environment Variables](#environment-variables) section above.

### Step 3 — Run in development mode

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

### Step 4 — Run in production mode

```bash
npm run build
npm run start
```

### What happens at startup

- Next.js connects to MongoDB Atlas via Mongoose (connection is cached globally across requests).
- Visiting `/login` presents the Google OAuth sign-in button.
- On successful login, NextAuth upserts a User document in MongoDB and attaches `session.user.id` (MongoDB `_id`) to the session.
- Visiting `/portfolio` renders the dashboard with three panels: Watchlist, Relevant News, and Suggested Stocks.

### Triggering the News Pipeline manually

Once the app is running, hit this endpoint in a browser or via `curl` to ingest and enrich news:

```bash
curl http://localhost:3000/api/pipeline
```

This fetches articles from NewsAPI, sends them to the ML service, and upserts enriched documents into MongoDB.

---

## Running the ML Service (Python / FastAPI)

> **Prerequisites:** Python 3.10+, an OpenAI API key. Docker is optional but recommended.

### Option A — Run with Docker (Recommended)

```bash
cd ML

# Build the image
docker build -t stoq-ml .

# Run the container
docker run -p 8000:8000 --env-file .env stoq-ml
```

The FastAPI service will be available at **http://localhost:8000**.

---

### Option B — Run directly with Python

#### Step 1 — Create and activate a virtual environment

```bash
cd ML
python -m venv venv

# On Linux / macOS
source venv/bin/activate

# On Windows
venv\Scripts\activate
```

#### Step 2 — Install dependencies

```bash
pip install fastapi uvicorn openai transformers torch xgboost catboost lightgbm yfinance pandas pydantic python-dotenv
```

#### Step 3 — Set up environment variables

Create `ML/.env`:

```env
OPENAI_API_KEY=<your-openai-api-key>
```

#### Step 4 — Start the FastAPI server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The service will be available at **http://localhost:8000**.

---

### ML Service Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/analyze` | Accepts a batch of articles, runs the full AI pipeline, returns `BatchArticleResult[]` |
| `GET` | `/health` | Service health check |

### Pydantic Schemas (Input / Output contracts)

| Schema | Fields |
|---|---|
| `IncomingNews` | `title`, `description`, `source`, `date` |
| `StockMetrics` | `rsi`, `macd`, `sentiment`, `volatility`, `volume_change` |
| `ProcessedStock` | `ticker`, `signal`, `confidence_score`, `reasoning`, `data: StockMetrics` |
| `DomainGroup` | `domain`, `stocks: List[ProcessedStock]` |
| `FinalReport` | `status`, `analyzed_news`, `impacted_domains: List[DomainGroup]` |
| `BatchArticleResult` | `article_id`, `source`, `news_text`, `ai_analysis: FinalReport` |

---

## API Reference

### Pipeline

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/pipeline` | None | Triggers full news ingestion + ML enrichment |

### Portfolio

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/portfolio` | Cookie (NextAuth) | Fetch user's holdings sorted by `addedAt` desc |
| `POST` | `/api/portfolio` | Cookie (NextAuth) | Add new holding. Returns `409` on duplicate ticker |
| `DELETE` | `/api/portfolio/{ticker}` | Cookie (NextAuth) | Remove holding by ticker |
| `PATCH` | `/api/portfolio/{ticker}` | Cookie (NextAuth) | Update share quantity. Body: `{ qty: number }` |
| `GET` | `/api/portfolio/news?page=1&limit=10` | Cookie (NextAuth) | Paginated news matching portfolio tickers |
| `GET` | `/api/portfolio/suggested` | Cookie (NextAuth) | Up to 10 AI-suggested BUY stocks not in portfolio |
| `GET` | `/api/health` | None | MongoDB connectivity check + latest article metadata |

### HTTP Status Code Reference

| Code | Meaning |
|---|---|
| `200` | Successful GET, PATCH, DELETE |
| `201` | Stock holding added via POST |
| `400` | Missing ticker/qty or invalid quantity |
| `401` | No valid NextAuth session cookie |
| `404` | Ticker not found for PATCH/DELETE |
| `409` | Ticker already in portfolio |
| `422` | ML service: article missing required `title` or `date` |
| `500` | Unhandled pipeline, DB, or ML failure |

---

## Data Models

### News (MongoDB)

| Field | Type | Notes |
|---|---|---|
| `title` | String (unique) | Upsert key for the pipeline |
| `stocks` | String[] | Uppercase NSE tickers |
| `domain` | String | Market sector (Banking, FMCG, Technology…) |
| `signal` | String | Enum: `BUY` \| `SELL` \| `HOLD` |
| `confidence_score` | Number | 0.0 – 1.0 |
| `rsi` | Number \| null | |
| `macd` | Number \| null | |
| `source` | String | Defaults to `'NewsAPI'` |
| `publishedAt` | Date | |
| `sourceUrl` | String | |
| `imageUrl` | String | |
| `expiresAt` | Date | TTL index — auto-deleted 3 days after creation |
| `createdAt / updatedAt` | Date | Auto-managed by Mongoose |

### Portfolio (MongoDB)

| Field | Type | Notes |
|---|---|---|
| `userId` | ObjectId → User | Foreign key |
| `ticker` | String | Uppercase, e.g. `TCS`, `INFY` |
| `qty` | Number | Minimum 1 |
| `addedAt` | Date | Defaults to `Date.now()` |
| Unique Index | Compound | `{ userId, ticker }` — no duplicates per user |

### User (MongoDB)

| Field | Type | Notes |
|---|---|---|
| `googleId` | String (unique) | OAuth `sub` claim |
| `email` | String | |
| `name` | String | |
| `picture` | String | Defaults to `''` |
| `createdAt / updatedAt` | Date | Auto-managed by Mongoose |

---

## Known Issues

The following bugs were identified in documentation review and should be fixed before production:

| # | Location | Issue |
|---|---|---|
| 1 | `suggested/route.ts` vs `News.ts` | Route queries for signal `'STRONG BUY'`, but the News model enum only declares `BUY`, `SELL`, `HOLD`. `STRONG BUY` is not a valid enum value — query will never match. |
| 2 | `health/route.ts` vs `News.ts` | Health route selects field `'headline'`, but the schema defines it as `'title'`. `latestArticle.headline` will always be `undefined`. |
| 3 | `pipeline.ts` vs `News.ts` | `runNewsPipeline()` writes `article_id`, `date`, `author`, and `impacted_domains` into merged objects, but none of these paths are defined in `News.ts`. Mongoose silently ignores them. |

---

## Cross-Module Integration Rules

1. `sendNewsToML()` sends **only** `date`, `source`, `title`, and `description` to the ML service.
2. `runNewsPipeline()` expects the ML response array to be in the **same order** as input articles (positional alignment).
3. All dashboard routes read directly from the MongoDB news collection — they depend on exact field names written by the pipeline.
4. `session.user.id` (MongoDB `_id`) is **required** for every authenticated portfolio API route.
5. Ticker symbols must always be **normalized to uppercase** before any MongoDB query.
