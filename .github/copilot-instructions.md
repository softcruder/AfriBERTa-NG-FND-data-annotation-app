# AfriBERTa NG Data Annotation Platform

AfriBERTa NG is a professional fake news detection data annotation platform built with Next.js 15, TypeScript, and Google OAuth authentication. The platform supports role-based access with admin and annotator roles, Google Drive/Sheets integration, and comprehensive data management features.

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Bootstrap, Build, and Run the Repository

**CRITICAL: Use --legacy-peer-deps for all npm commands due to React 19/18 dependency conflicts.**

```bash
# Install dependencies (REQUIRED)
npm install --legacy-peer-deps

# Development mode
npm run dev
# ✓ Starts in ~2 seconds on http://localhost:3000

# Production build
npm run build
# ✓ Takes ~27 seconds. NEVER CANCEL. Set timeout to 60+ minutes for safety.

# Production mode
npm run start
# ✓ Requires successful build first. Starts in ~500ms.

# Linting (has warnings but runs successfully)
npm run lint
# ✓ Takes ~10 seconds. Contains non-critical React warnings.
```

### Environment Configuration

**REQUIRED for Google OAuth functionality:**

Create `.env.local` file in repository root:

```bash
# Google OAuth (REQUIRED for authentication)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret  
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google

# Session Security (OPTIONAL for development, REQUIRED for production)
SESSION_SECRET=your-strong-secret-key-here-min-32-chars
SESSION_SALT=your-salt-value-here
```

**Without proper Google OAuth credentials, the application will load but authentication will fail.**

## Application Architecture

### Key Technologies
- **Framework**: Next.js 15.2.4 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **Authentication**: Google OAuth 2.0 with encrypted sessions
- **Data**: Google Sheets API for annotation storage
- **Deployment**: Vercel-optimized

### Directory Structure
```
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Backend API endpoints
│   │   ├── auth/         # Authentication routes
│   │   ├── annotations/  # Annotation management
│   │   ├── drive/        # Google Drive integration
│   │   ├── sheets/       # Google Sheets operations
│   │   └── payments/     # Payment calculations
│   ├── dashboard/        # Main application dashboard
│   └── page.tsx          # Landing/login page
├── components/           # React components
│   ├── ui/              # Reusable UI components (Radix-based)
│   ├── *-dashboard.tsx  # Role-specific dashboards
│   ├── annotation-*.tsx # Annotation workflow components
│   └── login-form.tsx   # Authentication interface
├── lib/                 # Utility libraries
│   ├── auth.ts         # Authentication utilities
│   ├── google-apis.ts  # Google API integrations
│   ├── encryption.ts   # Session encryption
│   └── validation.ts   # Form validation schemas
└── public/             # Static assets including logo.png
```

## User Roles and Access

### Admin Users (Hardcoded Authorization)
- `oladipona17@gmail.com`
- `nasirullah.m1901406@st.futminna.edu.ng`

Admin users can:
- Manage annotators and assignments
- View payment summaries and export data
- Monitor annotation quality and performance
- Configure annotation tasks and spreadsheets

### Annotator Users
All other authenticated users are assigned the `annotator` role and can:
- Access assigned annotation tasks
- Submit annotations with time tracking
- View personal performance metrics
- Export their own annotation data

## Validation Scenarios

**ALWAYS manually test these workflows after making changes:**

### Authentication Flow
1. Navigate to `http://localhost:3000`
2. Click "Continue with Google" button
3. Complete OAuth flow (requires valid Google credentials)
4. Verify redirect to `/dashboard` upon successful authentication
5. Confirm appropriate role-based dashboard loads (admin vs annotator)

### Core Annotation Workflow (for annotator users)
1. Log in as annotator user
2. Access annotation task from dashboard
3. Edit claims and source links if permitted
4. Add translation if content needs translation
5. Submit annotation and verify it's logged
6. Check time tracking functionality during annotation

### Admin Functions (for admin users)
1. Log in with admin email
2. Access admin dashboard functionality
3. Test annotator management features
4. Verify payment calculation features
5. Test data export functionality

### API Endpoints Test
```bash
# Test authentication endpoint
curl http://localhost:3000/api/auth/google

# Test API routes (requires authentication)
curl -H "Cookie: auth_session=..." http://localhost:3000/api/annotations
```

## Common Tasks

### Starting Development
```bash
# Clean install and start
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

### Fixing Build Issues
```bash
# If build fails, try clean rebuild
rm -rf .next
npm run build
```

### Debugging Authentication
1. Check environment variables are set correctly
2. Verify Google OAuth credentials in Google Console
3. Ensure redirect URI matches exactly: `http://localhost:3000/api/auth/google`
4. Check browser network tab for OAuth flow errors

### Code Quality
```bash
# Always run before committing (non-blocking warnings expected)
npm run lint

# Build validation before deployment
npm run build
```

## Important Implementation Details

### Security Features
- AES-256-GCM session encryption
- Secure OAuth 2.0 implementation
- Role-based access control
- CSRF protection via Next.js

### Google API Integration
- Drive API for CSV file access
- Sheets API for annotation logging
- Offline access for token refresh

### Performance Considerations
- Static generation where possible
- Optimized bundle splitting
- Image optimization with Next.js Image component

## Troubleshooting

### Common Issues

**"ERESOLVE could not resolve" during npm install:**
- Solution: Always use `npm install --legacy-peer-deps`

**Authentication fails after Google login:**
- Check environment variables are properly set
- Verify Google OAuth configuration
- Ensure redirect URI is exactly `http://localhost:3000/api/auth/google`

**Build warnings about React hooks dependencies:**
- These are non-critical ESLint warnings
- Build succeeds despite warnings
- Can be safely ignored for development

**Production build fails:**
- Ensure `npm run build` completes successfully before `npm run start`
- Clear `.next` directory if build cache is corrupted

### Build Times and Timeouts
- **npm install**: 45-60 seconds with --legacy-peer-deps. NEVER CANCEL.
- **npm run build**: 25-30 seconds. NEVER CANCEL. Set timeout to 60+ minutes.
- **npm run dev**: 1-2 seconds startup time
- **npm run start**: 500ms startup (requires build first)
- **npm run lint**: 8-12 seconds

## Testing and Validation

**No automated test suite exists.** Validation must be done manually:

1. **ALWAYS run through complete authentication flow** after auth-related changes
2. **Test annotation submission workflow** after API changes  
3. **Verify role-based access** after authentication changes
4. **Check Google API integration** after sheets/drive changes
5. **Validate responsive design** across different screen sizes

### Manual Testing Checklist
- [ ] Homepage loads correctly
- [ ] Google OAuth flow completes successfully
- [ ] Appropriate dashboard loads based on user role
- [ ] Annotation form functions properly
- [ ] Data persistence works with Google Sheets
- [ ] Session encryption/decryption works
- [ ] Logout functionality works
- [ ] Error handling displays appropriately

**NEVER skip manual validation. Build and lint success do not guarantee functional correctness.**