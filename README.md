# Project Structure

This workspace contains an invoice generator web application with supporting assets. Files have been reorganized for clarity.

## Directory layout

- `css/` - all site-specific stylesheets (home.css, menu.css, product.css plus global style.css)
- `js/` - client-side JavaScript modules and helpers
- `formats/` - invoice format templates (HTML)
- `format-css/` - CSS rules for individual invoice formats
- `style/` - shared stylesheet used by formats
- `server.js` - Express server entrypoint, serves static content from project root
- `index.html` - main application landing page
- other HTML pages remain at project root to avoid breaking relative links

## Clean-up

Unnecessary files (backups, outdated scripts) were removed:

- `index_backup.html`
- obsolete `app.js` at project root (client code is now under `js/app.js`)
- empty `new/` folder
- `new/redme.md`

## Notes

Paths inside HTML files were updated to reflect new asset locations (e.g. `<link href="css/home.css">`, `<script src="js/navigation-manager.js">`).

## Authentication (new)

A basic email/password system has been added to protect the invoice generator pages. The implementation lives in `server.js` and uses `bcrypt` for hashing, `jsonwebtoken` for session tokens, and a simple JSON file (`db.json`) as storage.  The flow works entirely with plain HTML/CSS/JS (no framework).

### Core features

- **Sign up** (via `signup.html`) with email, password and confirmation
- **Email verification**: user receives a token (logged to console) and must visit `/verify-email.html?token=...` before login
- **Login** (`login.html`) using email/password; unverified accounts are blocked with a clear message
- **Forgot password / Reset**: `forgot.html` sends a reset token and `reset.html` allows setting a new password using that token (also logged to console)
- Passwords are hashed with bcrypt; duplicates are prevented
- JWT tokens issued on login and stored in an HTTP‑only cookie with `SameSite=lax`
- **Remember me** checkbox on login extends auth cookie from 2 hours to one week when checked
- Logout clears the session cookie
- Protected routes (all HTML pages except login/signup and the new auth pages, plus the `/api/*` endpoints) redirect to the login page when not authenticated
- Navbar feedback: every page with a header will show the logged‑in user’s email and a logout icon; when there’s no active session a prominent gradient "Login" button appears instead of a small icon
- `/api/me` returns the current user; client scripts use it to display the email and toggle icons
- Simple rate limiting (5 attempts per 15 min) on the login endpoint
- Basic validation (email format, password length) on both client and server

**UX polish:** forms auto‑focus, show "Press Enter to submit" hints, and buttons display spinners during network requests.

### Setup instructions

1. Install dependencies (run from workspace root):
   ```bash
   npm install
   ```
2. Copy the example environment file and adjust values as needed:
   ```bash
   copy .env.example .env
   ```
3. Set `JWT_SECRET` to a secure value in `.env` or via environment variables.
4. Start the server:
   ```bash
   npm start
   ```
   For active development, use:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000/login.html` in your browser and create an account.

### Security notes

- This demonstration uses a file-based "database"; replace with PostgreSQL/Prisma or another store for production.
- HTTPS is required for `secure` cookies; adjust the `secure` flag in `server.js` when deploying.
- CSRF protection is minimal – the cookie is `SameSite=lax` and the API is JSON‑only.  Consider adding a proper CSRF token library if exposing to the internet.
- Input validation is performed server‑side; always validate anything coming from the client.
- Rate limiting prevents brute‑force attempts but is memory‑based; use Redis or similar for horizontal scaling.

This section can be expanded or removed depending on your deployment scenario.

The `format-css/` folder name replaces the previous `format css` with spaces and all invoice templates now reference it accordingly.

Feel free to adjust further structure (e.g. moving HTML pages into a subfolder) but you'll need to update the `window.location` calls in the scripts accordingly.

---

Happy coding! Keep the file system tidy to ease maintenance.