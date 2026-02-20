"use client";

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PatientRegistrationForm } from '@/components/forms/patient-registration-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function RegisterPatientPage() {
  const { isLoggedIn, login } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const starsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!starsRef.current) return;
    const starsContainer = starsRef.current;
    starsContainer.innerHTML = '';
    const numStars = 100;
    for (let i = 0; i < numStars; i++) {
      const star = document.createElement('div');
      star.className = 'ecg-star';
      star.style.top = Math.random() * 100 + 'vh';
      star.style.left = Math.random() * 100 + 'vw';
      star.style.animationDuration = (2 + Math.random() * 3) + 's';
      starsContainer.appendChild(star);
    }
    return () => { starsContainer.innerHTML = ''; };
  }, []);

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

  // Removed auto-redirect to ensure user must submit the form

  return (
    <div className="relative min-h-screen">
      <style jsx>{`
        .ecg-stars {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          z-index: 1;
          pointer-events: none;
        }
        .ecg-backdrop {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 40%, rgba(0,0,0,0.5) 100%);
          z-index: 0;
        }
        .ecg-star {
          position: absolute;
          width: 3px;
          height: 3px;
          background: cyan;
          border-radius: 50%;
          box-shadow: 0 0 8px cyan, 0 0 14px cyan;
          animation: ecg-twinkle 3s infinite ease-in-out;
        }
        @keyframes ecg-twinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        .ecg-svg {
          position: absolute;
          width: 100%;
          height: 200px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          pointer-events: none;
        }
        .ecg-wave {
          fill: none;
          stroke: cyan;
          stroke-width: 2;
          stroke-dasharray: 4000;
          stroke-dashoffset: 4000;
          filter: drop-shadow(0 0 6px cyan);
          animation: ecg-draw 6s linear infinite;
        }
        .ecg-dot {
          fill: cyan;
          filter: drop-shadow(0 0 8px cyan);
          r: 6;
          animation: ecg-moveDot 6s linear infinite;
          offset-path: path("M0,100 L200,100 L250,60 L280,120 L320,40 L360,160 L420,100 L600,100 L650,70 L680,130 L720,20 L780,180 L840,100 L1000,100 L1050,60 L1080,120 L1120,40 L1160,160 L1220,100 L1400,100 L1450,60 L1480,120 L1520,40 L1580,160 L1640,100 L1800,100 L1850,60 L1880,120 L1920,40 L1980,160 L2000,100");
        }
        @keyframes ecg-draw { from { stroke-dashoffset: 4000; } to { stroke-dashoffset: 0; } }
        @keyframes ecg-moveDot { 0% { offset-distance: 0%; } 100% { offset-distance: 100%; } }
      `}</style>

      <div className="ecg-backdrop" />
      <div ref={starsRef} className="ecg-stars" />
      <svg className="ecg-svg" viewBox="0 0 2000 200" xmlns="http://www.w3.org/2000/svg">
        <path className="ecg-wave" d="M0,100 L200,100 L250,60 L280,120 L320,40 L360,160 L420,100 L600,100 L650,70 L680,130 L720,20 L780,180 L840,100 L1000,100 L1050,60 L1080,120 L1120,40 L1160,160 L1220,100 L1400,100 L1450,60 L1480,120 L1520,40 L1580,160 L1640,100 L1800,100 L1850,60 L1880,120 L1920,40 L1980,160 L2000,100" />
        <circle className="ecg-dot" />
      </svg>

      <div className="container mx-auto py-8 relative z-10">
        <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/">← Back</Link>
        </Button>
        </div>
        <Card className="max-w-2xl mx-auto shadow-lg bg-transparent backdrop-blur-sm border border-cyan-500/20">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <UserPlus className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">Patient Registration</CardTitle>
          </div>
          <CardDescription className="text-md">
            {isLoggedIn ? 'Enter the patient\'s details below.' : 'Login to register a patient.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {
            <div className="grid gap-4 max-w-md mx-auto">
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
                {mode === 'login' && (
                  <div className="text-center">
                    <button
                      type="button"
                      className="underline text-sm"
                      onClick={() => setMode('signup')}
                    >
                      Register
                    </button>
                  </div>
                )}
              </form>
            </div>
          }
        </CardContent>
        </Card>
      </div>
    </div>
  );
}
