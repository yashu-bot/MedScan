"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Bell } from 'lucide-react';

export default function PatientDashboardPage() {
  const [weather, setWeather] = useState<{ temperature?: number; humidity?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string }>>([])
  const [availability, setAvailability] = useState<Array<any>>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('')
  const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string>('')
  const [booking, setBooking] = useState(false)
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [loadingAvailability, setLoadingAvailability] = useState(false)
  const [heightCm, setHeightCm] = useState<string>('')
  const [weightKg, setWeightKg] = useState<string>('')
  const [plan, setPlan] = useState<{ bmi: number; category: string; goal: 'gain' | 'maintain' | 'lose'; tips: string[]; foods: string[]; activities: string[] } | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [doctorNotifications, setDoctorNotifications] = useState<Array<{ id: string; content: string; createdAt: string }>>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=17.385&longitude=78.4867&current=temperature_2m,relative_humidity_2m');
        const json = await res.json();
        setWeather({
          temperature: json?.current?.temperature_2m,
          humidity: json?.current?.relative_humidity_2m,
        });
      } catch {
        setWeather(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingDoctors(true)
      const r = await fetch('/api/doctors', { cache: 'no-store' })
      const j = await r.json()
      setDoctors((j.doctors ?? []).map((d: any) => ({ id: d.id, name: d.name })))
      setLoadingDoctors(false)
    })()
  }, [])

  useEffect(() => {
    (async () => {
      if (!selectedDoctorId) { setAvailability([]); setSelectedAvailabilityId(''); return }
      setLoadingAvailability(true)
      const r = await fetch(`/api/doctors/${selectedDoctorId}/availability`, { cache: 'no-store' })
      const j = await r.json()
      setAvailability(j.availability ?? [])
      setLoadingAvailability(false)
    })()
  }, [selectedDoctorId])

  const book = async () => {
    if (!selectedDoctorId || !selectedAvailabilityId) return
    setBooking(true)
    const res = await fetch('/api/appointments', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: selectedDoctorId, availabilityId: selectedAvailabilityId })
    })
    setBooking(false)
    if (res.ok) {
      alert('Appointment booked!')
    } else {
      const j = await res.json().catch(() => ({}))
      alert(j?.error || 'Failed to book')
    }
  }

  return (
    <div className="container mx-auto py-8">
      {/* Notifications button */}
      <div className="flex justify-end mb-4">
        <Dialog open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="inline-flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notifications
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Recent Notifications</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Button
                variant="secondary"
                className="w-full"
                onClick={async () => {
                  setLoadingNotifications(true)
                  const res = await fetch('/api/notifications', { cache: 'no-store' })
                  const j = await res.json().catch(() => ({}))
                  setDoctorNotifications(j.notifications || [])
                  setLoadingNotifications(false)
                }}
              >
                Load My Notifications
              </Button>
              {loadingNotifications ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : doctorNotifications.length === 0 ? (
                <div className="text-sm text-muted-foreground">No notifications</div>
              ) : (
                <div className="space-y-2">
                  {doctorNotifications.map(n => (
                    <Card key={n.id} className="p-3">
                      <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div>
                      <div className="text-sm whitespace-pre-wrap">{n.content}</div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Home</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading current conditions...</div>
          ) : weather ? (
            <div className="grid gap-2 text-sm">
              <div><strong>Temperature:</strong> {weather.temperature} °C</div>
              <div><strong>Humidity:</strong> {weather.humidity} %</div>
            </div>
          ) : (
            <div>Unable to load weather right now.</div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-md mt-6">
        <CardHeader>
          <CardTitle>AI Wellness Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="height" className="text-xs">Height (cm)</label>
              <Input id="height" inputMode="decimal" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="e.g. 170" />
            </div>
            <div>
              <label htmlFor="weight" className="text-xs">Weight (kg)</label>
              <Input id="weight" inputMode="decimal" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g. 68" />
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  const h = parseFloat(heightCm)
                  const w = parseFloat(weightKg)
                  if (!h || !w || h <= 0 || w <= 0) { setPlan(null); return }
                  const bmi = w / Math.pow(h / 100, 2)
                  let category = '' as string
                  let goal: 'gain' | 'maintain' | 'lose' = 'maintain'
                  if (bmi < 18.5) { category = 'Underweight'; goal = 'gain' }
                  else if (bmi < 25) { category = 'Normal'; goal = 'maintain' }
                  else if (bmi < 30) { category = 'Overweight'; goal = 'lose' }
                  else { category = 'Obesity'; goal = 'lose' }

                  const foods = goal === 'gain'
                    ? ['Lean proteins (eggs, chicken, paneer, legumes)', 'Whole grains (brown rice, oats, millets)', 'Healthy fats (nuts, seeds, avocado, peanut butter)', 'Dairy (milk, curd, yogurt)']
                    : goal === 'maintain'
                    ? ['Balanced plate: 1/2 veggies, 1/4 protein, 1/4 whole grains', 'Fruits, salads, probiotic curd', 'Adequate water and electrolytes']
                    : ['High-fiber veggies and salads', 'Lean proteins; limit refined carbs and sugars', 'Whole grains in controlled portions']

                  const activities = goal === 'gain'
                    ? ['Strength training 3–4x/week', 'Light cardio 2–3x/week', 'Progressive overload on major lifts']
                    : goal === 'maintain'
                    ? ['150 mins moderate activity/week', '2x/week strength training', 'Daily 7–8k steps']
                    : ['30–45 mins brisk walk or cycling 5x/week', '3x/week strength + core', 'NEAT: take stairs, short walks']

                  const tips = goal === 'gain'
                    ? ['Slight calorie surplus (+250–400 kcal/day)', '3 meals + 2 snacks; add milkshakes/smoothies']
                    : goal === 'maintain'
                    ? ['Stick to consistent meal timings', 'Sleep 7–8 hours; manage stress']
                    : ['Calorie deficit (–300 to –500 kcal/day)', 'Avoid late-night snacking; hydrate well']

                  setPlan({ bmi: Math.round(bmi * 10) / 10, category, goal, tips, foods, activities })
                }}
              >
                Get Guidance
              </Button>
            </div>
          </div>

          {plan && (
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="border">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Your Metrics</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div><span className="text-muted-foreground">BMI:</span> {plan.bmi}</div>
                  <div><span className="text-muted-foreground">Category:</span> {plan.category}</div>
                  <div><span className="text-muted-foreground">Goal:</span> {plan.goal === 'gain' ? 'Gain weight' : plan.goal === 'lose' ? 'Lose weight' : 'Maintain'}</div>
                </CardContent>
              </Card>

              <Card className="border">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">What to Eat</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {plan.foods.map((f, i) => (<li key={i}>{f}</li>))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {plan.activities.map((a, i) => (<li key={i}>{a}</li>))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="md:col-span-3 border">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {plan.tips.map((t, i) => (<li key={i}>{t}</li>))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="shadow-md mt-6">
        <CardHeader>
          <CardTitle>Book Appointment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs">Doctor</label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId} disabled={loadingDoctors}>
                <SelectTrigger className="w-full"><SelectValue placeholder={loadingDoctors ? 'Loading doctors…' : 'Select doctor'} /></SelectTrigger>
                <SelectContent>
                  {loadingDoctors ? (
                    <div className="p-2 space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                      ))}
                    </div>
                  ) : doctors.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">No doctors available</div>
                  ) : (
                    doctors.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs">Availability</label>
              <Select value={selectedAvailabilityId} onValueChange={setSelectedAvailabilityId} disabled={!selectedDoctorId || loadingAvailability}>
                <SelectTrigger className="w-full"><SelectValue placeholder={!selectedDoctorId ? 'Select a doctor first' : (loadingAvailability ? 'Loading availability…' : 'Select date & time')} /></SelectTrigger>
                <SelectContent>
                  {loadingAvailability ? (
                    <div className="p-2 space-y-2">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : availability.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">No slots available</div>
                  ) : (
                    availability.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>
                        {new Date(a.date).toLocaleDateString()} • {a.startTime}–{a.endTime}
                        <span className="ml-2">
                          <Badge variant="outline" className="text-xs font-normal">Remaining {a.remaining ?? a.capacity}</Badge>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Button onClick={book} disabled={!selectedDoctorId || !selectedAvailabilityId || booking}>{booking ? 'Booking...' : 'Book appointment'}</Button>
          </div>
        </CardContent>
      </Card>
      {/* Floating message button */}
      <a
        href="/patient/messages"
        className="fixed bottom-6 right-6 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 h-14 w-14"
        aria-label="Open messages"
      >
        {/* chat icon */}
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
          <path d="M2 12c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10a9.96 9.96 0 0 1-4.472-1.05L2 22l1.05-4.472A9.96 9.96 0 0 1 2 12Zm6-1h8v2H8v-2Zm0-3h8v2H8V8Zm0 6h5v2H8v-2Z" />
        </svg>
      </a>
    </div>
  );
}


