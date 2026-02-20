"use client";

import type { PatientData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ShieldCheck, User, Droplet, HeartPulse, Phone, FileText } from 'lucide-react';
import Link from 'next/link';

interface EmergencyDisplayProps {
  patient: PatientData;
}

export default function EmergencyDisplay({ patient }: EmergencyDisplayProps) {
  return (
    <Card className="border-destructive border-2 shadow-xl my-4 bg-background animate-pulse-border-once">
      <style jsx global>{`
        @keyframes pulse-border {
          0%, 100% { border-color: hsl(var(--destructive) / 0.7); box-shadow: 0 0 0 0 hsl(var(--destructive) / 0.4); }
          50% { border-color: hsl(var(--destructive)); box-shadow: 0 0 10px 5px hsl(var(--destructive) / 0.2); }
        }
        .animate-pulse-border-once {
          animation: pulse-border 1.5s ease-out;
        }
      `}</style>
      <CardHeader className="bg-destructive/10">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <CardTitle className="text-2xl text-destructive">Emergency Patient Details</CardTitle>
        </div>
        <CardDescription className="text-destructive/80">
          Critical information for immediate attention.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
          <InfoItem icon={User} label="Name" value={patient.name} />
          <InfoItem label="Age" value={patient.age.toString()} />
          <InfoItem label="Gender" value={patient.gender} />
          <InfoItem icon={Droplet} label="Blood Group" value={patient.bloodGroup} className="font-bold text-red-600 dark:text-red-400" />
        </div>
        
        <InfoItem icon={AlertTriangle} label="Allergies" value={patient.allergies || 'None reported'} isCritical={!!patient.allergies} />
        <InfoItem icon={HeartPulse} label="Medical Conditions" value={patient.medicalConditions || 'None reported'} />
        
        <Card className="bg-muted/50 p-4">
          <h4 className="font-semibold mb-2 flex items-center"><Phone className="w-5 h-5 mr-2 text-primary"/>Emergency Contact:</h4>
          <p>{patient.emergencyContactName} ({patient.emergencyContactPhone})</p>
        </Card>

      </CardContent>
    </Card>
  );
}

interface InfoItemProps {
  icon?: React.ElementType;
  label: string;
  value: string;
  className?: string;
  isCritical?: boolean;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, className, isCritical }) => (
  <div className={`flex items-start ${isCritical ? 'text-destructive font-semibold' : ''}`}>
    {Icon && <Icon className={`w-5 h-5 mr-2 mt-1 flex-shrink-0 ${isCritical ? 'text-destructive' : 'text-primary'}`} />}
    <span className="font-medium mr-2">{label}:</span>
    <span className={`break-words ${className}`}>{value}</span>
  </div>
);
