# Buy-Via Application

## Introduction 

Buy-Via is an online platform that allows users to compare product prices across multiple e-commerce websites. The system automatically collects data from different online stores using web scraping, ensuring that users always have access to the latest prices.

This project consists of two main components:

- **Backend (FastAPI)**: The backend handles data processing, authentication, and interactions with the database.
- **Frontend (React)**: The frontend provides a user-friendly interface for customers to search and compare prices.

The application is designed to be fast, efficient, and scalable. It runs using Docker, which makes it easier to deploy on different machines.

## Technical Overview 

This project contains both the backend (FastAPI) and frontend (React) services for the Buy-Via application. The services are containerized using Docker and can be managed together with Docker Compose.

### GitHub Repository

The source code for the Buy-Via application is available on GitHub:

🔗 **[Buy-Via GitHub Repository](https://github.com/FAHOO20/Buy-Via/)**


### Important Notes:

1. **Environment Variables**:
    - The application requires `.env` files for both the backend and frontend.
    - The backend `.env` file contains:
      - AWS PostgreSQL RDS connection string.
      - Authentication secret keys.
    - The frontend `.env` file contains:
      - API URLs for different environments.
    - These details are not included in the repository for security reasons. To run the application, you need to create `.env` files based on the provided templates (`.env.example`) and fill them with your own credentials.

## Environment Variables

### Backend

The backend requires a `.env` file in the `backend/.env` directory with the following structure:

```plaintext
# Auth settings
AUTH_SECRET_KEY=<secret_key>
AUTH_ALGORITHM=HS256

# Backend settings
API_URL_DEV=http://localhost:5173
API_URL=<your_production_url>
DB_URL=postgresql://username:password@localhost:5432/database_name

# Deployment environment
DEPLOYMENT_ENVIRONMENT=DEV
```

### Frontend

The frontend requires a `.env` file in the `FrontEnd/.env` directory with the following structure:

```plaintext
VITE_API_URL_DEV=http://localhost:8000
VITE_API_URL=<your_production_url>
VITE_DEPLOYMENT_ENVIRONMENT=PROD
```

### Repository Structure:

- **`/backend`**: Contains the backend implementation using FastAPI.
- **`/frontend`**: Contains the frontend implementation using React.
- **`/scraper`**: Handles data collection from e-commerce websites using Selenium.
- **`/ai_modules`**: Contains AI functionality for product classification, recommendations, and products grouping.

2. **Classification Model**:
   - The pre-trained classification model `backend/ai_modules/classification_model.pkl` is not included in the github repository due to its large size.
3. **Database Setup**:
   - The application is configured to connect to a PostgreSQL database hosted on AWS RDS. If you want to run the application locally, you can:
     - Set up a local PostgreSQL instance.
     - Update the `.env` file with the appropriate connection string for your PostgreSQL instance.


## Different Ways to Run the Program

You can run the application in multiple ways:

1. **Local Python Environment**  
   Activate a virtual environment and install dependencies manually.  
   Recommended if you prefer more control over your environment.

2. **Docker (Recommended)**  
   Build and run the containers without worrying about environment conflicts.  
   Ideal if you want to ensure the scraper works with minimal setup issues.


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

