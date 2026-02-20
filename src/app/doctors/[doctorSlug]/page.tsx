"use client";

import { useMemo, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePatientData } from '@/context/PatientDataContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import EmergencyNotificationPanel from '@/components/core/emergency-notification-panel';

export default function DoctorPatientsPage() {
  const params = useParams();
  const doctorSlug = typeof params?.doctorSlug === 'string' ? params.doctorSlug : Array.isArray(params?.doctorSlug) ? params?.doctorSlug[0] : '';
  const { patients } = usePatientData();
  const router = useRouter();
  const [doctorId, setDoctorId] = useState<string>('')
  const [availability, setAvailability] = useState<Array<any>>([])
  const [date, setDate] = useState<string>('')
  const [startTime, setStartTime] = useState<string>('')
  const [endTime, setEndTime] = useState<string>('')
  const [capacity, setCapacity] = useState<number>(10)
  const [saving, setSaving] = useState<boolean>(false)
  const [appointments, setAppointments] = useState<Array<any>>([])
  const [loadingAppointments, setLoadingAppointments] = useState<boolean>(false)
  const [selectedApptId, setSelectedApptId] = useState<string>('')
  const [confirmOpen, setConfirmOpen] = useState<boolean>(false)

  useEffect(() => {
    ;(async () => {
      // resolve doctor id by slug using /api/doctors list
      const r = await fetch('/api/doctors', { cache: 'no-store' })
      const j = await r.json()
      const toSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      const match = (j.doctors ?? []).find((d: any) => toSlug(d.name) === doctorSlug)
      if (match?.id) {
        setDoctorId(match.id)
        const av = await fetch(`/api/doctors/${match.id}/availability`, { cache: 'no-store' })
        const aj = await av.json()
        setAvailability(aj.availability ?? [])
        setLoadingAppointments(true)
        const ap = await fetch(`/api/doctors/${match.id}/appointments`, { cache: 'no-store' })
        const apj = await ap.json()
        setAppointments(apj.appointments ?? [])
        setLoadingAppointments(false)
      }
    })()
  }, [doctorSlug])

  const addAvailability = async () => {
    if (!doctorId || !date || !startTime || !endTime || !capacity) return
    setSaving(true)
    const res = await fetch(`/api/doctors/${doctorId}/availability`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, startTime, endTime, capacity: Number(capacity) })
    })
    if (res.ok) {
      const aj = await (await fetch(`/api/doctors/${doctorId}/availability`, { cache: 'no-store' })).json()
      setAvailability(aj.availability ?? [])
      setDate(''); setStartTime(''); setEndTime(''); setCapacity(10)
    }
    setSaving(false)
  }

  const markCompleted = async () => {
    if (!doctorId || !selectedApptId) return
    const res = await fetch(`/api/doctors/${doctorId}/appointments/${selectedApptId}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      setAppointments(prev => prev.filter(a => a.id !== selectedApptId))
      setSelectedApptId('')
    } else {
      const j = await res.json().catch(() => ({}))
      alert(j?.error || 'Failed to mark completed')
    }
  }

  const doctorName = useMemo(() => {
    const words = doctorSlug.split('-').filter(Boolean);
    if (words.length === 0) return 'Doctor';
    const reconstructed = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    return reconstructed.startsWith('Dr') ? reconstructed : `Dr ${reconstructed}`;
  }, [doctorSlug]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Emergency Notification Panel */}
      <EmergencyNotificationPanel doctorSlug={doctorSlug} />
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{doctorName}'s Patients</CardTitle>
              <CardDescription>All registered patients with name and contact number.</CardDescription>
            </div>
            <Button onClick={() => router.push(`/face-scan?doctor=${encodeURIComponent(doctorSlug)}`)}>Face Scan</Button>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Availability</CardTitle>
          <CardDescription>Add your availability and capacity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs">Start Time</label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <label className="text-xs">End Time</label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div>
              <label className="text-xs">Capacity</label>
              <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value || 0))} />
            </div>
            <div className="flex items-end">
              <Button onClick={addAvailability} disabled={!doctorId || !date || !startTime || !endTime || !capacity || saving}>{saving ? 'Saving...' : 'Add'}</Button>
            </div>
          </div>

          <div className="mt-4 text-sm text-muted-foreground">Upcoming availability</div>
          {availability.length === 0 ? (
            <div className="mt-2 text-sm">No availability yet.</div>
          ) : (
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availability.map((a: any) => (
                <Card key={a.id} className="border hover:shadow-md transition-shadow">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">{new Date(a.date).toLocaleDateString()}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{a.startTime} – {a.endTime}</Badge>
                      <Badge variant="secondary">Capacity {a.capacity}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Registered Patients</CardTitle>
          <CardDescription>Showing {patients.length} patients</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact Number</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.emergencyContactPhone}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>Patients booked for your availability</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-muted-foreground">
              {loadingAppointments ? 'Loading…' : `${appointments.length} upcoming`}
            </div>
            <div>
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="secondary" disabled={!selectedApptId}>Checkup completed</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Mark checkup as completed?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the selected appointment from Upcoming Appointments. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={markCompleted}>Confirm</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          {loadingAppointments ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border">
                  <CardHeader className="py-3">
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 space-y-2">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-sm text-muted-foreground">No appointments yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {appointments.map((a: any) => {
                const displayName = a.user?.profile?.name || a.user?.username || 'Patient'
                const dateLabel = a.availability?.date ? new Date(a.availability.date).toLocaleDateString() : '-'
                const timeLabel = a.timeSlot || `${a.availability?.startTime ?? ''}–${a.availability?.endTime ?? ''}`
                const selected = selectedApptId === a.id
                return (
                  <Card key={a.id} className={`border hover:shadow-md transition-shadow ${selected ? 'ring-2 ring-primary' : ''}`}>
                    <CardHeader className="py-3">
                      <button className="text-left font-medium hover:underline" onClick={() => setSelectedApptId(selected ? '' : a.id)}>
                        {displayName}
                      </button>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3 text-sm space-y-1">
                      <div><span className="text-muted-foreground">Date:</span> {dateLabel}</div>
                      <div><span className="text-muted-foreground">Time:</span> {timeLabel}</div>
                      {a.tokenNumber ? (
                        <div><Badge variant="secondary">Token #{a.tokenNumber}</Badge></div>
                      ) : null}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


