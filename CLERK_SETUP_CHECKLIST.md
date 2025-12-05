# Clerk Setup Checklist

Use this checklist to complete your Clerk authentication setup.

## Prerequisites

- [ ] Node.js and Yarn installed
- [ ] Next.js 14 project running
- [ ] Access to project repository

## Step 1: Install Dependencies

- [ ] Run `yarn install` to install @clerk/nextjs and svix
- [ ] Verify installation succeeded
- [ ] Check package.json includes @clerk/nextjs

## Step 2: Get Clerk Account & Keys

- [ ] Go to https://dashboard.clerk.com/
- [ ] Create account or sign in
- [ ] Create new application
- [ ] Name: "DevLink CRM" (or your preference)
- [ ] Copy Publishable Key (starts with pk_)
- [ ] Copy Secret Key (starts with sk_)

## Step 3: Configure Environment

- [ ] Open `.env.local` file
- [ ] Replace `pk_test_` with your actual Publishable Key
- [ ] Replace `sk_test_` with your actual Secret Key
- [ ] Save file
- [ ] Restart dev server if running

## Step 4: Test Basic Authentication

- [ ] Start dev server: `yarn dev`
- [ ] Visit http://localhost:3000/auth/clerk-login
- [ ] Sign up with test email
- [ ] Check email for verification
- [ ] Verify email address
- [ ] Sign in successfully
- [ ] Verify redirect to /dashboard works

## Step 5: Test Protected Routes

- [ ] While signed out, try visiting /dashboard
- [ ] Confirm redirect to login page
- [ ] Sign in
- [ ] Verify access to /dashboard
- [ ] Sign out
- [ ] Verify redirect back to public page

## Step 6: Test User Profile

- [ ] Sign in if not already
- [ ] Visit http://localhost:3000/auth/profile
- [ ] View profile information
- [ ] Try updating name
- [ ] Try changing password
- [ ] Check active sessions
- [ ] Sign out from all devices (if testing)

## Step 7: Configure Social Providers (Optional)

In Clerk Dashboard:

- [ ] Go to Configure > Social Connections
- [ ] Enable Google OAuth
  - [ ] Add OAuth credentials
  - [ ] Test sign in with Google
- [ ] Enable Microsoft OAuth (optional)
  - [ ] Add OAuth credentials  
  - [ ] Test sign in with Microsoft
- [ ] Enable GitHub OAuth (optional)
  - [ ] Add OAuth credentials
  - [ ] Test sign in with GitHub

## Step 8: Set Up Webhooks (Optional)

- [ ] Go to Clerk Dashboard > Configure > Webhooks
- [ ] Click "Add Endpoint"
- [ ] Enter endpoint URL: `https://yourdomain.com/api/webhooks/clerk`
- [ ] Select events:
  - [ ] user.created
  - [ ] user.updated
  - [ ] user.deleted
  - [ ] session.created
  - [ ] session.ended
- [ ] Copy webhook signing secret
- [ ] Add to `.env.local` as `CLERK_WEBHOOK_SECRET`
- [ ] Test webhook with Clerk Dashboard test tool

## Step 9: Customize Appearance

- [ ] Open `lib/clerk/config.ts`
- [ ] Update colors to match brand
  - [ ] colorPrimary
  - [ ] colorBackground
  - [ ] colorText
- [ ] Update borderRadius if needed
- [ ] Update fontFamily if needed
- [ ] Test appearance in sign-in page
- [ ] Adjust element classes if needed

## Step 10: Integrate with Existing Code

- [ ] Identify pages that need authentication
- [ ] Add `requireAuth()` to server components
- [ ] Add `useAuthUser()` hook to client components
- [ ] Replace old auth checks with Clerk utilities
- [ ] Test each updated page
- [ ] Verify no broken functionality

## Step 11: Production Preparation

