# Onboarding Components

This directory contains two sets of onboarding-related components:

1. **Feature Cards** - Animated showcase cards for the registration flow
2. **Step Components** - Multi-step form components with validation

---

## Feature Cards

Animated feature cards showcasing CRM capabilities during the registration flow.

### Components

#### CampagnesCard
Displays campaign management features with real-time statistics:
- Active campaigns count (animated)
- Prospects reached (updates every 3s)
- Conversion rate percentage
- Purple/pink gradient theme

#### FichiersCard
Shows file management capabilities with progress animations:
- File upload progress bars
- Processing status indicators
- Real-time file status updates
- Blue/cyan gradient theme

#### IntegrationsCard
Demonstrates integration capabilities:
- Connection status for each integration
- Animated status badges (connected, connecting, available)
- Icon animations based on status
- Orange/red gradient theme

#### RendezVousCard
Showcases appointment management:
- Live clock display (updates every second)
- Meeting status indicators
- Different meeting types (video, phone, in-person)
- Indigo/purple gradient theme

#### OnboardingFeaturePanel
Carousel component that rotates through all feature cards:
- Auto-rotates every 8 seconds
- Manual navigation with dots
- Smooth transitions between cards

### Usage - Feature Cards

#### In Registration Page
```tsx
import { OnboardingFeaturePanel } from '@/components/auth/onboarding';

<AuthCard rightPanel={<OnboardingFeaturePanel />}>
  {/* Registration form */}
</AuthCard>
```

#### Standalone Demo Page
Visit `/auth/onboarding-demo` to see all cards displayed in a grid layout.

#### Individual Cards
```tsx
import { CampagnesCard, FichiersCard, IntegrationsCard, RendezVousCard } from '@/components/auth/onboarding';

<CampagnesCard />
<FichiersCard />
<IntegrationsCard />
<RendezVousCard />
```

### Features - Feature Cards

- **Real-time animations**: All cards feature smooth Framer Motion animations
- **Live statistics**: Numbers and statuses update dynamically
- **Responsive design**: Optimized for various screen sizes
- **French localization**: All text in French (fr-FR)
- **Glass morphism**: Modern backdrop blur effects
- **Gradient themes**: Each card has unique color scheme

---

## Step Components

Multi-step onboarding form components with comprehensive validation, error handling, and UI consistency matching the AuthCard design.

### Components

#### Step1 - Email Validation
**Purpose:** Collect and validate user's professional email address

**Features:**
- Real-time email format validation
- Domain validation (blocks test/temporary domains)
- Field-level error messages with icons
- Success feedback on valid input
- Accessible form with ARIA attributes

**Validation Rules:**
- Required field
- Valid email format (RFC-compliant regex)
- Blocks invalid domains: test.com, example.com, temp.com
- Professional email recommended

#### Step2 - Organization Name
**Purpose:** Collect organization/company name

**Features:**
- Character count indicator (100 max)
- Real-time validation
- Character limit enforcement
- Special character validation (allows accents, spaces, hyphens, etc.)
- Visual warning when approaching character limit

**Validation Rules:**
- Required field
- Minimum 2 characters
- Maximum 100 characters
- Allowed characters: letters, numbers, spaces, hyphens, apostrophes, ampersands, periods, and French accented characters

#### Step3 - Industry Selection
**Purpose:** Select business sector/industry

**Features:**
- Dropdown select with 15+ industry options
- Clear visual feedback on selection
- Info tooltip explaining why this information is needed
- Accessible select component with keyboard navigation

**Industry Options:**
- Technology & IT, Finance & Banking, Healthcare & Medical
- Retail & Commerce, Manufacturing & Industry, Consulting & Services
- Education & Training, Real Estate, Marketing & Communication
- Hospitality & Restaurant, Construction & Building, Transport & Logistics
- Energy & Environment, Legal, Other

#### Step4 - Team Size Picker
**Purpose:** Select organization size/team size

**Features:**
- Radio button cards with visual selection state
- Icons for better UX
- Hover states for better interactivity
- Info tooltip explaining usage
- 6 size categories (1 person, 2-10, 11-50, 51-200, 201-1000, 1000+)

#### Step5 - Password Creation
**Purpose:** Create secure password with confirmation

**Features:**
- **Password strength indicator** with 5 levels (Very weak → Excellent)
- Visual progress bar showing strength
- Real-time requirement checklist with checkmarks
- Password visibility toggle (eye icon)
- Confirmation field with match validation
- Color-coded feedback (red/orange/yellow/blue/green)

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (!@#$%^&*(),.?":{}|<>)

### Usage - Step Components

#### Individual Step Components

```tsx
import { Step1, Step2, Step3, Step4, Step5 } from '@/components/auth/onboarding'

// Step 1 - Email
<Step1
  data={{ email: '' }}
  onNext={(data) => console.log(data)}
/>

// Step 2 - Organization
<Step2
  data={{ organizationName: '' }}
  onNext={(data) => console.log(data)}
  onBack={() => console.log('Back')}
/>

// Step 3 - Industry
<Step3
  data={{ industry: '' }}
  onNext={(data) => console.log(data)}
  onBack={() => console.log('Back')}
/>

// Step 4 - Team Size
<Step4
  data={{ teamSize: '' }}
  onNext={(data) => console.log(data)}
  onBack={() => console.log('Back')}
/>

// Step 5 - Password
<Step5
  data={{ password: '', confirmPassword: '' }}
  onNext={(data) => console.log(data)}
  onBack={() => console.log('Back')}
/>
```

#### Complete Onboarding Flow

```tsx
import { OnboardingDemo } from '@/components/auth/OnboardingDemo'

// Use the complete demo with all steps integrated
<OnboardingDemo />
```

### Design Consistency - Step Components

All components follow the AuthCard design system:
- **Colors:** Blue theme (blue-50, blue-200, blue-600, blue-800)
- **Error states:** Red theme (red-500, red-600)
- **Success states:** Green theme (green-600)
- **Spacing:** Consistent padding and margins
- **Typography:** Blue headings, consistent font sizes
- **Buttons:** Primary blue, outline for secondary actions
- **Focus states:** Blue ring on focus
- **Disabled states:** Reduced opacity, lighter blue

### Accessibility

All components implement ARIA best practices:
- `aria-invalid` for error states
- `aria-describedby` linking to error messages
- Proper label associations
- Keyboard navigation support
- Screen reader friendly error messages
- Focus management

---

## Technical Details

- Built with React hooks (useState, useEffect)
- Framer Motion for animations
- Lucide React for icons
- Tailwind CSS for styling
- TypeScript for type safety
