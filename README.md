# CogniFuse Master Project Document

Last updated: May 1, 2026

## 1. Executive Summary

CogniFuse is an AI-powered learning platform that turns study material into an adaptive knowledge system. A user can paste notes or upload a PDF/image, and the application extracts concepts, builds a prerequisite-aware knowledge graph, generates flashcards, creates quizzes, diagnoses weak foundations, tracks mastery, and recommends what to study next.

The product combines:

- OCR and PDF text extraction for uploaded study material.
- LLM-based concept relationship extraction.
- A persistent user-specific knowledge graph.
- GraphSAGE-based node embeddings and link prediction.
- FAISS-backed semantic concept search.
- SM-2 spaced repetition for review scheduling.
- Adaptive quiz feedback and mistake analysis.
- Analytics for streaks, mastery, and weak concept clusters.

The current implementation is split into a FastAPI backend and a React frontend, with Supabase handling authentication and persistence.

## 2. Product Vision

CogniFuse is designed to act as a student's "second brain" for structured learning. Instead of treating notes as flat text, the system converts them into a graph of connected concepts. This allows the app to answer learning-specific questions:

- What concepts are in this material?
- Which ideas depend on other ideas?
- What should the learner study first?
- Which flashcards should be reviewed?
- Why did the learner miss a quiz question?
- Which weak foundations are blocking progress?
- What should the learner study next?

The central product thesis is that learning becomes faster and more reliable when study content is converted into prerequisite order, reinforced with active recall, and adjusted based on mastery.

## 3. Current Repository Structure

```text
CogniFuse/
  backend/
    main.py                 FastAPI app, auth, endpoints, pipeline orchestration
    llm_service.py          OpenRouter LLM integration and prompt logic
    gemini_service.py       Older/direct Gemini integration, currently not imported by main.py
    graph.py                NetworkX knowledge graph wrapper
    gnn_service.py          GraphSAGE embedding, link prediction, readiness scoring
    search_service.py       FAISS/brute-force semantic search and weak area detection
    ocr_service.py          EasyOCR image OCR and PyPDF2 PDF extraction
    supabase_client.py      Supabase client setup
    requirements.txt        Python dependencies
    Procfile                Deployment process command
    runtime.txt             Python runtime
    data/history.json       Legacy local history stub
  frontend/
    src/
      App.js                Routing, protected routes, navbar
      index.js              React entrypoint and Axios auth interceptor
      supabaseClient.js     Supabase frontend client
      pages/
        Landing.js          Public marketing/entry page
        Login.js            Sign in/sign up flow
        Upload.js           Text/file upload and processing
        Flashcards.js       Flashcard review flow
        Quiz.js             Quiz, answer submission, mistake diagnosis
        MindMap.js          D3 graph visualization
        Analytics.js        Streak, mastery, weak-zone dashboard
      index.css             Tailwind/global UI system
    package.json            React dependencies and scripts
    tailwind.config.js      Tailwind theme extension
  implementation_plan.md.resolved
  task.md.resolved
```

## 4. System Architecture

### Frontend

The frontend is a Create React App application using:

- React 19
- React Router 7
- Axios
- Supabase JS
- D3
- Tailwind CSS

It provides authenticated pages for uploading material, reviewing flashcards, taking quizzes, viewing a mind map, and checking analytics.

The app stores recent generated flashcards, graph data, and ordered concepts in `sessionStorage` after processing content. It also fetches persistent data from the backend when available.

### Backend

The backend is a FastAPI application using:

- FastAPI and Uvicorn
- Supabase Python client
- OpenRouter through the OpenAI SDK
- NetworkX
- PyTorch and PyTorch Geometric
- FAISS
- EasyOCR
- PyPDF2
- spaCy

The backend authenticates every protected request using the Supabase JWT in the `Authorization: Bearer <token>` header.

### Persistence

Supabase is the active persistence layer. The backend expects these tables:

- `knowledge_graphs`
- `flashcards`
- `profiles`
- `concept_mastery`
- `activity_logs`

The repository also contains `backend/data/history.json`, but the current main backend flow uses Supabase rather than this local file.

## 5. End-to-End Learning Flow

1. The user signs in through Supabase Auth.
2. The user submits text or uploads a PDF/image from the dashboard.
3. The backend extracts raw text if a file was uploaded.
4. The LLM extracts explicit concept triplets from the material.
5. The LLM generates foundational prerequisite triplets for the main topic.
6. The backend loads the user's existing knowledge graph from Supabase.
7. The graph is updated with foundational and current triplets.
8. The graph runs the GNN pipeline:
   - Train GraphSAGE embeddings.
   - Predict implicit relationships.
   - Build the semantic search index.
