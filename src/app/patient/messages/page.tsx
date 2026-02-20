"use client";

import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Conversation {
  id: string
  doctorId: string
  doctor: { id: string; name: string; speciality: string }
  messages: Array<{ id: string; senderType: 'PATIENT' | 'DOCTOR'; content: string; createdAt: string; doctorName?: string }>
}

export default function PatientMessagesPage() {
  const [doctors, setDoctors] = useState<Array<{ id: string; name: string; speciality: string }>>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("")
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string>("")
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    ;(async () => {
      const r = await fetch('/api/doctors', { cache: 'no-store' })
      const j = await r.json()
      setDoctors((j.doctors ?? []).map((d: any) => ({ id: d.id, name: d.name, speciality: d.speciality })))
    })()
  }, [])

  useEffect(() => {
    if (!selectedDoctorId) return
    ;(async () => {
      const r = await fetch(`/api/messages?doctorId=${encodeURIComponent(selectedDoctorId)}`, { cache: 'no-store' })
      const j = await r.json()
      setConversation(j.conversation ?? null)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })()
  }, [selectedDoctorId])

  const send = async () => {
    setError("")
    if (!selectedDoctorId) { setError('Please select a doctor.'); return }
    if (!input.trim()) { return }
    setSending(true)
    const res = await fetch('/api/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctorId: selectedDoctorId, content: input.trim() })
    })
    if (res.ok) {
      setInput('')
      const j = await (await fetch(`/api/messages?doctorId=${encodeURIComponent(selectedDoctorId)}`, { cache: 'no-store' })).json()
      setConversation(j.conversation ?? null)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } else {
      try {
        const j = await res.json()
        setError(j?.error || 'Failed to send message')
      } catch {
        setError('Failed to send message')
      }
    }
    setSending(false)
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Message a Doctor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Doctor</label>
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select doctor" />
              </SelectTrigger>
              <SelectContent>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name} — {d.speciality}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="h-80 border rounded-md p-3 overflow-auto bg-background">
            {!conversation || (conversation.messages?.length ?? 0) === 0 ? (
              <div className="text-sm text-muted-foreground">No messages yet.</div>
            ) : (
              <div className="space-y-2">
                {conversation.messages.map(m => {
                  const name = m.senderType === 'DOCTOR' ? (m.doctorName || 'Doctor') : 'You'
                  const ts = new Date(m.createdAt).toLocaleString()
                  const isPatient = m.senderType === 'PATIENT'
                  return (
                    <div key={m.id} className={isPatient ? 'text-right' : 'text-left'}>
                      <div className={`inline-block px-3 py-2 rounded-md ${isPatient ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <div className={`text-xs opacity-80 mb-1 ${isPatient ? 'text-white/80' : 'text-foreground/70'}`}>{name} • {ts}</div>
                        <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your message..." onKeyDown={(e) => { if (e.key === 'Enter') send() }} />
            <Button onClick={send} disabled={sending || !selectedDoctorId || !input.trim()}>{sending ? 'Sending...' : 'Send'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


