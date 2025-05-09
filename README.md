# Full-Stack Django + React Project

This is a full-stack web application using Django (backend) and React (frontend). The backend provides a REST API, and the frontend consumes it to offer a user-friendly interface.

---

## Getting Started

### 1. Backend Setup (Django)

#### Install dependencies

```bash
pip install django
pip install djangorestframework
pip install django-cors-headers
```

#### Run the backend server

```bash
python manage.py migrate
python manage.py runserver
```

### 2. Frontend Setup (React)

#### Install dependencies

```bash
npm install
npm install react-bootstrap bootstrap
```

#### Run the frontend

```bash
npm start
```

---

## Project Structure Overview

### Backend (Django)

- **models.py**  
  Defines the data models used in the application.

- **serializers.py**  
  Converts Django models to JSON format and vice versa for REST API interaction.

- **views.py**  
  Contains CRUD logic and endpoints for API routes. Also all the backend checks that needed for input getting done in here.
  
  *TO DO: Right now checked things are below. PLS ADD ANY ELSE IF YOU FIND*
  
  *- For task --> Users must be users of WP, can connected with only 1 WP, start/end week must not exceed that of WP*

- **urls.py**  
  Connects view logic to specific URL endpoints.

### Frontend (React)

- **Navigator.js**  
  Main navigation bar or sidebar for switching between pages.

- **User.js / WorkPackage.js / Task.js**  
  Pages for listing and interacting with each model's data.

- **AddUserModal.js / EditUserModal.js (for each page similar 2 files)**  
  Modal components for adding and editing model entries (similar files exist for other models like WorkPackage and Task).

---

## Notes

- PLS check for urls in backend part before adding smth related with it
- CORS must be properly configured in Django for frontend-backend communication.
- Customize this README as your project grows.