9. The graph is topologically ordered so prerequisites appear first.
10. The LLM generates flashcards in prerequisite order.
11. Graph data, flashcards, and activity logs are saved to Supabase.
12. The frontend sends the user to the flashcard experience.
13. The user can quiz themselves on a concept.
14. Quiz results update mastery, streak, and SM-2 review state.
15. Incorrect answers trigger root-cause lookup and optional AI mistake analysis.
16. Analytics and recommendations use graph structure, mastery, and embeddings.

## 6. Backend Modules

### `main.py`

`main.py` is the backend orchestrator. It defines the FastAPI app, configures CORS, validates Supabase sessions, loads and saves user-scoped graph state, and exposes all public API endpoints.

Important responsibilities:

- Authenticate requests with Supabase.
- Process raw text and uploaded files.
- Run the full concept-to-flashcard pipeline.
- Generate quizzes.
- Submit quiz answers.
- Update streaks, mastery, and SM-2 data.
- Return graph, flashcards, summaries, recommendations, semantic search results, and analytics.
- Reset a user's learning state.

### `llm_service.py`

This is the active AI generation service used by `main.py`.

It uses OpenRouter via the OpenAI SDK:

- Primary model: `google/gemini-2.0-flash-lite-001`
- Fallback model: `openai/gpt-4o-mini`

Capabilities:

- Extract concept relationship triplets.
- Generate foundational prerequisite triplets.
- Analyze mistakes.
- Generate flashcards in batches.
- Generate multiple-choice quizzes.
- Generate alternate flashcard explanations.
- Generate concept summaries.

It also attempts to load `en_core_web_sm` for spaCy NER enrichment. If the model is missing, the service continues without NER.

### `graph.py`

`KnowledgeGraph` wraps a NetworkX directed graph.

It stores:

- Concept nodes.
- Directed relationship edges.
- Mastery scores.
- Node type metadata: `base` or `current`.
- GNN service state.
- Semantic search service state.

Core behavior:

- Build graph data from triplets.
- Load graph JSON from Supabase.
- Export graph JSON for Supabase/frontend.
- Topologically order concepts.
- Fall back to in-degree ordering if cycles exist.
- Traverse prerequisites backward to find root causes.
- Update and read mastery.
- Compute recommendations, weak areas, clusters, and semantic search.

### `gnn_service.py`

This module implements the GraphSAGE intelligence layer.

It converts the NetworkX graph into a PyTorch Geometric graph with five node features:

- In-degree
- Out-degree
- Mastery
- PageRank
- Clustering coefficient

It trains a two-layer GraphSAGE encoder and a link predictor using positive graph edges and randomly sampled negative pairs. Outputs are 128-dimensional node embeddings.

The service also:

- Predicts missing links between concepts.
- Computes readiness scores from mastery and prerequisite embedding similarity.
- Provides embeddings for visualization/search.

### `search_service.py`

This module builds a semantic index over GNN embeddings.

If FAISS is available, it uses `IndexFlatIP` over normalized vectors for cosine-style similarity. If FAISS is unavailable, it falls back to brute-force cosine search.

Capabilities:

- Search for concepts similar to a query concept.
- Cluster concepts by embedding similarity.
- Detect weak areas by finding low-mastery clusters.

### `ocr_service.py`

This module extracts text from uploaded files.

Image extraction uses EasyOCR with tuned parameters for faint or handwritten text:

- Paragraph grouping enabled.
- Wider horizontal spacing tolerance.
- Mild vertical tolerance.
- Lower contrast threshold.
- Text threshold filtering.

PDF extraction uses PyPDF2 page text extraction.

### `supabase_client.py`

This creates the backend Supabase client from environment variables.

Priority:

1. `SUPABASE_SERVICE_ROLE_KEY`
2. `SUPABASE_ANON_KEY`

The service role key is preferred so backend database operations can bypass RLS where appropriate.

## 7. API Reference

All main learning endpoints require a valid Supabase bearer token.

### Content Processing

`POST /process-text`

Request:

```json
{
  "text": "study notes..."
}
```

Response includes:

- `triplets`
- `graph`
- `flashcards`
- `ordered_concepts`

`POST /process-file`

Accepts multipart file upload. Supported formats:

- PDF
- PNG
- JPG/JPEG
- BMP
- TIFF
- WEBP

### Quiz and Learning

`POST /generate-quiz`

```json
{
  "concept": "Gradient Descent"
}
```

