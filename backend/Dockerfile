FROM python:3.10-slim-buster

LABEL maintainer="BuyVia"

# Set the working directory
WORKDIR /dir

# Copy the requirements file
COPY requirements.txt /dir/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install system dependencies
RUN apt update && apt install -y \
    wget \
    curl \
    unzip \
    build-essential \
    libssl-dev \
    libffi-dev \
    libpq-dev \
    zlib1g-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    libncurses5-dev \
    libncursesw5-dev \
    liblzma-dev \
    xz-utils \
    tk-dev

# Install wget, curl, and unzip for downloads and extraction
RUN apt install curl wget unzip -y

# Set working directory again (redundant, but ensures location consistency)
WORKDIR /dir

# Copy the application files into the container
COPY . /dir

# Install Google Chrome
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt install ./google-chrome-stable_current_amd64.deb -y

# Download the latest ChromeDriver
RUN wget -q -O /tmp/chromedriver.zip "https://chromedriver.storage.googleapis.com/$(curl -sS https://chromedriver.storage.googleapis.com/LATEST_RELEASE)/chromedriver_linux64.zip"
RUN unzip /tmp/chromedriver.zip chromedriver -d /dir
RUN chmod +x /dir/chromedriver

# Expose FastAPI's default port
EXPOSE 8000

# Set the default command to run the FastAPI application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
