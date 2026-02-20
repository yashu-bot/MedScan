
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bot } from "lucide-react";
import SymptomChecker from '@/components/dashboard/symptom-checker';
import ReportSummarizer from '@/components/dashboard/report-summarizer';
import PrescriptionHelper from '@/components/dashboard/prescription-helper';


export default function UserDashboardPage() {
    return (
        <div className="container mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-3xl"><Bot className="h-8 w-8 text-primary"/>AI Clinical Tools</CardTitle>
                    <CardDescription className="text-md">
                        Use AI-powered tools to assist with clinical analysis and understanding. These tools are for informational purposes.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="symptom_checker" className="w-full">
                        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            <TabsTrigger value="symptom_checker">Symptom Checker</TabsTrigger>
                            <TabsTrigger value="report_summarizer">Report Summarizer</TabsTrigger>
                            <TabsTrigger value="prescription_helper">Prescription Helper</TabsTrigger>
                        </TabsList>
                        <TabsContent value="symptom_checker" className="mt-6">
                            <SymptomChecker />
                        </TabsContent>
                        <TabsContent value="report_summarizer" className="mt-6">
                            <ReportSummarizer />
                        </TabsContent>
                        <TabsContent value="prescription_helper" className="mt-6">
                            <PrescriptionHelper />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}
