# BillableAI Chrome Extension

An AI-powered Chrome extension designed to shadow a lawyer's workflow inside Gmail. It tracks time spent writing emails, summarizes content using LLMs, and logs activities to Clio or PracticePanther.

## 🚀 Features

- **Typing Timer**: Track actual time spent actively typing emails
- **AI Summary Engine**: Generate professional billable summaries using GPT/Gemini
- **Client/Case Mapper**: Match email recipients with Clio clients/matters
- **Confirmation UI**: Review and edit summaries before logging
- **OAuth Integration**: Secure authentication with Gmail and Clio
- **Retry Handling**: Automatic retry for failed API calls

## 🏗️ Project Structure

```
BillableAI/
├── extension/          # Chrome Extension (React + TailwindCSS)
│   ├── public/
│   ├── src/
│   ├── manifest.json
│   └── tailwind.config.js
├── backend/            # Node.js/Express API server
│   ├── src/
│   ├── package.json
│   └── env.example
└── README.md
```

## 🛠️ Technology Stack

### Frontend (Chrome Extension)
- React 19 + Vite
- TailwindCSS
- Chrome Extension Manifest v3
- WebExtension Polyfill
- Axios for API calls

### Backend (API Server)
- Node.js + Express
- MongoDB + Mongoose
- OAuth 2.0 for Gmail and Clio
- OpenAI/Gemini API integration
- JWT for authentication

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- MongoDB (optional for development)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd BillableAI
```

### 2. Frontend Setup (Chrome Extension)
```bash
cd extension
npm install
npm run dev  # For development
npm run build  # For production
```

### 3. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your API keys
npm run dev
```

### 4. Environment Variables
Create a `.env` file in the `backend/` directory:

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/billableai
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CLIO_CLIENT_ID=your_clio_client_id
CLIO_CLIENT_SECRET=your_clio_client_secret
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
```

## 🔧 Development

### Running the Frontend
```bash
cd extension
npm run dev
```

### Running the Backend
```bash
cd backend
npm run dev
```

### Loading the Extension in Chrome
1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `extension/dist` folder (after building)

## 📋 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/clio` - Clio OAuth

### Gmail Integration
- `GET /api/gmail/threads` - Fetch email threads
- `POST /api/gmail/summarize` - Summarize email content

### Clio Integration
- `GET /api/clio/clients` - Fetch clients
- `GET /api/clio/matters` - Fetch matters
- `POST /api/clio/log-time` - Log time entry

### AI Services
- `POST /api/ai/summarize` - Generate email summary
- `POST /api/ai/suggest` - Get AI suggestions

## 🔐 Security

- OAuth 2.0 for secure authentication
- JWT tokens for session management
- Environment variables for sensitive data
- CORS configuration for Chrome extension
- Helmet.js for security headers

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support, email support@billableai.com or create an issue in the repository.
