import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft, Shield, Calendar, Info, Trash2,
  Download, Upload, Wrench, Wifi, Smartphone,
} from 'lucide-react'
import { clearAllData, exportAllData, importAllData, repairData } from '../db/database'
import { useToast } from '../components/Toast'
import { usePWA } from '../hooks/usePWA'
import { APP_VERSION } from '../lib/version'
import { formatDate } from '../lib/dates'
import type { SermonNote, PrayerPoint, ActionStep } from '../types'

interface ImportPreview {
  exportedAt?: string
  version?: number
  sermonNotes: SermonNote[]
  prayerPoints: PrayerPoint[]
  actionSteps: ActionStep[]
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-[10px] font-semibold text-ivory-dim uppercase tracking-widest mb-3 px-1">
      {children}
    </p>
  )
}

export default function Settings() {
  const { showToast } = useToast()
  const { isOnline, canInstall, triggerInstall } = usePWA()
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null)
  const [cleared, setCleared] = useState(false)
  const [importing, setImporting] = useState(false)
  const [repairing, setRepairing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    const data = await exportAllData()
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const date = new Date().toISOString().split('T')[0]
    a.download = `seeded-backup-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Backup downloaded')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string)
        if (!parsed || typeof parsed !== 'object') throw new Error('Not an object')
        setImportPreview({
          exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : undefined,
          version: typeof parsed.version === 'number' ? parsed.version : undefined,
          sermonNotes: Array.isArray(parsed.sermonNotes) ? parsed.sermonNotes : [],
          prayerPoints: Array.isArray(parsed.prayerPoints) ? parsed.prayerPoints : [],
          actionSteps: Array.isArray(parsed.actionSteps) ? parsed.actionSteps : [],
        })
        setShowImportConfirm(true)
      } catch {
        showToast('Could not read file — make sure it is a valid Seeded backup.', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleImport() {
    if (!importPreview) return
    setImporting(true)
    try {
      await importAllData(importPreview)
      setShowImportConfirm(false)
      setImportPreview(null)
      showToast('Data imported successfully')
    } catch {
      showToast('Import failed. Please try again.', 'error')
    } finally {
      setImporting(false)
    }
  }

  async function handleRepair() {
    setRepairing(true)
    try {
      const { removed, synced } = await repairData()
      const total = removed + synced
      showToast(total === 0 ? 'All data looks healthy' : `Repaired ${total} record${total !== 1 ? 's' : ''}`)
    } catch {
      showToast('Repair failed. Please try again.', 'error')
    } finally {
      setRepairing(false)
    }
  }

  async function handleClear() {
    await clearAllData()
    setShowClearConfirm(false)
    setCleared(true)
  }

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/" className="text-ivory-dim -ml-1 p-1" aria-label="Back to home">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </Link>
        <h1 className="text-xl font-semibold text-ivory tracking-tight">Settings</h1>
      </div>

      {/* About */}
      <SectionLabel>About</SectionLabel>
      <div className="space-y-3 mb-7">
        <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-forest-light flex items-center justify-center shrink-0">
              <Info size={17} className="text-gold" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-ivory">Seeded</p>
              <p className="text-xs text-ivory-dim mt-0.5">Version {APP_VERSION}</p>
            </div>
          </div>
          <p className="text-ivory-dim text-sm leading-relaxed">
            A dedicated sermon-notes app for capturing church messages, prayer points, reflections,
            and weekly action steps — so the Word can take root in everyday life.
          </p>
        </div>

        <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-forest-light flex items-center justify-center shrink-0">
              <Shield size={17} className="text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-ivory">Local-only Storage</p>
          </div>
          <p className="text-ivory-dim text-sm leading-relaxed">
            All your notes are stored on this device using IndexedDB. Nothing is sent to any server.
            Your reflections are yours alone.
          </p>
        </div>
      </div>

      {/* App & Offline */}
      <SectionLabel>App &amp; Offline</SectionLabel>
      <div className="space-y-3 mb-7">
        <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-forest-light flex items-center justify-center shrink-0">
              <Wifi size={17} className="text-gold" strokeWidth={1.5} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-ivory">Offline Support</p>
              <p className={`text-xs mt-0.5 font-medium ${isOnline ? 'text-emerald-400' : 'text-gold'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
          <p className="text-ivory-dim text-sm leading-relaxed">
            After your first visit, Seeded loads and works without an internet connection.
            Your notes are always available on this device.
          </p>
          <p className="text-ivory-dim text-sm leading-relaxed mt-2">
            Before clearing browser data or switching devices, export a backup from Backup &amp; Restore below.
          </p>
        </div>

        {canInstall && (
          <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-forest-light flex items-center justify-center shrink-0">
                <Smartphone size={17} className="text-gold" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-ivory">Install App</p>
            </div>
            <p className="text-ivory-dim text-sm leading-relaxed mb-4">
              Add Seeded to your home screen for a full-screen experience, even without internet.
            </p>
            <button
              onClick={triggerInstall}
              className="text-sm text-gold font-medium border border-gold/40 px-4 py-2 rounded-xl"
            >
              Add to Home Screen
            </button>
          </div>
        )}
      </div>

      {/* App Data */}
      <SectionLabel>App Data</SectionLabel>
      <div className="space-y-3 mb-7">
        <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-forest-light flex items-center justify-center shrink-0">
              <Calendar size={17} className="text-gold" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-ivory">Date Format</p>
              <p className="text-xs text-ivory-dim mt-0.5">dd/mm/yyyy throughout the app</p>
            </div>
          </div>
        </div>
      </div>

      {/* Backup & Restore */}
      <SectionLabel>Backup &amp; Restore</SectionLabel>
      <div className="space-y-3 mb-7">
        <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-forest-light flex items-center justify-center shrink-0">
              <Download size={17} className="text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-ivory">Export Data</p>
          </div>
          <p className="text-ivory-dim text-sm leading-relaxed mb-4">
            Download all your sermon notes, prayer points, and growth steps as a JSON backup file.
          </p>
          <button
            onClick={handleExport}
            className="text-sm text-gold font-medium border border-gold/40 px-4 py-2 rounded-xl"
          >
            Download Backup
          </button>
        </div>

        <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-forest-light flex items-center justify-center shrink-0">
              <Upload size={17} className="text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-ivory">Import Data</p>
          </div>
          <p className="text-ivory-dim text-sm leading-relaxed mb-4">
            Restore from a Seeded backup JSON file. Your existing data will be kept — only records with matching IDs will be updated.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-gold font-medium border border-gold/40 px-4 py-2 rounded-xl"
          >
            Choose Backup File
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <SectionLabel>Danger Zone</SectionLabel>
      <div className="space-y-3 mb-8">
        <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-forest-light flex items-center justify-center shrink-0">
              <Wrench size={17} className="text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-ivory">Repair Local Data</p>
          </div>
          <p className="text-ivory-dim text-sm leading-relaxed mb-4">
            Scan for orphaned prayer points or growth steps and sync sermon titles into linked records.
          </p>
          <button
            onClick={handleRepair}
            disabled={repairing}
            className="text-sm text-gold font-medium border border-gold/40 px-4 py-2 rounded-xl disabled:opacity-50"
          >
            {repairing ? 'Checking…' : 'Repair Data'}
          </button>
        </div>

        <div className="bg-forest-mid rounded-2xl p-5 border border-forest-light">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-forest-light flex items-center justify-center shrink-0">
              <Trash2 size={17} className="text-gold" strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-ivory">Clear All Data</p>
          </div>
          {cleared ? (
            <p className="text-emerald-400 text-sm">All data has been cleared.</p>
          ) : (
            <>
              <p className="text-ivory-dim text-sm leading-relaxed mb-4">
                Permanently delete all sermon notes, prayer points, and growth steps from this device. This cannot be undone.
              </p>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-sm text-red-400 font-medium border border-red-700/40 px-4 py-2 rounded-xl"
              >
                Clear All Data
              </button>
            </>
          )}
        </div>
      </div>

      <p className="text-center text-ivory-dim text-xs">Let the Word take root.</p>

      {/* Clear Confirm Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-5">
          <div className="bg-forest-mid border border-forest-light rounded-3xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-ivory mb-2">Clear all data?</h2>
            <p className="text-ivory-dim text-sm mb-6 leading-relaxed">
              This will permanently delete all your sermon notes, prayer points, and growth steps from this device.
              This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 border border-forest-light text-ivory py-3 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="flex-1 bg-red-700 text-white py-3 rounded-xl text-sm font-semibold"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Confirm Modal */}
      {showImportConfirm && importPreview && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-5">
          <div className="bg-forest-mid border border-forest-light rounded-3xl p-6 w-full max-w-sm">
            <h2 className="text-lg font-semibold text-ivory mb-2">Import this backup?</h2>
            {importPreview.exportedAt && (
              <p className="text-ivory-dim text-xs mb-3">
                Exported on {formatDate(importPreview.exportedAt)}
                {importPreview.version ? ` · v${importPreview.version}` : ''}
              </p>
            )}
            <p className="text-ivory-dim text-sm mb-3 leading-relaxed">This file contains:</p>
            <ul className="text-ivory text-sm space-y-1 mb-4 pl-1">
              <li>· {importPreview.sermonNotes.length} sermon note{importPreview.sermonNotes.length !== 1 ? 's' : ''}</li>
              <li>· {importPreview.prayerPoints.length} prayer point{importPreview.prayerPoints.length !== 1 ? 's' : ''}</li>
              <li>· {importPreview.actionSteps.length} growth step{importPreview.actionSteps.length !== 1 ? 's' : ''}</li>
            </ul>
            <p className="text-ivory-dim text-xs mb-6 leading-relaxed">
              This will <strong className="text-ivory">merge</strong> into your existing data. Records with matching IDs will be updated. No existing data will be deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowImportConfirm(false); setImportPreview(null) }}
                className="flex-1 border border-forest-light text-ivory py-3 rounded-xl text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 bg-gold text-forest py-3 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {importing ? 'Importing…' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
