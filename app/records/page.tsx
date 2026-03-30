'use client'

import { ChangeEvent, useEffect, useState } from 'react'
import { ActionLink, Panel, Screen } from '@/components/AppShell'
import { MedicalRecord, formatDate, supabase } from '@/lib/supabase'

export default function RecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [recordType, setRecordType] = useState('Ultrasound')
  const [recordDate, setRecordDate] = useState('')
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    const { data } = await supabase.from('medical_records').select('*').order('created_at', { ascending: false })
    setRecords((data as MedicalRecord[] | null) ?? [])
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    const filePath = `${Date.now()}-${file.name}`
    await supabase.storage.from('medical-records').upload(filePath, file, { upsert: true })
    const { data } = await supabase
      .from('medical_records')
      .insert({
        file_name: file.name,
        file_path: filePath,
        file_type: file.type || null,
        file_size: file.size,
        record_type: recordType,
        record_date: recordDate || null,
        notes: notes || null,
      })
      .select()
      .single()
    setRecords((current) => [data as MedicalRecord, ...current])
    setNotes('')
    setRecordDate('')
    setUploading(false)
    event.target.value = ''
  }

  return (
    <Screen eyebrow="Personal medical follow-up" title="Medical records" action={<ActionLink href="/more" label="More" />}>
      <Panel>
        <div className="grid grid-cols-1 gap-3">
          <input value={recordType} onChange={(event) => setRecordType(event.target.value)} placeholder="Record type" className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
          <input value={recordDate} onChange={(event) => setRecordDate(event.target.value)} type="date" className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Doctor notes, lab comments, follow-up plan" className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
          <label className="rounded-[18px] bg-mint px-4 py-3 text-center text-sm font-semibold text-slate-950">
            {uploading ? 'Uploading...' : 'Upload record'}
            <input type="file" className="hidden" onChange={handleUpload} />
          </label>
        </div>
      </Panel>
      <Panel>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Stored files</p>
        <div className="mt-4 space-y-3">
          {records.length === 0 && <p className="text-sm text-slate-400">No records uploaded yet.</p>}
          {records.map((record) => (
            <div key={record.id} className="rounded-[20px] border border-white/10 bg-black/15 p-4">
              <p className="text-sm font-semibold text-white">{record.file_name}</p>
              <p className="mt-1 text-xs text-slate-400">{record.record_type || 'Record'} {record.record_date ? `· ${formatDate(record.record_date)}` : ''}</p>
              {record.notes && <p className="mt-2 text-sm text-slate-300">{record.notes}</p>}
            </div>
          ))}
        </div>
      </Panel>
    </Screen>
  )
}

