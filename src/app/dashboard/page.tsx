"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface Hospital { id: string; name: string; address: string; }
interface Doctor { id: string; name: string; speciality: string; hospitalId?: string | null; }

export default function DashboardPage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Employee UI removed

  // Hospital form state
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [isCreatingHospital, setIsCreatingHospital] = useState(false);

  // Doctor form state
  const [doctorName, setDoctorName] = useState('');
  const [doctorSpeciality, setDoctorSpeciality] = useState('');
  const [doctorHospitalId, setDoctorHospitalId] = useState<string | undefined>(undefined);
  const [isCreatingDoctor, setIsCreatingDoctor] = useState(false);

  async function refresh() {
    setLoading(true);
    setError(null);
    const [hRes, dRes] = await Promise.all([
      fetch('/api/hospitals', { cache: 'no-store' }),
      fetch('/api/doctors', { cache: 'no-store' }),
    ]);
    const hJson = hRes.ok ? await hRes.json() : { hospitals: [] };
    const dJson = dRes.ok ? await dRes.json() : { doctors: [] };
    setHospitals(hJson.hospitals || []);
    setDoctors(dJson.doctors || []);
    setLoading(false);
    if (!hRes.ok || !dRes.ok) {
      setError('Failed to load some data. Ensure database/migrations are applied.');
    }
  }

  useEffect(() => { refresh(); }, []);

  async function createHospital(e: React.FormEvent) {
    e.preventDefault();
    setIsCreatingHospital(true);
    setError(null);
    try {
      const res = await fetch('/api/hospitals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: hospitalName, address: hospitalAddress }) });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j?.error || 'Failed to add hospital');
      }
      setHospitalName('');
      setHospitalAddress('');
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      setIsCreatingHospital(false);
    }
  }

  async function createDoctor(e: React.FormEvent) {
    e.preventDefault();
    setIsCreatingDoctor(true);
    setError(null);
    try {
      const res = await fetch('/api/doctors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: doctorName, speciality: doctorSpeciality, hospitalId: doctorHospitalId || null }) });
      if (!res.ok) {
        const j = await res.json().catch(()=>({}));
        throw new Error(j?.error || 'Failed to add doctor');
      }
      setDoctorName('');
      setDoctorSpeciality('');
      setDoctorHospitalId(undefined);
      refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
    } finally {
      setIsCreatingDoctor(false);
    }
  }

  // Employee section removed per request

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Add Hospital</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={createHospital}>
            <div className="grid gap-2">
              <Label htmlFor="hname">Hospital Name</Label>
              <Input id="hname" value={hospitalName} onChange={e => setHospitalName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="haddr">Address</Label>
              <Input id="haddr" value={hospitalAddress} onChange={e => setHospitalAddress(e.target.value)} required />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={isCreatingHospital}>{isCreatingHospital ? 'Adding...' : 'Add Hospital'}</Button>
            </div>
          </form>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-base">Existing Hospitals</h3>
              {!loading && (
                <Badge variant="secondary">{hospitals.length} total</Badge>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border">
                    <CardHeader className="flex-row items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="w-full space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-3 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : hospitals.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No hospitals yet. Add your first hospital to get started.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {hospitals.map(h => (
                  <Card key={h.id} className="hover:shadow-lg transition-shadow duration-200 border">
                    <CardHeader className="flex-row items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{(h.name || '?').slice(0,2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{h.name}</CardTitle>
                        <p className="text-xs text-muted-foreground truncate">Hospital</p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground line-clamp-2">{h.address}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Add Doctor</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-3" onSubmit={createDoctor}>
            <div className="grid gap-2">
              <Label htmlFor="dname">Doctor Name</Label>
              <Input id="dname" value={doctorName} onChange={e => setDoctorName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dspec">Specialization</Label>
              <Input id="dspec" value={doctorSpeciality} onChange={e => setDoctorSpeciality(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Hospital (optional)</Label>
              <Select value={doctorHospitalId} onValueChange={(v) => setDoctorHospitalId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select hospital" />
                </SelectTrigger>
                <SelectContent>
                  {hospitals.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={isCreatingDoctor}>{isCreatingDoctor ? 'Adding...' : 'Add Doctor'}</Button>
            </div>
          </form>
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-base">Existing Doctors</h3>
              {!loading && (
                <Badge variant="secondary">{doctors.length} total</Badge>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="border">
                    <CardHeader className="flex-row items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="w-full space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-3 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : doctors.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No doctors yet. Add your first doctor to see them here.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map(d => {
                  const hospitalName = hospitals.find(h => h.id === d.hospitalId)?.name;
                  const initials = (d.name || '?')
                    .split(' ')
                    .map(s => s[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <Card key={d.id} className="hover:shadow-lg transition-shadow duration-200 border">
                      <CardHeader className="flex-row items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <CardTitle className="text-base truncate">{d.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs font-normal">{d.speciality}</Badge>
                            <span className="text-xs text-muted-foreground truncate">
                              {hospitalName ? hospitalName : 'Unassigned'}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs text-muted-foreground">Doctor</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employee section removed */}
    </div>
  );
}

 
