import { DbProfile, DbRoom } from '@/types/database'

type ParsedChore = {
  name: string
  roomId?: number
  assignedTo?: string
  recurrence?: string
  dueDate?: string
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'any'
}

export function parseChoreInput(
  input: string, 
  members: Pick<DbProfile, 'id' | 'full_name'>[], 
  rooms: DbRoom[]
): ParsedChore {
  let remainingText = input

  const result: ParsedChore = {
    name: '',
    timeOfDay: 'any',
    recurrence: 'none'
  }

  // --- 1. Extract Room ---
  // We look for room names in the string (case insensitive)
  for (const room of rooms) {
    const regex = new RegExp(`\\b(in|at)?\\s*${room.name}\\b`, 'i')
    if (regex.test(remainingText)) {
      result.roomId = room.id
      remainingText = remainingText.replace(regex, '') // Remove found room from text
      break // Assume only one room per chore
    }
  }

  // --- 2. Extract Assignee ---
  // Look for member first names
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

  // --- 3. Extract Recurrence ---
  if (/every\s*day|daily/i.test(remainingText)) {
    result.recurrence = 'daily'
    remainingText = remainingText.replace(/every\s*day|daily/i, '')
  } else if (/every\s*week|weekly|every\s*(mon|tue|wed|thu|fri|sat|sun)/i.test(remainingText)) {
    result.recurrence = 'weekly'
    remainingText = remainingText.replace(/every\s*week|weekly|every\s*(mon|tue|wed|thu|fri|sat|sun)\w*/i, '')
  } else if (/every\s*month|monthly/i.test(remainingText)) {
    result.recurrence = 'monthly'
    remainingText = remainingText.replace(/every\s*month|monthly/i, '')
  }

  // --- 4. Extract Time of Day ---
  if (/\b(morning|am)\b/i.test(remainingText)) {
    result.timeOfDay = 'morning'
    remainingText = remainingText.replace(/\b(morning|am)\b/i, '')
  } else if (/\b(afternoon|pm)\b/i.test(remainingText)) {
    result.timeOfDay = 'afternoon'
    remainingText = remainingText.replace(/\b(afternoon|pm)\b/i, '')
  } else if (/\b(evening|night)\b/i.test(remainingText)) {
    result.timeOfDay = 'evening'
    remainingText = remainingText.replace(/\b(evening|night)\b/i, '')
  }

  // --- 5. Extract Due Date (Simple Heuristics) ---
  const today = new Date()
  let targetDate = new Date()
  let dateFound = false

  if (/\btomorrow\b/i.test(remainingText)) {
    targetDate.setDate(today.getDate() + 1)
    remainingText = remainingText.replace(/\btomorrow\b/i, '')
    dateFound = true
  } else if (/\btoday\b/i.test(remainingText)) {
    // do nothing, already today
    remainingText = remainingText.replace(/\btoday\b/i, '')
    dateFound = true
  }
  
  // Handle "next Friday" or "on Monday"
  // (This is a simplified version. For robust date parsing without AI, libraries like 'chrono-node' are best, 
  // but this covers basic "tomorrow/today" cases without extra deps)

  if (dateFound) {
    result.dueDate = targetDate.toISOString().split('T')[0]
  }

  // --- 6. Cleanup Name ---
  // Remove extra spaces, prepositions at the end, specific time words we missed
  result.name = remainingText
    .replace(/\s+/g, ' ') // Collapse spaces
    .replace(/^(to|for|at)\s+/i, '') // Remove leading prepositions
    .trim()
  
  // Capitalize first letter
  result.name = result.name.charAt(0).toUpperCase() + result.name.slice(1)

  return result
}