# Jadara (جدارة) - Smart Recruitment Platform

**Jadara** is an intelligent recruitment and talent acquisition platform that leverages AI to streamline the hiring process, evaluate candidates, and build exceptional teams.

## 🌟 Features

### Core Capabilities
- **AI-Powered Candidate Evaluation**: Automated candidate screening and scoring using advanced AI
- **Smart Job Creation Wizard**: Create job postings with AI assistance
- **Collaborative Hiring**: Multi-user collaboration with role-based access control
- **Blind Hiring Support**: Fair evaluation with configurable data hiding
- **Interview Scheduling**: Integrated calendar and interview management
- **Voice & Text Assessments**: Multi-format candidate evaluation tools
- **Real-Time Application Tracking**: Monitor candidates through every stage

### Role-Based Dashboards
- **Super Admin**: Platform management, user control, and system configuration
- **Admin/Recruiter**: Full hiring pipeline management and candidate review
- **Reviewer**: Focused candidate evaluation and scoring interface

### Multilingual Support
- **Arabic (RTL)**: Full right-to-left support
- **English (LTR)**: Complete English interface
- Seamless language switching with persistent preferences

## 🚀 Getting Started

### Prerequisites
- [Bun](https://bun.sh) (recommended) or Node.js 18+
- MongoDB database
- (Optional) Google Gemini API key for AI features
- (Optional) Resend API key for email notifications

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd jadara
```

2. **Install dependencies**
```bash
bun install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your-secret-key-here

# AI (Optional - for candidate evaluation)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# Email (Optional - for notifications)
RESEND_API_KEY=your_resend_api_key

# Storage (Optional - for file uploads)
DO_SPACES_ENDPOINT=your_digitalocean_endpoint
DO_SPACES_BUCKET=your_bucket_name
DO_SPACES_KEY=your_access_key
DO_SPACES_SECRET=your_secret_key
DO_SPACES_REGION=your_region
```

4. **Seed the database**
```bash
bun run seed
```

This will create default user accounts:
- **Super Admin**: `superadmin@jadara.com` / `superadmin123`
- **Admin**: `admin@jadara.com` / `admin123`
- **Reviewer**: `reviewer@jadara.com` / `reviewer123`

5. **Run the development server**
```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
jadara/
├── src/
│   ├── app/                    # Next.js 16 App Router
│   │   ├── api/[[...route]]/   # Hono API routes
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (dashboard)/        # Dashboard pages
│   │   └── (public)/           # Public application pages
│   ├── components/
│   │   └── ui/                 # shadcn/ui components
│   ├── hooks/
│   │   └── useTranslate.ts     # Translation hook
│   ├── lib/
│   │   ├── mongodb.ts          # Database connection
│   │   ├── auth.ts             # Authentication utilities
│   │   └── utils.ts            # Helper functions
│   ├── models/                 # MongoDB schemas & API routes
│   │   ├── Users/
│   │   ├── Jobs/
│   │   ├── Applicants/
│   │   ├── CompanyProfile/
│   │   └── SystemConfig/
│   ├── i18n/
│   │   └── locales/
│   │       ├── ar.json         # Arabic translations
│   │       └── en.json         # English translations
│   └── services/               # Business logic services
├── scripts/                    # Utility scripts
│   ├── seed-users.ts          # Database seeding
│   └── reset-passwords.ts     # Password reset
└── public/                     # Static assets
```

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router with React Server Components)
- **Language**: TypeScript (strict mode)
- **Package Manager**: Bun
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (new-york style)
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **API Framework**: Hono
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with HTTP-only cookies
- **AI**: Google Gemini (configurable)
- **Email**: Resend
- **File Storage**: DigitalOcean Spaces (S3-compatible)

## 🔧 Available Scripts

```bash
# Development
bun dev              # Start development server
bun run build        # Build for production
bun start            # Start production server
bun run lint         # Run ESLint

# Database
bun run seed         # Seed database with default users
bun run reset-passwords   # Reset user passwords
bun run clear-db     # Clear database (use with caution)
```

## 🎨 UI Features

### Design System
- **Dark/Light Mode**: Automatic theme switching with system preference support
- **Responsive Design**: Mobile-first approach with full tablet/desktop optimization
- **RTL Support**: Comprehensive right-to-left layout for Arabic
- **Glassmorphism**: Modern UI with backdrop blur effects
- **Smooth Animations**: Framer Motion and CSS animations

### Components
- **Data Tables**: Sortable, filterable, with pagination
- **Kanban Boards**: Drag-and-drop candidate pipeline
- **Form Wizards**: Multi-step job creation with validation
- **Charts**: Real-time recruitment analytics
- **Notifications**: Toast notifications and in-app alerts

## 🔒 Security Features

- **Role-Based Access Control (RBAC)**: Granular permissions system
- **JWT Authentication**: Secure HTTP-only cookies
- **Session Management**: Automatic session expiry and refresh
- **Audit Logging**: Track all system activities
- **Data Encryption**: Secure password hashing with bcrypt
- **Input Validation**: Zod schemas for all API endpoints

## 🤖 AI Features

### Candidate Evaluation
- Automated CV/resume analysis
- Skills extraction and matching
- Experience verification
- Language proficiency assessment
- Red flag detection
- Comprehensive scoring system

### Job Description Generation
- Context-aware job descriptions
- Smart skills suggestions
- Industry-specific templates
- Customizable tone and style

## 📧 Email Templates

Pre-built professional email templates:
- Interview invitations
- Application status updates
- Rejection notifications (with optional feedback)
- Job offer letters

## 🌍 Internationalization

### Supported Languages
- **Arabic (العربية)**: Complete RTL support
- **English**: Full LTR interface

### Features
- Persistent language preference
- Per-user language settings
- Dynamic content translation
- Date/time localization

## 🔄 API Structure

All API routes follow RESTful conventions using Hono:

```
/api/users          # User management
/api/jobs           # Job postings
/api/applicants     # Candidate applications
/api/interviews     # Interview scheduling
/api/evaluations    # AI evaluations
/api/company-profile # Company settings
/api/system-config  # System configuration
```

## 📝 Company Profile Setup

After logging in as an admin, navigate to **Settings > Company** to configure:

- Company name
- Industry
- Company bio (used for AI-generated job descriptions)
- Website URL

**Example for Jadara:**
```
Company Name: Jadara Recruitment Solutions
Industry: Human Resources & Talent Acquisition
Bio: Jadara is a leading provider of intelligent recruitment solutions in the MENA region. We combine cutting-edge AI technology with deep HR expertise to help organizations find and hire exceptional talent efficiently and fairly. Our platform supports blind hiring practices, multilingual assessments, and comprehensive candidate evaluation.
Website: https://jadara.com
```

## 🤝 Contributing

This is a proprietary project. For access and contribution guidelines, please contact the development team.

## 📄 License

Proprietary - All Rights Reserved

## 🆘 Support

For technical support or questions:
- Email: support@jadara.com
- Internal Documentation: Check project wiki

---

**Jadara (جدارة)** - Empowering Your Talent Acquisition
