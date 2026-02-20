"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PatientRegistrationForm } from '@/components/forms/patient-registration-form';

export default function PatientProfilePage() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/patient/profile', { cache: 'no-store' });
      if (!res.ok) { setHasProfile(false); setLoading(false); return; }
      const json = await res.json();
      setProfile(json?.profile ?? null);
      setHasProfile(Boolean(json?.profile));
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="container mx-auto py-8">Loading...</div>;

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>{hasProfile ? (editing ? 'Update your details' : 'Your details') : 'Complete your profile'}</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasProfile && (
            <PatientRegistrationForm
              mode="create"
              onSuccess={(saved) => {
                setProfile(saved);
                setHasProfile(true);
              }}
            />
          )}
          {hasProfile && !editing && (
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {profile?.name}</div>
              <div><strong>Age:</strong> {profile?.age}</div>
              <div><strong>Gender:</strong> {profile?.gender}</div>
              <div><strong>Blood Group:</strong> {profile?.bloodGroup}</div>
              <div><strong>Allergies:</strong> {profile?.allergies || '—'}</div>
              <div><strong>Conditions:</strong> {profile?.medicalConditions || '—'}</div>
              <div><strong>Recent Surgeries:</strong> {profile?.recentSurgeries || '—'}</div>
              <div><strong>Implants:</strong> {profile?.implantedDevices || '—'}</div>
              <div><strong>Emergency Contact:</strong> {profile?.emergencyContactName} ({profile?.emergencyContactPhone})</div>
              <Button className="mt-4" onClick={() => setEditing(true)}>Update</Button>
            </div>
          )}
          {hasProfile && editing && (
            <PatientRegistrationForm
              mode="edit"
              initialValues={{
                name: profile?.name ?? '',
                age: profile?.age ?? ('' as unknown as number),
                gender: profile?.gender,
                bloodGroup: profile?.bloodGroup ?? '',
                allergies: profile?.allergies ?? '',
                medicalConditions: profile?.medicalConditions ?? '',
                recentSurgeries: profile?.recentSurgeries ?? '',
                implantedDevices: profile?.implantedDevices ?? '',
                emergencyContactName: profile?.emergencyContactName ?? '',
                emergencyContactPhone: profile?.emergencyContactPhone ?? '',
                facialImagePreview: profile?.facialImagePreview ?? '',
              }}
              onSuccess={(saved) => {
                setProfile(saved);
                setEditing(false);
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}


