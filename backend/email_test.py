from fastapi import FastAPI
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# SMTP settings
smtp_server = os.getenv("SMTP_SERVER")
port = os.getenv("SMTP_PORT")
login = os.getenv("SMTP_USERNAME")
password = os.getenv("SMTP_PASSWORD") 

app = FastAPI()

@app.get("/send-email")
def send_email():
    sender_email = "example@mail.com"  # Adjust your sender email
    to_email = "a.fehaid20@gmail.com"

    # Email content
    message = MIMEMultipart("alternative")
    message["From"] = sender_email
    message["To"] = to_email
    message["Subject"] = "Test Email from FastAPI"

    html = """\
    <html>
        <body>
            <p>Hi, this is a test email sent from FastAPI.</p>
            <h1>Welcome!</h1>
        </body>
    </html>
    """
    part = MIMEText(html, "html")
    message.attach(part)

    try:
        # Connect using simple SMTP (no SSL, no STARTTLS)
        with smtplib.SMTP(smtp_server, port) as server:
            server.login(login, password)  # Authenticate
            server.sendmail(sender_email, to_email, message.as_string())
        return {"message": "Email sent successfully!"}
    except Exception as e:
        return {"error": str(e)}