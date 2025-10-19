# DocSearchEngine

A document search engine that allows users to upload, organize, and search through their documents with full-text search capabilities.

## Features

- **User Authentication**: Register and login system
- **Document Upload**: Upload PDF and text files
- **Full-Text Search**: Search through document content
- **Document Management**: Organize your personal document library
- **Public Sharing**: Share documents publicly with other users
- **Modern UI**: Clean, responsive interface built with Tailwind CSS

## Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: Azure Database for PostgreSQL
- **File Processing**: PDF parsing with pdf-parse
- **Authentication**: Session-based authentication with bcrypt
- **Frontend**: Vanilla JavaScript with Tailwind CSS

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

The application uses the `PG_URL` environment variable that's already configured in your Azure App Service. This contains the PostgreSQL connection string for your `docsearchengine-pg` database.

Additional environment variables you may want to set:

```env
# Session Configuration (if not already set)
SESSION_SECRET=your-super-secret-session-key-change-in-production

# Environment
NODE_ENV=production

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app.azurewebsites.net
```

### 3. Database Setup

The application will automatically create the required tables on first run using your existing PostgreSQL database:
- `users` - User accounts
- `documents` - Document metadata
- `document_content` - Extracted document content
- `search_index` - Search index for full-text search with GIN indexing for performance

### 4. Run the Application

```bash
npm start
```

The application will be available at `http://localhost:8080`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Documents
- `POST /api/documents/upload` - Upload new document
- `GET /api/documents/my-documents` - Get user's documents
- `GET /api/documents/public` - Get public documents
- `DELETE /api/documents/:id` - Delete document

### Search
- `GET /api/search?q=query&filter=all|my|public` - Search documents

## Pages

- `/` - Home page with navigation
- `/app.html` - Main search interface
- `/library.html` - Personal document library
- `/explore.html` - Public documents explorer
- `/ui` - UI sandbox for development

## Deployment

The application is designed to be deployed as a single app on Azure App Service with Azure SQL Database.

### Azure Configuration

1. **App Service Settings**:
   - Set all environment variables in App Service Configuration
   - Enable "Always On" for better performance

2. **PostgreSQL Database**:
   - Your existing `docsearchengine-pg` database is already configured
   - The `PG_URL` environment variable contains the connection string
   - No additional configuration needed

3. **File Storage**:
   - Documents are stored in the `uploads` directory
   - For production, consider using Azure Blob Storage

## Development

The application uses ES modules and requires Node.js 20 or higher.

### Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # Database configuration
│   ├── middleware/
│   │   └── auth.js              # Authentication middleware
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── documents.js         # Document management routes
│   │   └── search.js            # Search routes
│   └── app.js                   # Main application
├── public/
│   ├── app.html                 # Main search interface
│   ├── library.html             # Document library
│   ├── explore.html             # Public documents
│   └── index.html               # Home page
├── uploads/                     # Document storage
└── server.js                    # Server entry point
```

## Security Considerations

- Passwords are hashed using bcrypt
- Sessions are configured with secure cookies
- File uploads are restricted to PDF and text files
- CORS is configured for production domains
- SQL injection protection through parameterized queries

## License

MIT License
