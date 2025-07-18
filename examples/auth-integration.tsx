/**
 * Example of how to integrate the AuthProvider into your app
 *
 * Add this to your root layout or a parent component
 */

import { AuthProvider } from "@/contexts/AuthContext";
import { AuthStatus } from "@/components/auth-status";

export default function AppWithAuth() {
  return (
    <AuthProvider>
      {/* Your app content */}
      <div>
        <h1>My Jellyfin App</h1>

        {/* Example auth status component */}
        <AuthStatus />

        {/* Your other components */}
      </div>
    </AuthProvider>
  );
}

/**
 * Example of using useAuth in any component
 */

import { useAuth } from "@/hooks/useAuth";

export function ExampleComponent() {
  const { user, serverUrl, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h2>Welcome {user?.Name}!</h2>
      <p>Connected to: {serverUrl}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

/**
 * Example of using useAuthContext (if you prefer context pattern)
 */

import { useAuthContext } from "@/contexts/AuthContext";

export function AnotherExampleComponent() {
  const { user, isAuthenticated } = useAuthContext();

  return (
    <div>
      {isAuthenticated ? (
        <span>Logged in as {user?.Name}</span>
      ) : (
        <span>Not logged in</span>
      )}
    </div>
  );
}
