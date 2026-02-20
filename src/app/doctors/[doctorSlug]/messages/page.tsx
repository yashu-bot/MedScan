"use client";

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Conversation {
  id: string
  doctorId: string
  user?: { id: string; username: string }
  messages: Array<{ id: string; senderType: 'PATIENT' | 'DOCTOR'; content: string; createdAt: string; doctorName?: string }>
}

export default function DoctorMessagesPage() {
  const params = useParams()
  const doctorSlug = typeof params?.doctorSlug === 'string' ? params.doctorSlug : Array.isArray(params?.doctorSlug) ? params?.doctorSlug[0] : ''
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [doctorId, setDoctorId] = useState<string>('')
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const load = async () => {
    // Resolve doctorId from slug by looking up doctors list
    const list = await fetch('/api/doctors', { cache: 'no-store' })
    const lj = await list.json()
    const toSlug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    const match = (lj.doctors ?? []).find((d: any) => toSlug(d.name) === doctorSlug)
    if (!match) { setDoctorId(''); setConversation(null); return }
    setDoctorId(match.id)
    const r = await fetch(`/api/doctors/${match.id}/messages`, { cache: 'no-store' })
    const j = await r.json()
    setConversation(j.conversation ?? null)
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  useEffect(() => { if (doctorSlug) load() }, [doctorSlug])

  const send = async () => {
    if (!input.trim()) return
    if (!doctorId) return
    const r = await fetch(`/api/doctors/${doctorId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input.trim() })
    })
    if (r.ok) {
      setInput('')
      await load()
    }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Patient Messages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">{conversation ? 'Conversation loaded.' : 'No conversation yet.'}</div>

          <div className="h-80 border rounded-md p-3 overflow-auto bg-background">
            {!conversation || (conversation.messages?.length ?? 0) === 0 ? (
              <div className="text-sm text-muted-foreground">No messages yet.</div>
            ) : (
              <div className="space-y-2">
                {conversation.messages.map(m => {
                  const name = m.senderType === 'DOCTOR' ? (m.doctorName || 'Doctor') : (conversation?.user?.username || 'Patient')
                  const ts = new Date(m.createdAt).toLocaleString()
                  const isDoctor = m.senderType === 'DOCTOR'
                  return (
                    <div key={m.id} className={isDoctor ? 'text-right' : 'text-left'}>
                      <div className={`inline-block px-3 py-2 rounded-md ${isDoctor ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <div className={`text-xs opacity-80 mb-1 ${isDoctor ? 'text-white/80' : 'text-foreground/70'}`}>{name} • {ts}</div>
                        <div className="text-sm whitespace-pre-wrap">{m.content}</div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your reply..." onKeyDown={(e) => { if (e.key === 'Enter') send() }} />
            <Button onClick={send}>Reply</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


