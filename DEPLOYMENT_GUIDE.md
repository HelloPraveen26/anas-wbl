# Deployment and Testing Guide - Credits Refresh Solution

## Overview

This guide covers the deployment and testing of the client-side credits refresh solution that automatically updates user credit balances after successful payments without requiring page refreshes or re-authentication.

## Quick Summary

The solution automatically detects when users return from PayU payments and refreshes their credit balance in real-time. It includes manual refresh options, toast notifications, and comprehensive error handling.

## Files Added/Modified

### New Files Created:
- `src/hooks/useUserRefresh.ts` - Core user data refresh functionality
- `src/hooks/usePaymentCallback.ts` - Payment callback detection (optional)
- `src/hooks/useToast.ts` - Toast notification system
- `src/components/Toast.tsx` - Toast UI component
- `src/components/PaymentCallbackHandler.tsx` - Payment detection component
- `src/components/ui/badge.tsx` - Badge UI component
- `src/app/dashboard/credits-test/page.tsx` - Test page for functionality
- `CREDITS_REFRESH_SOLUTION.md` - Technical documentation

### Modified Files:
- `src/app/dashboard/layout.tsx` - Added payment detection and refresh buttons
- `src/components/BuyCreditsDialog.tsx` - Added payment initiated callback

## Deployment Steps

### 1. Pre-deployment Checklist

```bash
# Verify build passes
cd client
npm run build

# Check for TypeScript errors
npm run type-check

# Run tests if available
npm test
```

### 2. Environment Variables

Ensure these environment variables are properly set:

```bash
# Development
NODE_ENV=development
# Uses http://localhost:8000/api/v1 automatically

# Production
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://voice.zenxai.io/api/v1
```

### 3. Deployment Process

The solution is entirely client-side, so no server changes are required:

```bash
# Standard Next.js deployment
npm run build
npm start

# Or deploy to your platform (Vercel, Netlify, etc.)
```

## Testing Guide

### 1. Automated Testing

Navigate to the test page: `/dashboard/credits-test`

**Test Functions Available:**
- View current user data and credits
- Manual refresh button test
- Simulate payment return
- Test toast notifications

### 2. End-to-End Payment Testing

#### Development Environment:
1. Login to dashboard
2. Note current credit balance
3. Click "Buy Credits" 
4. Enter test amount (e.g., ₹100)
5. Complete PayU test payment
6. Verify automatic credit update upon return
7. Check for success toast notification

#### Production Environment:
1. Use small test amounts (₹1-10)
2. Test with real PayU payments
3. Verify credits update automatically
4. Test manual refresh functionality

### 3. Manual Testing Scenarios

#### Scenario 1: Successful Payment Flow
```
1. User starts with 0 credits
2. Purchases ₹100 worth of credits
3. Completes PayU payment
4. Returns to dashboard
5. EXPECTED: Credits show 100, success toast appears
```

#### Scenario 2: Manual Refresh
```
1. User is on dashboard
2. Admin manually adds credits via backend
3. User clicks refresh button (🔄) next to credits
4. EXPECTED: Credits update to new amount
```

#### Scenario 3: Payment Failure
```
1. User initiates payment
2. Cancels or fails payment on PayU
3. Returns to dashboard
4. EXPECTED: Credits unchanged, no success toast
```

#### Scenario 4: Network Issues
```
1. User returns from payment
2. API call fails due to network issues
3. EXPECTED: Error logged to console, manual refresh still works
```

### 4. Browser Testing

Test across different browsers:
- Chrome (latest)
- Firefox (latest) 
- Safari (latest)
- Edge (latest)

**Key areas to test:**
- localStorage functionality
- URL parameter detection
- Toast notifications
- Manual refresh buttons

### 5. Mobile Testing

Test on mobile devices:
- iOS Safari
- Android Chrome
- Responsive design of toast notifications
- Touch interaction with refresh buttons

## Monitoring and Debugging

### 1. Browser Console Logs

Look for these log messages:

```javascript
// Successful payment detection
"Payment callback detected, refreshing user data..."

// Successful refresh
"User data refreshed, new credits: 150"

// API call details
"✅ API request successful: {data}"

// Error cases
"Failed to refresh user data: [error details]"
```

