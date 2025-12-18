# Overview
AlgoBuddy is a collaborative technical interview preparation platform that enables users to practice coding questions together in real-time. 

## Architecture

### Microservices Architecture
- **API Gateway** - Entry point for all client requests, handles routing and JWT authentication
- **User Service** - Manages user authentication, profiles, and sessions using Google OAuth
- **Question Service** - Handles CRUD operations for coding questions
- **Matching Service** - WebSocket based service for real-time peer matching
- **Collaboration Service** - Websocket based service for real-time collaborative coding sessions
- **UI** - Next.js frontend application
- **Shared** - Common TypeScript types and interfaces shared across services

### Technology Stack
- **Runtime**: Node
- **Web Framework**: Express
- **Websocket**: Socket.IO
- **Frontend**: Next.js
- **Databases**: MongoDB, Redis
- **ORM**: Prisma
- **Authentication**: JWT tokens with Google OAuth 2.0
- **Containerization**: Docker

# Development

### Environment Variables

Refer to `.env.example` for all required environment variables for local development and production deployment.

## Local Development Setup
1. The following sets up and runs all services locally with hot reload for development
```bash
npm install -g yarn
git clone <repository-url>
cp .env.example .env # Edit .env with your configuration

# Start services individually for development with hot reload
yarn --cwd api-gateway shared; yarn --cwd api-gateway install; yarn --cwd api-gateway dev
yarn --cwd user-service shared; yarn --cwd user-service install; yarn --cwd user-service dev
yarn --cwd question-service shared; yarn --cwd question-service install; yarn --cwd question-service dev
yarn --cwd matching-service shared; yarn --cwd matching-service install; yarn --cwd matching-service dev
yarn --cwd collaboration-service shared; yarn --cwd collaboration-service install; yarn --cwd collaboration-service dev
yarn --cwd ui shared; yarn --cwd ui install; yarn --cwd ui dev
```
2. If local MongoDB or Redis instances are needed for development, run the following commands in a separate terminal
```bash
cd db
docker compose up
```
3. Go to http://localhost:4000

### MongoDB commands
To run the mongo shell to connect to the local MongoDB server, run the following command in a separate terminal:

```
docker exec -it mongo mongosh
```

To set an admin user in mongosh, run the following command:

```
db.User.updateOne( { email: "<USER_EMAIL>" }, { $set: { role: "ADMIN" } })
```

### Redis commands
To run the redis-cli to connect to the local Redis server, run the following command in a separate terminal:

```
docker exec -it redis redis-cli -a <REDIS_PASSWORD>
```

Replace `<REDIS_PASSWORD>` with the password set in the `.env` file.

## Development Notes
- The shared folder is a package containing shared types and interfaces used across all services, it is a necessary dependency for all services
- Run `yarn shared` in all services after making changes to the shared package
- In the API Gateway, user information is extracted from JWT and passed via headers (`x-user-id`, `x-user-role`)

# Deployment
- Containerised deployment for local and cloud environments

## Local Deployment

### Option 1 - Local DB Docker instance
- If you don't have a cloud MongoDB or Redis instance, you can use this setup and configure `.env.production.local`

```bash
cp .env.example .env.production.local # Edit .env with your configuration
docker compose build --no-cache # create docker images
docker compose -f docker-compose.local.yml up # create containers for local MongoDB and Redis
```

### Option 2 - Cloud DB instance
- If you have a cloud MongoDB or Redis instance, ensure your `.env.production` is configured correctly
```bash
cp .env.example .env.production # Edit .env with your configuration
docker compose build --no-cache
docker compose up
```

## Cloud Deployment
- GCP Cloud Run was used for deployment
- There is a cloudbuild.yaml file for GCP Cloud Build to automate builds and deployments for each microservice
- All containers are connected using Direct VPC and set to private except for API Gateway which is the public entry point

## Deployment Notes
### Single Origin Deployment
- UI sits behind the API Gateway for unified origin for cookies to be stored properly (iOS devices have strict cookie policies for cross-origin requests)
- It is possible setup UI and API Gateway behind an external load balancer, but this adds additional cost to the deployment
- This deployment was set up to minimise cost since requests rarely come in
### Networking
- Both local and cloud deployments use private networking between services and expose only the API Gateway