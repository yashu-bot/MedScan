
"use client";

import { LocationMap } from '@/components/dashboard/location-map';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from 'lucide-react';

export default function LiveLocationPage() {
  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Navigation className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl">Your Live Location</CardTitle>
          </div>
          <CardDescription className="text-md">
            This page attempts to display your current location using your browser's geolocation feature on Google Maps.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LocationMap initialPatients={[]} showUserLocation={true} mapHeight="calc(100vh - 22rem)" /> 
           <p className="mt-4 text-sm text-muted-foreground text-center">
            Note: This map shows your browser-reported location. 
            Accuracy depends on your device and browser settings. 
            A valid Google Maps API key is required for the map to function.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
