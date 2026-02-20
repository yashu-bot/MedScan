
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { PatientData, MedicalNote } from '@/lib/schemas';

interface PatientContextType {
  patients: PatientData[];
  addPatient: (patient: PatientData) => Promise<void>;
  getPatientById: (id: string) => PatientData | undefined;
  addNoteToPatientHistory: (patientId: string, noteContent: string, doctorName?: string) => Promise<void>;
  refreshPatients: () => Promise<void>;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientDataProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<PatientData[]>([]);

  const refreshPatients = useCallback(async () => {
    const res = await fetch('/api/patients', { cache: 'no-store' });
    const data = await res.json();
    setPatients(Array.isArray(data) ? data : (data?.patients ?? []));
  }, []);

  useEffect(() => {
    void refreshPatients();
  }, [refreshPatients]);

  const addPatient = useCallback(async (patient: PatientData) => {
    // Persist to API
    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    if (!res.ok) return; 
    const created = await res.json();
    setPatients((prev) => [created, ...prev]);
  }, []);

  const getPatientById = useCallback((id: string) => {
    return patients.find(p => p.id === id);
  }, [patients]);

  const addNoteToPatientHistory = useCallback(async (patientId: string, noteContent: string, doctorName?: string) => {
    const res = await fetch(`/api/patients/${patientId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        content: noteContent,
        doctorName: doctorName || 'Dr. System'
      }),
    });
    if (!res.ok) {
      console.error('Failed to save medical note:', res.status, res.statusText);
      throw new Error('Failed to save medical note');
    }
    const newNote: MedicalNote = await res.json();
    
    // Update the patient's medical history in the state
    setPatients(prevPatients => 
        prevPatients.map(patient => {
            if (patient.id === patientId) {
                const updatedHistory = patient.medicalHistory ? [...patient.medicalHistory, newNote] : [newNote];
                return { ...patient, medicalHistory: updatedHistory } as PatientData;
            }
            return patient as PatientData;
        })
    );
    
    // Also refresh the patients list to ensure we have the latest data
    await refreshPatients();
  }, [refreshPatients]);

  return (
    <PatientContext.Provider value={{ patients, addPatient, getPatientById, addNoteToPatientHistory, refreshPatients }}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatientData() {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatientData must be used within a PatientDataProvider');
  }
  return context;
}
