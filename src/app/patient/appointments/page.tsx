"use client";

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const r = await fetch('/api/appointments', { cache: 'no-store' })
      const j = await r.json()
      setAppointments(j.appointments ?? [])
      setLoading(false)
    })()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>My Appointments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border">
                  <CardHeader className="flex-row items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="w-full space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-3 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No appointments booked yet.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.map((a: any) => {
                const doctorName = a.doctor?.name || 'Doctor'
                const initials = String(doctorName)
                  .split(' ')
                  .map((s: string) => s[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()
                const dateLabel = a.availability?.date ? new Date(a.availability.date).toLocaleDateString() : 'Date'
                const timeLabel = a.timeSlot || `${a.availability?.startTime ?? ''}–${a.availability?.endTime ?? ''}`
                return (
                  <Card key={a.id} className="hover:shadow-lg transition-shadow duration-200 border">
                    <CardHeader className="flex-row items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <CardTitle className="text-base truncate">{doctorName}</CardTitle>
                        <div className="text-xs text-muted-foreground truncate">{dateLabel}</div>
                      </div>
                      <div className="ml-auto">
                        {a.tokenNumber ? (
                          <Badge variant="secondary">Token #{a.tokenNumber}</Badge>
                        ) : null}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Time:</span> {timeLabel}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


