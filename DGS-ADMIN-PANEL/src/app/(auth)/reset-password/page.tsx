/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Clock, Eye, EyeOff } from "lucide-react";
import { requestReset, verifyReset, submitReset } from "@/services/auth/auth.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type Step = "REQUEST" | "VERIFY" | "SUBMIT";

const OTP_EXPIRY_SECONDS = 5 * 60; // 5 minutes

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("REQUEST");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRY_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const identifierRef = useRef<HTMLInputElement>(null);
  const otpRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Start/reset countdown when moving to VERIFY step
  useEffect(() => {
    if (step === "VERIFY") {
      setTimeLeft(OTP_EXPIRY_SECONDS);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const idVal = identifierRef.current?.value.trim() || "";
    if (!idVal) {
      toast.error("Please enter your email or mobile number");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Sending OTP...");
    try {
      const res = await requestReset({ identifier: idVal });
      toast.dismiss(toastId);
      if (res.success) {
        toast.success(res.message || "OTP sent successfully");
        setIdentifier(idVal);
        setStep("VERIFY");
      } else {
        toast.error(res.message || "Failed to send OTP");
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timeLeft === 0) {
      toast.error("OTP has expired. Please request a new one.");
      setStep("REQUEST");
      return;
    }
    const otpVal = otpRef.current?.value.trim() || "";
    if (!otpVal) {
      toast.error("Please enter the OTP code");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Verifying OTP...");
    try {
      const res = await verifyReset({ identifier, otp: otpVal });
      toast.dismiss(toastId);
      if (res.success) {
        toast.success(res.message || "OTP verified successfully");
        setOtp(otpVal);
        setStep("SUBMIT");
      } else {
        toast.error(res.message || "Invalid OTP code");
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const passwordVal = passwordRef.current?.value || "";
    if (passwordVal.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating your password...");
    try {
      const res = await submitReset({ identifier, otp, password: passwordVal });
      toast.dismiss(toastId);
      if (res.success) {
        toast.success("Password updated successfully!");
        router.push("/login");
      } else {
        toast.error(res.message || "Failed to update password");
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-start">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Login
        </Link>
      </div>

      <Card className="border shadow-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {step === "REQUEST" && "Reset Password"}
            {step === "VERIFY" && "Verify OTP"}
            {step === "SUBMIT" && "Create Password"}
          </CardTitle>
          <CardDescription className="text-xs">
            {step === "REQUEST" && "Enter your registered email address to receive a verification OTP."}
            {step === "VERIFY" && `We've sent a 4-digit OTP code to ${identifier}.`}
            {step === "SUBMIT" && "Enter your new secure login password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "REQUEST" && (
            <form onSubmit={handleRequest} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="identifier" className="text-xs font-medium uppercase tracking-tight text-slate-700">
                  Email Address
                </Label>
                <Input
                  id="identifier"
                  type="email"
                  ref={identifierRef}
                  placeholder="admin@milanova-tech.com"
                  className="h-10"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-white shadow-xs h-10"
              >
                {loading ? "Sending..." : "Send Verification OTP"}
              </Button>
            </form>
          )}

          {step === "VERIFY" && (
            <form onSubmit={handleVerify} className="space-y-4">
              {/* Countdown Timer */}
              <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold tracking-wider ${timeLeft === 0
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : timeLeft <= 60
                    ? "bg-amber-50 text-amber-600 border border-amber-200"
                    : "bg-muted text-muted-foreground border"
                }`}>
                <Clock className="w-3.5 h-3.5" />
                {timeLeft === 0
                  ? "OTP Expired — request a new one"
                  : `OTP expires in ${formatTime(timeLeft)}`}
              </div>

              <div className="space-y-1">
                <Label htmlFor="otp" className="text-xs font-medium uppercase tracking-tight text-gray-700">OTP Code</Label>
                <Input
                  id="otp"
                  ref={otpRef}
                  placeholder="Enter 4-digit code"
                  maxLength={4}
                  disabled={timeLeft === 0}
                  className="h-10 text-center tracking-widest text-lg font-bold"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || timeLeft === 0}
                className="w-full bg-primary hover:bg-primary-hover text-white shadow-xs h-10 disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP Code"}
              </Button>
              <button
                type="button"
                onClick={() => setStep("REQUEST")}
                className="w-full text-center text-xs text-muted-foreground hover:text-primary transition-colors font-bold uppercase tracking-wider text-[10px]"
              >
                {timeLeft === 0 ? "Request New OTP" : "Change email"}
              </button>
            </form>
          )}

          {step === "SUBMIT" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="password" className="text-xs font-medium uppercase tracking-tight text-slate-700">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    ref={passwordRef}
                    placeholder="••••••••"
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-hover text-white shadow-xs h-10"
              >
                {loading ? "Submitting..." : "Update Password"}
              </Button>
            </form>
          )}

          <div className="text-center text-xs text-muted-foreground mt-4">
            Remember your password?{" "}
            <Link
              href="/login"
              className="font-bold text-primary hover:underline"
            >
              Sign In
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
