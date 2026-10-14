/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// Recompiling for route registration
import { useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { loginSchema } from "@/zod/login.validation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LoginForm = () => {

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string } | null>(null);

  // No live gate on the submit button. A previous `isDraftValid`-style check
  // read the uncontrolled refs during render, and refs are not reactive: with
  // no errors yet, `onChange` returned the identical `null`, React bailed out
  // of the re-render, so the button stayed disabled forever and login was
  // impossible. handleLogin validates with the same schema and renders the
  // field errors, so the button stays enabled and the errors are the feedback.

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    const email = emailRef.current?.value || "";
    const password = passwordRef.current?.value || "";

    const result = loginSchema.safeParse({ Email: email, Password: password });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.Email?.[0],
        password: fieldErrors.Password?.[0],
      });
      return;
    }

    setLoading(true);
    try {
      toast.loading("Logging in...");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const apiResult = await response.json().catch(() => null);
      toast.dismiss();

      if (response.ok && apiResult?.success) {
        toast.success("Login successful!");
        window.location.href = "/welcome";
        return;
      }

      if (apiResult?.message) {
        toast.error(apiResult.message);
        return;
      }

      toast.error("Credential does not match or user does not exist");
    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">

      <div>
        <label>Email</label>
        <Input
          ref={emailRef}
          type="email"
          placeholder="your@gmail.com"
          onChange={() => setErrors((prev) => (prev ? { ...prev, email: undefined } : prev))}
        />
        {errors?.email && (
          <p className="text-red-500 text-sm">{errors.email}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium">Password</label>
          <Link href="/reset-password" className="text-xs font-semibold text-primary hover:underline">
            Forgot Password?
          </Link>
        </div>
        <Input
          ref={passwordRef}
          type="password"
          placeholder="••••••••"
          onChange={() => setErrors((prev) => (prev ? { ...prev, password: undefined } : prev))}
        />
        {errors?.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
      </div>

      <Button className="w-full" disabled={loading} type="submit">
        {loading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};

export default LoginForm;
