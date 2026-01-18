/**
 * Email to Wallet Onboarding Component
 * Guides users through email verification → wallet creation → account setup
 */

'use client';

import React, { useState, useEffect } from 'react';
import { EmailToWalletProvider } from '@/lib/emailToWalletProvider';
import type { SmartWalletAccount, OnboardingProgress } from '@/lib/emailToWalletProvider';

interface OnboardingStep {
  step: number;
  title: string;
  description: string;
}

interface FormState {
  email: string;
  verificationCode: string;
  displayName: string;
  agreeToTerms: boolean;
  error: string;
  success: string;
  loading: boolean;
}

export const EmailToWalletOnboarding: React.FC<{ onComplete?: (account: SmartWalletAccount) => void }> = ({
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formState, setFormState] = useState<FormState>({
    email: '',
    verificationCode: '',
    displayName: '',
    agreeToTerms: false,
    error: '',
    success: '',
    loading: false,
  } as FormState);
  const [account, setAccount] = useState<SmartWalletAccount | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  const provider = EmailToWalletProvider.getInstance();

  const steps: OnboardingStep[] = [
    { step: 1, title: 'Email Entry', description: 'Enter your email address' },
    { step: 2, title: 'Email Verification', description: 'Verify your email with the code we sent' },
    { step: 3, title: 'Wallet Creation', description: 'Your smart wallet is being created on Base' },
    { step: 4, title: 'Profile Setup', description: 'Customize your account' },
    { step: 5, title: 'Complete', description: 'Your account is ready!' },
  ];

  // Countdown timer for verification code
  useEffect(() => {
    if (verificationSent && timeRemaining > 0) {
      const timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [verificationSent, timeRemaining]);

  // Load existing progress
  useEffect(() => {
    const email = localStorage.getItem('temp_email');
    if (email) {
      const existingAccount = provider.getSmartWallet(email);
      if (existingAccount) {
        setAccount(existingAccount);
        setCurrentStep(4);
      }
      const existingProgress = provider.getOnboardingProgress(email);
      if (existingProgress) {
        setProgress(existingProgress);
      }
    }
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState(prev => ({ ...prev, loading: true, error: '', success: '' }));

    try {
      // Validate email
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Check if wallet already exists
      const existing = provider.getSmartWallet(formState.email);
      if (existing) {
        throw new Error('An account already exists for this email');
      }

      // Request email verification
      const verification = provider.requestEmailVerification(formState.email);

      setVerificationSent(true);
      setTimeRemaining(300); // 5 minutes
      localStorage.setItem('temp_email', formState.email);

      setFormState(prev => ({
        ...prev,
        success: 'Verification code sent to your email!',
        loading: false,
      }));

      setCurrentStep(2);
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false,
      }));
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState(prev => ({ ...prev, loading: true, error: '', success: '' }));

    try {
      if (!formState.verificationCode) {
        throw new Error('Please enter the verification code');
      }

      const verified = provider.verifyEmail(formState.email, formState.verificationCode);
      if (!verified) {
        throw new Error('Invalid or expired verification code');
      }

      setFormState(prev => ({
        ...prev,
        success: 'Email verified successfully!',
        loading: false,
      }));

      setTimeout(() => {
        setCurrentStep(3);
      }, 1000);
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Verification failed',
        loading: false,
      }));
    }
  };

  const handleCreateWallet = async () => {
    setFormState(prev => ({ ...prev, loading: true, error: '', success: '' }));

    try {
      // Create smart wallet
      const newAccount = provider.createSmartWallet(formState.email);
      setAccount(newAccount);

      // Get wallet init data
      const initData = provider.getWalletInitData(formState.email);
      if (!initData) {
        throw new Error('Failed to initialize wallet');
      }

      setFormState(prev => ({
        ...prev,
        success: 'Wallet created! Your address: ' + newAccount.walletAddress.slice(0, 10) + '...',
        loading: false,
      }));

      // Store session token
      const session = provider.createSessionToken(formState.email);
      localStorage.setItem('session_token', session.token);
      localStorage.setItem('wallet_address', newAccount.walletAddress);

      setTimeout(() => {
        setCurrentStep(4);
      }, 1500);
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create wallet',
        loading: false,
      }));
    }
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState(prev => ({ ...prev, loading: true, error: '', success: '' }));

    try {
      if (!formState.displayName.trim()) {
        throw new Error('Please enter your display name');
      }

      if (!formState.agreeToTerms) {
        throw new Error('Please agree to the terms and conditions');
      }

      if (!account) {
        throw new Error('No wallet found');
      }

      // Update profile
      const updated = provider.updateProfile(formState.email, {
        displayName: formState.displayName,
      });

      if (!updated) {
        throw new Error('Failed to update profile');
      }

      // Complete onboarding
      const completed = provider.completeOnboarding(formState.email);

      setFormState(prev => ({
        ...prev,
        success: 'Account setup complete!',
        loading: false,
      }));

      setCurrentStep(5);

      // Call completion callback
      if (onComplete) {
        setTimeout(() => onComplete(updated), 1000);
      }
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Setup failed',
        loading: false,
      }));
    }
  };

  const resendVerificationCode = () => {
    setFormState(prev => ({ ...prev, loading: true }));
    try {
      provider.requestEmailVerification(formState.email);
      setTimeRemaining(300);
      setFormState(prev => ({
        ...prev,
        success: 'New code sent!',
        loading: false,
      }));
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        error: 'Failed to resend code',
        loading: false,
      }));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-3">
            {steps.map((s) => (
              <div
                key={s.step}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold transition-all ${
                  currentStep >= s.step
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {currentStep > s.step ? '✓' : s.step}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-300 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{steps[currentStep - 1].title}</h1>
          <p className="text-gray-600 mb-6">{steps[currentStep - 1].description}</p>

          {/* Error and Success Messages */}
          {formState.error && (
            <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-lg text-sm">
              {formState.error}
            </div>
          )}
          {formState.success && (
            <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-lg text-sm">
              {formState.success}
            </div>
          )}

          {/* Step 1: Email Entry */}
          {currentStep === 1 && (
            <form onSubmit={handleEmailSubmit}>
              <input
                type="email"
                placeholder="your@email.com"
                value={formState.email}
                onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={formState.loading}
              />
              <button
                type="submit"
                disabled={formState.loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
              >
                {formState.loading ? 'Sending...' : 'Get Verification Code'}
              </button>
            </form>
          )}

          {/* Step 2: Email Verification */}
          {currentStep === 2 && (
            <form onSubmit={handleVerifyEmail}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  placeholder="000000"
                  value={formState.verificationCode}
                  onChange={(e) => setFormState(prev => ({ ...prev, verificationCode: e.target.value }))}
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={formState.loading}
                />
              </div>

              {timeRemaining > 0 && (
                <p className="text-center text-sm text-gray-600 mb-4">
                  Code expires in {formatTime(timeRemaining)}
                </p>
              )}

              <button
                type="submit"
                disabled={formState.loading || !formState.verificationCode}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors mb-2"
              >
                {formState.loading ? 'Verifying...' : 'Verify Email'}
              </button>

              {timeRemaining === 0 && (
                <button
                  type="button"
                  onClick={resendVerificationCode}
                  disabled={formState.loading}
                  className="w-full text-blue-600 hover:text-blue-700 font-semibold py-2"
                >
                  Resend Code
                </button>
              )}
            </form>
          )}

          {/* Step 3: Wallet Creation */}
          {currentStep === 3 && (
            <div>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center mb-4">
                  <div className="animate-spin">
                    <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full" />
                  </div>
                </div>
                <p className="text-center text-gray-700 font-medium">
                  Creating your smart wallet on Base...
                </p>
              </div>

              <button
                onClick={handleCreateWallet}
                disabled={formState.loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
              >
                {formState.loading ? 'Creating...' : 'Create Wallet'}
              </button>

              {account && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg text-sm">
                  <p className="text-green-800">✓ Wallet created:</p>
                  <p className="text-green-800 font-mono break-all text-xs mt-1">
                    {account.walletAddress}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Profile Setup */}
          {currentStep === 4 && (
            <form onSubmit={handleProfileSetup}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  placeholder="Your Game Name"
                  value={formState.displayName}
                  onChange={(e) => setFormState(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={formState.loading}
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.agreeToTerms}
                    onChange={(e) => setFormState(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    disabled={formState.loading}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    I agree to the{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>
                  </span>
                </label>
              </div>

              {account && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-xs text-gray-700">
                  <p className="font-semibold mb-1">Wallet Info:</p>
                  <p className="text-blue-600 font-mono truncate">{account.walletAddress}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={formState.loading || !formState.displayName || !formState.agreeToTerms}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
              >
                {formState.loading ? 'Setting up...' : 'Complete Setup'}
              </button>
            </form>
          )}

          {/* Step 5: Complete */}
          {currentStep === 5 && account && (
            <div className="text-center">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <span className="text-3xl">✓</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
                <p className="text-gray-600">Welcome to Bass Ball on Base</p>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
                <div className="mb-3">
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Email</p>
                  <p className="text-gray-900 font-medium">{account.email}</p>
                </div>
                <div className="mb-3">
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Wallet Address</p>
                  <p className="text-gray-900 font-mono text-xs break-all">{account.walletAddress}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold">Tier</p>
                  <p className="text-gray-900 font-medium capitalize">{account.tier}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  window.location.href = '/dashboard';
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-gray-600 text-xs mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default EmailToWalletOnboarding;
