# Buy-Via

## Prerequisites

- Python 3.x
- Node.js and npm

## Backend Setup

1. Navigate to the backend directory:

    ```bash
    cd backend
    ```

2. Create and activate a virtual environment:

    ```bash
    python -m venv venv
    ```

    On Windows:

    ```bash
    venv\Scripts\activate
    ```

    On macOS/Linux:

    ```bash
    source venv/bin/activate
    ```

3. Install the dependencies:

    ```bash
    pip install -r requirements.txt
    ```

## Frontend Setup

1. Navigate to the frontend directory:

    ```bash
    cd frontend
    ```

2. Install the packages:

    ```bash
    npm install
    ```

## Running the Backend

In the backend directory with the virtual environment activated:

```bash
uvicorn main:app --reload
```

## Running the Frontend

In the frontend directory:

```bash
npm run dev
```

## Running the Scraper

1. Ensure the virtual environment is activated:

    ```bash
    venv\Scripts\activate
    ```

2. Run the scraper manager:

    ```bash
    python -m scraper.scraper_manager
    ```