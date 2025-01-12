# Buy-Via Application

This project contains both the backend (FastAPI) and frontend (React) services for the Buy-Via application. The services are containerized using Docker and can be managed together with Docker Compose.

## Running Locally on a Developer Machine

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
    cd FrontEnd
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

# Running using docker

### Prerequisites
1. Install [Docker](https://docs.docker.com/get-docker/).
2. Clone this repository:
    ```bash
    git clone <repository-url>
    cd Buy-Via
    ```

## Environment Variables
The backend requires a `.env` file in the `backend` directory with the following structure:

```plaintext
# Auth settings
AUTH_SECRET_KEY=<secret_key>
AUTH_ALGORITHM=HS256

# Backend settings
API_URL=http://localhost:5173
DB_URL=sqlite:///./backend/buy_via.db

# Deployment environment
DEPLOYMENT_ENVIRONMENT=DEV

# Email settings
SMTP_HOST=<smtp_host>
SMTP_PORT=<smtp_port>
SMTP_USERNAME=<smtp_username>
SMTP_PASSWORD=<smtp_password>

```

1. **Navigate to the `backend` directory**:
    ```bash
    cd backend
    ```

2. **Create a `.env` file** with the above variables and replace `<values>` with the correct information.

## Running the Project

### Using Docker Compose (Recommended)
Run these commands from the **root directory (`Buy-Via`)**:

1. **Build the Docker images**:
    ```bash
    docker compose build
    ```

2. **Run the containers**:
    ```bash
    docker compose up
    ```

3. **Access the application**:
    - Backend API: [http://localhost:8000](http://localhost:8000)
    - Frontend: [http://localhost:5173](http://localhost:5173)

4. **Stop the containers**:
    ```bash
    docker compose down
    ```

5. **To clear volumes (optional)**:
    ```bash
    docker compose down --volumes
    ```
6. **To get into a Docker container's shell (optional)**:
    ```bash
    docker exec -it <container_id> bash
    ```

### Running Services Individually

#### Backend

1. **Navigate to the `backend` directory**:
    ```bash
    cd backend
    ```

2. **Build the Docker image**:
    ```bash
    docker build -t buy-via-backend .
    ```

3. **Run the backend container**:
    ```bash
    docker run -it --rm -p 8000:8000 buy-via-backend
    ```

4. **Access the backend API** at [http://localhost:8000](http://localhost:8000).

#### Frontend

1. **Navigate to the `frontend` directory**:
    ```bash
    cd FrontEnd
    ```

2. **Build the Docker image**:
    ```bash
    docker build -t buy-via-frontend .
    ```

3. **Run the frontend container**:
    ```bash
    docker run -it --rm -p 5173:5173 buy-via-frontend
    ```

4. **Access the frontend** at [http://localhost:5173](http://localhost:5173).

### Common Troubleshooting

## Development Notes

- Backend service: **FastAPI**.
- Frontend service: **React** with **Vite**.
- The project uses **Docker Compose** for seamless container orchestration.
- Live code synchronization is supported for local development using mounted volumes.

This guide ensures that developers know **which directory** to navigate to and run commands, reducing confusion.