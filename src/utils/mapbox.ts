/**
 * Mapbox token management
 * 
 * This file exports Mapbox tokens for use in the application.
 * Tokens are sourced from environment variables.
 */

import { MAPBOX_PUBLIC_TOKEN } from '@env';

// Import from environment variables (configured in .env)
export const MAPBOX_DOWNLOAD_TOKEN = process.env.MAPBOX_DOWNLOAD_TOKEN || 'sk.eyJ1IjoiYnJvd25zdWdhIiwiYSI6ImNtOGZla2h5cDBhb2MyaW92YWd2dDY3ZnEifQ.qVRe6SQGEl8wbwb7jV5ceg';

// Export the Mapbox token - this provides a fallback in case the environment variable isn't loaded
export const MAPBOX_ACCESS_TOKEN = MAPBOX_PUBLIC_TOKEN || 'pk.eyJ1IjoiYnJvd25zdWdhIiwiYSI6ImNrdjdsZGo0ZTlrbGszMWs2bnpndnlldjQifQ.XDaBKrhWFiLYxg_5OgGvDA'; 