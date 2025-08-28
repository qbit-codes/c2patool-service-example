# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

This is a simple Node.js Express service that demonstrates adding C2PA (Content Authenticity Initiative) manifests to uploaded images using the external `c2patool` binary. 

### Core Components

- **Server (`server.js`)**: Express server with three main routes:
  - `GET /version`: Returns c2patool version info
  - `POST /upload`: Handles image uploads, calls c2patool to add C2PA manifest, returns signed image data
  - `GET /`: Serves the client interface
  
- **Client (`client/`)**: Simple HTML/CSS/JS interface for uploading and viewing signed images:
  - `index.html`: Basic upload form
  - `index.js`: Handles file selection, uploads via fetch API, displays gallery with C2PA badges
  - `styles.css`: Basic styling
  
- **C2PA Integration**: Uses external `c2patool` binary (must be placed in root directory) to sign images with manifests defined in `manifest.json`

### Key Dependencies

The c2patool binary must be downloaded separately and placed in the project root. The service calls it via child_process.exec().

### Data Flow

1. User selects images in browser
2. Client sends each file to `/upload` endpoint via fetch
3. Server saves file to `uploads/` directory
4. Server calls `c2patool` to add C2PA manifest and sign the image
5. Server returns image URL and manifest report
6. Client displays signed image with interactive C2PA badge

## Commands

- `npm install`: Install dependencies
- `npm start`: Start development server with nodemon (runs on port 8000)
- `npm test`: No tests configured

## Development Notes

- Images are stored in `uploads/` directory (created automatically)
- The service uses c2patool's built-in test certificate for demo purposes
- Manifest configuration is defined in `manifest.json` in the root
- Server serves static files from both `client/` and `uploads/` directories
- File uploads limited to 2GB via express-fileupload middleware