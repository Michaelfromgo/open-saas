# Hylo AI - Application

The main Hylo AI application built with [Wasp](https://wasp.sh), featuring AI research assistance and meal planning capabilities.

## Features

### AI Research Assistant
- Natural language query processing
- Task breakdown into manageable subtasks
- Web search capabilities
- Comprehensive answer compilation
- Interactive task progress tracking

### Meal Planning System
- Customizable meal preferences
  - Calorie targets
  - Dietary preferences (vegan, keto, etc.)
  - Food allergies
  - Cuisine preferences
  - Prep time constraints
- Weekly meal plan generation
- Recipe details with ingredients and instructions
- Macronutrient information
- Grocery list generation
- Serving size adjustment

### User Management
- Email authentication with verification
- Profile management
- Subscription handling
- Dark mode preferences

## Development

### Prerequisites
- Node.js (v16+)
- Wasp CLI (latest version)
- PostgreSQL database

### Environment Setup
Create two environment files in the root directory:

#### `.env.client`
```
# For local development
REACT_APP_API_URL=http://localhost:3001
```

#### `.env.server`
```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/mydb

# Auth
JWT_SECRET=your-jwt-secret

# OpenAI (for Research Assistant)
OPENAI_API_KEY=your-openai-api-key
```

### Running locally
1. Start the database:
   ```
   wasp start db
   ```

2. Apply database migrations (when schema changes):
   ```
   wasp db migrate-dev
   ```

3. Start the development server:
   ```
   wasp start
   ```

4. Access the application at http://localhost:3000

### Deployment
The application is configured for deployment on Fly.io:

```bash
# To deploy both frontend and backend
wasp deploy fly deploy

# To deploy only backend updates
wasp deploy fly deploy --skip-client

# To deploy only frontend updates
wasp deploy fly deploy --skip-server 
   or
fly deploy -c fly-server.toml -a hylo-saas-server
```


#### Fly.io Management Commands
```bash
# Restart applications
fly apps restart hylo-saas-client
fly apps restart hylo-saas-server

# View application secrets
flyctl secrets list --app hylo-saas-server

# Set application secrets
flyctl secrets set KEY=VALUE --app hylo-saas-server
# Example: flyctl secrets set OPENAI_API_KEY=sk-123456789 --app hylo-saas-server
# Multiple secrets: flyctl secrets set KEY1=VALUE1 KEY2=VALUE2 --app hylo-saas-server

# View application logs
flyctl logs --app hylo-saas-server
flyctl logs --app hylo-saas-client
```

### Troubleshooting

#### Common Issues:
- **Database connection errors**: Verify your DATABASE_URL in `.env.server`
- **OpenAI API errors**: Check your OPENAI_API_KEY and request limits
- **Build errors after pulling updates**: Run `wasp clean` and then `wasp start`

## API Documentation

The application exposes several endpoints:

- `/auth/*` - Authentication related endpoints
- `/api/research` - Research assistant endpoints
- `/api/meal-plan` - Meal planning endpoints

For detailed API documentation, refer to the operations.ts files in each feature directory.

cd app && fly deploy -c fly-server.toml -a hylo-saas-server
fly deploy -c fly-server.toml -a hylo-saas-server