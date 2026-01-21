# Credits Refresh Solution

## Problem Statement

The application was displaying user credits from a JWT token stored in localStorage. When users purchased credits through PayU payment gateway, the payment was processed successfully on the server-side and credits were updated in the database, but the client-side UI still showed the old credit amount until the user logged in again (which refreshed the JWT token).

## Solution Overview

This solution implements a comprehensive client-side credits refresh system that automatically detects payment returns and updates the user's credit balance in real-time without requiring a page refresh or re-login.

## Architecture

### 1. Hooks-Based Architecture

- **useUserRefresh**: Core hook for refreshing user data from the server
- **usePaymentCallback**: Detects payment returns and triggers automatic refresh
- **useToast**: Provides user feedback through toast notifications

### 2. Components

- **ToastContainer**: Displays notification messages
- **Enhanced BuyCreditsDialog**: Integrated with the refresh system
- **Updated Dashboard Layout**: Auto-detects payment callbacks

## Implementation Details

### Files Created/Modified

#### New Files:
- `src/hooks/useUserRefresh.ts` - User data refresh functionality
- `src/hooks/usePaymentCallback.ts` - Payment callback detection
- `src/hooks/useToast.ts` - Toast notification system
- `src/components/Toast.tsx` - Toast UI component
- `src/components/ui/badge.tsx` - Badge component for UI
- `src/app/dashboard/credits-test/page.tsx` - Test page for the functionality

#### Modified Files:
- `src/app/dashboard/layout.tsx` - Added payment detection and refresh buttons
- `src/components/BuyCreditsDialog.tsx` - Added payment initiated callback

### Key Features

#### 1. Automatic Payment Detection
```typescript
// Detects payment returns via URL parameters
const txnid = searchParams.get('txnid');
const status = searchParams.get('status');
const mihpayid = searchParams.get('mihpayid');
const paymentParam = searchParams.get('payment');
```

#### 2. Real-time Credits Update
```typescript
// Automatically refreshes user data after payment
setTimeout(async () => {
  const result = await refreshUser();
  if (result.success && result.user) {
    setUser(result.user);
    // Show success notification
  }
}, 2000);
```

#### 3. Manual Refresh Option
Users can manually refresh their credits using the refresh button in the sidebar.

#### 4. Toast Notifications
Provides immediate feedback to users about payment status and credit updates.

## How It Works

### Payment Flow

1. **User Initiates Payment**
   - Clicks "Buy Credits" in the dashboard
   - Fills out the payment amount
   - Gets redirected to PayU payment gateway

2. **Payment Processing**
   - User completes payment on PayU
   - PayU sends webhook to server (`/api/v1/payment/success`)
   - Server updates user credits in database
   - Server redirects user back to dashboard with payment parameters

3. **Automatic Refresh**
   - Dashboard detects payment parameters in URL
   - Shows "Processing payment..." toast
   - Waits 2 seconds for server processing to complete
   - Calls `/api/v1/auth/profile` to get fresh user data
   - Updates localStorage and component state
   - Shows success toast with credit amount

4. **UI Update**
   - Credits display updates immediately
   - User sees new balance without page refresh
   - Toast notification confirms the update

### Manual Refresh

Users can click the refresh icon (🔄) next to their credits to manually trigger a refresh at any time.

## Testing

### Using the Test Page

Navigate to `/dashboard/credits-test` to test the functionality:

1. **View Current User Data**: See current credits and user information
2. **Manual Refresh**: Test the refresh functionality
3. **Simulate Payment Return**: Simulate returning from PayU with payment parameters
4. **Test Notifications**: See how toast notifications work

### Manual Testing

1. **Complete Payment Flow**:
   - Go to dashboard
   - Click "Buy Credits"
   - Enter amount and proceed to PayU (test mode)
   - Complete payment
   - Return to dashboard
   - Verify credits are updated automatically

2. **Manual Refresh**:
   - Click the refresh button next to credits
   - Verify credits update if server has newer data

## Error Handling

- **Network Errors**: Gracefully handles API failures
- **Invalid Tokens**: Detects expired/invalid JWT tokens
- **Server Errors**: Shows appropriate error messages
- **Timeout Issues**: Retries with exponential backoff

## Performance Considerations

- **Minimal API Calls**: Only refreshes when necessary
- **Debounced Requests**: Prevents multiple simultaneous refresh calls
- **Efficient State Updates**: Updates only changed data
- **Memory Management**: Proper cleanup of timeouts and event listeners

## Security

- **Token Validation**: Validates JWT tokens before making API calls
- **Secure Storage**: Updates localStorage securely
- **Error Masking**: Doesn't expose sensitive error details to users

## Browser Compatibility

- **Modern Browsers**: Works with all modern browsers
- **URL API**: Uses standard URLSearchParams API
- **Fetch API**: Uses native fetch with proper error handling
- **LocalStorage**: Safely handles localStorage availability

## Monitoring & Debugging

### Console Logs
The solution includes comprehensive logging:
```
Payment callback detected: {txnid: "...", status: "success"}
User data refreshed, new credits: 150
```

### Debug Information
- Payment detection logs
- API call success/failure logs
- User data update logs
- Error details with context

## Deployment Notes

### Environment Variables
Ensure these environment variables are set:
- `NEXT_PUBLIC_API_URL` - Production API URL
- Development automatically uses `http://localhost:8000/api/v1`

### Server-Side Requirements
The solution works with the existing server endpoints:
- `POST /api/v1/payment/create-payment` - Create payment
- `POST /api/v1/payment/success` - Payment success webhook
- `GET /api/v1/auth/profile` - Get user profile

## Optional Enhancements

### Server-Side Improvements (Optional)
To make the solution even more robust, consider these server-side enhancements:

```typescript
// Add payment status to redirect URL
return `${appBaseUrl}/dashboard/assistants?payment=success&txnid=${body.txnid}&amount=${body.amount}`;
```

### Real-time Updates (Future)
For real-time updates across multiple tabs/devices:
- WebSocket connections for instant notifications
- Server-Sent Events (SSE) for credit updates
- Push notifications for mobile apps

## Troubleshooting

### Common Issues

1. **Credits Not Updating**
   - Check browser console for errors
   - Verify API endpoints are accessible
   - Check JWT token validity
   - Try manual refresh

2. **Payment Detection Not Working**
   - Verify PayU redirect URLs include parameters
   - Check server-side redirect implementation
   - Ensure URL parameters are preserved

3. **Toast Notifications Not Showing**
   - Check ToastContainer is rendered
   - Verify toast hook is properly imported
   - Check for CSS conflicts

### Debug Steps

1. Open browser developer tools
2. Check Console tab for error messages
3. Check Network tab for API calls
4. Verify localStorage content
5. Test manual refresh functionality

## Conclusion

This solution provides a robust, user-friendly way to keep credit balances synchronized without requiring page refreshes or re-authentication. It handles edge cases gracefully and provides clear feedback to users about their payment status and credit updates.

The implementation is entirely client-side, requiring no changes to the existing server-side payment processing logic, making it a safe and easy upgrade to deploy.