# Quick Start Guide

## Prerequisites
- Node.js 16+ installed
- Python 3.8+ installed
- npm or yarn package manager

## Step 1: Install Frontend Dependencies

```bash
npm install
```

## Step 2: Install Backend Dependencies

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

## Step 3: (Optional) Configure Spotify API

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Copy your Client ID and Client Secret
4. Create a `.env` file in the `backend` directory:

```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

## Step 4: Start the Backend Server

```bash
cd backend
python app.py
```

The backend will run on `http://localhost:5000`

## Step 5: Start the Frontend (in a new terminal)

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Step 6: Use the Application

1. Open `http://localhost:3000` in your browser
2. Grant camera/microphone permissions when prompted
3. Choose your detection method (Face or Voice)
4. Click "Start Detection" or "Start Recording"
5. View your personalized music recommendations!

## Troubleshooting

### Camera/Microphone not working
- Make sure you've granted browser permissions
- Check that no other app is using the camera/microphone
- Try refreshing the page

### Backend connection errors
- Ensure the backend is running on port 5000
- Check that CORS is enabled (it should be by default)
- Verify the proxy settings in `vite.config.js`

### Model loading errors
- Check your internet connection (models download on first use)
- Clear browser cache and try again
- Ensure you're using a modern browser (Chrome, Firefox, Edge)

### Spotify API errors
- The app works without Spotify API (uses fallback recommendations)
- If you want Spotify integration, verify your credentials in `.env`
- Make sure your Spotify app has the correct redirect URIs configured

## Production Build

To build for production:

```bash
# Frontend
npm run build

# Backend
# Use a production WSGI server like gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

