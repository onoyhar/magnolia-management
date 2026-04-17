# 🔐 Credentials & Password Storage

## Overview
User credentials are securely stored in the Supabase `users` table with encrypted passwords using bcryptjs.

## Password Encryption

### Method: bcryptjs
- **Algorithm**: bcrypt with 10 salt rounds
- **Hash Length**: 60 characters
- **Salted**: Yes (unique salt per password)
- **Reversible**: No (one-way hashing)

### Why bcryptjs?
✅ Industry standard for password hashing
✅ Slow by design (prevents brute force attacks)
✅ Salts prevent rainbow table attacks
✅ Future-proof (can increase cost factor if needed)

## Database Storage

### Users Table Structure
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Default Admin User
```
Username: admin
Password: clustermagnoliaburaden2025 (hashed in database)
```

## Session Management

### Auth Sessions Table
```sql
CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Session Flow
1. User logs in with username/password
2. Server verifies password against `password_hash` using bcrypt.compare()
3. Session token generated (32-byte random hex)
4. Token stored in auth_sessions table
5. Token sent to client as HTTP-only cookie
6. Client includes cookie with subsequent requests
7. Server validates token against auth_sessions table

### Session Duration
- **Expiration**: 7 days
- **Automatic Cleanup**: Sessions with expired timestamps
- **Logout**: Deletes session record from database

## API Implementation

### Login Endpoint (`/api/login`)
```javascript
// POST /api/login
// Body: { username, password }
// Returns: { success: true, user: {...} }
// Sets: auth_token cookie (HTTP-only, 7-day expiry)
```

### Logout Endpoint (`/api/logout`)
```javascript
// POST /api/logout or GET /api/logout
// Clears: auth_token cookie from client
// Deletes: Session record from database
```

### Auth Check (`/api/auth/check`)
```javascript
// GET /api/auth/check
// Validates: Token cookie against auth_sessions table
// Returns: { authenticated: true/false, user: {...} }
```

## Security Best Practices Implemented

✅ **Password Hashing**
- Bcrypt with 10 salt rounds (passwords never stored in plain text)

✅ **Session Tokens**
- Cryptographically random 32-byte tokens
- Stored securely in database, not client-side

✅ **HTTP-Only Cookies**
- Prevents JavaScript access to tokens
- Protection against XSS attacks

✅ **HTTPS in Production**
- Secure flag set for cookies
- Tokens only transmitted over encrypted channels

✅ **Session Expiration**
- Automatic 7-day expiration
- Server validates expiry time on each request

✅ **Environment Variables**
- Secrets in .env file (not committed to git)
- Separate service role key for backend operations

✅ **Row-Level Security (RLS)**
- Supabase RLS policies on users and auth_sessions tables
- Prevents unauthorized data access

## Adding New Users

### Option 1: Modify setup-admin.js
```javascript
// scripts/setup-admin.js
// Change username and password, then run:
node scripts/setup-admin.js
```

### Option 2: Create Admin Interface (Future)
Could add admin page to:
- Create new users
- Reset passwords
- Manage user roles
- Enable/disable users

## Changing the Default Password

1. Update password in `scripts/setup-admin.js`:
```javascript
const password = "your-new-password-here";
```

2. Run setup script:
```bash
set -a && source .env && set +a && node scripts/setup-admin.js
```

3. Delete old admin user from Supabase dashboard if creating duplicate

## Troubleshooting

**Login returns "Invalid credentials"**
- Check username/password match exactly
- Verify users table has records
- Check that setup-admin.js has been run

**Session not persisting between pages**
- Browser cookies might be disabled
- Check browser console for cookie errors
- Verify auth_sessions table has records

**Password changes not taking effect**
- Remember to delete old user record before re-running setup
- Clear browser cookies and login again

## Migration to Real Authentication System (Future)

Could integrate with:
- Auth0
- Firebase Authentication
- Supabase Auth (easier, same provider)
- NextAuth.js
