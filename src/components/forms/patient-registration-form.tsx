
"use client";

import type { ChangeEvent } from 'react';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { patientRegistrationSchema, type PatientRegistrationFormData } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Camera, FileImage, Loader2 } from 'lucide-react';
import WebcamCapture from '@/components/core/webcam-capture';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
// Optional: this form can still work without context; API is the source of truth now

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export interface PatientRegistrationFormProps {
  mode?: 'create' | 'edit';
  initialValues?: Partial<PatientRegistrationFormData> | null;
  onSuccess?: (savedProfile: any) => void;
}

export function PatientRegistrationForm({ mode = 'create', initialValues = null, onSuccess }: PatientRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [facialImageFile, setFacialImageFile] = useState<File | null>(null); // Keep for potential direct upload
  const [facialImagePreview, setFacialImagePreview] = useState<string | null>(null);
  const [showWebcam, setShowWebcam] = useState(false);
  const { toast } = useToast();

  const form = useForm<PatientRegistrationFormData>({
    resolver: zodResolver(patientRegistrationSchema),
    defaultValues: {
      name: initialValues?.name ?? '',
      age: (initialValues?.age as unknown as number) ?? ('' as unknown as number),
      gender: initialValues?.gender as any,
      bloodGroup: initialValues?.bloodGroup ?? '',
      allergies: initialValues?.allergies ?? '',
      medicalConditions: initialValues?.medicalConditions ?? '',
      recentSurgeries: initialValues?.recentSurgeries ?? '',
      implantedDevices: initialValues?.implantedDevices ?? '',
      emergencyContactName: initialValues?.emergencyContactName ?? '',
      emergencyContactPhone: initialValues?.emergencyContactPhone ?? '',
      facialImagePreview: initialValues?.facialImagePreview ?? '', // Added for storing data URL
    },
  });

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFacialImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setFacialImagePreview(previewUrl);
      form.setValue('facialImagePreview', previewUrl); 
    }
  };

  const handleWebcamCapture = (imageSrc: string) => {
    // Convert data URL to blob then to file if needed, or just store data URL
    setFacialImagePreview(imageSrc);
    form.setValue('facialImagePreview', imageSrc);
    // Optionally convert to file if backend expects file object
    // fetch(imageSrc).then(res => res.blob()).then(blob => {
    //   const file = new File([blob], "webcam-capture.png", { type: "image/png" });
    //   setFacialImageFile(file);
    // });
    setShowWebcam(false);
  };

  async function onSubmit(data: PatientRegistrationFormData) {
    setIsSubmitting(true);
    try {
      const payload = {
        name: data.name,
        age: Number(data.age),
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        allergies: data.allergies || '',
        medicalConditions: data.medicalConditions || '',
        recentSurgeries: data.recentSurgeries || '',
        implantedDevices: data.implantedDevices || '',
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        facialImagePreview: data.facialImagePreview || '',
      };

      const res = await fetch('/api/patient/profile', {
        method: mode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Failed to save');
      }

      const json = await res.json();
      const savedProfile = json?.profile;

      toast({
        title: mode === 'edit' ? 'Profile updated' : 'Registration successful',
        description: `${data.name}'s profile has been saved.`,
        variant: 'default',
      });

      if (onSuccess) onSuccess(savedProfile);

      form.reset();
      setFacialImageFile(null);
      setFacialImagePreview(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Unknown error';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age *</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="30" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || '')} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bloodGroup"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Blood Group *</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select blood group" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {bloodGroups.map(group => (
                      <SelectItem key={group} value={group}>{group}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="allergies"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allergies</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Penicillin, Peanuts" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="medicalConditions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Existing Medical Conditions</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Asthma, Diabetes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="recentSurgeries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recent Surgeries or Hospitalizations</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Appendix removal (2022)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="implantedDevices"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Implanted Devices</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Pacemaker, Stent" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <h3 className="text-lg font-semibold pt-4 border-t">Emergency Contact</h3>
         <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Phone *</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <h3 className="text-lg font-semibold pt-4 border-t">Facial Image</h3>
        <FormField
          control={form.control}
          name="facialImagePreview" // Storing the preview URL
          render={() => ( 
            <FormItem>
              <FormLabel>Upload Facial Image (Optional)</FormLabel>
              <FormControl>
                <Input type="file" accept="image/*" onChange={handleImageFileChange} className="mb-2" />
              </FormControl>
              <FormDescription>
                Alternatively, use webcam to capture an image.
              </FormDescription>
              <Dialog open={showWebcam} onOpenChange={setShowWebcam}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" onClick={() => setShowWebcam(true)}>
                    <Camera className="mr-2 h-4 w-4" /> Use Webcam
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                  <DialogHeader>
                    <DialogTitle>Capture Facial Image</DialogTitle>
                  </DialogHeader>
                  {showWebcam && <WebcamCapture onCapture={handleWebcamCapture} onCancel={() => setShowWebcam(false)} />}
                </DialogContent>
              </Dialog>
              {facialImagePreview && (
                <div className="mt-4">
                  <img src={facialImagePreview} alt="Facial preview" className="w-32 h-32 rounded-md object-cover border" />
                </div>
              )}
              <FormMessage /> 
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {mode === 'edit' ? 'Saving...' : 'Submitting...'}
            </>
          ) : (
            mode === 'edit' ? 'Update Profile' : 'Register Patient'
          )}
        </Button>
      </form>
    </Form>
  );
}
