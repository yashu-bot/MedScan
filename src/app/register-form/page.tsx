"use client";

import { useState } from 'react';
import Link from 'next/link';
import { PatientRegistrationForm } from '@/components/forms/patient-registration-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterFormPage() {
  const { isLoggedIn, login } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/patient/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) throw new Error('signup failed');
      await login(username, password);
    } catch {}
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await login(username, password);
    setLoading(false);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/">← Back</Link>
        </Button>
      </div>
      <Card className="max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <UserPlus className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">Patient Registration</CardTitle>
          </div>
          <CardDescription className="text-md">
            {isLoggedIn ? 'Enter the patient\'s details below.' : 'Login or sign up to register a patient.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoggedIn ? (
            <PatientRegistrationForm />
          ) : (
            <div className="grid gap-4 max-w-md mx-auto">
              <div className="flex gap-2 mb-2">
                <Button variant={mode === 'login' ? 'default' : 'outline'} onClick={() => setMode('login')}>
                  <LogIn className="mr-2 h-4 w-4" /> Login
                </Button>
                <Button variant={mode === 'signup' ? 'default' : 'outline'} onClick={() => setMode('signup')}>
                  <UserPlus className="mr-2 h-4 w-4" /> Sign up
                </Button>
              </div>
              <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="grid gap-3">
                <div>
                  <label htmlFor="username" className="text-sm">Username</label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="password" className="text-sm">Password</label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" disabled={loading}>{loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Sign up')}</Button>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



