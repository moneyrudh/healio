# Healio - Medical Documentation Assistant

Healio is an AI-powered medical documentation application that helps healthcare providers efficiently document patient encounters.

## Features

- Guided medical consultations with structured sections
- Integration with large language models for natural conversation
- Evidence-based medical information with sources
- Automatic generation of clinical documentation
- PDF report generation
- Voice-to-text capability (coming soon)

## Tech Stack

- **Frontend**: React.js with TypeScript, Tailwind CSS, Headless UI
- **Backend**: Python with Flask, OpenAI integrations
- **Database**: Supabase with pgvector for vector search

## Setup Instructions

### Prerequisites

- Node.js v16+ and npm

### Installation

1. Clone the repository

```bash
git clone https://github.com/moneyrudh/healio.git
cd healio
```

2. Install frontend dependencies

```bash
npm install
```

3. Create a `.env` file with the following variables:

```
REACT_APP_API_URL=http://localhost:5001
```

4. Start the development server

```bash
npm start
```

5. Application will be available at `http://localhost:3000`

### Required Dependencies

This project requires the following npm packages:

```bash
npm install react react-dom react-router-dom @headlessui/react @heroicons/react @headlessui/tailwindcss tailwindcss postcss autoprefixer
```

For the backend, refer to the backend codebase setup instructions.

## Usage

1. Visit the landing page at `/`
2. Click "Start Consultation" to begin a new consultation
3. Select a provider and patient (or add a new patient)
4. Follow the guided consultation process
5. View and download the generated medical report

## Development

### Directory Structure

```
src/
├── api.ts                           # API service methods
├── types.ts                         # TypeScript type definitions
├── ChatContext.tsx                  # Context provider for chat functionality
├── App.tsx                          # Main application component (update to existing file)
├── components/
│   ├── Navbar.tsx                   # Updated navigation bar component
│   ├── chat/
│   │   └── index.tsx                # Chat message and input components
│   ├── patients/
│   │   └── index.tsx                # Patient selection and creation components
│   ├── providers/
│   │   └── index.tsx                # Provider selection components
│   ├── sections/
│   │   └── SectionProgress.tsx      # Section progress indicator
│   ├── shared/
│   │   └── index.tsx                # Shared UI components (buttons, modals, etc.)
│   └── summary/
│       └── SummaryView.tsx          # Consultation summary view
├── context/
│   └── ThemeContext.tsx             # Existing theme context (no changes needed)
├── hooks/
│   └── useSpeechRecognition.ts      # Hook for speech-to-text (placeholder)
└── pages/
    ├── LandingPage.tsx              # Existing landing page (no changes needed)
    └── ChatPage.tsx                 # Main chat page component
```

### Building for Production

```bash
npm run build
```

## License

[MIT](LICENSE)