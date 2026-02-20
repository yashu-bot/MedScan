"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DoctorListItem {
  id: string;
  name: string;
  speciality: string;
  hospital?: { id: string; name: string; address: string } | null;
}

export default function DoctorsListPage() {
  const [doctors, setDoctors] = useState<DoctorListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/doctors', { cache: 'no-store' });
      const j = res.ok ? await res.json() : { doctors: [] };
      setDoctors(j.doctors || []);
      setLoading(false);
    })();
  }, []);

  const toSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Doctors</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : doctors.length === 0 ? (
            <div className="text-sm text-muted-foreground">No doctors found</div>
          ) : (
            <ul className="divide-y">
              {doctors.map((d) => (
                <li key={d.id} className="py-3">
                  <div className="flex items-start justify-between gap-4">
                    <Link href={`/doctors/${toSlug(d.name)}`} className="flex-1 block hover:text-primary">
                      <div className="font-medium">{d.name}</div>
                      <div className="text-sm text-muted-foreground">{d.speciality}</div>
                      <div className="text-sm">
                        {d.hospital ? (
                          <span>{d.hospital.name} — {d.hospital.address}</span>
                        ) : (
                          <span>No hospital</span>
                        )}
                      </div>
                    </Link>
                    <Link
                      href={`/doctors/${toSlug(d.name)}/messages`}
                      className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-90 h-10 w-10 mt-1"
                      aria-label={`Message ${d.name}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                        <path d="M2 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10a9.96 9.96 0 0 1-4.472-1.05L2 22l1.05-4.472A9.96 9.96 0 0 1 2 12Zm6-1h8v2H8v-2Zm0-3h8v2H8V8Zm0 6h5v2H8v-2Z" />
                      </svg>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