Returns:

- `question`
- `options`
- `answer`

`POST /submit-answer`

```json
{
  "concept": "Gradient Descent",
  "correct": true,
  "score": 25
}
```

Updates:

- Streak
- SM-2 schedule
- Mastery score
- Graph persistence
- Concept mastery row

`POST /analyze-mistake`

```json
{
  "question": "Quiz question",
  "user_answer": "Wrong answer",
  "concept": "Gradient Descent"
}
```

Returns:

- `analysis`
- `suggestion`
- `foundational_concept`

### Graph and Study Material

`GET /graph`

Returns graph data:

- `nodes`
- `edges`
- `gnn_active`

`GET /flashcards`

Returns user flashcards from Supabase.

`POST /summary`

```json
{
  "concept": "Gradient Descent"
}
```

Returns a short AI-generated concept summary.

### Recommendations and Search

`GET /recommend-next?top_k=5`

Returns GNN-readiness-based concepts to study next.

`GET /semantic-search?query=<concept>&top_k=5`

Returns semantically similar graph concepts. In the current implementation, `query` must match an existing concept because search uses concept embeddings, not free-text embedding generation.

### Analytics

`GET /analytics/streak`

Returns:

- `count`
- `last_active`

`GET /analytics/mastery`

Returns:

- `average`
- `total_concepts`

`GET /analytics/weak-zones`

Returns low-mastery concept clusters.

### Reset

`POST /reset`

Deletes graph, flashcards, mastery data, and resets streak data for the authenticated user.

## 8. Database Model

The code implies the following Supabase schema.

### `knowledge_graphs`

Stores one graph JSON payload per user.

Expected fields:

- `user_id`
- `graph_json`
- `updated_at`

### `flashcards`

Stores generated flashcards.

Expected fields:

- `user_id`
- `concept`
- `front`
- `back`

### `profiles`

Stores user-level learning metadata.

Expected fields:

- `id`
- `email`
- `streak_count`
- `last_active_date`

### `concept_mastery`

Stores per-concept mastery and spaced repetition state.

Expected fields:

- `user_id`
- `concept`
- `mastery_score`
- `sm2_interval`
- `sm2_repetitions`
- `sm2_ease_factor`
- `next_review`

Important code note: `get_user_history()` currently reads raw `concept_mastery` rows into a dictionary, while `/submit-answer` expects keys named `interval`, `repetitions`, and `ease_factor` for existing rows. Existing database rows use `sm2_interval`, `sm2_repetitions`, and `sm2_ease_factor`. This mismatch should be fixed before relying heavily on repeated review scheduling.

### `activity_logs`

Stores audit/activity events.

Expected fields:

- `user_id`
- `action`
- `details`

## 9. Frontend Pages

### Landing

`Landing.js` is the public entry page. It markets the app as an AI-powered neural learning tool and routes authenticated users to the dashboard or unauthenticated users to login.

### Login

`Login.js` supports sign in and sign up with Supabase email/password auth.

### Dashboard / Upload

`Upload.js` is the main authenticated starting point. It supports:

- Pasted notes.
- Drag-and-drop file upload.
- PDF and image upload.
- Processing through `/process-text` or `/process-file`.
- Saving generated graph, flashcards, and concept order into `sessionStorage`.
- Navigating to flashcards after successful processing.

### Flashcards

`Flashcards.js` presents generated cards in prerequisite order.

Features:

- Flip-card UI.
- Previous/next navigation.
- Keyboard controls.
- Concept trail.
- Route into quiz for the current concept.

### Quiz

`Quiz.js` generates and renders multiple-choice questions.

Features:

- Concept selection.
- Answer checking.
- Mastery score display.
- Backend answer submission.
- AI mistake diagnosis after wrong answers.
- Optional navigation to a foundational concept from mistake analysis.
- Reset session action.

### Mind Map

`MindMap.js` renders the graph with D3.

Features:

- Force-directed graph.
- Node color by mastery.
- Directed edges with labels.
- Predicted links shown as dashed purple relationships.
- Foundational/current topic filters.
- Node click summaries.
- Quiz navigation for selected concepts.
- Reset action.

### Analytics

`Analytics.js` shows:

- Study streak.
- Overall mastery.
- Total concepts.
- GNN-powered weak zones.
- Target practice entry points.

## 10. Environment Variables

### Backend

Required:

```text
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
```

Optional/legacy:

```text
GEMINI_API_KEY=
```

`GEMINI_API_KEY` is only used by `gemini_service.py`, which is not the active service imported by `main.py`.

