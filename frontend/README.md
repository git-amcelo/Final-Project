# GymBuddy Frontend - Next.js 14

Next.js 14 frontend for the GymBuddy fitness partner matching platform.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Animations**: GSAP
- **Icons**: Lucide React
- **API**: Custom fetch wrapper with JWT authentication

## Design System

### Aesthetic: Preset C - "Brutalist Signal"

**Colors:**
- Paper (`#E8E4DD`) - Primary background
- Signal (`#E63B2E`) - Accent/CTA color
- Offwhite (`#F5F3EE`) - Secondary background
- Black (`#111111`) - Text and borders

**Typography:**
- Headings: "Space Grotesk" (tight tracking)
- Drama: "DM Serif Display" Italic (hero headlines)
- Data: "Space Mono" (technical text)

**UI Elements:**
- Rounded corners: 2xl, 3xl, 4xl
- Magnetic button hover effects
- Noise texture overlay (0.05 opacity)
- Smooth GSAP animations

## Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Update `NEXT_PUBLIC_API_URL` to point to your Django backend.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Build for Production

```bash
npm run build
npm start
```

## Pages & Features

### Public Pages
- `/` - Landing page with cinematic design
- `/login` - User login with JWT
- `/register` - User registration

### Protected Pages (require auth)
- `/dashboard` - User dashboard with stats and quick actions
- `/profile` - Edit user profile and preferences
- `/matching` - Find compatible workout buddies with filters
- `/workouts` - Browse and manage workout sessions
- `/groups` - Explore and join workout groups

## API Integration

The frontend is fully integrated with the Django backend:

- **JWT Authentication**: Auto-refresh tokens, handle 401 errors
- **API Client**: Located at `src/lib/api.ts`
- **TypeScript Types**: Located at `src/types/index.ts`

### API Functions

```typescript
import { authApi, userApi, workoutApi, groupApi, matchingApi, ratingApi } from '@/lib/api';

// Authentication
await authApi.login('username', 'password');
authApi.logout();

// User profile
const profile = await userApi.getProfile();
await userApi.updateProfile({ bio: '...' });

// Workouts
const sessions = await workoutApi.listSessions({ my: 'true' });
await workoutApi.createSession({ title: '...', ... });

// Matching
const matches = await matchingApi.findBuddies({ fitness_level: 'intermediate' });
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── page.tsx      # Landing page
│   │   ├── login/        # Login page
│   │   ├── register/     # Registration page
│   │   ├── dashboard/    # User dashboard
│   │   ├── profile/      # Profile management
│   │   ├── matching/     # Smart matching
│   │   ├── workouts/     # Workout sessions
│   │   └── groups/       # Groups
│   ├── components/       # Reusable components
│   │   ├── Navbar.tsx
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   ├── Philosophy.tsx
│   │   ├── Footer.tsx
│   │   ├── AuthLayout.tsx
│   │   └── ProtectedRoute.tsx
│   ├── lib/              # Utilities
│   │   ├── api.ts        # API client
│   │   └── utils.ts      # Helper functions
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   └── styles/           # Global styles
│       └── globals.css
├── public/               # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## Features Implemented

### ✅ Authentication
- User registration with role selection
- JWT login with automatic token refresh
- Protected routes with redirect to login
- Logout functionality

### ✅ Profile Management
- View and edit user profile
- Upload profile picture
- Set fitness goals and interests
- Configure availability
- Manage gym preferences

### ✅ Smart Matching
- Filter by fitness level, gender, goals, location
- Compatibility scoring display
- Match reasons breakdown
- View match profiles

### ✅ Workout Sessions
- List all/my/available sessions
- Create new workout sessions
- View session details
- Filter by status and availability

### ✅ Groups
- Browse all groups
- View my groups
- Search groups
- Group cards with full details

## Integration with Django Backend

All API endpoints are integrated:

| Feature | Frontend | Backend |
|---------|----------|---------|
| Auth | `/login`, `/register` | `/api/register/`, `/api/token/` |
| Profile | `/profile` | `/api/profile/` |
| Matching | `/matching` | `/api/matching/find-buddies/` |
| Workouts | `/workouts` | `/api/workouts/` |
| Groups | `/groups` | `/api/groups/` |

## Design Patterns

### Magnetic Buttons
```tsx
<button className="btn-magnetic bg-signal text-white px-6 py-3 rounded-xl">
  Click Me
</button>
```

### GSAP Animations
```tsx
useEffect(() => {
  const gsap = (await import('gsap')).default;
  gsap.to(element, { opacity: 1, duration: 1 });
}, []);
```

### Protected Routes
```tsx
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

## Known Limitations

- Profile picture upload requires multipart form (not fully implemented)
- No real-time notifications
- No pagination on list views
- No error boundary component
- No loading skeletons

## Future Enhancements

- Add WebSocket support for real-time updates
- Implement infinite scroll for list views
- Add loading skeletons
- Implement error boundaries
- Add PWA support
- Add analytics tracking

---

**Built for Group 15 - COMP8347 Final Project**
University of Windsor - May 2026
