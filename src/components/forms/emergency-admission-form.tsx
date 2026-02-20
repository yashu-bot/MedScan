
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emergencyAdmissionSchema, type EmergencyAdmissionFormData, type PatientData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileDown, Save } from 'lucide-react';
import jsPDF from 'jspdf';

interface EmergencyAdmissionFormProps {
  patientData: PatientData;
}

export function EmergencyAdmissionForm({ patientData }: EmergencyAdmissionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<EmergencyAdmissionFormData>({
    resolver: zodResolver(emergencyAdmissionSchema),
    defaultValues: {
      patientId: patientData.id,
      name: patientData.name,
      age: patientData.age,
      bloodGroup: patientData.bloodGroup,
      allergies: patientData.allergies,
      medicalConditions: patientData.medicalConditions,
      recentSurgeries: patientData.recentSurgeries,
      implantedDevices: patientData.implantedDevices,
      admissionNotes: '',
      consentGiven: false,
      dateTime: new Date().toISOString(),
    },
  });

  const generatePDF = (data: EmergencyAdmissionFormData) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text("Emergency Admission Form", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Patient ID: ${data.patientId}`, 14, 35);
    doc.text(`Date & Time: ${new Date(data.dateTime).toLocaleString()}`, 14, 42);
    
    let yPos = 55;
    const lineHeight = 7;
    const sectionGap = 10;

    doc.setFontSize(14);
    doc.text("Patient Information", 14, yPos);
    yPos += lineHeight;
    doc.setFontSize(10);
    doc.text(`Name: ${data.name}`, 14, yPos); yPos += lineHeight;
    doc.text(`Age: ${data.age}`, 14, yPos); yPos += lineHeight;
    doc.text(`Blood Group: ${data.bloodGroup}`, 14, yPos); yPos += lineHeight;
    doc.text("Allergies:", 14, yPos); yPos += lineHeight;
    doc.text(data.allergies || "None reported", 20, yPos, { maxWidth: 180 }); yPos += lineHeight * (Math.ceil((data.allergies?.length || 15) / 80) + 1); // crude line wrap
    doc.text("Medical Conditions:", 14, yPos); yPos += lineHeight;
    doc.text(data.medicalConditions || "None reported", 20, yPos, { maxWidth: 180 }); yPos += lineHeight * (Math.ceil((data.medicalConditions?.length || 15) / 80) +1);
    doc.text("Recent Surgeries:", 14, yPos); yPos += lineHeight;
    doc.text(data.recentSurgeries || "None reported", 20, yPos, { maxWidth: 180 }); yPos += lineHeight * (Math.ceil((data.recentSurgeries?.length || 15) / 80) +1);
    doc.text("Implanted Devices:", 14, yPos); yPos += lineHeight;
    doc.text(data.implantedDevices || "None reported", 20, yPos, { maxWidth: 180 }); yPos += lineHeight * (Math.ceil((data.implantedDevices?.length || 15) / 80) +1);
    
    yPos += sectionGap;
    doc.setFontSize(14);
    doc.text("Admission Details", 14, yPos);
    yPos += lineHeight;
    doc.setFontSize(10);
    doc.text("Admission Notes:", 14, yPos); yPos += lineHeight;
    doc.text(data.admissionNotes || "N/A", 20, yPos, { maxWidth: 180 }); yPos += lineHeight * (Math.ceil((data.admissionNotes?.length || 10) / 80) +1);
    
    yPos += sectionGap;
    doc.setFontSize(14);
    doc.text("Consent", 14, yPos);
    yPos += lineHeight;
    doc.setFontSize(10);
    doc.text(`Consent Given: ${data.consentGiven ? 'Yes' : 'No'}`, 14, yPos);
    
    yPos += sectionGap * 2;
    doc.text("Signature: _________________________ (Staff)", 14, yPos);
    
    doc.save(`emergency_form_${data.patientId}_${new Date(data.dateTime).toLocaleDateString().replace(/\//g, '-')}.pdf`);
    
    toast({
      title: "PDF Exported",
      description: "The emergency form has been downloaded.",
    });
  };

  async function onSubmit(data: EmergencyAdmissionFormData) {
    setIsSubmitting(true);
    console.log("Emergency Form Data:", data);

    // Simulate API call to save form data to Firestore
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Form Submitted",
      description: `Admission form for ${data.name} has been saved.`,
      variant: "default",
    });
    setIsSubmitting(false);
    
    // Optionally, trigger PDF download after successful submission
    // generatePDF(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Display non-editable patient info first for confirmation */}
        <div className="space-y-3 p-4 border rounded-md bg-muted/30">
            <h3 className="text-lg font-semibold">Patient Information (Confirm or Edit)</h3>
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="age" render={({ field }) => (
              <FormItem><FormLabel>Age</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="bloodGroup" render={({ field }) => (
              <FormItem><FormLabel>Blood Group</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="allergies" render={({ field }) => (
              <FormItem><FormLabel>Allergies</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="medicalConditions" render={({ field }) => (
              <FormItem><FormLabel>Medical Conditions</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="recentSurgeries" render={({ field }) => (
              <FormItem><FormLabel>Recent Surgeries/Hospitalizations</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="implantedDevices" render={({ field }) => (
              <FormItem><FormLabel>Implanted Devices</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
        </div>
        
        <FormField
          control={form.control}
          name="admissionNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admission Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter any relevant notes for admission..." {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="consentGiven"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Consent for Treatment *
                </FormLabel>
                <FormDescription>
                  Confirm that consent for emergency treatment has been obtained or is implied by the situation.
                </FormDescription>
                 <FormMessage />
              </div>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="dateTime"
          render={({ field }) => (
            <FormItem hidden> {/* Hidden field, auto-populated */}
              <FormControl>
                <Input type="hidden" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => generatePDF(form.getValues())}
            className="flex-1"
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export to PDF
          </Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Admission Form
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
