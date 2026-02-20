"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        setError("Invalid username or password");
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
    setIsSubmitting(false);
  };

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

      <div className="container mx-auto py-12 max-w-md relative z-10">
        <Card className="shadow-md bg-transparent backdrop-blur-sm border border-cyan-500/20">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Use username 'admin' and password 'admin123'.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Signing in...' : 'Login'}</Button>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
}



