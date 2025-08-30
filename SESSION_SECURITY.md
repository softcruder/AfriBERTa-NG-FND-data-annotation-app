# Session Security Configuration

This application now includes enhanced session security with encryption and admin authorization.

## Environment Variables

For production security, you should set the following environment variables:

```bash
# Session Encryption (REQUIRED for production)
SESSION_SECRET=your-strong-secret-key-here-min-32-chars
SESSION_SALT=your-salt-value-here

# Google OAuth (existing)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=your-redirect-uri
```

## Admin Authorization

Admin access is granted to the following email addresses:
- oladipona17@gmail.com
- nasirullah.m1901406@st.futminna.edu.ng

Users with these email addresses will be assigned the `admin` role, while all other users will be assigned the `annotator` role.

## Security Features

1. **Session Encryption**: All session data is encrypted using AES-256-GCM before being stored in cookies
2. **Admin Authorization**: Specific email addresses are authorized as administrators
3. **Session Validation**: Encrypted sessions are automatically validated and expired sessions are rejected

## Development

For development, the application will use default encryption keys, but you should set proper environment variables for production deployment.