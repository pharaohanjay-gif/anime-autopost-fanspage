// Configuration for Weebnesia Bot
// Credentials are loaded from environment variables for security
// Set these in .env.local file or Vercel environment variables

export const FACEBOOK_CONFIG = {
  PAGE_ID: process.env.NEXT_PUBLIC_FB_PAGE_ID || '61585967653974',
  PAGE_NAME: 'Weebnesia',
  ACCESS_TOKEN: process.env.FB_PAGE_ACCESS_TOKEN || '',
  API_VERSION: 'v18.0',
};

export const GROQ_CONFIG = {
  API_KEY: process.env.GROQ_API_KEY || '',
  MODEL: 'llama-3.3-70b-versatile',
};
