// src/lib/smart-parser.ts

import { DbProfile, DbRoom } from '@/types/database'

type ParsedChore = {
  name: string
  roomId?: number
  assignedTo?: string 
  recurrence?: string // 'daily', 'weekly', 'custom:daily:3', or 'custom:daily:1:2023-12-31'
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
  for (const room of rooms) {
    const regex = new RegExp(`\\b(in|at)?\\s*${room.name}\\b`, 'i')
    if (regex.test(remainingText)) {
      result.roomId = room.id
      remainingText = remainingText.replace(regex, '')
      break 
    }
  }

  if (!result.roomId) {
    const keywordMap: Record<string, string[]> = {
      'Kitchen': ['fridge', 'dishwasher', 'oven', 'stove', 'sink', 'cook'],
      'Living Room': ['sofa', 'couch', 'tv', 'rug'],
      'Bathroom': ['toilet', 'shower', 'bath', 'tub'],
      'Bedroom': ['bed', 'sheet', 'pillow', 'sleep'],
      'Laundry': ['washer', 'dryer', 'clothes', 'iron']
    }

    for (const room of rooms) {
      const roomKey = Object.keys(keywordMap).find(k => room.name.toLowerCase().includes(k.toLowerCase()));
      const keywords = roomKey ? keywordMap[roomKey] : [];
      if (keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(remainingText))) {
        result.roomId = room.id
        break
      }
    }
  }

  // --- 4. Recurrence Detection ---
  
  // Check for "until [Date]" first to extract it
  let untilDateStr = ''
  // Matches "until Dec 25", "until 12/25", "until 2025-12-25"
  const untilMatch = remainingText.match(/until\s+([A-Za-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2})/i)
  
  if (untilMatch) {
      const dateStr = untilMatch[1]
      const dateObj = new Date(dateStr)
      // If valid date, store YYYY-MM-DD
      if (!isNaN(dateObj.getTime())) {
          // Adjust for current year if missing? JS Date handles "Dec 25" by defaulting to current year usually, 
          // but we should ensure it's future.
          if (dateObj < new Date()) {
              dateObj.setFullYear(dateObj.getFullYear() + 1)
          }
          untilDateStr = dateObj.toISOString().split('T')[0]
          remainingText = remainingText.replace(untilMatch[0], '')
      }
  }

  // "Every X Days/Weeks"
  const customMatch = remainingText.match(/every\s+(\d+)\s+(day|week|month)s?/i)
  if (customMatch) {
    const interval = customMatch[1]
    const unit = customMatch[2].toLowerCase()
    const freq = unit === 'day' ? 'daily' : unit === 'week' ? 'weekly' : 'monthly'
    
    // Format: custom:freq:interval:until
    result.recurrence = `custom:${freq}:${interval}${untilDateStr ? ':' + untilDateStr : ''}`
    remainingText = remainingText.replace(customMatch[0], '')
  } 
  // Standard Detection
  else if (/every\s*day|daily/i.test(remainingText)) {
    result.recurrence = untilDateStr ? `custom:daily:1:${untilDateStr}` : 'daily'
    remainingText = remainingText.replace(/every\s*day|daily/i, '')
  } else if (/every\s*week|weekly/i.test(remainingText)) {
    result.recurrence = untilDateStr ? `custom:weekly:1:${untilDateStr}` : 'weekly'
    remainingText = remainingText.replace(/every\s*week|weekly/i, '')
  } else if (/every\s*month|monthly/i.test(remainingText)) {
    result.recurrence = untilDateStr ? `custom:monthly:1:${untilDateStr}` : 'monthly'
    remainingText = remainingText.replace(/every\s*month|monthly/i, '')
  }

  // --- 5. Date Math ---
  const today = new Date()
  let targetDate: Date | null = null
  
  const inDaysMatch = remainingText.match(/\bin\s+(\d+)\s+days?/i)
  if (inDaysMatch) {
    const days = parseInt(inDaysMatch[1])
    targetDate = new Date()
    targetDate.setDate(today.getDate() + days)
    remainingText = remainingText.replace(inDaysMatch[0], '')
  }
  else if (/\btomorrow\b/i.test(remainingText)) {
    targetDate = new Date()
    targetDate.setDate(today.getDate() + 1)
    remainingText = remainingText.replace(/\btomorrow\b/i, '')
  }
  else {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayMatch = remainingText.match(new RegExp(`\\bnext\\s+(${daysOfWeek.join('|')})\\b`, 'i'))
    if (dayMatch) {
      const targetDayIndex = daysOfWeek.indexOf(dayMatch[1].toLowerCase())
      const currentDayIndex = today.getDay()
      let daysToAdd = targetDayIndex - currentDayIndex
      if (daysToAdd <= 0) daysToAdd += 7
      targetDate = new Date()
      targetDate.setDate(today.getDate() + daysToAdd)
      remainingText = remainingText.replace(dayMatch[0], '')
    }
  }

  if (/\btonight\b/i.test(remainingText)) {
    result.timeOfDay = 'evening'
    if (!targetDate) targetDate = new Date()
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