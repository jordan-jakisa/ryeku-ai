# Ryeku AI Research Assistant

Ryeku is a full-stack web application that leverages AI to automate the process of conducting research. Users can input a research topic, and the application will find relevant sources, analyze them, and generate a comprehensive report.

This project is a monorepo containing two main components:

-   `ryeku-backend`: A FastAPI application that serves the AI-powered research agent.
-   `ryeku-frontend`: A Next.js application that provides the user interface.

## Features

-   **AI-Powered Research**: Utilizes LangChain and LangGraph with Azure OpenAI to create an agentic research workflow.
-   **Source Discovery**: Automatically finds and suggests relevant, authoritative sources for any given topic.
-   **Report Generation**: Synthesizes information from selected sources to generate a structured and detailed research report.
-   **Interactive UI**: A modern and responsive user interface built with Next.js and Tailwind CSS.

## Getting Started

To run the entire application, you will need to have both the backend and frontend servers running concurrently.

### Prerequisites

-   [Python](https://www.python.org/) 3.9+
-   [Node.js](https://nodejs.org/) 18+
-   An Azure OpenAI account with a deployed model.

### 1. Run the Backend

First, get the backend server running.

1.  **Navigate to the backend directory:**
    ```bash
    cd ryeku-backend
    ```

2.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the `ryeku-backend` directory and add your Azure OpenAI API keys:
    ```
    AZURE_OPENAI_DEPLOYMENT="your-deployment-name"
    AZURE_OPENAI_API_VERSION="your-api-version"
    AZURE_OPENAI_ENDPOINT="your-endpoint"
    AZURE_OPENAI_API_KEY="your-api-key"
    ```

4.  **Start the backend server:**
    ```bash
    uvicorn app.main:app --reload
    ```
    The backend API will now be running at `http://localhost:8000`.

### 2. Run the Frontend

Next, set up and run the frontend application.

1.  **Open a new terminal and navigate to the frontend directory:**
    ```bash
    cd ryeku-frontend
    ```

2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```

3.  **Start the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend application will be accessible at `http://localhost:3000`.

## Usage

Once both servers are running, open your web browser and go to `http://localhost:3000` to start using the Ryeku AI Research Assistant.
