# Election Admin App - Setup Guide

## 🔧 Fixed Issues

### 1. Firebase Connection ✅
- **Problem**: The app was trying to connect to a REST API at `http://localhost:3000/api` which didn't exist
- **Solution**: Integrated Firebase Firestore directly into the application
- Added Firebase dependency to `package.json`
- Updated `src/lib/api.ts` to use Firestore methods instead of REST API calls

### 2. CSS Styling ✅
- **Problem**: Import path case sensitivity issue with Layout folder
- **Solution**: Fixed import path in `App.tsx` from `./components/layout/` to `./components/Layout/`
- Tailwind CSS is now properly configured and working

### 3. Project Structure ✅
- All TypeScript components are now properly configured
- Vite dev server is running successfully
- All UI components (Card, Button, Table) are working correctly

## 🚀 Getting Started

### Prerequisites
- Node.js installed
- Firebase project (already configured)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5174/` (or another port if 5174 is in use)

## 📊 Database Setup

### Option 1: Use the Settings Page (Recommended)
1. Navigate to the **Settings** page in the app
2. Click on "Seed Sample Data" button
3. This will populate your Firebase database with:
   - 5 sample candidates
   - 5 sample districts

### Option 2: Manual Firebase Setup
You can add data directly to your Firebase console:

**Candidates Collection:**
```json
{
  "name": "John Doe",
  "party": "Democratic Party",
  "district": "District 1",
  "votes": 15420,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Districts Collection:**
```json
{
  "name": "District 1",
  "registeredVoters": 45000,
  "totalVotes": 29270,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## 🎨 Features

### Dashboard
- Total votes count
- Total candidates count
- Total districts count
- Voter turnout percentage

### Candidates Page
- View all candidates
- Add new candidates
- Edit existing candidates
- Delete candidates
- View vote counts by candidate

### Districts Page
- View all electoral districts
- Add new districts
- Edit district information
- View voter registration and turnout data
- Delete districts

### Results Page
- Visual bar chart of vote distribution
- Top 5 candidates ranking
- Real-time results from Firebase

### Settings Page
- Database seeding functionality
- Firebase connection status
- Configuration information

## 🔥 Firebase Configuration

The app is connected to:
- **Project ID**: electionnew-app
- **Database**: Firestore
- **Collections**: 
  - `candidates` - Stores candidate information
  - `districts` - Stores district information

## 📁 Project Structure

```
src/
├── components/
│   ├── Layout/
│   │   └── DashboardLayout.tsx    # Main layout with navigation
│   └── ui/
│       ├── button.tsx              # Reusable button component
│       ├── card.tsx                # Card component
│       └── table.tsx               # Table component
├── lib/
│   ├── api.ts                      # Firebase Firestore API wrapper
│   ├── utils.ts                    # Utility functions (cn)
│   └── seedData.ts                 # Database seeding utility
├── pages/
│   ├── Dashboard.tsx               # Dashboard with stats
│   ├── Candidates.tsx              # Candidates management
│   ├── Districts.tsx               # Districts management
│   ├── Results.tsx                 # Election results visualization
│   └── Settings.tsx                # Settings and database management
├── firebase.js                     # Firebase initialization
├── App.tsx                         # Main app with routing
├── main.tsx                        # Entry point
└── index.css                       # Global styles with Tailwind

```

## 🛠️ Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router DOM** - Navigation
- **Firebase/Firestore** - Backend database
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **Lucide React** - Icons
- **Radix UI** - Accessible UI primitives

## 🎯 Next Steps

1. **Authentication**: Add Firebase Authentication to secure the admin panel
2. **Validation**: Add form validation for creating/editing candidates and districts
3. **Real-time Updates**: Implement real-time listeners for live data updates
4. **Export Data**: Add functionality to export election results
5. **Advanced Analytics**: Add more detailed analytics and reports

## ⚠️ Important Notes

- Make sure your Firebase security rules are properly configured
- In production, add authentication before deploying
- The seed data is for testing purposes only
- Always backup your database before performing bulk operations

## 🐛 Troubleshooting

### Port Already in Use
If you see "Port 5173 is in use", Vite will automatically try the next available port (5174, 5175, etc.)

### Firebase Permission Errors
Check your Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // For development only!
    }
  }
}
```

### CSS Not Loading
Make sure Tailwind is properly installed:
```bash
npm install -D tailwindcss postcss autoprefixer
```

## 📝 License

This project is part of the Parliament Election Android & Web App system.