### 2. Network Tab Monitoring

Monitor these API calls:
- `GET /api/v1/auth/profile` - Should be called after payment return
- Response should include updated credits

### 3. LocalStorage Inspection

Check browser localStorage:
```javascript
// Check stored user data
localStorage.getItem('user')

// Check auth token
localStorage.getItem('authToken')
```

### 4. Common Issues and Solutions

#### Issue: Credits not updating after payment
**Debug Steps:**
1. Check browser console for errors
2. Verify payment parameters in URL
3. Check network tab for API calls
4. Try manual refresh
5. Verify server updated credits in database

#### Issue: Toast notifications not appearing
**Debug Steps:**
1. Check if ToastContainer is rendered
2. Verify no CSS conflicts with z-index
3. Check browser console for JavaScript errors
4. Test with browser dev tools open

#### Issue: Manual refresh not working
**Debug Steps:**
1. Check network connectivity
2. Verify API endpoint is accessible
3. Check JWT token validity
4. Review server logs for errors

## Performance Considerations

### 1. Optimization Features
- Debounced refresh calls prevent multiple simultaneous requests
- Minimal API calls (only when necessary)
- Efficient state updates
- Proper cleanup of timeouts and listeners

### 2. Load Testing
Test with multiple users:
- Multiple concurrent payments
- Rapid refresh button clicks
- Network timeout scenarios

## Security Considerations

### 1. Token Validation
- JWT tokens are validated before API calls
- Expired tokens are automatically cleared
- Invalid tokens trigger re-authentication

### 2. Error Handling
- Sensitive error details are not exposed to users
- Server errors are logged but not displayed
- Network errors show user-friendly messages

## Rollback Plan

If issues occur, the solution can be easily rolled back:

### 1. Quick Rollback
Remove or comment out these components:
```typescript
// In dashboard/layout.tsx
{/* <PaymentCallbackHandler user={user} onUserUpdate={setUser} /> */}

// Remove refresh buttons from credits cards
```

### 2. Full Rollback
Revert these files to their previous versions:
- `src/app/dashboard/layout.tsx`
- `src/components/BuyCreditsDialog.tsx`

The solution is non-breaking, so partial rollbacks are safe.

## Production Monitoring

### 1. Metrics to Track
- Payment success rate
- Credit update success rate
- API call response times
- Error rates

### 2. Alerts to Set Up
- High error rates from `/auth/profile` endpoint
- Unusual patterns in payment callbacks
- JavaScript errors related to credit refresh

### 3. User Feedback
Monitor for:
- Support tickets about credits not updating
- User reports of payment issues
- Complaints about UI responsiveness

## Maintenance

### 1. Regular Tasks
- Monitor browser console logs in production
- Review API response times
- Check for any new payment parameter formats from PayU
- Update toast message text as needed

### 2. Updates and Improvements
- Consider adding real-time WebSocket updates
- Implement retry mechanisms for failed refreshes
- Add analytics tracking for payment flows
- Optimize toast notification timing

## Support and Troubleshooting

### 1. User Support
For users reporting credit issues:
1. Ask them to try manual refresh first
2. Check server logs for their user ID
3. Verify payment was processed on PayU side
4. Manual credit adjustment if needed

### 2. Developer Support
For development team:
1. Review browser console logs
2. Check network requests in dev tools
3. Verify API endpoint responses
4. Test with different payment scenarios

## Success Criteria

The deployment is successful when:
- ✅ Credits update automatically after payment (within 5 seconds)
- ✅ Manual refresh works consistently
- ✅ Toast notifications appear appropriately
- ✅ No breaking changes to existing functionality
- ✅ Build process completes without errors
- ✅ Cross-browser compatibility confirmed
- ✅ Mobile responsiveness verified

## Contact and Support

For technical issues or questions about this solution:
1. Check the technical documentation: `CREDITS_REFRESH_SOLUTION.md`
2. Use the test page: `/dashboard/credits-test`
3. Review browser console logs
4. Check API endpoint functionality

This solution provides a robust, user-friendly way to keep credit balances synchronized in real-time while maintaining backward compatibility and requiring no server-side changes.