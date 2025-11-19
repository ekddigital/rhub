# EKD Digital Resource Hub - Deployment Guide

## Prerequisites

- Vercel account
- MySQL database configured and accessible
- Domain: `rhub.ekddigital.com`
- Environment variables (see `.env.example` for required values)

## Vercel Deployment Steps

### 1. Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### 2. Link Project to Vercel

```bash
cd /Users/ekd/Documents/coding_env/web/andgroupco/rhub
vercel link
```

### 3. Add Environment Variables to Vercel

You can add environment variables via:

- **Vercel Dashboard** (Recommended)
- **Vercel CLI**

#### Option A: Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

#### Required Environment Variables

| Variable Name             | Example Value                             | Environment                      |
| ------------------------- | ----------------------------------------- | -------------------------------- |
| `DATABASE_URL`            | `mysql://user:pass@host:port/database`    | Production, Preview, Development |
| `NODE_ENV`                | `production`                              | Production only                  |
| `NEXT_PUBLIC_SITE_URL`    | `https://rhub.ekddigital.com`             | Production only                  |
| `NEXTAUTH_SECRET`         | Generate using: `openssl rand -base64 32` | Production, Preview              |
| `NEXTAUTH_URL`            | `https://rhub.ekddigital.com`             | Production only                  |
| `NEXT_TELEMETRY_DISABLED` | `1`                                       | All environments                 |

**Note**: Replace example values with your actual credentials. Never commit real credentials to version control.

#### Option B: Vercel CLI

```bash
# Add environment variables via CLI
vercel env add DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXT_PUBLIC_SITE_URL production
vercel env add NEXTAUTH_URL production
vercel env add NODE_ENV production
vercel env add NEXT_TELEMETRY_DISABLED production
```

### 4. Configure Domain

1. In Vercel Dashboard → **Settings** → **Domains**
2. Add custom domain: `rhub.ekddigital.com`
3. Follow Vercel's DNS configuration instructions

### 5. Deploy

#### Automatic Deployment (Recommended)

- Push to GitHub main branch
- Vercel automatically deploys

#### Manual Deployment via CLI

```bash
vercel --prod
```

### 6. Verify Database Connection

After deployment, check logs to ensure database connection is successful:

```bash
vercel logs --follow
```

### 7. Run Database Migrations (If Needed)

If you need to run migrations on production:

```bash
# Set production database URL temporarily
export DATABASE_URL="your-production-database-url"

# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push
```

**Security**: Never commit your production DATABASE_URL to version control.

## Post-Deployment Checklist

- [ ] Verify site loads at `https://rhub.ekddigital.com`
- [ ] Test reference converter with sample XML/RIS file
- [ ] Check database logging (conversion jobs are saved)
- [ ] Test copy and download functionality
- [ ] Verify responsive design on mobile
- [ ] Check browser console for errors
- [ ] Test theme toggle (light/dark mode)
- [ ] Verify all resource cards link correctly

## Vercel Build Configuration

The project uses these default settings (no configuration needed):

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

## Environment-Specific URLs

| Environment | URL                           | Purpose               |
| ----------- | ----------------------------- | --------------------- |
| Production  | `https://rhub.ekddigital.com` | Live site             |
| Preview     | `https://rhub-*.vercel.app`   | Pull request previews |
| Development | `http://localhost:3000`       | Local development     |

## Monitoring & Analytics

### Vercel Analytics (Enabled by default)

- Automatic page view tracking
- Web Vitals monitoring
- No additional configuration needed

### Optional: Google Analytics

Add to environment variables if needed:

```
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## Troubleshooting

### Database Connection Issues

- Verify MySQL server is accessible from Vercel's IP ranges
- Check DATABASE_URL format is correct
- Ensure database credentials are valid

### Build Failures

```bash
# Test build locally
npm run build

# Check for TypeScript errors
npx tsc --noEmit

# Check for linting errors
npm run lint
```

### Missing Environment Variables

- Check Vercel Dashboard → Settings → Environment Variables
- Ensure variables are set for correct environment (Production/Preview/Development)
- Redeploy after adding new variables

## Rollback

If deployment fails:

```bash
# Via Dashboard: Deployments → Previous deployment → "Promote to Production"

# Via CLI
vercel rollback
```

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
