# Hylo AI

A powerful SaaS platform featuring AI research assistance and customizable meal planning.

## Overview

Hylo AI is built on the [OpenSaaS](https://opensaas.sh) template and offers advanced AI-powered features:

1. **Research Assistant** - AI-powered research tool that breaks complex topics into search tasks and provides comprehensive answers
2. **Meal Planning** - Personalized meal plans with customizable options for diet preferences, allergies, and preparation time
3. **User Authentication** - Email and social login with secure profile management
4. **Dark Mode Support** - Fully responsive UI with complete dark mode support across all components

## Project Structure

The project consists of three main directories:
1. `app` - The main web application built with [Wasp](https://wasp.sh)
2. `e2e-tests` - [Playwright](https://playwright.dev/) tests for automated testing
3. `blog` - Blog/documentation built with [Astro](https://docs.astro.build)

## Technology Stack

- **Frontend**: React.js with TailwindCSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT-based with social login options
- **AI Integration**: OpenAI API integration for research assistant
- **Deployment**: Fly.io for seamless cloud deployment

## Getting Started

### Prerequisites
- Node.js (v16+)
- Wasp CLI installed (`curl -sSL https://get.wasp.sh/installer.sh | sh`)
- PostgreSQL database

### Setup Instructions
1. Clone the repository
2. Create `.env.client` and `.env.server` files with proper configuration
3. Install dependencies:
   ```
   cd app
   wasp deps
   ```
4. Start the database:
   ```
   wasp start db
   ```
5. Run database migrations:
   ```
   wasp db migrate-dev
   ```
6. Start the development server:
   ```
   wasp start
   ```

### Deployment
The application is deployed on Fly.io. To deploy updates:
```
cd app
wasp deploy fly deploy
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

# View application logs
flyctl logs --app hylo-saas-server
flyctl logs --app hylo-saas-client
```

## Features in Detail

### Research Assistant
The AI-powered research assistant breaks complex questions into smaller, manageable tasks. It leverages the OpenAI API to search for information and compile comprehensive answers.

### Meal Planning
The meal planning feature generates personalized weekly meal plans based on:
- Calorie targets
- Dietary preferences (vegan, keto, etc.)
- Allergies and restrictions
- Cuisine preferences
- Prep time constraints

Plans include detailed recipes, ingredients, macronutrient information, and even a smart grocery list generator.

## Contributing

We welcome contributions to Hylo AI! Please feel free to submit issues and pull requests to help improve the platform.

## License

This project is based on the OpenSaaS template and maintains its original licensing.
