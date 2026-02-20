
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Activity, ListFilter, Users } from 'lucide-react'; // Removed Clock, MapPin
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { PatientData } from '@/lib/schemas'; // Use PatientData

interface PatientListProps {
  patients: PatientData[]; // Changed to PatientData
  onSelectPatient: (patientId: string) => void;
  selectedPatientId: string | null;
}

export function PatientList({ patients, onSelectPatient, selectedPatientId }: PatientListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (patient.medicalConditions && patient.medicalConditions.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const handleSelect = (patientId: string) => {
    onSelectPatient(patientId);
  }

  return (
    <Card className="h-full flex flex-col shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            <CardTitle>Registered Patients</CardTitle>
          </div>
          <Badge variant="secondary">{filteredPatients.length} Active</Badge>
        </div>
        <CardDescription>List of registered patients.</CardDescription>
        <div className="relative mt-2">
          <ListFilter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Filter by name or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-full"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-0">
        <ScrollArea className="h-[calc(100vh-20rem)] md:h-[calc(100vh-25rem)] lg:h-[500px]">
          {filteredPatients.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              {patients.length === 0 ? "No patients registered yet." : "No patients match your filter."}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filteredPatients.map((patient) => (
                <li
                  key={patient.id}
                  className={cn(
                    "p-4 hover:bg-accent/50 cursor-pointer transition-colors",
                    selectedPatientId === patient.id && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(patient.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && handleSelect(patient.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={patient.faceImageUrl || `https://placehold.co/40x40.png?text=${patient.name.charAt(0)}`} 
                        alt={patient.name} 
                        data-ai-hint="person avatar"
                      />
                      <AvatarFallback>{patient.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold">{patient.name}, {patient.age}</h4>
                      <p className={cn("text-sm truncate", selectedPatientId === patient.id ? "text-accent-foreground/80" : "text-muted-foreground", "flex items-center")}>
                        <Activity className="h-4 w-4 mr-1 flex-shrink-0" /> 
                        {patient.medicalConditions || 'No conditions listed'}
                      </p>
                    </div>
                    {/* ETA and live location removed as they are not part of registration data */}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
