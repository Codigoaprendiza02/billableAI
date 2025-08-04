# MongoDB Setup Guide

## Option 1: MongoDB Atlas (Recommended - Free Cloud Database)

1. **Create MongoDB Atlas Account**:
   - Go to: https://www.mongodb.com/atlas
   - Sign up for a free account
   - Create a new cluster (free tier)

2. **Get Connection String**:
   - In your cluster, click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with `billableai`

3. **Update env.local**:
   ```bash
   MONGODB_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/billableai?retryWrites=true&w=majority
   ```

## Option 2: Install MongoDB Locally

1. **Download MongoDB Community Server**:
   - Go to: https://www.mongodb.com/try/download/community
   - Download Windows version
   - Install with default settings

2. **Start MongoDB**:
   - MongoDB should run as a Windows service automatically
   - Or run: `mongod` in command prompt

3. **Keep current env.local**:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/billableai
   ```

## Option 3: Use SQLite (No Installation Required)

If you want to avoid MongoDB entirely, we can modify the backend to use SQLite instead.

## Quick Test

After setting up MongoDB, restart the backend server:

```bash
cd backend
npm start
```

Then test the connection:

```bash
node test-auth-flow.js
```

## Troubleshooting

- **"Database is not available"**: MongoDB is not running or connection string is wrong
- **"Connection refused"**: MongoDB service is not started
- **"Authentication failed"**: Wrong username/password in connection string 