# Onboarding Feature Cards

Animated feature cards showcasing CRM capabilities during the registration flow.

## Components

### CampagnesCard
Displays campaign management features with real-time statistics:
- Active campaigns count (animated)
- Prospects reached (updates every 3s)
- Conversion rate percentage
- Purple/pink gradient theme

### FichiersCard
Shows file management capabilities with progress animations:
- File upload progress bars
- Processing status indicators
- Real-time file status updates
- Blue/cyan gradient theme

### IntegrationsCard
Demonstrates integration capabilities:
- Connection status for each integration
- Animated status badges (connected, connecting, available)
- Icon animations based on status
- Orange/red gradient theme

### RendezVousCard
Showcases appointment management:
- Live clock display (updates every second)
- Meeting status indicators
- Different meeting types (video, phone, in-person)
- Indigo/purple gradient theme

### OnboardingFeaturePanel
Carousel component that rotates through all feature cards:
- Auto-rotates every 8 seconds
- Manual navigation with dots
- Smooth transitions between cards

## Usage

### In Registration Page
```tsx
import { OnboardingFeaturePanel } from '@/components/auth/onboarding';

<AuthCard rightPanel={<OnboardingFeaturePanel />}>
  {/* Registration form */}
</AuthCard>
```

### Standalone Demo Page
Visit `/auth/onboarding-demo` to see all cards displayed in a grid layout.

### Individual Cards
```tsx
import { CampagnesCard, FichiersCard, IntegrationsCard, RendezVousCard } from '@/components/auth/onboarding';

<CampagnesCard />
<FichiersCard />
<IntegrationsCard />
<RendezVousCard />
```

## Features

- **Real-time animations**: All cards feature smooth Framer Motion animations
- **Live statistics**: Numbers and statuses update dynamically
- **Responsive design**: Optimized for various screen sizes
- **French localization**: All text in French (fr-FR)
- **Glass morphism**: Modern backdrop blur effects
- **Gradient themes**: Each card has unique color scheme

## Technical Details

- Built with React hooks (useState, useEffect)
- Framer Motion for animations
- Lucide React for icons
- Tailwind CSS for styling
- TypeScript for type safety
