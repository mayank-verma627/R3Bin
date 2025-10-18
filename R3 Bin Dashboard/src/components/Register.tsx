// components/Register.tsx
import { useState } from "react";
import { supabase } from "./supabase";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      console.log("🔄 Starting Google OAuth...");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        console.error("❌ Google OAuth error:", error);
        setError(error.message);
      } else {
        console.log("✅ Google OAuth started successfully");
      }
    } catch (err: any) {
      console.error("❌ Failed to sign in with Google:", err);
      setError("Failed to sign in with Google");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!name.trim()) {
      setError("Please enter your name");
      setLoading(false);
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number");
      setLoading(false);
      return;
    }

    try {
      console.log("🔄 Starting registration for:", email);
      
      // 1. Create the auth user WITH email verification
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            phone: phone,
          },
          emailRedirectTo: `${window.location.origin}/email-verified`
        }
      });

      // ============ CRITICAL DEBUGGING SECTION ============
      console.log("📊 Registration Response:", {
        user: authData?.user,
        session: authData?.session,
        emailConfirmedAt: authData?.user?.email_confirmed_at,
        identities: authData?.user?.identities,
        error: authError
      });

      // CHECK 1: Is there an error?
      if (authError) {
        console.error("❌ Registration error:", authError);
        setError(authError.message);
        setLoading(false);
        return;
      }

      // CHECK 2: Does user have a session immediately? (SHOULD BE NULL)
      if (authData?.session) {
        console.warn("⚠️⚠️⚠️ PROBLEM DETECTED: User has a session immediately!");
        console.warn("This means user is auto-confirmed. Check Supabase settings:");
        console.warn("1. Auth → Providers → Email → 'Enable email auto-confirm' should be OFF");
        console.warn("2. Auth → Providers → Email → 'Confirm email' should be ON");
      } else {
        console.log("✅ Good: No session returned (user needs to verify email)");
      }

      // CHECK 3: Is email already confirmed? (SHOULD BE NULL)
      if (authData?.user?.email_confirmed_at) {
        console.warn("⚠️⚠️⚠️ PROBLEM: email_confirmed_at is already set!");
        console.warn("Email confirmed at:", authData.user.email_confirmed_at);
        console.warn("This means auto-confirm is ON in Supabase");
      } else {
        console.log("✅ Good: email_confirmed_at is null (not yet verified)");
      }

      // CHECK 4: Check user identities
      console.log("🔍 User identities:", authData?.user?.identities);

      if (authData.user) {
        console.log("✅ User created successfully:", authData.user.id);
        console.log("📧 User should receive verification email at:", email);
        
        setSuccess(true);
        
        // Log success but warn if something is wrong
        if (authData.session || authData.user.email_confirmed_at) {
          setError("⚠️ Account created BUT email might not require verification. Check console logs!");
        }
      }
    } catch (err: any) {
      console.error("❌ Unexpected error:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    window.location.href = '/';
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md mx-4"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Account</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-300 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            ✅ Check your email for verification link! You must verify your email before logging in.
            <div className="mt-2 text-xs text-gray-600">
              📱 Check console (F12) for debugging info
            </div>
          </div>
        )}

        {/* Google Sign Up Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading || success}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 disabled:bg-gray-100 transition-all duration-300 font-semibold text-lg shadow-sm hover:shadow-md disabled:shadow-none mb-6 flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign up with Google
        </button>

        {/* Divider */}
        <div className="flex items-center mb-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <div className="px-3 text-gray-500 text-sm">or</div>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Name Field */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg"
            required
            disabled={loading || success}
          />
        </div>

        {/* Email Field */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email Address
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg"
            required
            disabled={loading || success}
          />
        </div>

        {/* Phone Field */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg"
            required
            disabled={loading || success}
          />
        </div>

        {/* Password Field */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            placeholder="Enter password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 text-lg"
            required
            minLength={6}
            disabled={loading || success}
          />
        </div>

        {/* Confirm Password Field */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200 text-lg ${
              confirmPassword && password !== confirmPassword 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
                : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'
            }`}
            required
            minLength={6}
            disabled={loading || success}
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-red-600 text-sm mt-2 font-medium">⚠️ Passwords do not match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl disabled:shadow-none"
        >
          {loading ? "Creating Account..." : success ? "Check Your Email! 📧" : "Create Account"}
        </button>
        
        <p className="mt-6 text-base text-center text-gray-600">
          Already have an account?{" "}
          <span 
            onClick={goToLogin}
            className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer font-bold transition-colors duration-200"
          >
            Sign In
          </span>
        </p>
      </form>
    </div>
  );
}