### Frontend

Required:

```text
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
REACT_APP_API_URL=http://localhost:8000
```

## 11. Local Development

### Backend

From `backend/`:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Notes:

- `torch`, `torch-geometric`, `faiss-cpu`, `easyocr`, and `spacy` are large dependencies.
- `main.py` sets `KMP_DUPLICATE_LIB_OK=TRUE` before importing numerical libraries to reduce OpenMP runtime conflicts.
- EasyOCR may download model assets on first use.

### Frontend

From `frontend/`:

```bash
npm install
npm start
```

Default frontend URL:

```text
http://localhost:3000
```

Default backend URL:

```text
http://localhost:8000
```

## 12. Deployment Notes

The backend includes:

```text
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

The Python runtime is pinned to:

```text
3.11.11
```

Deployment platform requirements:

- Python 3.11 support.
- Enough disk space for ML dependencies.
- Environment variables for Supabase and OpenRouter.
- CPU resources sufficient for GraphSAGE training and OCR.

The frontend can be built with:

```bash
npm run build
```

## 13. Current Implementation Status

Completed or substantially implemented:

- Supabase authentication integration.
- Protected frontend routes.
- Text upload flow.
- File upload flow.
- PDF extraction.
- EasyOCR image extraction with handwriting-oriented tuning.
- OpenRouter LLM service with fallback.
- spaCy NER enrichment when the model is available.
- Knowledge graph construction.
- Foundational prerequisite generation.
- Topological concept ordering.
- Flashcard generation.
- Quiz generation.
- Mistake analysis.
- Mastery updates.
- Streak updates.
- SM-2 scheduling logic.
- GraphSAGE embeddings.
- Link prediction.
- FAISS semantic index.
- Semantic clusters and weak-zone detection.
- D3 mind map with foundational/current filters.
- Analytics dashboard.

Remaining or incomplete:

- Automated backend tests are planned but not present.
- Frontend test still contains the default Create React App `learn react` assertion and will not match the current app.
- The frontend README is still the default Create React App README.
- `gemini_service.py` appears to be legacy/unused.
- `backend/data/history.json` appears to be legacy/unused by the current Supabase flow.
- Free-text semantic search is not fully implemented; current search expects an existing concept name.
- `mutate_card()` exists in `llm_service.py` but `/submit-answer` does not currently call it, so `mutated_card` usually remains `None`.
- The SM-2 database read/write key mismatch should be corrected.
- Several files contain mojibake characters from an encoding issue, especially comments and UI emoji text. This does not necessarily break runtime behavior, but it should be cleaned for polish.

## 14. Known Technical Risks

### Authentication and RLS

The backend uses the Supabase service role key when available. This is powerful and should only be used server-side. Never expose it in frontend environment variables.

### Runtime Cost

The graph pipeline retrains GraphSAGE after graph load/build. For larger graphs, this can add noticeable latency.

### LLM JSON Reliability

The backend prompts the model to return strict JSON and strips markdown fences, but model output can still be malformed. The code has fallbacks in many places, but production quality would benefit from schema validation and retry/repair logic.

### Semantic Search Scope

The search service indexes graph node embeddings, not natural-language query embeddings. This is useful for concept-to-concept similarity, but it is not yet a full free-text semantic search engine.

### Supabase Schema Coupling

The code assumes table and column names but the repo does not include migrations. Without migrations, setup depends on manually creating the correct schema.

### Frontend Session Storage

The frontend uses `sessionStorage` for immediate generated results. This works for the current session, but persistent reload behavior depends on backend fetches and can be inconsistent across pages.

## 15. Recommended Next Improvements

1. Add Supabase migrations or a schema SQL file.
2. Fix the SM-2 read/write field mismatch.
3. Replace the default frontend test with tests for login/routing or upload rendering.
4. Add backend tests for:
   - Triplet graph construction.
   - Topological fallback with cycles.
   - SM-2 scheduling.
   - Weak-zone detection.
   - Auth failure handling.
5. Clean mojibake/encoding artifacts across source files.
6. Either remove `gemini_service.py` or document it as a deprecated fallback.
7. Add a project-specific frontend README.
8. Add a true free-text semantic search path using text embeddings.
9. Move GNN training to a background job or cache embeddings more aggressively for larger graphs.
10. Add API response models for stronger FastAPI documentation.

## 16. One-Sentence Pitch

CogniFuse turns notes into an adaptive learning graph, then uses AI, active recall, spaced repetition, and graph intelligence to tell each learner what to understand first, what to review next, and why they are struggling.
