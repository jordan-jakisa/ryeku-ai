# Ryeku Research Backend

This directory contains the FastAPI backend for the Ryeku research application. It uses LangChain and LangGraph to power an AI research agent.

## Setup

1.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

2.  **Create a `.env` file:**

    Create a `.env` file in this directory and add your Azure OpenAI credentials:

    ```
    AZURE_OPENAI_DEPLOYMENT="your-deployment-name"
    AZURE_OPENAI_API_VERSION="your-api-version"
    AZURE_OPENAI_ENDPOINT="your-endpoint"
    AZURE_OPENAI_API_KEY="your-api-key"
    ```

## Running the Application

To run the FastAPI server, use the following command:

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`. You can access the OpenAPI documentation at `http://localhost:8000/docs`. 