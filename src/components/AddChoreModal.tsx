// src/components/AddChoreModal.tsx
'use client'

import { Fragment, useState, FormEvent, useEffect, useRef, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { 
  X, Loader2, User, Home, Calendar, Repeat, Wand2, Clock, 
  Coffee, Sun, Moon, PlusCircle, Check, Copy, Trash2, Ban, 
  Sparkles, Save, Users, ShoppingCart, Shield, Feather, MoreVertical 
} from 'lucide-react'
import { createChore } from '@/app/chore-actions'
import { createTemplate, deleteTemplate } from '@/app/template-actions'
import { DbProfile, DbRoom, DbTemplate } from '@/types/database'
import { useRouter } from 'next/navigation'
import {FZ} from 'sonner' // Fake import to fix auto-import issues, actually using toast below
import { toast } from 'sonner'
import { parseChoreInput } from '@/lib/smart-parser'
import { useGameFeel } from '@/hooks/use-game-feel'
import Avatar from './Avatar'

type Props = {
  isOpen: boolean
  members: Pick<DbProfile, 'id' | 'full_name' | 'avatar_url'>[]
  rooms: DbRoom[]
  currentUserId: string
  templates?: DbTemplate[]
}

type TimeOption = 'morning' | 'afternoon' | 'evening' | 'any';

// Helper for fixed positioning
type MenuPosition = { x: number, y: number, id: number } | null;

function ChoreForm({ 
  closeModal, 
  members, 
  rooms,
  currentUserId,
  templates = []
}: { 
  closeModal: () => void, 
  members: Props['members'], 
  rooms: Props['rooms'],
  currentUserId: string,
  templates?: DbTemplate[]
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [smartInput, setSmartInput] = useState('')
  const { interact,Tv, triggerHaptic } = useGameFeel()
  const [isShaking, setIsShaking] = useState(false)
  
  // --- Form State ---
  const [name, setName] = useState('')
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [roomId, setRoomId] = useState('')
  
  // Date & Deadline States
  const [dueDate, setDueDate] = useState('')
  const [hasDueDate, setHasDueDate] = useState(true)
  const [deadlineType, setDeadlineType] = useState<'soft' | 'hard'>('soft')
  
  const [timeOfDay, setTimeOfDay] = useState<TimeOption>('any')
  const [exactTime, setExactTime] = useState('')
  
  // Advanced Recurrence State
  const [recurrenceFreq, setRecurrenceFreq] = useState('none')
  const [recurrenceInterval, setRecurrenceInterval] = useState<number | string>(1)
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('')
  
  // Rotation State
  const [isRotating, setIsRotating] = useState(false)

  // Instance State
  const [instanceCount, setInstanceCount] = useState<number | string>(1)

  // Subtasks State
  const [subtasks, setSubtasks] = useState<string[]>([])
  const [newSubtask, setNewSubtask] = useState('')

  // Template Save State
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [notes, setNotes] = useState('')

  // Intelligence Feedback State
  const [detectedTags, setDetectedTags] = useState<string[]>([])
  const [isShopping, setIsShopping] = useState(false)

  // Template Context Menu State (Updated for Fixed Positioning)
  const [menuPosition, setMenuPosition] = useState<MenuPosition>(null)
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)

  const toggleMember = (id: string) => {
    interact('neutral')
    setAssignedIds(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const addSubtask = () => {
    if(newSubtask.trim()) {
        setSubtasks([...subtasks, newSubtask.trim()])
        setNewSubtask('')
    }
  }

  // --- Template Logic ---
  const applyTemplate = (template: DbTemplate) => {
    interact('success')
    setName(template.name)
    // Handle JSONB parsing safely
    let parsedSubtasks: string[] = []
    if (Array.isArray(template.subtasks)) {
        parsedSubtasks = template.subtasks
    } else if (typeof template.subtasks === 'string') {
        try { parsedSubtasks = JSON.parse(template.subtasks) } catch {}
    }
    
    setSubtasks(parsedSubtasks)
    setSmartInput('') 
    setDetectedTags(['Template Applied'])
    toast.success(`Applied "${template.name}"`)
  }

  const handleTemplateStart = (e: React.TouchEvent | React.MouseEvent, templateId: number) => {
    // Get coordinates depending on event type
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY

    longPressTimer.current = setTimeout(() => {
        triggerHaptic('medium')
        setMenuPosition({ x: clientX, y: clientY, id: templateId })
    }, 500) // 500ms long press
  }

  const handleTemplateEnd = (template: DbTemplate) => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
        // If we didn't trigger context menu (menuPosition is null), then treat as click
        if (!menuPosition) {
            applyTemplate(template)
        }
    }
  }

  const handleTouchMove = () => {
    if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
    }
  }

  const handleDeleteTemplate = async () => {
      if (!menuPosition) return
      const id = menuPosition.id
      setMenuPosition(null)

      if(!confirm('Delete this template permanently?')) return
      
      const result = await deleteTemplate(id)
      if(result.success) {
          toast.success('Template deleted')
          router.refresh() 
      } else {
          toast.error('Failed to delete')
      }
  }

  const handleEditTemplate = () => {
      if (!menuPosition) return
      const template = templates.find(t => t.id === menuPosition.id)
      if (template) {
        applyTemplate(template)
        toast.info("Template loaded. Make changes and save as new.")
      }
      setMenuPosition(null)
  }

  // --- Date Logic ---
  const clearDueDate = () => {
      setDueDate('')
      setHasDueDate(false)
      setDeadlineType('soft') // Reset strictness
  }

  const enableDueDate = () => {
      setHasDueDate(true)
      if (!dueDate) setDueDate(new Date().toISOString().split('T')[0])
  }

  // --- Smart Parsing Logic ---
  useEffect(() => {
    const timer = setTimeout(() => {
        if (!smartInput.trim()) {
            setDetectedTags([])
            setIsShopping(false)
            return
        }

        const parsed = parseChoreInput(smartInput, members, rooms, currentUserId)
        
        if (parsed.name) setName(parsed.name)
        if (parsed.roomId) setRoomId(parsed.roomId.toString())
        if (parsed.assignedTo) setAssignedIds([parsed.assignedTo]) 
        
        if (parsed.recurrence) {
            if (parsed.recurrence.startsWith('custom:')) {
                const parts = parsed.recurrence.split(':')
                setRecurrenceFreq(parts[1])
                setRecurrenceInterval(parseInt(parts[2]) || 1)
            } else {
                setRecurrenceFreq(parsed.recurrence)
                setRecurrenceInterval(1)
            }
        }
        
        if (parsed.dueDate) {
            setDueDate(parsed.dueDate)
            setHasDueDate(true)
        }
        if (parsed.timeOfDay) setTimeOfDay(parsed.timeOfDay)
        
        if (parsed.exactTime) setExactTime(parsed.exactTime)
        
        if (parsed.instances && parsed.instances > 1) {
            setInstanceCount(parsed.instances)
        }

        if (parsed.subtasks.length > 0) setSubtasks(parsed.subtasks)

        setIsShopping(parsed.isShoppingList)
        setDetectedTags(parsed.tags)

    }, 500)

    return () => clearTimeout(timer)
  }, [smartInput, members, rooms, currentUserId])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    
    if (!name.trim()) {
        setIsShaking(true)
        triggerHaptic('medium')
        toast.error("Please give your chore a name")
        setTimeout(() => setIsShaking(false), 500)
        return
    }

    setPending(true)
    
    const formData = new FormData(event.currentTarget)
    formData.append('timeOfDay', timeOfDay)
    formData.append('assignedTo', JSON.stringify(assignedIds))
    formData.append('rotateAssignees', String(isRotating)) 
    formData.append('deadlineType', deadlineType) // NEW: Hard vs Soft
    
    const finalInstances = instanceCount === '' ? 1 : Number(instanceCount)
    formData.append('instances', finalInstances.toString())
    formData.append('subtasks', JSON.stringify(subtasks))

    if (!hasDueDate) {
        formData.delete('dueDate')
    }

    let finalRecurrence = 'none'
    if (recurrenceFreq !== 'none') {
        const finalInterval = recurrenceInterval === '' ? 1 : Number(recurrenceInterval)
        const base = finalInterval > 1 
            ? `custom:${recurrenceFreq}:${finalInterval}` 
            : recurrenceFreq
        
        if (recurrenceEndDate) {
            const safeBase = finalInterval === 1 && !base.startsWith('custom') 
                ? `custom:${recurrenceFreq}:1` 
                : base.startsWith('custom') ? base : `custom:${recurrenceFreq}:${finalInterval}`
            
            finalRecurrence = `${safeBase}:${recurrenceEndDate}`
        } else {
            finalRecurrence = base
        }
    }
    formData.set('recurrence_type', finalRecurrence)

    // --- Optimistic Close ---
    // Close immediately to improve perceived performance
    closeModal()
    toast.promise(
        async () => {
            // 1. Create Chore
            const result = await createChore(formData)
            
            // 2. Create Template (if checked)
            if (saveAsTemplate) {
                const templateFormData = new FormData()
                templateFormData.append('name', name)
                templateFormData.append('subtasks', JSON.stringify(subtasks))
                await createTemplate(templateFormData)
            }

            if (!result.success) throw new Error(result.message)
            
            // Background refresh
            router.refresh()
            return result.message
        },
        {
            loading: 'Creating...',
            success: (msg) => `${msg}`,
            error: (err) => `Error: ${err.message}`
        }
    )
  }

  return (
    <>
        <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* --- SMART INPUT HERO --- */}
        <div className="relative space-y-3">
            <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-500 ${isShopping ? 'text-green-600' : 'text-brand'}`}>
                    {isShopping ? <ShoppingCart className="h-5 w-5 animate-bounce" /> : <Wand2 className="h-5 w-5 animate-pulse" />}
                </div>
                <input
                    type="text"
                    value={smartInput}
                    onChange={(e) => setSmartInput(e.target.value)}
                    placeholder={isShopping ? "Add items to list..." : "e.g. 'Deep clean bathroom for Ben tomorrow'"}
                    className={`
                        block w-full rounded-2xl border-2 p-4 pl-10 text-lg font-medium focus:ring-0 transition-all duration-500 bg-background
                        ${isShopping 
                            ? 'border-green-200 bg-green-50 dark:bg-green-900/10 focus:border-green-500 text-green-900 dark:text-green-300 placeholder:text-green-700/50' 
                            : 'border-brand/20 bg-brand/5 dark:bg-brand/10 focus:border-brand text-foreground placeholder:text-muted-foreground'
                        }
                    `}
                    autoFocus
                    autoCapitalize="sentences"
                    autoComplete="off"
                />
            </div>
            
            {/* INTELLIGENCE FEEDBACK & TEMPLATES */}
            <div className="min-h-[2rem] flex flex-wrap gap-2 items-center">
                {detectedTags.length > 0 ? (
                    detectedTags.map((tag, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-brand/10 text-brand-dark dark:text-brand-light text-[10px] font-bold uppercase tracking-wider animate-in zoom-in slide-in-from-left-2" style={{ animationDelay: `${i * 100}ms` }}>
                            <Sparkles className="h-3 w-3" /> {tag}
                        </span>
                    ))
                ) : templates.length > 0 && !smartInput && (
                    <div className="flex gap-2 overflow-x-auto pb-4 -mb-4 no-scrollbar mask-gradient items-center w-full touch-pan-x">
                        <span className="text-xs font-bold text-text-secondary self-center mr-1 flex-shrink-0">Your Templates:</span>
                        {templates.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onTouchStart={(e) => handleTemplateStart(e, t.id)}
                                onTouchEnd={() => handleTemplateEnd(t)}
                                onTouchMove={handleTouchMove}
                                onMouseDown={(e) => handleTemplateStart(e, t.id)} // Desktop testing
                                onMouseUp={() => handleTemplateEnd(t)}
                                className={`
                                    flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs font-medium transition-all shadow-sm select-none active:scale-95
                                    ${menuPosition?.id === t.id ? 'ring-2 ring-brand border-brand' : 'text-text-secondary hover:border-brand hover:text-brand'}
                                `}
                            >
                                <Sparkles className="h-3 w-3 text-brand/70" />
                                {t.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        <div className="h-px bg-border w-full" />

        {/* NAME FIELD */}
        <div>
            <label htmlFor="name" className="block font-heading text-sm font-medium text-text-primary">
            Chore Name
            </label>
            <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-1 block w-full rounded-xl border bg-background p-3 transition-all focus:border-brand focus:ring-brand ${isShaking ? 'border-red-500 ring-2 ring-red-200 animate-shake' : 'border-border'}`}
                autoCapitalize="sentences"
            />
        </div>

        {/* ASSIGN TO */}
        <div>
            <label className="block font-heading text-sm font-medium text-text-primary mb-2">
            Assign To
            </label>
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={() => setAssignedIds([])}
                    className={`
                        flex items-center gap-2 px-3 py-2 rounded-xl border transition-all
                        ${assignedIds.length === 0 
                            ? 'bg-brand-light border-brand text-brand shadow-sm dark:bg-brand/20' 
                            : 'bg-card border-border text-text-secondary hover:border-brand/50'}
                    `}
                >
                    <User className="h-5 w-5" />
                    <span className="text-sm font-bold">Anyone</span>
                </button>
                
                {members.map(m => {
                    const isSelected = assignedIds.includes(m.id)
                    return (
                        <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleMember(m.id)}
                            className={`
                                relative flex items-center gap-2 pr-3 rounded-xl border transition-all overflow-hidden
                                ${isSelected 
                                    ? 'bg-brand-light border-brand ring-1 ring-brand shadow-sm dark:bg-brand/20' 
                                    : 'bg-card border-border hover:border-brand/50'}
                            `}
                        >
                            <Avatar url={m.avatar_url} alt={m.full_name || ''} size={40} />
                            <span className={`text-sm font-bold ${isSelected ? 'text-brand-dark dark:text-brand-light' : 'text-text-secondary'}`}>
                                {m.full_name?.split(' ')[0]}
                            </span>
                            {isSelected && (
                                <div className="absolute top-0 right-0 bg-brand text-white rounded-bl-lg p-0.5">
                                    <Check className="h-3 w-3" />
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>
        </div>

        {/* ROOM & DUE DATE */}
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                <label htmlFor="roomId" className="block font-heading text-sm font-medium text-text-primary">
                    Room
                </label>
                <div className="relative mt-1">
                    <Home className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                    <select
                    id="roomId"
                    name="roomId"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
                    >
                    <option value="">No Room</option>
                    {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                        {room.name}
                        </option>
                    ))}
                    </select>
                </div>
                </div>

                <div>
                    <div className="flex justify-between items-center">
                        <label htmlFor="dueDate" className="block font-heading text-sm font-medium text-text-primary">
                            Due Date
                        </label>
                        {!hasDueDate ? (
                            <button type="button" onClick={enableDueDate} className="text-xs text-brand font-semibold hover:underline">
                                + Set Date
                            </button>
                        ) : (
                            <button type="button" onClick={clearDueDate} className="text-xs text-text-secondary hover:text-red-500 hover:underline">
                                Clear
                            </button>
                        )}
                    </div>
                    
                    <div className="relative mt-1">
                        {hasDueDate ? (
                            <>
                                <Calendar className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                                <input
                                type="date"
                                id="dueDate"
                                name="dueDate"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 transition-all focus:border-brand focus:ring-brand"
                                />
                            </>
                        ) : (
                            <div className="mt-1 block w-full rounded-xl border border-dashed border-border bg-gray-50 dark:bg-muted/30 p-3 text-text-secondary text-center text-sm italic">
                                No due date set
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* DEADLINE TYPE TOGGLE */}
            {hasDueDate && (
                <div className="bg-gray-50 dark:bg-muted/30 rounded-xl p-3 flex items-center justify-between border border-border animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg ${deadlineType === 'hard' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                            {deadlineType === 'hard' ? <Shield className="h-4 w-4" /> : <Feather className="h-4 w-4" />}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary">Deadline Type</p>
                            <p className="text-sm font-semibold text-text-primary">
                                {deadlineType === 'hard' ? 'Hard Deadline' : 'Flexible'}
                            </p>
                        </div>
                    </div>
                    <div className="flex bg-card rounded-lg border border-border p-1">
                        <button
                            type="button"
                            onClick={() => setDeadlineType('soft')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${deadlineType === 'soft' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm' : 'text-text-secondary hover:bg-muted'}`}
                        >
                            Soft
                        </button>
                        <button
                            type="button"
                            onClick={() => setDeadlineType('hard')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${deadlineType === 'hard' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 shadow-sm' : 'text-text-secondary hover:bg-muted'}`}
                        >
                            Hard
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* TIME OF DAY */}
        <div>
            <label className="block font-heading text-sm font-medium text-text-primary mb-2">
                Time of Day
            </label>
            <div className="flex gap-2">
                {['any', 'morning', 'afternoon', 'evening'].map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setTimeOfDay(t as TimeOption)}
                        className={`
                            flex-1 flex flex-col items-center justify-center gap-1 p-2 rounded-xl border transition-all
                            ${timeOfDay === t 
                                ? 'bg-brand-light border-brand text-brand shadow-sm dark:bg-brand/20' 
                                : 'bg-background border-border text-text-secondary hover:border-brand/50'}
                        `}
                    >
                        {t === 'morning' && <Coffee className="h-4 w-4" />}
                        {t === 'afternoon' && <Sun className="h-4 w-4" />}
                        {t === 'evening' && <Moon className="h-4 w-4" />}
                        {t === 'any' && <Clock className="h-4 w-4" />}
                        <span className="text-xs font-medium capitalize">{t}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* ADVANCED RECURRENCE */}
        <div className="p-4 bg-gray-50 dark:bg-muted/20 rounded-xl border border-border space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Repeat className="h-5 w-5 text-brand" />
                    <h4 className="font-heading font-semibold text-sm">Recurrence</h4>
                </div>
                
                {/* ROTATION TOGGLE */}
                {recurrenceFreq !== 'none' && assignedIds.length > 1 && (
                    <div className="flex items-center gap-2 animate-in fade-in">
                        <label htmlFor="rotate" className="text-xs font-bold text-brand uppercase cursor-pointer">
                            Rotate Assignees?
                        </label>
                        <div 
                            onClick={() => setIsRotating(!isRotating)}
                            className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors ${isRotating ? 'bg-brand' : 'bg-gray-200 dark:bg-muted'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${isRotating ? 'left-5' : 'left-1'}`} />
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex flex-col gap-3">
                <div className="flex gap-3 items-center">
                    <span className="text-sm text-text-secondary whitespace-nowrap w-12">Repeat</span>
                    
                    <input 
                        type="number" 
                        min="1" 
                        max="99"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(e.target.value === '' ? '' : parseInt(e.target.value))}
                        className={`w-16 rounded-lg border-border bg-background p-2 text-center font-bold text-sm ${recurrenceFreq === 'none' ? 'opacity-50' : ''}`}
                        disabled={recurrenceFreq === 'none'}
                    />
                    
                    <select
                    value={recurrenceFreq}
                    onChange={(e) => setRecurrenceFreq(e.target.value)}
                    className="flex-1 rounded-lg border-border bg-background p-2 text-sm"
                    >
                    <option value="none">Never</option>
                    <option value="daily">Day(s)</option>
                    <option value="weekly">Week(s)</option>
                    <option value="monthly">Month(s)</option>
                    </select>
                </div>

                {/* Rotation Info */}
                {isRotating && recurrenceFreq !== 'none' && (
                    <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg animate-in slide-in-from-top-1">
                        <Users className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <p>
                            The task will rotate between the {assignedIds.length} selected people. 
                            First instance assigned to <strong>{
                                members.find(m => m.id === assignedIds[0])?.full_name?.split(' ')[0] || 'First Person'
                            }</strong>.
                        </p>
                    </div>
                )}

                {recurrenceFreq !== 'none' && (
                    <div className="flex gap-3 items-center animate-in slide-in-from-top-2 fade-in">
                        <span className="text-sm text-text-secondary whitespace-nowrap w-12">Until</span>
                        <div className="flex-1 relative">
                            <input 
                                type="date" 
                                value={recurrenceEndDate}
                                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                                className="w-full rounded-lg border-border bg-background p-2 text-sm pl-9"
                            />
                            <Ban className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary pointer-events-none" />
                        </div>
                        {recurrenceEndDate && (
                            <button 
                                type="button" 
                                onClick={() => setRecurrenceEndDate('')}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Clear End Date"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* MULTIPLE INSTANCES */}
        <div className="p-4 bg-gray-50 dark:bg-muted/20 rounded-xl border border-border space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Copy className="h-5 w-5 text-brand" />
                    <h4 className="font-heading font-semibold text-sm">Multiple Copies</h4>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        type="button" 
                        onClick={() => setInstanceCount(Math.max(1, (Number(instanceCount) || 1) - 1))}
                        className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted"
                    >
                        -
                    </button>
                    <input 
                        type="number"
                        min="1"
                        max="20"
                        value={instanceCount}
                        onChange={(e) => setInstanceCount(e.target.value === '' ? '' : parseInt(e.target.value))}
                        className="w-12 rounded-lg border-border bg-background p-1 text-center font-bold text-sm"
                    />
                    <button 
                        type="button" 
                        onClick={() => setInstanceCount(Math.min(10, (Number(instanceCount) || 1) + 1))}
                        className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted"
                    >
                        +
                    </button>
                </div>
            </div>
            {(Number(instanceCount) || 1) > 1 && (
                <p className="text-xs text-text-secondary">
                    Creates {instanceCount} separate chores named "{name} #1" to "#{instanceCount}"
                </p>
            )}
        </div>

        {/* SUBTASKS UI */}
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-heading text-sm font-medium text-text-primary">
                    {isShopping ? <ShoppingCart className="h-4 w-4 text-brand" /> : null}
                    {isShopping ? 'Shopping List Items' : 'Sub-steps'}
                </label>
                {subtasks.length > 0 && (
                    <span className="text-[10px] bg-gray-100 dark:bg-muted px-2 py-0.5 rounded-full text-text-secondary font-bold">
                        {subtasks.length}
                    </span>
                )}
            </div>
            
            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={newSubtask} 
                    onChange={(e) => setNewSubtask(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                    placeholder={isShopping ? "e.g. 'Milk'" : "e.g. 'Sort whites'"}
                    className="flex-1 rounded-xl border-border bg-background p-2 text-sm"
                    autoCapitalize="sentences"
                />
                <button 
                    type="button" 
                    onClick={addSubtask} 
                    className="p-2 bg-gray-100 dark:bg-muted rounded-xl hover:bg-brand-light text-brand"
                >
                    <PlusCircle className="h-5 w-5" />
                </button>
            </div>
            
            {subtasks.length > 0 && (
                <ul className="space-y-1 pl-1 max-h-40 overflow-y-auto">
                    {subtasks.map((st, i) => (
                        <li key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-muted/30 p-2 rounded-lg animate-in slide-in-from-left-2" style={{ animationDelay: `${i * 50}ms` }}>
                            <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${isShopping ? 'bg-green-500' : 'bg-brand/50'}`} />
                                <span>{st}</span>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setSubtasks(subtasks.filter((_, idx) => idx !== i))} 
                                className="text-gray-400 hover:text-red-500"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>

        {/* DETAILS TOGGLE */}
        <details className="group" open={!!exactTime || !!notes}>
            <summary className="flex items-center gap-2 text-sm font-medium text-brand cursor-pointer list-none">
                <span>Add Notes & Exact Time</span>
            </summary>
            <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-top-2">
                <div>
                    <textarea
                        id="notes"
                        name="notes"
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add details..."
                        className="mt-1 block w-full rounded-xl border-border bg-background p-3 focus:border-brand focus:ring-brand"
                        autoCapitalize="sentences"
                    />
                </div>
                <div>
                    <label htmlFor="exactTime" className="block font-heading text-sm font-medium text-text-primary mb-1">
                        Exact Time (Optional)
                    </label>
                    <div className="relative">
                        <Clock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-secondary" />
                        <input
                            type="time"
                            id="exactTime"
                            name="exactTime"
                            value={exactTime}
                            onChange={(e) => setExactTime(e.target.value)}
                            className="mt-1 block w-full appearance-none rounded-xl border-border bg-background p-3 pl-10 focus:border-brand focus:ring-brand"
                        />
                    </div>
                </div>
            </div>
        </details>

        {/* ACTIONS */}
        <div className="pt-4 space-y-4">
            
            {/* SAVE AS TEMPLATE TOGGLE */}
            {name.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                    <input 
                        type="checkbox" 
                        id="saveAsTemplate" 
                        checked={saveAsTemplate}
                        onChange={(e) => setSaveAsTemplate(e.target.checked)}
                        className="rounded text-brand focus:ring-brand border-gray-300"
                    />
                    <label htmlFor="saveAsTemplate" className="text-sm text-text-secondary font-medium flex items-center gap-1">
                        <Save className="h-3 w-3" />
                        Save as a new template
                    </label>
                </div>
            )}

            <div className="flex items-center justify-end space-x-4">
                <button
                type="button"
                onClick={closeModal}
                className="rounded-xl px-5 py-3 font-heading text-base font-semibold text-text-secondary transition-all hover:bg-gray-100 dark:hover:bg-muted"
                >
                Cancel
                </button>
                <button
                type="submit"
                disabled={pending}
                className="flex items-center justify-center rounded-xl bg-brand px-6 py-3 font-heading text-base font-semibold text-white shadow-lg transition-all hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                {pending ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    `Create ${instanceCount === '' || Number(instanceCount) <= 1 ? '' : instanceCount + ' '} Chore${instanceCount === '' || Number(instanceCount) <= 1 ? '' : 's'}`
                )}
                </button>
            </div>
        </div>
        </form>

        {/* FIXED POSITION CONTEXT MENU OVERLAY */}
        {menuPosition && (
            <>
                <div className="fixed inset-0 z-[60]" onClick={() => setMenuPosition(null)} />
                <div 
                    className="fixed z-[70] bg-popover text-popover-foreground rounded-xl shadow-xl border border-border p-1 flex flex-col min-w-[140px] animate-in zoom-in duration-200 origin-top-left"
                    style={{ 
                        top: menuPosition.y, 
                        left: Math.min(menuPosition.x, typeof window !== 'undefined' ? window.innerWidth - 160 : 0) 
                    }}
                >
                    <button 
                        type="button"
                        onClick={() => { 
                            const tmpl = templates.find(t => t.id === menuPosition.id);
                            if(tmpl) applyTemplate(tmpl); 
                            setMenuPosition(null); 
                        }} 
                        className="text-left px-3 py-2.5 text-sm font-semibold hover:bg-muted rounded-lg flex items-center gap-2"
                    >
                        <Check className="h-4 w-4" /> Use Template
                    </button>
                    <button 
                        type="button"
                        onClick={handleEditTemplate} 
                        className="text-left px-3 py-2.5 text-sm font-semibold hover:bg-muted rounded-lg flex items-center gap-2"
                    >
                        <Wand2 className="h-4 w-4" /> Use & Edit
                    </button>
                    <button 
                        type="button"
                        onClick={handleDeleteTemplate} 
                        className="text-left px-3 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2"
                    >
                        <Trash2 className="h-4 w-4" /> Delete
                    </button>
                    <div className="h-px bg-border my-1" />
                    <button 
                        type="button"
                        onClick={() => setMenuPosition(null)} 
                        className="text-left px-3 py-2.5 text-xs text-text-secondary hover:bg-muted rounded-lg"
                    >
                        Cancel
                    </button>
                </div>
            </>
        )}
    </>
  )
}

export default function AddChoreModal(props: Props) {
  const router = useRouter()

  const handleClose = () => {
    router.push('/dashboard')
    router.refresh() 
  }

  return (
    <Transition appear show={props.isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-card p-8 text-left align-middle shadow-xl transition-all border border-border">
                <div className="flex items-center justify-between mb-4">
                  <Dialog.Title as="h3" className="text-2xl font-heading font-semibold">
                    Add New Chore
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="rounded-full p-2 text-text-secondary transition-colors hover:bg-background"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <ChoreForm
                    closeModal={handleClose}
                    members={props.members}
                    rooms={props.rooms}
                    currentUserId={props.currentUserId}
                    templates={props.templates}
                />

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}