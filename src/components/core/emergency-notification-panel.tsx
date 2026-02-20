"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Phone, User, Clock, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmergencyNotification {
  id: string;
  content: string;
  createdAt: string;
  senderType: string;
}

interface EmergencyNotificationPanelProps {
  doctorSlug: string;
  className?: string;
}

export default function EmergencyNotificationPanel({ 
  doctorSlug, 
  className = "" 
}: EmergencyNotificationPanelProps) {
  const [notifications, setNotifications] = useState<EmergencyNotification[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [doctorSlug]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/notifications/emergency?doctorSlug=${encodeURIComponent(doctorSlug)}`);
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    toast({
      title: "Notification Dismissed",
      description: "Emergency notification has been dismissed.",
    });
  };

  const dismissAll = () => {
    setNotifications([]);
    toast({
      title: "All Notifications Dismissed",
      description: "All emergency notifications have been cleared.",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const extractContactInfo = (content: string) => {
    const nameMatch = content.match(/Name: ([^\n]+)/);
    const phoneMatch = content.match(/Phone: ([^\n]+)/);
    return {
      name: nameMatch ? nameMatch[1].trim() : 'Unknown',
      phone: phoneMatch ? phoneMatch[1].trim() : 'Unknown'
    };
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md ${className}`}>
      <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <CardTitle className="text-lg text-red-800 dark:text-red-200">
                Emergency Alerts
              </CardTitle>
            </div>
            <div className="flex gap-1">
              {notifications.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissAll}
                  className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-red-700 dark:text-red-300">
            Patient face scan matches requiring immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((notification) => {
            const contactInfo = extractContactInfo(notification.content);
            return (
              <div
                key={notification.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-200 dark:border-red-700"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="destructive" className="text-xs">
                    EMERGENCY
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {formatTime(notification.createdAt)}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">{contactInfo.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-green-600" />
                    <span className="font-mono">{contactInfo.phone}</span>
                  </div>
                  
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                    Patient identified via face scan - Contact emergency contact immediately
                  </p>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 text-xs"
                    onClick={() => {
                      // Copy phone number to clipboard
                      navigator.clipboard.writeText(contactInfo.phone);
                      toast({
                        title: "Phone Number Copied",
                        description: `${contactInfo.phone} copied to clipboard`,
                      });
                    }}
                  >
                    Copy Phone
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => dismissNotification(notification.id)}
                    className="text-xs"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            );
          })}
          
          {isLoading && (
            <div className="text-center py-2">
              <div className="text-sm text-gray-500">Checking for new alerts...</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

