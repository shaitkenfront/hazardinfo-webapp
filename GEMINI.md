# Gemini Project: Hazard Info App

This document provides a comprehensive overview of the Hazard Info App project, designed to be used as a context file for the Gemini AI assistant.

## Project Overview

The Hazard Info App is a full-stack web application that displays disaster preparedness information for a specified location. Users can input an address, coordinates, or use their current location to retrieve and visualize hazard information.

The project is structured as a monorepo with two main components:

*   **`frontend`**: A React application built with Vite and TypeScript. It provides the user interface for location input and disaster information display.
*   **`backend`**: A Node.js and Express application written in TypeScript. It serves as an API that fetches data from an external hazard information service, caches it, and provides it to the frontend.

## Core Technologies

*   **Frontend**: React, TypeScript, Vite, OpenLayers for maps
*   **Backend**: Node.js, Express, TypeScript, SQLite for caching
*   **Testing**: Vitest (frontend), Jest (backend), Playwright (e2e)
*   **Development**: Concurrently for running both frontend and backend simultaneously.

## Building and Running

### Development

To run the application in development mode (with hot-reloading):

```bash
npm run dev
```

This command concurrently starts the backend server (on `http://localhost:3001`) and the frontend development server (on `http://localhost:3000`).

### Building for Production

To build the application for production:

```bash
npm run build
```

This command builds both the frontend and backend, placing the compiled files in the `dist` directory of each respective sub-project.

### Testing

To run all tests:

```bash
npm test
```

This command runs both the backend (Jest) and frontend (Vitest) tests.

To run tests for a specific part of the application:

*   **Backend tests:** `npm run test:backend`
*   **Frontend tests:** `npm run test:frontend`

## Development Conventions

*   **TypeScript**: The entire codebase is written in TypeScript, so all new code should also be in TypeScript.
*   **Testing**: Both the frontend and backend have their own testing suites. New features should be accompanied by corresponding tests.
*   **Monorepo Structure**: The project is organized as a monorepo. The root `package.json` contains scripts for managing both the frontend and backend.
*   **API Communication**: The frontend communicates with the backend via a REST API. The backend, in turn, communicates with an external hazard information API. The latest REST API specifications are described in `API_SPECIFICATION.md`.
*   **State Management**: The frontend appears to manage state within React components. For more complex state, a dedicated state management library might be considered.
*   **Styling**: CSS files are co-located with their respective components.