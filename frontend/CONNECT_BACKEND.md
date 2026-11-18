# Connecting Venuva to your Django backend

Everything API-related lives in **`src/lib/api.ts`**. The frontend already speaks
your exact API contract — you don't need to touch any component.

## 1. Start Django

```bash
cd Venue-booking-system
python manage.py runserver        # serves on http://localhost:8000
```

## 2. Enable CORS (your repo doesn't have it yet)

```bash
pip install django-cors-headers
```

```python
# venue_booking/settings.py
INSTALLED_APPS = [
    ...
    "corsheaders",          # add
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",   # MUST be first
    ...
]

CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
```

*(If you skip this, the browser will block every request — this is the #1 gotcha.)*

## 3. Point the frontend at it

```bash
cp .env.example .env
```

```bash
# .env
VITE_API_URL=http://localhost:8000/api
VITE_USE_MOCK=false
```

Restart `npm run dev`. Done — the navigation, login, venue list,
booking requests and dashboard are all live against your database.

## What works out of the box

| Your endpoint                           | Where it's used                                   |
| --------------------------------------- | ------------------------------------------------- |
| `POST /api/accounts/register/`          | Auth modal → "Join" (with customer/owner picker)  |
| `POST /api/accounts/login/`             | Auth modal → "Sign in" (username + password)      |
| `POST /api/accounts/logout/`            | Nav user menu → sign out                          |
| `GET  /api/venues/list/`                | Home featured, Collection page, venue detail      |
| `POST /api/booking/booking_venue/`      | Booking panel → checkout modal                    |
| `GET  /api/booking/booking_list/`       | Dashboard "Your requests"                         |

## Things already handled for you

- **JWT** — `access_token` stored and sent as `Authorization: Bearer …`
- **Register returns no tokens** → the client auto-calls `/login/` after registering
- **Per-hour pricing** — totals shown match your `Booking.save()` (hours × price_per_hour)
- **`starting_time`/`ending_time`** — sent as `"HH:MM"` from the session picker; `"HH:MM:SS"` responses parsed back
- **Media** — `/media/venues/...` paths are auto-prefixed with the API origin
- **Owner accounts** — get a friendly block if they try to book (your `IsCustomer` permission)
- **Statuses** — `pending → approved / rejected` rendered as-is (no concept of client-side cancel, since your API has none — the cancel button only exists in demo mode)
- **No venue detail endpoint needed** — detail pages work off the list response (`/venues/update_venue/` has trailing-space / missing-`<pk>` issues in your urls.py, so the frontend deliberately never calls it)

## Keep demo mode anywhere

`VITE_USE_MOCK=true` (the default) runs the full showcase with built-in
venues and a simulated owner who approves requests — handy for demos and
for developing the UI without the server running.
