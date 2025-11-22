// src/lib/smart-parser.ts

import { DbProfile, DbRoom } from '@/types/database'

type ParsedChore = {
  name: string
  roomId?: number
  assignedTo?: string 
  recurrence?: string // Can be 'daily' or 'custom:daily:3'
  dueDate?: string
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'any'
}

export function parseChoreInput(
  input: string, 
  members: Pick<DbProfile, 'id' | 'full_name'>[], 
  rooms: DbRoom[],
  currentUserId: string 
): ParsedChore {
  let remainingText = input
  const result: ParsedChore = {
    name: '',
    timeOfDay: 'any',
    recurrence: 'none'
  }

  // --- 1. Context: "Me/My" Detection ---
  if (/\b(my|me|i)\b/i.test(remainingText)) {
    result.assignedTo = currentUserId
  }

  // --- 2. Assignee Detection (Names) ---
  if (!result.assignedTo) {
    for (const member of members) {
      if (!member.full_name) continue
      const firstName = member.full_name.split(' ')[0]
      const regex = new RegExp(`\\b(for|by)?\\s*${firstName}\\b`, 'i')
      
      if (regex.test(remainingText)) {
        result.assignedTo = member.id
        remainingText = remainingText.replace(regex, '')
        break
      }
    }
  }

  // --- 3. Room Detection ---
  // A. Explicit Room Name
  for (const room of rooms) {
    const regex = new RegExp(`\\b(in|at)?\\s*${room.name}\\b`, 'i')
    if (regex.test(remainingText)) {
      result.roomId = room.id
      remainingText = remainingText.replace(regex, '')
      break 
    }
  }

  // B. Implicit Room Detection (Keywords)
  if (!result.roomId) {
    // In a real app, these keywords would come from the DB/Room properties
    const keywordMap: Record<string, string[]> = {
      'Kitchen': ['fridge', 'dishwasher', 'oven', 'stove', 'sink', 'cook'],
      'Living Room': ['sofa', 'couch', 'tv', 'rug'],
      'Bathroom': ['toilet', 'shower', 'bath', 'tub'],
      'Bedroom': ['bed', 'sheet', 'pillow', 'sleep'],
      'Laundry': ['washer', 'dryer', 'clothes', 'iron']
    }

    for (const room of rooms) {
      // Match room name to keys in our simple map
      const roomKey = Object.keys(keywordMap).find(k => room.name.toLowerCase().includes(k.toLowerCase()));
      const keywords = roomKey ? keywordMap[roomKey] : [];
      
      if (keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(remainingText))) {
        result.roomId = room.id
        break
      }
    }
  }

  // --- 4. Recurrence (Simple & Custom) ---
  
  // Custom Interval Detection: "Every X Days/Weeks"
  const customMatch = remainingText.match(/every\s+(\d+)\s+(day|week|month)s?/i)
  if (customMatch) {
    const interval = customMatch[1]
    const unit = customMatch[2].toLowerCase()
    // Map unit to internal frequency string
    const freq = unit === 'day' ? 'daily' : unit === 'week' ? 'weekly' : 'monthly'
    
    result.recurrence = `custom:${freq}:${interval}`
    remainingText = remainingText.replace(customMatch[0], '')
  } 
  // Standard Detection
  else if (/every\s*day|daily/i.test(remainingText)) {
    result.recurrence = 'daily'
    remainingText = remainingText.replace(/every\s*day|daily/i, '')
  } else if (/every\s*week|weekly/i.test(remainingText)) {
    result.recurrence = 'weekly'
    remainingText = remainingText.replace(/every\s*week|weekly/i, '')
  } else if (/every\s*month|monthly/i.test(remainingText)) {
    result.recurrence = 'monthly'
    remainingText = remainingText.replace(/every\s*month|monthly/i, '')
  }

  // --- 5. Date Math (Relative) ---
  const today = new Date()
  let targetDate: Date | null = null
  
  // "In X days"
  const inDaysMatch = remainingText.match(/\bin\s+(\d+)\s+days?/i)
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1])
    targetDate = new Date()
    targetDate.setDate(today.getDate() + days)
    remainingText = remainingText.replace(inDaysMatch[0], '')
  }
  // "Tomorrow"
  else if (/\btomorrow\b/i.test(remainingText)) {
    targetDate = new Date()
    targetDate.setDate(today.getDate() + 1)
    remainingText = remainingText.replace(/\btomorrow\b/i, '')
  }
  // "Next [Day]"
  else {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayMatch = remainingText.match(new RegExp(`\\bnext\\s+(${daysOfWeek.join('|')})\\b`, 'i'))
    
    if (dayMatch) {
      const targetDayIndex = daysOfWeek.indexOf(dayMatch[1].toLowerCase())
      const currentDayIndex = today.getDay()
      let daysToAdd = targetDayIndex - currentDayIndex
      if (daysToAdd <= 0) daysToAdd += 7 // Move to next week
      targetDate = new Date()
      targetDate.setDate(today.getDate() + daysToAdd)
      remainingText = remainingText.replace(dayMatch[0], '')
    }
  }

  // Time of Day Context
  if (/\btonight\b/i.test(remainingText)) {
    result.timeOfDay = 'evening'
    if (!targetDate) targetDate = new Date() // Tonight implies today
    remainingText = remainingText.replace(/\btonight\b/i, '')
  } else if (/\b(morning|am)\b/i.test(remainingText)) {
    result.timeOfDay = 'morning'
    remainingText = remainingText.replace(/\b(morning|am)\b/i, '')
  } else if (/\b(afternoon|pm)\b/i.test(remainingText)) {
    result.timeOfDay = 'afternoon'
    remainingText = remainingText.replace(/\b(afternoon|pm)\b/i, '')
  } else if (/\b(evening|night)\b/i.test(remainingText)) {
    result.timeOfDay = 'evening'
    remainingText = remainingText.replace(/\b(evening|night)\b/i, '')
  }

  if (targetDate) {
    result.dueDate = targetDate.toISOString().split('T')[0]
  }

  // --- 6. Cleanup ---
  result.name = remainingText
    .replace(/\s+/g, ' ') 
    .replace(/^(to|for|at|in)\s+/i, '') 
    .trim()
  
  if (result.name.length > 0) {
    result.name = result.name.charAt(0).toUpperCase() + result.name.slice(1)
  }

  return result
}