# Ryeku Frontend

This directory contains the Next.js frontend for the Ryeku research application. It provides the user interface for submitting research topics, selecting sources, and viewing the generated reports.

## Tech Stack

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Setup

1.  **Install dependencies:**

    Make sure you have [Node.js](https://nodejs.org/) (v18 or later) and [npm](https://www.npmjs.com/) installed.

    ```bash
    npm install
    ```

2.  **Environment Variables:**

    This project does not require any specific environment variables to run in a local development environment, as it will connect to the local backend API by default.

## Running the Application

To run the Next.js development server, use the following command:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Building for Production

To create a production build, run:

```bash
npm run build
```

And to start the production server:

```bash
npm run start
``` 