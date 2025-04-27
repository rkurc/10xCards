# Security Best Practices for 10xCards Authentication

## Using Supabase Auth Securely

### Auth Data Verification

When using Supabase Auth, always verify user authentication status with the server using `getUser()` instead of relying solely on session data from local storage or cookies. This is critical for security-sensitive operations.

```typescript
// ❌ INSECURE: Don't rely only on session data for security decisions
const { data } = await supabase.auth.getSession();
if (data.session) {
  // DON'T make security decisions based only on session existence
}

// ✅ SECURE: Verify with the auth server
const { data: { user }, error } = await supabase.auth.getUser();
if (user) {
  // User is authenticated and verified with the server
}
```

### When to Use Each Method

1. `getUser()`: Use for:
   - Protecting routes/resources
   - Authorization checks
   - Any security decisions
   - Server-side authentication verification

2. `getSession()`: Appropriate for:
   - Checking session status for UI purposes
   - Getting refresh/access tokens
   - Getting session metadata

3. `onAuthStateChange`: Use for:
   - UI updates based on auth state
   - But verify with `getUser()` before granting access to protected resources

### Best Practices

1. Always use the Supabase SSR helpers for server-side authentication
2. Implement proper CSRF protection
3. Use HTTP-only cookies for storing authentication tokens
4. Validate user permissions server-side for all protected operations
5. Never trust client-side authentication state for security decisions

Remember that the client is in the user's control and can be manipulated. Always verify authentication server-side before providing access to protected resources or data.
