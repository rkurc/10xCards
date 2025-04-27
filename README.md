# 10xCards

AI-powered flashcard generator for efficient learning through spaced repetition.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Version](https://img.shields.io/badge/version-0.0.1-blue)

## Table of Contents
- [10xCards](#10xcards)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
    - [Key Features](#key-features)
  - [Tech Stack](#tech-stack)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [AI Integration](#ai-integration)
    - [Testing Tools](#testing-tools)
    - [CI/CD and Hosting](#cicd-and-hosting)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
  - [Available Scripts](#available-scripts)
  - [Project Scope](#project-scope)
    - [Included Features](#included-features)
    - [Not Included in MVP](#not-included-in-mvp)
  - [Project Status](#project-status)
    - [Success Metrics](#success-metrics)
  - [License](#license)

## Overview

10xCards is a web application that enables automatic generation and management of educational flashcards using artificial intelligence. The app aims to significantly improve the learning process through spaced repetition by eliminating the time-consuming manual creation of flashcards.

### Key Features

- Automatic flashcard generation using AI based on pasted text
- Manual creation, editing, and deletion of flashcards
- Simple user account system with secure data access
- Integration with spaced repetition algorithm
- Learning sessions using the spaced repetition algorithm
- Personalization options (text, colors, references)
- Generation and acceptance statistics
- Flashcard readability assessment
- Flashcard set management (thematic grouping)

## Tech Stack

### Frontend
- [Astro 5](https://astro.build/) - Fast, modern website builder with minimal JavaScript
- [React 19](https://react.dev/) - JavaScript library for building user interfaces
- [TypeScript 5](https://www.typescriptlang.org/) - Static typing for JavaScript
- [Tailwind 4](https://tailwindcss.com/) - Utility-first CSS framework
- [Shadcn/ui](https://ui.shadcn.com/) - Accessible component library

### Backend
- [Supabase](https://supabase.com/) - Open source Firebase alternative
  - PostgreSQL database
  - Authentication system
  - Backend-as-a-Service SDK

### AI Integration
- [Openrouter.ai](https://openrouter.ai/) - Access to various language models

### Testing Tools
- [Vitest](https://vitest.dev/) - Fast unit testing framework for components and services
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Testing utilities for React components
- [Playwright](https://playwright.dev/) - End-to-end testing framework for web applications
- [Supertest](https://github.com/visionmedia/supertest) - API testing library
- [Supabase Local Emulator](https://supabase.com/docs/guides/cli/local-development) - Local testing environment for Supabase

### CI/CD and Hosting
- GitHub Actions for CI/CD pipelines
- DigitalOcean for application hosting via Docker

## Getting Started

### Prerequisites

- Node.js v22.14.0 (as specified in .nvmrc)
- npm or yarn package manager

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/10xCards.git
   cd 10xCards
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with the following variables:
   ```
   PUBLIC_SUPABASE_URL=your_supabase_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   PUBLIC_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open your browser and navigate to http://localhost:4321

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the project for production
- `npm run preview` - Previews the built project locally
- `npm run astro` - Runs Astro CLI commands
- `npm run lint` - Runs ESLint to find code issues
- `npm run lint:fix` - Runs ESLint and automatically fixes issues
- `npm run format` - Formats code with Prettier
- `npm run test` - Runs Vitest unit tests
- `npm run test:e2e` - Runs Playwright end-to-end tests

## Project Scope

### Included Features

- AI-powered flashcard generation from text input
- Manual flashcard creation and management
- User authentication system
- Integration with existing spaced repetition algorithms
- Learning sessions with spaced repetition
- Personalization options for flashcards
- Generation statistics
- Flashcard set management

### Not Included in MVP

- Custom advanced spaced repetition algorithm (using open-source solutions instead)
- Import support for different document formats (PDF, DOCX, etc.)
- Flashcard sharing between users
- Integration with external educational platforms
- Mobile applications (web version only)
- Advanced social features

## Project Status

The project is currently in early development stage (version 0.0.1). The foundation and core features are being implemented according to the product requirements document.

### Success Metrics

We measure success through:
- 75% minimum acceptance rate of AI-generated flashcards
- At least 75% of flashcards in the system created using automatic options
- Average time to create a set of 10 flashcards under 5 minutes
- 80% of users satisfied with interface intuitiveness
- 60% user retention (users returning within a week)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
