# Creative Invoice

AI-powered GST invoice data extraction for Indian businesses. Upload PDF invoices and get structured data extracted using OCR + LLM, with automatic GST validation.

## Features

- **PDF Upload** - Drag-and-drop single or batch (up to 10) PDF invoices
- **AI Extraction** - Google Document AI (OCR) + Groq LLM (Llama 3.3 70B) extracts structured fields
- **GST Validation** - GSTIN format checks, CGST/SGST/IGST rules, tax math verification
- **Multi-format Export** - JSON, Tally-compatible XML, CSV
- **Auth** - Email/password and Google OAuth via Supabase Auth
- **Subscription System** - Free tier (3 invoices/month) with Pro upgrade path
- **User Isolation** - Row Level Security ensures data privacy

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, Framer Motion |
| Backend | Python, FastAPI, Pydantic |
| OCR | Google Document AI |
| LLM | Groq API (Llama 3.3 70B) |
| Database | Supabase (PostgreSQL + Auth + Storage) |

## Architecture

```
Upload PDF -> Google Document AI (OCR) -> Groq LLM (Extraction) -> GST Validation -> Supabase Storage
```

Processing happens asynchronously via FastAPI BackgroundTasks. The frontend polls for results every 2 seconds.

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase project (free tier works)
- Google Cloud project with Document AI API enabled
- Groq API key

### 1. Clone and install

```bash
git clone <your-repo-url>
cd creative-invoice
```

### 2. Database setup

Run the SQL migrations in your **Supabase Dashboard > SQL Editor** in order:

```
backend/sql/001_create_tables.sql
backend/sql/002_subscriptions.sql
```

Also add the `deleted_at` column for soft deletes:

```sql
ALTER TABLE invoices ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;
```

### 3. Supabase Storage

Create a storage bucket named `invoices` in your Supabase Dashboard.

### 4. Backend setup

```bash
cd backend
cp .env.example .env
# Fill in your actual keys in .env
pip install -r requirements.txt
```

**Backend `.env` variables:**

| Variable | Description |
|----------|-------------|
| `GOOGLE_PROJECT_ID` | Google Cloud project ID |
| `GOOGLE_PROCESSOR_ID` | Document AI processor ID |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account JSON |
| `GROQ_API_KEY` | Groq API key |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `ALLOWED_ORIGINS` | Comma-separated frontend origins |

**Start the backend:**

```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
uvicorn app.main:app --reload --port 8000
```

> Note: `GOOGLE_APPLICATION_CREDENTIALS` must be set as an OS-level env var, not just in `.env`.

### 5. Frontend setup

```bash
cd frontend
cp .env.example .env
# Fill in your Supabase URL and anon key
npm install
npm run dev
```

**Frontend `.env` variables:**

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `VITE_API_BASE_URL` | Backend URL (default: `http://localhost:8000`) |

### 6. Google OAuth (optional)

To enable "Sign in with Google":

1. Go to **Supabase Dashboard > Authentication > Providers > Google**
2. Create OAuth 2.0 Client ID in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
3. Set redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Enter Client ID and Secret in Supabase dashboard

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| POST | `/api/invoices/upload` | Upload single PDF |
| POST | `/api/invoices/upload-batch` | Upload multiple PDFs (max 10) |
| GET | `/api/invoices` | List invoices |
| GET | `/api/invoices/{id}` | Get invoice details |
| GET | `/api/invoices/{id}/download?format=json\|xml\|csv` | Download extracted data |
| DELETE | `/api/invoices/{id}` | Delete invoice |
| GET | `/api/subscriptions/me` | Get subscription & usage |
| POST | `/api/buyers` | Save buyer GSTIN |
| GET | `/api/buyers` | List saved buyers |
| DELETE | `/api/buyers/{id}` | Delete buyer |

## Testing

```bash
cd backend
pytest                                    # all tests
pytest tests/test_validation.py           # single file
pytest tests/test_validation.py -k "test_name"  # single test
```

## Project Structure

```
creative-invoice/
├── backend/
│   ├── app/
│   │   ├── api/routes/          # FastAPI route handlers
│   │   ├── database/            # Supabase client & CRUD
│   │   ├── models/              # Pydantic schemas
│   │   ├── services/            # OCR, extraction, validation, pipeline
│   │   └── utils/               # Helpers
│   ├── sql/                     # Database migrations
│   ├── tests/                   # Unit & integration tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/          # UI, layout, feature components
│   │   ├── pages/               # Route pages
│   │   ├── contexts/            # Auth context
│   │   ├── hooks/               # Custom hooks
│   │   ├── lib/                 # Supabase & API clients
│   │   ├── types/               # TypeScript types
│   │   └── styles/              # Global CSS & Tailwind theme
│   └── package.json
└── README.md
```

## License

MIT
