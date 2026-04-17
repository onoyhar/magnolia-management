# 🔐 Login & Authentication Setup

This guide will help you set up the authentication system for the Magnolia application.

## What's Been Added

✅ Login page at `/login`
✅ Protected routes (all pages require authentication)
✅ Default admin user creation
✅ Session management with database storage
✅ Logout functionality
✅ User info display in sidebar

## Setup Instructions

### Step 1: SQL Setup in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com/
2. Select your project
3. Go to **SQL Editor** → **New Query**
4. Copy the entire content from `setup-auth.sql`
5. Paste it into the SQL Editor
6. Run the query

This will create two new tables:
- `users` - For storing user accounts
- `auth_sessions` - For storing active sessions

### Step 2: Create Default Admin User

Run the setup script:

```bash
node scripts/setup-admin.js
```

**Output:**
```
✅ Default admin user created successfully!
Username: admin
Password: clustermagnoliaburaden2025
```

### Step 3: Start the App

```bash
npm run dev
```

Visit `http://localhost:3000/login` and login with:
- Username: `admin`
- Password: `clustermagnoliaburaden2025`

---

## File Structure

### New Files Created

```
app/
├── api/
│   ├── login/route.js              # Login endpoint
│   ├── logout/route.js             # Logout endpoint
│   └── auth/
│       └── check/route.js          # Check auth session
├── login/page.jsx                  # Login page
├── components/
│   └── ProtectedRoute.jsx          # Route protection wrapper
├── lib/
│   └── AuthContext.jsx             # Auth state management

scripts/
├── setup-admin.js                  # Create admin user script
└── setup-auth.sh                   # Complete setup script (optional)
```

### Modified Files

- `app/layout.jsx` - Added AuthProvider
- `app/components/LayoutWithSidebar.jsx` - Added logout button
- All protected pages - Wrapped with `<ProtectedRoute>`

---

## How It Works

### Login Flow

1. User enters username & password
2. `/api/login` validates credentials against the `users` table
3. If valid, creates a session in `auth_sessions` table
4. Sets secure HTTP-only cookie with session token
5. Redirects to home page

### Session Check

1. ProtectedRoute wrapper checks session on each page load
2. `/api/auth/check` validates the session token
3. If expired or invalid, redirects to login page
4. If valid, loads the protected page

### Logout

1. User clicks logout button
2. `/api/logout` deletes the session from database
3. Clears the auth cookie
4. Redirects to login page

---

## Security Features

✅ **HTTP-only Cookies** - Cannot be accessed by JavaScript
✅ **Secure Flag** - Only sent over HTTPS (in production)
✅ **Session Expiry** - Sessions expire after 7 days
✅ **Password Hashing** - Uses SHA-256 (production should use bcrypt)
✅ **RLS Enabled** - Database row-level security enabled

---

## Changing Password

To change the admin password, manually update the database:

1. Go to Supabase Dashboard
2. Go to **Table Editor** → `users`
3. Find the admin user
4. Update the `password_hash` field with the new hash

To generate a new hash, run:

```bash
node -e "const crypto = require('crypto'); console.log(crypto.createHash('sha256').update('YOUR_PASSWORD_HERE').digest('hex'))"
```

---

## Creating Additional Users

To add more admin users, use this SQL query in Supabase:

```sql
INSERT INTO users (username, password_hash, name, role, is_active)
VALUES (
  'new_user',
  '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',  -- password: 'password'
  'New Admin',
  'admin',
  true
);
```

Replace the password_hash with your desired password hash.

---

## Troubleshooting

### "Invalid credentials" error

- Check that the `users` table exists in Supabase
- Verify the admin user was created successfully
- Check the database for the user record

### Session not persisting

- Clear browser cookies
- Check that `auth_sessions` table exists
- Verify the cookie is being set (check browser DevTools → Application → Cookies)

### Redirect to login keeps happening

- Clear browser cache and cookies
- Restart the dev server
- Check the `/api/auth/check` endpoint in browser console

---

## API Endpoints

### POST `/api/login`

Request:
```json
{
  "username": "admin",
  "password": "clustermagnoliaburaden2025"
}
```

Response:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "username": "admin",
    "name": "Administrator",
    "role": "admin"
  }
}
```

### POST `/api/logout`

Response:
```json
{
  "success": true
}
```

### GET `/api/auth/check`

Response:
```json
{
  "authenticated": true,
  "user": {
    "id": "uuid",
    "username": "admin",
    "name": "Administrator",
    "role": "admin"
  }
}
```

---

## Environment Variables

Ensure your `.env` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Next Steps

1. ✅ Run SQL setup in Supabase
2. ✅ Create admin user with `node scripts/setup-admin.js`
3. ✅ Start dev server with `npm run dev`
4. ✅ Login at http://localhost:3000/login
5. ✅ Test logout functionality

---

**Support:** For issues, check the browser console and server logs for error messages.
