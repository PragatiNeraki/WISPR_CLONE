# Wispr Flow – Voice-to-Text Desktop App

A functional clone of Wispr Flow built as a technical assignment, demonstrating real-time voice-to-text transcription using modern web technologies packaged as a desktop application.
Try it now: https://wispr-clone-beryl.vercel.app/

## Tech Stack

- **Tauri** – Desktop application framework
- **React** – UI framework
- **TypeScript** – Type-safe JavaScript
- **Vite** – Build tool and dev server
- **Deepgram** – Speech-to-Text API

## Core Features

- **Microphone access and audio capture** – Uses Web Audio API to capture high-quality audio
- **Real-time speech transcription** – Streams audio to Deepgram for live transcription
- **Recording workflow** – Simple click-to-record/stop interface
- **Connection and error handling** – Graceful error states and connection status feedback
- **Clean architecture** – Separation between UI, audio capture, and transcription services

## Setup Instructions

### Install Dependencies

```bash
npm install
```

### Web Demo (Browser)

```bash
npm run dev
```

Access the app at `http://localhost:1420/`

### Desktop App (Tauri)

```bash
npm run tauri dev
```

## Environment Variables

Create a `.env` file in the project root:

```
VITE_DEEPGRAM_API_KEY=your_api_key_here
```

Get your API key from [Deepgram Console](https://console.deepgram.com)

## Web Demo Note

The app can run in the browser for demonstration purposes. However, the **primary target is the Tauri desktop application**, which provides:
- Better performance
- Native OS integration
- More secure API key handling

## Project Structure

```
src/
├── components/          # React UI components
├── hooks/              # Custom React hooks
├── services/           # Business logic (audio, transcription, Deepgram client)
├── utils/              # Audio processing utilities
└── types/              # TypeScript type definitions
```


