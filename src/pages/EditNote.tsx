import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSermonNote } from '../db/database'
import { getNoteType } from '../types'
import type { NoteType } from '../types'
import NoteForm from './NoteForm'
import QuietTimeForm from './QuietTimeForm'

export default function EditNote() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [noteType, setNoteType] = useState<NoteType | null>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    getSermonNote(id).then(note => {
      if (!note) { setNotFound(true); return }
      setNoteType(getNoteType(note))
    })
  }, [id])

  if (notFound) {
    navigate('/notes', { replace: true })
    return null
  }

  if (noteType === null) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-ivory-dim text-sm">Loading...</p>
      </div>
    )
  }

  return noteType === 'quiet_time' ? <QuietTimeForm mode="edit" /> : <NoteForm mode="edit" />
}
