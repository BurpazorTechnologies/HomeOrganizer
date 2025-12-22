<script setup>
import UserInfo from './UserInfo.vue';
import WelcomeHeader from './WelcomeHeader.vue';
</script>
<template>
    <WelcomeHeader />

    <UserInfo />

    <div>
        <h2>What is JWT?</h2>
        <div>
            JWT stands for JSON Web Token. It is a compact, URL-safe means of representing claims to be transferred between two parties.
            A JWT consists of three parts separated by dots (.), which are:
            1. Header - Contains metadata about the token (algorithm, type)
            2. Payload - Contains the claims (user data, expiration, etc.)
            3. Signature - Used to verify the token hasn't been tampered with
            Format: header.payload.signature (e.g., xxxxx.yyyyy.zzzzz)
        </div>
    </div>
    <div>
        <button>Generate JWT Token</button>
    </div>

    <div>
        <h2>JWT Structure Breakdown</h2>
        <div>
            Header Section:
            - Algorithm used for signing (e.g., HS256, RS256)
            - Token type (JWT)
            - This is Base64Url encoded
            
            Payload Section:
            - Claims about the user (sub, email, name, etc.)
            - Standard claims: iss (issuer), exp (expiration), iat (issued at), nbf (not before)
            - Custom claims: user_id, role, permissions
            - This is Base64Url encoded (NOT encrypted - anyone can decode it)
            
            Signature Section:
            - Created by taking the encoded header, encoded payload, a secret, and the algorithm specified in the header
            - Formula: HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
            - This ensures the token hasn't been tampered with
        </div>
    </div>

    <div>
        <h2>JWT Secret Key</h2>
        <div>
            IMPORTANT SECURITY NOTE: This is a private key used to sign and verify JWT tokens.
            In production and actual applications, this key is NEVER accessible client-side.
            It should only exist on the server and be kept secure in environment variables.
            We are showing it here for educational purposes only to understand how JWT signing works.
            
            JWT Secret Key: [Will be displayed here]
            Algorithm: HS256 (HMAC with SHA-256)
            Key Length: [Will show key length]
        </div>
    </div>

    <div>
        <h2>JWT Flow - Step by Step Demonstration</h2>
        <div>
            Step 1: User Login
            - User provides credentials (email and password)
            - Server validates credentials against database
            - If valid, server generates a JWT token
            
            Step 2: Token Generation
            - Server creates JWT header with algorithm and type
            - Server creates JWT payload with user claims (id, email, name, etc.)
            - Server signs the token using the secret key
            - Server returns the complete JWT token to the client
            
            Step 3: Token Storage
            - Client receives the JWT token
            - Token is stored in browser's localStorage or sessionStorage
            - localStorage persists across browser sessions
            - sessionStorage is cleared when browser tab is closed
            
            Step 4: Token Usage
            - Client includes JWT token in Authorization header for API requests
            - Format: Authorization: Bearer [JWT_TOKEN]
            - Server extracts token from header
            
            Step 5: Token Validation
            - Server verifies token signature using secret key
            - Server checks token expiration (exp claim)
            - Server validates token hasn't been tampered with
            - Server extracts user information from payload
            
            Step 6: Request Processing
            - If token is valid, server processes the request
            - If token is invalid or expired, server returns 401 Unauthorized
        </div>
    </div>

    <div>
        <h2>Token Generation Details</h2>
        <div>
            On logged in, a JWT token is generated and stored in the browser's localStorage.
            
            Raw JWT Token (will be displayed here):
            Format: xxxxx.yyyyy.zzzzz
            
            Decoded Header (will be displayed here):
            - Algorithm: HS256
            - Type: JWT
            
            Decoded Payload (will be displayed here):
            - User ID
            - Email
            - First Name
            - Last Name
            - Issued At (iat): timestamp
            - Expiration (exp): timestamp
            - Token Lifetime: 60 minutes (configurable)
            
            Token Expiration Details:
            - Created at: [timestamp]
            - Expires at: [timestamp]
            - Time remaining: [countdown]
        </div>
    </div>

    <div>
        <h2>JWT Algorithm - HS256</h2>
        <div>
            Our JWT token is generated using the HS256 algorithm (HMAC with SHA-256).
            
            Algorithm Details:
            - HS256 = HMAC (Hash-based Message Authentication Code) with SHA-256
            - Symmetric algorithm (same key used for signing and verification)
            - Fast and efficient for server-to-server communication
            - Key must be kept secret on the server
            
            How it works:
            1. Take the Base64Url encoded header
            2. Take the Base64Url encoded payload
            3. Concatenate them with a dot: header.payload
            4. Apply HMAC-SHA256 with the secret key
            5. Base64Url encode the result to create the signature
            
            Alternative Algorithms:
            - RS256: Asymmetric (public/private key pair) - more secure, slower
            - ES256: Elliptic curve cryptography - modern and secure
            - HS384/HS512: Stronger HMAC variants
        </div>
    </div>

    <div>
        <h2>Token Storage</h2>
        <div>
            Our JWT token is stored in the browser's localStorage.
            
            Storage Location: localStorage
            Storage Key: jwt_token (or similar)
            
            Why localStorage?
            - Persists across browser sessions
            - Available until explicitly removed
            - Survives page refreshes
            
            Alternative: sessionStorage
            - Cleared when browser tab is closed
            - More secure for sensitive applications
            - Better for temporary sessions
            
            Security Considerations:
            - localStorage is accessible to JavaScript (XSS vulnerability)
            - Never store sensitive data in JWT payload (it's Base64 encoded, not encrypted)
            - Use HTTPS to prevent token interception
            - Consider httpOnly cookies for better security (but requires CORS setup)
            
            Current Storage Status:
            - Token exists: [yes/no]
            - Storage location: [localStorage/sessionStorage]
            - Token key name: [key name]
        </div>
    </div>

    <div>
        <h2>Token Usage in API Requests</h2>
        <div>
            Our JWT token is used to authenticate API requests.
            
            How it's sent:
            - Included in the Authorization header
            - Format: Authorization: Bearer [JWT_TOKEN]
            - Example: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
            
            Request Flow:
            1. Client makes API request
            2. Client retrieves JWT from localStorage
            3. Client adds Authorization header with Bearer token
            4. Server receives request and extracts token
            5. Server validates token
            6. Server processes request if token is valid
            
            Example Request:
            GET /api/protected-endpoint
            Headers:
            - Authorization: Bearer [JWT_TOKEN]
            - Content-Type: application/json
            - Accept: application/json
            
            Console Logging:
            - All requests will be logged to browser console
            - Request headers will be visible
            - Response data will be logged
            - Check browser console (F12) to see detailed logs
        </div>
    </div>

    <div>
        <h2>Token Validation</h2>
        <div>
            Our JWT token is validated on the server side.
            
            Validation Process:
            1. Extract token from Authorization header
            2. Verify token format (three parts separated by dots)
            3. Decode header and payload (Base64Url decode)
            4. Verify signature using secret key
            5. Check expiration time (exp claim)
            6. Check issued at time (iat claim) if needed
            7. Validate custom claims (user_id, role, etc.)
            
            Validation Checks:
            - Signature valid: [yes/no]
            - Not expired: [yes/no]
            - Not tampered: [yes/no]
            - User exists: [yes/no]
            - User active: [yes/no]
            
            <button>Check Authentication</button>
            <div>
                Response will be displayed here:
                - Status: [200/401/403]
                - Message: [success/error message]
                - User data: [decoded user information]
                - Token valid: [true/false]
                - Time remaining: [minutes/seconds]
                
                Console Log:
                - Request URL: [endpoint]
                - Request Headers: [headers object]
                - Response Status: [status code]
                - Response Data: [response object]
            </div>
        </div>
    </div>

    <div>
        <h2>Token Refresh</h2>
        <div>
            Our JWT token can be refreshed on the server side.
            
            Why Refresh Tokens?
            - Extend session without requiring re-login
            - Security: shorter-lived access tokens
            - Better user experience: seamless authentication
            
            Refresh Flow:
            1. Client detects token is about to expire (or has expired)
            2. Client sends refresh request with current token
            3. Server validates current token (even if expired, within grace period)
            4. Server generates new JWT token with extended expiration
            5. Server returns new token to client
            6. Client replaces old token with new token in storage
            
            Refresh Token Strategy:
            - Access Token: Short-lived (15-60 minutes) - used for API requests
            - Refresh Token: Long-lived (7-30 days) - used only to get new access tokens
            - Refresh tokens stored securely (httpOnly cookie or secure storage)
            
            <button>Refresh Token</button>
            <div>
                Response will be displayed here:
                - New token: [new JWT token]
                - Old token: [previous token]
                - New expiration: [timestamp]
                - Time extended by: [minutes]
                
                Console Log:
                - Refresh request: [request details]
                - Old token expiration: [timestamp]
                - New token expiration: [timestamp]
                - Response: [response object]
            </div>
        </div>
    </div>

    <div>
        <h2>Token Invalidation</h2>
        <div>
            Our JWT token can be invalidated on the server side.
            
            Invalidation Methods:
            1. Token Blacklist: Server maintains list of invalidated tokens
            2. Token Expiration: Let token expire naturally
            3. Secret Key Rotation: Change secret key (invalidates all tokens)
            4. User Status Change: Mark user as inactive/deleted
            
            When to Invalidate:
            - User logs out
            - Security breach detected
            - Password changed
            - Account suspended/deleted
            - Suspicious activity detected
            
            Logout Flow:
            1. Client sends logout request with current token
            2. Server adds token to blacklist (if using blacklist strategy)
            3. Server returns success response
            4. Client removes token from localStorage
            5. Client redirects to login page
            
            <button>Invalidate Token</button>
            <div>
                Response will be displayed here:
                - Status: [success/error]
                - Message: [confirmation message]
                - Token blacklisted: [yes/no]
                - Token removed from storage: [yes/no]
                
                Console Log:
                - Invalidation request: [request details]
                - Token status: [invalidated/removed]
                - Response: [response object]
            </div>
        </div>
    </div>

    <div>
        <h2>JWT Security Best Practices</h2>
        <div>
            Security Considerations:
            
            1. Secret Key Management:
            - Never expose secret key to client-side code
            - Use strong, randomly generated keys (minimum 256 bits)
            - Rotate keys periodically
            - Store keys in environment variables
            
            2. Token Storage:
            - localStorage: Convenient but vulnerable to XSS
            - sessionStorage: Better for temporary sessions
            - httpOnly Cookies: Most secure (prevents XSS access)
            - Memory: Most secure but lost on page refresh
            
            3. Token Expiration:
            - Use short expiration times (15-60 minutes for access tokens)
            - Implement refresh token mechanism
            - Check expiration on every request
            
            4. HTTPS:
            - Always use HTTPS in production
            - Prevents token interception (man-in-the-middle attacks)
            - Required for secure cookie transmission
            
            5. Token Payload:
            - Don't store sensitive data (passwords, credit cards)
            - Keep payload small (affects request size)
            - Use standard claims when possible
            
            6. Validation:
            - Always validate signature
            - Always check expiration
            - Validate all claims
            - Verify user still exists and is active
            
            7. Token Transmission:
            - Use Authorization header (not URL parameters)
            - Avoid logging tokens in production
            - Implement token rotation
            
            8. Error Handling:
            - Don't reveal token validation details in error messages
            - Use generic error messages for security
            - Log security events server-side
        </div>
    </div>

    <div>
        <h2>JWT vs Other Authentication Methods</h2>
        <div>
            JWT vs Session Cookies:
            - JWT: Stateless, scalable, works across domains
            - Sessions: Stateful, requires server storage, simpler revocation
            
            JWT vs OAuth:
            - JWT: Token format/standard
            - OAuth: Authorization framework (often uses JWT)
            
            JWT vs API Keys:
            - JWT: Contains user info, expires, can be validated
            - API Keys: Simple but less secure, no expiration built-in
            
            When to Use JWT:
            - Microservices architecture
            - Mobile applications
            - Single Page Applications (SPAs)
            - Stateless API authentication
            - Cross-domain authentication
            
            When NOT to Use JWT:
            - Simple server-rendered applications
            - When immediate revocation is critical
            - When token size is a concern
            - When you need server-side session management
        </div>
    </div>

    <div>
        <h2>Console Logging</h2>
        <div>
            All JWT operations will be logged to the browser console for learning purposes.
            
            What Gets Logged:
            - Token generation: Request and response
            - Token validation: Request headers, validation steps, response
            - Token refresh: Old token, new token, expiration times
            - Token invalidation: Request, blacklist status, response
            - API requests: Full request/response cycle
            - Token decoding: Header, payload, signature verification
            
            How to View Logs:
            1. Open browser developer tools (F12 or Right-click > Inspect)
            2. Go to Console tab
            3. Look for logs prefixed with [JWT Lab]
            4. Expand objects to see detailed information
            
            Log Format:
            [JWT Lab] Operation: [operation name]
            [JWT Lab] Request: { method, url, headers, body }
            [JWT Lab] Response: { status, data, headers }
            [JWT Lab] Token Info: { raw, decoded, expiration }
            
            Note: In production, sensitive information should NOT be logged to console.
            This is for educational purposes only.
        </div>
    </div>

    <div>
        <h2>Additional Learning Resources</h2>
        <div>
            Key Concepts to Understand:
            
            1. Base64Url Encoding:
            - Similar to Base64 but URL-safe
            - Replaces + with -, / with _, removes padding =
            - Used for JWT header and payload encoding
            
            2. HMAC (Hash-based Message Authentication Code):
            - Cryptographic function for message authentication
            - Combines secret key with message
            - Produces fixed-size hash output
            - Used in HS256 algorithm
            
            3. Claims:
            - Registered claims: Standard JWT claims (iss, exp, iat, etc.)
            - Public claims: Custom claims with collision-resistant names
            - Private claims: Application-specific claims
            
            4. Token Lifecycle:
            - Generation: Created on login
            - Storage: Saved client-side
            - Transmission: Sent with requests
            - Validation: Verified server-side
            - Refresh: Extended when needed
            - Invalidation: Removed on logout
            
            5. Stateless Authentication:
            - Server doesn't store session data
            - All information in token
            - Scalable across multiple servers
            - No database lookup needed for validation
            
            Useful Tools:
            - jwt.io: Online JWT decoder and debugger
            - Browser DevTools: Inspect network requests and console logs
            - Postman: Test API endpoints with JWT tokens
            
            Common JWT Libraries:
            - PHP: firebase/php-jwt
            - JavaScript: jsonwebtoken, jose
            - Python: PyJWT
            - Java: java-jwt
        </div>
    </div>
</template>

<style scoped>

</style>