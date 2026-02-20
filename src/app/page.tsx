
"use client"; 

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Heart, ShieldCheck, UserPlus, Zap, LogIn, ArrowRight, Bot } from "lucide-react"; 
import Link from "next/link";
import Image from 'next/image';
import { useAuth } from "@/context/AuthContext"; 
import { useRouter } from 'next/navigation'; 
 

export default function HomePage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  const handleLogin = () => {
    router.push('/login');
  };

  const handleOrdersAccess = () => {
    router.push('/orders');
  }

  

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative py-20 md:py-32 text-primary-foreground"
        style={{
          backgroundImage: "url('/images/backgrounds/home-hero.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="container mx-auto px-6 text-center">
          {/* Logo removed from here */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 pt-8 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.5)]"> {/* Added pt-8 for spacing if logo was tall */}
            Welcome to MedScan360
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-blue-100 max-w-3xl mx-auto mb-10 drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            Your comprehensive solution for emergency medical data management. Streamline patient care from first response to hospital admission.
          </p>
          <div className="flex flex-wrap justify-center items-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 shadow-xl transform hover:scale-105 transition-transform duration-150 w-full sm:w-auto py-3 px-8"
              asChild
            >
              <Link href="/register">
                <UserPlus className="mr-2 h-5 w-5" /> Register New Patient
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white/20 hover:text-white shadow-xl transform hover:scale-105 transition-transform duration-150 w-full sm:w-auto py-3 px-8"
              onClick={handleLogin}
            >
              <LogIn className="mr-2 h-5 w-5" /> Access Professional Dashboard
            </Button>
             <Button 
              variant="secondary" 
              size="lg" 
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl transform hover:scale-105 transition-transform duration-150 w-full sm:w-auto py-3 px-8"
              asChild
            >
              <Link href="/user-dashboard">
                <Bot className="mr-2 h-5 w-5" /> Try MedScan AI
              </Link>
            </Button>
            
          </div>
          <div className="mt-6 flex justify-center gap-4">
            <button aria-label="orders-access" onClick={handleOrdersAccess} className="w-10 h-10 rounded-full border border-white/60 hover:bg-white/10 transition-colors" />
            <Link href="/employees" aria-label="add-employee" className="w-10 h-10 rounded-full border border-white/60 hover:bg-white/10 transition-colors flex items-center justify-center">
              <span className="sr-only">Add Employee</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Overview Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-semibold text-center text-primary mb-4">
            Key Benefits for Your Team
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            MedScan360 is designed to enhance efficiency and accuracy in critical situations.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            <BenefitCard
              icon={Zap}
              title="Rapid Identification"
              description="Swiftly identify patients using advanced (simulated) face scan technology, saving crucial seconds."
            />
            <BenefitCard
              icon={FileText}
              title="Centralized Records"
              description="Access and manage all patient information, from registration to emergency forms, in one secure place."
            />
            <BenefitCard
              icon={Heart}
              title="Enhanced Coordination"
              description="Improve team collaboration with shared access to vital patient data and (simulated) live location tracking."
            />
          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-6 text-center">
          <ShieldCheck className="w-16 h-16 text-accent mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-semibold text-primary mb-6">
            Ready to Streamline Your Workflow?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join other medical professionals who are enhancing their emergency response capabilities with MedScan360.
          </p>
          <Button 
            size="lg" 
            className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-xl transform hover:scale-105 transition-transform duration-150 py-3 px-10"
            onClick={handleLogin}
          >
            Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-muted-foreground border-t bg-background">
        <p>&copy; {new Date().getFullYear()} MedScan360. Advanced Emergency Medical Systems. </p>
      </footer>
    </div>
  );
}

interface BenefitCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function BenefitCard({ icon: Icon, title, description }: BenefitCardProps) {
  return (
    <Card className="flex flex-col items-center text-center p-6 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card">
      <div className="p-4 bg-primary/10 rounded-full mb-4">
        <Icon className="w-10 h-10 text-primary" />
      </div>
      <CardTitle className="text-xl font-semibold text-primary mb-2">{title}</CardTitle>
      <CardDescription className="text-base">{description}</CardDescription>
    </Card>
  );
}
