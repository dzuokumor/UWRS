# Urban Waste Reporting System (UWRS)

## Table of Contents  
- [Introduction](#introduction)  
- [System Requirements](#system-requirements)  
- [Installation Guide](#installation-guide)  
- [Setting Up Environment Variables](#setting-up-environment-variables)  
- [Database Setup](#database-setup)  
- [Running the Application](#running-the-application)  
- [API Endpoints & Testing](#api-endpoints--testing)  
- [Frontend Setup](#frontend-setup)  
- [Deployment Guide](#deployment-guide)  
- [Troubleshooting & Common Issues](#troubleshooting--common-issues)  
- [Contributing](#contributing)  
- [License](#license)  

---

## Introduction  
The **Urban Waste Reporting System (UWRS)** is a platform that enhances urban waste management by enabling real-time waste reporting, community-led cleanup initiatives, and collaboration with NGOs and government agencies.  

---

## System Requirements  

To successfully run the project, ensure you have the following installed:

### Backend Requirements  
- Python (≥ 3.9)  
- Flask  
- SQLite / PostgreSQL  
- Cloudinary API (for image storage)  
- Flask-Mail (for email authentication)  

### Frontend Requirements  
- Node.js (≥ 16.x)  
- React.js  
- Tailwind CSS  

---

## Installation Guide  

### 🛠️ Step 1: Clone the Repository  
To begin, clone the repository from GitHub to your local machine using the following command:  

git clone https://github.com/your-username/uwrs.git

Navigate into the project directory:


cd uwrs
## Step 2: Set Up a Virtual Environment
Create a virtual environment to isolate project dependencies:


python -m venv venv  
Activate the virtual environment:

For Windows:


venv\Scripts\activate  
For macOS/Linux:


source venv/bin/activate  
## Step 3: Install Dependencies
With the virtual environment activated, install the required dependencies using:


pip install -r requirements.txt
Setting Up Environment Variables
Create a .env file in the root directory and add the following:


# General
SECRET_KEY=your_secret_key


# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Flask-Mail)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_email_password
Database Setup
Initialize and apply migrations to set up the database:


flask db init
flask db migrate -m "Initial migration"
flask db upgrade
(Optional) If you want to seed initial data into the database, run:


python seed.py
Running the Application
Start the backend server using:


flask run
By default, the server runs on http://127.0.0.1:5000.

API Endpoints & Testing
General User Signup
POST /api/auth/signup
Request Body:
json
{
  "email": "user@gmail.com",
  "password": "password123"
}
Email Verification
GET /api/auth/verify-email?token=<your_token>
User Login
POST /api/auth/login
Request Body:
json
{
  "email": "user@gmail.com",
  "password": "password123"
}
Submit Waste Report
POST /api/waste/report
Headers:
Authorization: Bearer <JWT_TOKEN>
Request Body:
json
{
  "location": "Lagos, Nigeria",
  "description": "Illegal dumping site",
  "image": "cloudinary_image_url"
}
Claim Waste Report (NGOs & Government)
POST /api/waste/claim/<report_id>
Frontend Setup
Navigate to the frontend directory:


cd frontend
Install dependencies:

npm install
Start the React development server:

npm start
By default, the frontend runs at http://localhost:3000.

Deployment Guide
Backend Deployment (Vercel/Heroku)
Install Heroku CLI and log in:

npm install -g heroku
heroku login
Push the code to Heroku:

git push heroku main
Frontend Deployment (Vercel)
Install Vercel CLI and log in:

npm install -g vercel
vercel login
Deploy the frontend:

vercel --prod
Troubleshooting & Common Issues
Virtual Environment Not Activating (Windows)
If the virtual environment doesn't activate, try:

venv\Scripts\activate of venv\Scripts\activate.ps1
If that fails, run:

Set-ExecutionPolicy Unrestricted -Scope Process
Database Migrations Not Working
If migrations fail, reset and re-run them:

flask db downgrade
flask db migrate
flask db upgrade
Cloudinary Image Upload Fails
Check your .env file and ensure CLOUDINARY_API_KEY is set correctly.

Email Verification Not Sending
Ensure Less Secure Apps is enabled in your Gmail settings.

Contributing
Fork the repository

Create a branch (git checkout -b feature-name)

Commit changes (git commit -m "Added new feature")

Push to GitHub (git push origin feature-name)

Open a pull request


🎯 Congratulations! You now have a fully functional Urban Waste Reporting System running on your machine. 🚀

---







