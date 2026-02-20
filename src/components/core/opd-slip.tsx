
"use client";

import type { OpdSlipData } from '@/lib/schemas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Hospital, CalendarDays, Ticket, UserCircle, Activity } from 'lucide-react';
import { cn } from '@/lib/utils'; // Make sure cn is imported

interface OpdSlipProps {
  slip: OpdSlipData;
}

export default function OpdSlip({ slip }: OpdSlipProps) {
  const displayDate = new Date(slip.slipDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const displayTime = new Date(slip.slipDate).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl border-2 border-primary my-4">
      <CardHeader className="bg-primary/10 text-center p-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Hospital className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl text-primary">MedScan360 Clinic</CardTitle>
        </div>
        <CardDescription className="text-md font-semibold text-primary/90">Outpatient Department Slip</CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="text-center mb-6">
          <p className="text-sm text-muted-foreground">Token Number</p>
          <p className="text-4xl font-bold text-accent">{slip.tokenNumber}</p>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <InfoItem icon={UserCircle} label="Patient Name" value={slip.patientName} />
          <InfoItem label="Patient ID" value={slip.patientId} />
          <InfoItem label="Age / Gender" value={`${slip.patientAge} / ${slip.patientGender}`} />
          {slip.department && <InfoItem icon={Activity} label="Department" value={slip.department} />}
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
           <InfoItem icon={CalendarDays} label="Date" value={displayDate} />
           <InfoItem label="Time" value={displayTime} />
        </div>

        {slip.doctorName && (
            <>
            <Separator />
            <div className="pt-2">
                <InfoItem label="Consulting Doctor" value={slip.doctorName} className="font-semibold text-center block" />
            </div>
            </>
        )}
        
        <Separator />

        <div className="mt-6 p-3 border-2 border-dashed border-muted-foreground/50 rounded-md text-center">
          <p className="text-xs font-semibold text-muted-foreground tracking-wider">[ OFFICIAL USE / STAMP AREA ]</p>
        </div>

         <p className="text-xs text-center text-muted-foreground mt-4">
            Please keep this slip safe. Valid for today only.
        </p>
      </CardContent>
    </Card>
  );
}

interface InfoItemProps {
  icon?: React.ElementType;
  label: string;
  value: string;
  className?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ icon: Icon, label, value, className }) => (
  <div className={cn("flex flex-col", className)}>
    <span className="text-xs text-muted-foreground flex items-center">
      {Icon && <Icon className="w-3 h-3 mr-1.5 text-primary" />}
      {label}
    </span>
    <span className="font-medium text-foreground break-words">{value}</span>
  </div>
);
