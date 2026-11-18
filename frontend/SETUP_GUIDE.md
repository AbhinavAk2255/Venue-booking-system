# Venuva — Setup Guide

## STEP 1: Fix Django (Add CORS) — Run in your Django terminal

```bash
# In your venue_booking Django project folder:
pip install django-cors-headers
```

Then open `venue_booking/settings.py` and make these 3 edits:

### Edit 1 — Add to INSTALLED_APPS:
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',        # ← ADD THIS LINE
    'accounts',
    'booking',
    'venues',
]
```

### Edit 2 — Add to MIDDLEWARE (MUST be the FIRST item):
```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',           # ← ADD THIS AS FIRST LINE
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

### Edit 3 — Add this line anywhere in settings.py (at the bottom is fine):
```python
CORS_ALLOW_ALL_ORIGINS = True
```

Then restart Django:
```bash
python manage.py runserver
```

---

## STEP 2: Run the Frontend — In the animated-react-venue-frontend folder

```bash
npm install
npm run dev
```

---

## STEP 3: Open the browser

Go to: http://localhost:5173

That's it. You're connected.

---

## Testing the connection

1. Click "Sign in" → enter any username/password you created in Django admin
2. Or click "Join" → register a new customer account (it auto-logs in)
3. Browse venues (if you've added venues via Django admin or Postman)
4. Book a venue → the request hits your real Django API
5. Check Dashboard → shows your real bookings from the database

---

## How to add venues to see them

Since you're the backend developer, add venues via:

### Option A — Django Admin
```bash
python manage.py createsuperuser
```
Then go to http://localhost:8000/admin/ and add Venue objects

### Option B — Postman
1. Login as an owner: POST http://localhost:8000/api/accounts/login/
2. Use the access_token
3. POST http://localhost:8000/api/venues/create/ with:
   - venue_name, venue_type, location, capacity, price_per_hour, description, image

The frontend will automatically display them with type-matched styling.

---

## If something doesn't work

| Problem | Fix |
|---------|-----|
| `vite: not found` | Run `npm install` first |
| CORS error in browser console | You didn't add `corsheaders` to Django (Step 1) |
| No venues showing | Add venues via Django admin or Postman |
| Login fails | Make sure Django is running on port 8000 |
| "Network Error" | Django isn't running, or wrong port |
