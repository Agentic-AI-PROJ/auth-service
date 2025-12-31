# Auth Service

The **Auth Service** handles user identity, authentication, and session management. It supports both traditional email/password login and OAuth providers (Google, GitHub), issuing JWTs for secure access across the platform.

## 🚀 Features

- **Multi-method Authentication**:
  - **Email/Password**: Secure registration and login with bcrypt hashing.
  - **OAuth 2.0**: Native support for **Google** and **GitHub** login strategies via Passport.js.
- **JWT Issuance**: Generates signed JSON Web Tokens containing user roles and ID.
- **Dynamic Auth Providers**: Endpoint to check which authentication methods are currently enabled via feature flags.
- **User & Role Management**: Automatic user creation and role assignment upon registration.

## 🛠️ Technology Stack

- **Runtime**: Node.js, Express
- **Security**: Passport.js, Bcrypt, JWT
- **Database**: MongoDB (via Mongoose)
- **Logging**: Winston

## 📦 Installation & Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file in the root of the service:
    ```env
    PORT=3003
    MONGO_URI=mongodb://localhost:27017/ai-agents
    JWT_SECRET=your_jwt_secret
    
    # Frontend URL for OAuth redirects
    FRONTEND_URL=http://localhost:5173
    
    # OAuth Credentials
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
    ```

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    The server will start at `http://localhost:3003`.

## 🔌 API Reference & Curl Examples

### 1. Register User

Create a new account with email and password.

- **Endpoint**: `POST /register`
- **Body**: `email`, `password`, `displayName`

**Curl Example:**

```bash
curl -X POST http://localhost:3003/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securePassword123",
    "displayName": "Alice Wonderland"
  }'
```

### 2. Login

Authenticate a user and receive a JWT.

- **Endpoint**: `POST /login`
- **Body**: `email`, `password`

**Curl Example:**

```bash
curl -X POST http://localhost:3003/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securePassword123"
  }'
```

### 3. Get Available Auth Methods

Check which authentication providers are enabled (useful for dynamic frontend UIs).

- **Endpoint**: `GET /available-auths`

**Curl Example:**

```bash
curl http://localhost:3003/available-auths
```

### 4. OAuth Flows (Browser Only)

These endpoints are designed to be accessed via a browser window, not curl, as they involve redirects to external identity providers.

- **Google Login**: `GET /google` -> Redirects to Google
- **GitHub Login**: `GET /github` -> Redirects to GitHub

The callback URLs (`/google/callback` and `/github/callback`) will handle the response and redirect the user back to the frontend with a `?token=...` parameter.

## 💓 Health Checks

- **Server Status**: Since this service sits behind the API Gateway, standard health checks are typically performed at the gateway level or by verifying the `/available-auths` endpoint.
