# NestJS Authentication API

A robust authentication system built with NestJS, Prisma, MongoDB, and JWT tokens.

## Features

- User registration and login
- JWT-based authentication (access & refresh tokens)
- Password hashing with bcrypt
- Password change functionality
- Token refresh mechanism
- User profile management
- MongoDB integration with Prisma ORM

## Tech Stack

- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **MongoDB** - NoSQL database
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **TypeScript** - Type-safe development
- **Docker** - Containerization

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- MongoDB instance (local or remote)
- Docker and Docker Compose (optional, for containerized setup)

## Installation

### Option 1: Local Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd week-one
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory or use the existing one:

   ```env
   # Database
   DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database-name"

   # Bcrypt
   BCRYPT_SALT_ROUNDS=10

   # JWT Access Token
   JWT_ACCESS_SECRET=your_strong_access_secret_here
   JWT_ACCESS_EXPIRATION=15m

   # JWT Refresh Token
   JWT_REFRESH_SECRET=your_strong_refresh_secret_here
   JWT_REFRESH_EXPIRATION=7d

   # Application
   PORT=5050
   ```

4. **Generate Prisma Client**

   ```bash
   npx prisma generate
   ```

5. **Push database schema** (for MongoDB)

   ```bash
   npx prisma db push
   ```

6. **Start the development server**
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:5050`

## API Endpoints

### Authentication

#### Register

- **POST** `/auth/register`
  ```json
  {
  	"email": "user@example.com",
  	"password": "password123",
  	"name": "John Doe",
  	"phone": "+1234567890"
  }
  ```

#### Login

- **POST** `/auth/login`
  ```json
  {
  	"email": "user@example.com",
  	"password": "password123"
  }
  ```

#### Refresh Token

- **POST** `/auth/refresh`
  ```json
  {
  	"refreshToken": "your-refresh-token",
  	"userId": "user-id"
  }
  ```

#### Logout

- **POST** `/auth/logout`
  - Requires: Bearer Token (Authorization header)

#### Change Password

- **PATCH** `/auth/change-password`
  - Requires: Bearer Token (Authorization header)
  ```json
  {
  	"currentPassword": "oldpassword123",
  	"newPassword": "newpassword123"
  }
  ```

### User

#### Get Profile

- **GET** `/user/profile`
  - Requires: Bearer Token (Authorization header)

#### Update Profile

- **PATCH** `/user/profile`
  - Requires: Bearer Token (Authorization header)
  ```json
  {
  	"name": "Updated Name",
  	"phone": "+9876543210"
  }
  ```


## Project Structure

```
week-one/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── dto/                 # Data transfer objects
│   │   ├── guards/              # Auth guards (JWT, Refresh Token)
│   │   ├── strategies/          # Passport strategies
│   │   ├── Interfaces/          # TypeScript interfaces
│   │   ├── auth.controller.ts   # Auth endpoints
│   │   ├── auth.service.ts      # Auth business logic
│   │   └── auth.module.ts       # Auth module definition
│   ├── user/                    # User module
│   │   ├── dto/                 # User DTOs
│   │   ├── user.controller.ts   # User endpoints
│   │   ├── user.service.ts      # User business logic
│   │   └── user.module.ts       # User module definition
│   ├── prisma/                  # Prisma module
│   │   ├── prisma.service.ts    # Prisma client service
│   │   └── prisma.module.ts     # Prisma module definition
│   ├── app.module.ts            # Root module
│   └── main.ts                  # Application entry point
├── prisma/
│   └── schema.prisma            # Database schema
├── test/                        # Test files
├── .env                         # Environment variables (not in git)
├── .env.example                 # Environment variables template
├── Dockerfile                   # Docker configuration
├── docker-compose.yml           # Docker Compose configuration
├── .dockerignore                # Docker ignore file
├── package.json                 # Dependencies and scripts
└── README.md                    # This file
```

## Environment Variables

| Variable                 | Description                      | Default | Required |
| ------------------------ | -------------------------------- | ------- | -------- |
| `DATABASE_URL`           | MongoDB connection string        | -       | Yes      |
| `BCRYPT_SALT_ROUNDS`     | Salt rounds for password hashing | 10      | Yes      |
| `JWT_ACCESS_SECRET`      | Secret for access tokens         | -       | Yes      |
| `JWT_ACCESS_EXPIRATION`  | Access token expiration          | 15m     | Yes      |
| `JWT_REFRESH_SECRET`     | Secret for refresh tokens        | -       | Yes      |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiration         | 7d      | Yes      |
| `PORT`                   | Application port                 | 5050    | No       |
