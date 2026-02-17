import { useState, useEffect, useRef } from "react";
import logo from "../../../public/img/Logo/HomelyHope.png";

import {
  Input,
  Button,
  Typography,
} from "@material-tailwind/react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { EnvelopeIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/dashboard/home");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Hide asterisks inside input fields (only in input containers, not labels)
  useEffect(() => {
    if (authLoading) return; // Don't run while loading

    const hideAsterisks = () => {
      // Only target containers that have input fields
      const form = document.querySelector('form');
      if (!form) return;

      // Find input containers specifically
      const inputContainers = form.querySelectorAll('.relative');
      inputContainers.forEach(container => {
        // Only process if it contains an input element
        const input = container.querySelector('input');
        if (!input) return;

        // Find spans that contain only asterisks (not the input itself)
        const spans = container.querySelectorAll('span');
        spans.forEach(span => {
          const text = span.textContent?.trim();
          // Check if it's an asterisk and not part of a label
          if ((text === '*' || text === '∗') && !span.closest('label')) {
            // Make sure it's not the label asterisk (which should be visible)
            const isLabelAsterisk = span.closest('div')?.previousElementSibling?.querySelector('.text-red-500');
            if (!isLabelAsterisk) {
              span.style.display = 'none';
              span.style.visibility = 'hidden';
            }
          }
        });

        // Also hide any red asterisks inside the input container (but not in labels)
        const redSpans = container.querySelectorAll('span.text-red-500, span[class*="red"]');
        redSpans.forEach(span => {
          const text = span.textContent?.trim();
          if ((text === '*' || text === '∗') && !span.closest('label')) {
            // Check if it's inside the input wrapper, not the label
            const inputWrapper = container.querySelector('div[class*="input"]');
            if (inputWrapper && inputWrapper.contains(span)) {
              span.style.display = 'none';
              span.style.visibility = 'hidden';
            }
          }
        });
      });
    };

    // Run after component mounts and inputs are rendered
    const timer1 = setTimeout(hideAsterisks, 100);
    const timer2 = setTimeout(hideAsterisks, 300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [authLoading]); // Run when authLoading changes

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate("/dashboard/home");
      } else {
        setError(result.message || "Invalid credentials");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-50 to-amber-100 relative overflow-hidden">
        <img
          src="/img/SignIn.png"
          alt="Login"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Side - Form */}
      <div className="
      w-full lg:w-1/2
      flex items-center justify-center
      min-h-screen
      p-4 sm:p-6 md:p-8 lg:p-12
      bg-white
    ">

        <div className="w-full max-w-md">
          {/* Logo/Branding */}
          <div className="flex justify-center items-center">
            <img src={logo} alt="Logo" className="w-32 h-32" />
          </div>

          <div className="app-title">
            <Typography variant="h2" className="font-bold text-blue-gray-900 mb-2 text-center">
              Another Second Chance
            </Typography>
          </div>
          <div className="text-center mb-8">
            <Typography variant="h4" className="font-bold text-blue-gray-900 mb-2">
              LOGIN
            </Typography>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                Email <span className="text-red-500">*</span>
              </Typography>
              <div className="relative">
                <Input
                  ref={emailInputRef}
                  type="email"
                  size="lg"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="!border-t-blue-gray-200 focus:!border-t-gray-900 pl-10"
                  labelProps={{
                    className: "before:content-none after:content-none",
                  }}
                  containerProps={{
                    className: "[&_span.text-red-500]:hidden [&_span]:has-text('*'):hidden"
                  }}
                  required
                />
                <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                Password <span className="text-red-500">*</span>
              </Typography>
              <div className="relative">
                <Input
                  ref={passwordInputRef}
                  type={showPassword ? "text" : "password"}
                  size="lg"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="!border-t-blue-gray-200 focus:!border-t-gray-900 !pr-12"
                  labelProps={{
                    className: "before:content-none after:content-none",
                  }}
                  containerProps={{
                    className: "[&_span.text-red-500]:hidden [&_span]:has-text('*'):hidden"
                  }}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded z-10"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}



            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full mt-6"
              size="lg"
              disabled={loading}
            >
              {loading ? "Signing In..." : "SUBMIT"}
            </Button>

            {/* Terms & Conditions */}
            {/* <Typography variant="small" color="gray" className="text-center mt-4">
              By logging in, you agree to our{" "}
              <Link to="#" className="text-blue-600 hover:underline">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link to="#" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </Typography> */}
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
