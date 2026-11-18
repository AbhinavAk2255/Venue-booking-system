# Venue Booking System

## Overview

The Venue Booking System is a backend-based web application developed using Django and Django REST Framework (DRF). The system allows venue owners to add and manage venues, while customers can browse venues and make bookings through secure REST APIs.

The application follows a role-based architecture consisting of Customer, Owner, and Super Admin roles. JWT authentication is implemented for secure login and protected API access.

---

# Features

## Authentication & Authorization

* User Registration
* JWT Token Login
* Role-Based Access Control
* Customer and Owner Roles
* Super Admin Access

---

# Venue Management

* Owners can add venues
* Owners can update their venues
* Owners can delete their venues
* Owners can view their own venues
* Venue image upload support
* Automatic venue capacity categorization

---

# Venue Categories

Venues are categorized automatically based on seating capacity:

* Intimate
* Classic
* Grand
* Elite

---

# Booking Management

* Customers can book venues
* Automatic booking amount calculation
* Accurate duration calculation using date and time
* Booking status management
* Customers can view their own bookings
* Owners can view bookings for their venues

---

# Booking Status

* Pending
* Approved
* Rejected

---

# Technologies Used

## Backend

* Python
* Django
* Django REST Framework (DRF)

## Database

* MySQL / SQLite

## Authentication

* JWT Authentication

## Tools

* Git
* GitHub
* Postman

---

# API Features

* RESTful API Architecture
* Secure JWT Authentication
* Role-Based Permissions
* CRUD Operations
* Image Upload APIs
* Serializer Validation
* Custom Permissions

---

# Project Structure

```text
venue_booking_system/
│
├── accounts/
├── venues/
├── bookings/
├── media/
├── manage.py
└── requirements.txt
```

---

# Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/venue-booking-system.git
```

---

## Create Virtual Environment

```bash
python -m venv venv
```

---

## Activate Virtual Environment

### Windows

```bash
venv\Scripts\activate
```

### Linux / Mac

```bash
source venv/bin/activate
```

---

## Install Dependencies

```bash
pip install -r requirements.txt
```

---

## Run Migrations

```bash
python manage.py makemigrations

python manage.py migrate
```

---

## Run Server

```bash
python manage.py runserver
```

---

# Author

Abhinav AK

---

# Future Improvements

* Online Payment Integration
* Booking Conflict Detection
* Venue Reviews & Ratings
* Email Notifications
* Advanced Search & Filters
* Booking Analytics Dashboard