- [ ] Set environment variables in production host
  - [ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  - [ ] CLERK_SECRET_KEY
  - [ ] CLERK_WEBHOOK_SECRET (if using webhooks)
  - [ ] Route configuration variables
- [ ] Update Clerk Dashboard with production domain
- [ ] Configure CORS if needed
- [ ] Set up monitoring/alerts
- [ ] Test authentication in production
- [ ] Monitor Clerk Dashboard for errors

## Step 12: User Migration (If Applicable)

- [ ] Review CLERK_MIGRATION_GUIDE.md
- [ ] Add clerk_user_id column to database
- [ ] Create migration API endpoint
- [ ] Test migration with test user
- [ ] Create migration UI component
- [ ] Add migration prompt to dashboard
- [ ] Monitor migration success rate
- [ ] Handle migration errors gracefully

## Step 13: Documentation & Training

- [ ] Share CLERK_QUICKSTART.md with team
- [ ] Review CLERK_SETUP.md together
- [ ] Walk through authentication flow
- [ ] Demonstrate user management
- [ ] Show Clerk Dashboard features
- [ ] Document any custom implementations
- [ ] Create troubleshooting runbook

## Step 14: Testing & QA

- [ ] Test sign-up flow
  - [ ] Email/password
  - [ ] Social providers
  - [ ] Email verification
- [ ] Test sign-in flow
  - [ ] Email/password
  - [ ] Social providers
  - [ ] "Remember me"
- [ ] Test password reset
  - [ ] Request reset
  - [ ] Receive email
  - [ ] Reset password
  - [ ] Sign in with new password
- [ ] Test profile management
  - [ ] View profile
  - [ ] Update information
  - [ ] Change password
  - [ ] Manage sessions
- [ ] Test protected routes
  - [ ] Access while signed out
  - [ ] Access while signed in
  - [ ] Session expiration
- [ ] Test sign-out
  - [ ] Single device
  - [ ] All devices
  - [ ] Automatic redirect

## Step 15: Security Review

- [ ] Verify environment variables are secure
- [ ] Check no secrets in code
- [ ] Review middleware configuration
- [ ] Test unauthorized access attempts
- [ ] Enable MFA in Clerk Dashboard
- [ ] Review session duration settings
- [ ] Check CORS configuration
- [ ] Audit webhook security
- [ ] Review rate limiting settings

## Optional Enhancements

- [ ] Add custom user metadata
- [ ] Implement role-based access control
- [ ] Create custom email templates
- [ ] Add organization support
- [ ] Implement invitation system
- [ ] Add user impersonation (admin)
- [ ] Create custom sign-up flow
- [ ] Add custom OAuth providers
- [ ] Implement passwordless auth
- [ ] Add biometric authentication

## Maintenance Tasks

### Weekly
- [ ] Review Clerk Dashboard for errors
- [ ] Check authentication success rate
- [ ] Monitor webhook delivery
- [ ] Review new user signups

### Monthly  
- [ ] Update @clerk/nextjs if needed
- [ ] Review and update documentation
- [ ] Audit user permissions
- [ ] Check for deprecated features
- [ ] Review security settings

### Quarterly
- [ ] Full security audit
- [ ] User experience review
- [ ] Performance optimization
- [ ] Documentation refresh
- [ ] Team training refresh

## Troubleshooting Guide

### Issue: Can't sign in
- [ ] Check environment variables
- [ ] Verify Clerk keys are correct
- [ ] Check browser console errors
- [ ] Review Next.js server logs
- [ ] Test in incognito mode
- [ ] Clear browser cache/cookies

### Issue: Redirects not working
- [ ] Check middleware.ts configuration
- [ ] Verify route URLs in .env.local
- [ ] Check for typos in route paths
- [ ] Test with different browsers
- [ ] Review Next.js routing

### Issue: Webhooks not received
- [ ] Verify webhook URL is accessible
- [ ] Check webhook secret is correct
- [ ] Review webhook logs in Clerk Dashboard
- [ ] Test endpoint with curl
- [ ] Check server firewall settings

### Issue: Styling looks wrong
- [ ] Review clerkConfig appearance settings
- [ ] Check for CSS conflicts
- [ ] Inspect elements in browser dev tools
- [ ] Test with default Clerk styles
- [ ] Review Tailwind configuration

## Success Metrics

Track these metrics to measure success:

- [ ] Authentication success rate > 95%
- [ ] Sign-up completion rate
- [ ] Password reset success rate
- [ ] Average time to authenticate
- [ ] User satisfaction scores
- [ ] Security incident rate (0 is goal)
- [ ] Session duration metrics
- [ ] User retention rate

## Support Resources

- Clerk Documentation: https://clerk.com/docs
- Clerk Discord: https://clerk.com/discord
- GitHub Issues: https://github.com/clerkinc/javascript/issues
- Email Support: support@clerk.com (paid plans)

## Notes & Custom Requirements

Use this space to document custom requirements or modifications:

```
[Your notes here]
```

---

**Last Updated**: [Date]
**Completed By**: [Name]
**Status**: [ ] Not Started / [ ] In Progress / [ ] Complete
