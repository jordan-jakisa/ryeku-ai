## Azure OpenAI configuration

The backend now exclusively uses **Azure OpenAI** for all LLM calls (including the source-credibility classifier).

Add these variables to `backend/.env`:

```dotenv
AZURE_OPENAI_DEPLOYMENT="gpt-4o-mini"   # your deployment name
AZURE_OPENAI_ENDPOINT="https://<resource>.openai.azure.com/"
AZURE_OPENAI_API_VERSION="2023-05-15"
AZURE_OPENAI_API_KEY="<your key>"

# Optional – Redis cache
REDIS_URL="redis://localhost:6379/0"
```

Run the API:

```bash
cd backend
pip install -r requirements.txt  # ensure openai>=1.3.0
uvicorn app.main:app --reload
``` 