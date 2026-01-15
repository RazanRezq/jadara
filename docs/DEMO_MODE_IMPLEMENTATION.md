# Demo Mode Implementation

This document describes the Read-Only Demo Mode feature implemented for portfolio demonstration purposes.

## Overview

The demo mode allows portfolio visitors to explore the Jadara platform with a guest account while protecting existing test data from modifications.

## Demo User Credentials

```
Email:    demo@jadara.app
Password: demo123
```

## Features Implemented

### 1. Guest Login Button

Located on the login page (`/login`), visitors can click "Login as Guest (Demo)" to instantly access the platform without needing to create an account.

### 2. Backend Protection (API Middleware)

A global middleware (`demoModeProtection`) is applied to all API routes that:

- **Blocks** all `POST`, `PUT`, `PATCH`, and `DELETE` requests for the demo user
- **Returns** a friendly error message: "This action is disabled in Demo Mode"
- **Allows** specific paths like login/logout and job applications (configurable in `src/lib/demoMode.ts`)

### 3. Frontend Visual Indicators

- **Header Badge**: A pulsing "Demo Mode • Read Only" badge appears in the header
- **Sidebar Badge**: A demo mode indicator in the sidebar showing the current mode
- **Tooltip**: Hover over the badge to see "You're viewing a demo. Data modifications are disabled."

### 4. Internationalization

Full i18n support with translations in:
- English (`src/i18n/locales/en.json`)
- Arabic (`src/i18n/locales/ar.json`)

## File Structure

```
src/
├── lib/
│   └── demoMode.ts              # Demo mode constants and utilities
├── hooks/
│   └── useDemoMode.ts           # Client-side demo mode hook
├── components/
│   ├── demo-mode-badge.tsx      # Visual badge component
│   └── demo-mode-button.tsx     # Button wrapper for demo mode
scripts/
└── seed-demo-user.ts            # Script to create demo user
```

## Setup Instructions

### 1. Create the Demo User

Run the seed script to create the demo user in your database:

```bash
bun run seed:demo
```

### 2. Environment Variables

No additional environment variables are required. The demo user email is configured in `src/lib/demoMode.ts`.

## Configuration

### Allowed Write Operations

By default, the demo user can only perform these write operations:

```typescript
// src/lib/demoMode.ts
export const DEMO_ALLOWED_WRITE_PATHS = [
    '/api/applicants/apply', // Allow submitting job applications
    '/api/users/login',      // Allow login
    '/api/users/logout',     // Allow logout
]
```

To allow additional operations, add paths to this array.

### Demo User Email

To change the demo user email:

```typescript
// src/lib/demoMode.ts
export const DEMO_USER_EMAIL = 'demo@jadara.app'
```

## Usage in Components

### Using the Demo Mode Hook

```tsx
import { useDemoMode } from "@/hooks/useDemoMode"

function MyComponent({ userEmail }) {
    const { isDemo, showDemoWarning } = useDemoMode({ email: userEmail })
    
    if (isDemo) {
        // Show restricted UI or disable certain features
    }
}
```

### Using the DemoModeButton Component

```tsx
import { DemoModeButton } from "@/components/demo-mode-button"

function MyComponent({ isDemo }) {
    return (
        <DemoModeButton 
            isDemo={isDemo} 
            variant="destructive"
            onClick={handleDelete}
        >
            Delete
        </DemoModeButton>
    )
}
```

## API Response Format

When a demo user attempts a restricted action, the API returns:

```json
{
    "success": false,
    "error": "Demo Mode - Read Only",
    "details": "This action is disabled in Demo Mode. Data modifications are not allowed."
}
```

HTTP Status Code: `403 Forbidden`

## Security Considerations

1. The demo user has `admin` role to access most features visually
2. All write operations are blocked at the API level
3. The protection is enforced server-side, not just client-side
4. Session handling works normally for the demo user

## Testing

1. Visit `/login` and click "Login as Guest (Demo)"
2. Try to create, edit, or delete any resource
3. Verify that the action is blocked with a friendly message
4. Check that the demo mode badge is visible in the header and sidebar
