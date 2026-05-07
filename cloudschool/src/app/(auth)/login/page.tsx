'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { Metadata } from 'next';

const schema = z.object({
  email:    z.email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [authError, setAuthError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setAuthError('');
    const res = await signIn('credentials', {
      email:    data.email,
      password: data.password,
      redirect: false,
    });

    if (res?.error) {
      setAuthError('Invalid email or password.');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg-deepest)]">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[var(--color-brand-alpha-10)] blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[var(--color-brand-alpha-10)] blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-[var(--color-brand)] flex items-center justify-center mb-4 shadow-[var(--shadow-brand)]">
            <GraduationCap size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">CloudSchool</h1>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--color-bg-surface)] border border-[var(--border-standard)] rounded-[var(--radius-xl)] p-6 shadow-[var(--shadow-xl)]">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="you@school.edu"
              autoComplete="email"
              required
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="flex flex-col gap-1.5">
              <Input
                id="password"
                type={showPw ? 'text' : 'password'}
                label="Password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                error={errors.password?.message}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                aria-label={showPw ? 'Hide password' : 'Show password'}
                className="self-end text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
              >
                {showPw ? <EyeOff size={12} /> : <Eye size={12} />}
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>

            {authError && (
              <p role="alert" className="text-xs text-[var(--color-danger)] text-center">
                {authError}
              </p>
            )}

            <Button type="submit" loading={isSubmitting} className="w-full mt-1">
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-[var(--text-tertiary)] mt-6">
          CloudSchool ERP &copy; {new Date().getFullYear()}
        </p>
      </div>
    </main>
  );
}
