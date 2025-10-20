# Backend API Server

Express.js backend that provides analysis endpoints for the Project Afterglow web app.

## Setup

1. Install dependencies (already done):
   ```bash
   npm install
   ```

2. Create `.env` file with required variables:
   ```bash
   cp .env.example .env
   ```

3. Add your OpenRouter API key to `.env`:
   ```
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

## Development

### Start Backend Only
```bash
npm run server:dev
```

Server runs on `http://localhost:3001` with auto-reload on file changes.

### Start Frontend + Backend
```bash
npm run dev:all
```

Runs both:
- Frontend (Vite): `http://localhost:3000`
- Backend (Express): `http://localhost:3001`

## API Endpoints

### Health Check
```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T10:00:00.000Z"
}
```

### Analyze Dating App Data
```bash
POST /api/analyze
```

Request body:
```json
{
  "messages": [...],      // Array of NormalizedMessage
  "matches": [...],       // Array of MatchContext
  "participants": [...],  // Array of ParticipantProfile
  "userId": "user-1",     // Current user's ID
  "platform": "tinder"    // "tinder" | "hinge" | "other"
}
```

Response (200):
```json
{
  "result": {
    "completedStage": "stage1" | "stage2",
    "stage1Report": { /* Stage 1 report */ },
    "stage2Report": { /* Stage 2 report if escalated */ },
    "processing": {
      "stage1Duration": 1234,
      "stage2Duration": 5678 | null,
      "totalDuration": 6912,
      "stage1Cost": 0.0123,
      "stage2Cost": 0.0456 | null,
      "totalCost": 0.0579,
      "escalated": true,
      "escalationReason": "Red flags detected"
    }
  },
  "metadata": {
    "requestedAt": "2024-01-01T10:00:00.000Z",
    "processingTimeMs": 6912,
    "platform": "tinder"
  }
}
```

Error response (400/500):
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "stack": "..." // Only in development
  }
}
```

## Testing

### Test Validation
```bash
# Missing messages (should return 400)
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"messages":[],"matches":[],"participants":[],"userId":"test","platform":"tinder"}'
```

### Test with Real Data
Requires `.env` with `OPENROUTER_API_KEY` set.

See `examples/` directory for sample Tinder and Hinge data files.

## Architecture

```
Frontend (Vite)           Backend (Express)           AI Service
    :3000        ━━━━━>       :3001        ━━━━━>  OpenRouter

                          /api/analyze
                              ↓
                     runTwoStageAnalysis()
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
            Stage 1: Safety        Stage 2: Deep
              Screener              Analysis
               (GPT-3.5)            (GPT-4)
                    ↓                   ↓
           generateStage1Report  generateStage2Report
                    ↓                   ↓
                    └─────────┬─────────┘
                              ↓
                      Return results
```

## File Structure

```
server/
├── index.ts                 # Main Express server
├── routes/
│   └── analyze.ts          # Analysis endpoint
├── middleware/
│   ├── error-handler.ts    # Error handling
│   ├── request-logger.ts   # Request logging
│   └── validate-request.ts # Schema validation
└── types/
    └── api.ts              # API type definitions
```

## Environment Variables

Required:
- `OPENROUTER_API_KEY` - OpenRouter API key for AI analysis

Optional:
- `PORT` - Server port (default: 3001)
- `CORS_ORIGIN` - CORS origin (default: http://localhost:3000)
- `NODE_ENV` - Environment (development/production)

## Error Codes

- `VALIDATION_ERROR` - Request validation failed
- `NO_MESSAGES` - Empty messages array
- `ANALYSIS_FAILED` - Analysis processing error
- `INTERNAL_ERROR` - Unknown server error
