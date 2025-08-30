# Deployment Pipeline Documentation

## Overview

This project uses a GitOps deployment pipeline with separate development and production environments. The pipeline is designed with development as the primary branch for all new features and bug fixes.

## Branch Strategy

### Primary Development Branch
- **Branch**: `copilot/fix-4d4f3236-5307-4aeb-bd6a-7814afa559ee`
- **Purpose**: Primary development branch where all new features and fixes are merged
- **Auto-deployment**: Automatically deploys to development environment on every push

### Production Branch
- **Branch**: `main`
- **Purpose**: Production-ready code only
- **Deployment**: Manual promotion from development branch

## Deployment Environments

### Development Environment
- **Triggers**: 
  - Push to `copilot/fix-4d4f3236-5307-4aeb-bd6a-7814afa559ee` branch
  - Pull requests targeting the development branch
- **Workflow**: `.github/workflows/deploy-dev.yml`
- **Purpose**: Testing and validation of new features
- **Auto-deployment**: Yes

### Production Environment
- **Triggers**: 
  - Push to `main` branch (after promotion)
  - Manual workflow dispatch
- **Workflow**: `.github/workflows/deploy-prod.yml`
- **Purpose**: Live production environment
- **Auto-deployment**: Only after manual promotion

## Deployment Process

### 1. Development Workflow
```bash
# Create feature branch from development
git checkout copilot/fix-4d4f3236-5307-4aeb-bd6a-7814afa559ee
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: add new feature"

# Push and create PR to development branch
git push origin feature/new-feature
# Create PR targeting copilot/fix-4d4f3236-5307-4aeb-bd6a-7814afa559ee
```

### 2. Promotion to Production
When development is ready for production:

1. Go to GitHub Actions tab
2. Select "Promote Development to Production" workflow
3. Click "Run workflow"
4. Type "promote" in the confirmation field
5. Click "Run workflow" button

This will:
- Merge development branch to main
- Trigger production deployment
- Create a release tag with timestamp

## Pipeline Features

### Automated Testing
All deployments include:
- Dependency installation
- Linting checks
- Application build
- Unit tests (if available)

### Environment Protection
- **Development**: No protection rules
- **Production**: Requires manual approval and confirmation

### Release Management
- Automatic tagging on production deployment
- Release tags follow format: `vYYYY.MM.DD-HHMMSS`
- Git history maintained through merge commits

## Configuration

### Environment Variables
Set the following secrets in GitHub repository settings:

#### Development Environment
- Add any development-specific environment variables

#### Production Environment
- Add production deployment credentials
- Configure production environment variables

### Deployment Targets
Update the deployment commands in the workflow files:
- `.github/workflows/deploy-dev.yml` - Line 49+
- `.github/workflows/deploy-prod.yml` - Line 44+

Replace the echo statements with actual deployment commands for your hosting service (Vercel, Netlify, AWS, etc.).

## Monitoring and Rollback

### Monitoring
- Check GitHub Actions for deployment status
- Monitor application logs in respective environments

### Rollback Process
If production deployment fails:
1. Use GitHub's environment history to identify last working commit
2. Manually revert main branch to previous working state
3. Redeploy production environment

## Security Considerations

- All deployments require successful build and test completion
- Production deployments require manual confirmation
- Environment secrets are isolated between dev and prod
- Branch protection rules should be configured for main branch

## Getting Started

1. Ensure all environment variables are configured
2. Update deployment commands in workflow files
3. Test development deployment by pushing to development branch
4. When ready, promote to production using the manual workflow