"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  bloodGroup: string;
  allergies: string;
  medicalConditions: string;
  recentSurgeries: string;
  implantedDevices: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  faceImageUrl: string;
  registeredAt: string;
  username: string;
}

export default function AllPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patients');
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      const data = await response.json();
      setPatients(data.patients || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading patients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">Error: {error}</div>
        <button 
          onClick={fetchPatients}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">All Registered Patients</h1>
        <p className="text-gray-600 mt-2">
          Total: {patients.length} patients registered
        </p>
        <button 
          onClick={fetchPatients}
          className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Refresh
        </button>
      </div>

      {patients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No patients registered yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {patients.map((patient) => (
            <Card key={patient.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{patient.name}</span>
                  <Badge variant="secondary">{patient.age} years</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Gender:</span> {patient.gender}
                  </div>
                  <div>
                    <span className="font-medium">Blood Group:</span> {patient.bloodGroup}
                  </div>
                </div>
                
                {patient.allergies && (
                  <div className="text-sm">
                    <span className="font-medium">Allergies:</span> {patient.allergies}
                  </div>
                )}
                
                {patient.medicalConditions && (
                  <div className="text-sm">
                    <span className="font-medium">Conditions:</span> {patient.medicalConditions}
                  </div>
                )}

                <div className="text-sm">
                  <span className="font-medium">Emergency Contact:</span> {patient.emergencyContactName}
                </div>
                <div className="text-sm">
                  <span className="font-medium">Phone:</span> {patient.emergencyContactPhone}
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  Registered: {new Date(patient.registeredAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

