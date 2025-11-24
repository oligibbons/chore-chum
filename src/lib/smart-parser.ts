// src/lib/smart-parser.ts

import { DbProfile, DbRoom } from '@/types/database'

// --- TYPES ---

type ParsedChore = {
  name: string
  roomId?: number
  assignedTo?: string 
  recurrence: string 
  dueDate?: string
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'any'
  exactTime?: string
  instances: number
  subtasks: string[]
  isShoppingList: boolean
  tags: string[] // Used for UI feedback (e.g., "Auto-Plan Generated", "Room Detected")
}

// --- 1. KNOWLEDGE BASE (The "AI" Simulation) ---

// A dictionary of common tasks and their implicit sub-steps.
// This makes the app feel like it "knows" how to do housework.
const CHORE_RECIPES: Record<string, string[]> = {
  // KITCHEN
  'clean fridge': ['Remove expired food', 'Wipe shelves', 'Clean drawers', 'Wipe exterior', 'Check temp'],
  'deep clean oven': ['Remove racks', 'Apply cleaner', 'Scrub interior', 'Clean glass', 'Wipe knobs'],
  'dishwasher': ['Unload clean', 'Load dirty', 'Check rinse aid', 'Clean filter'],
  'descale kettle': ['Fill with solution', 'Boil', 'Rinse thoroughly', 'Boil fresh water'],
  'empty bin': ['Tie bag', 'Take to curb', 'Clean bin interior', 'New liner'],
  
  // BATHROOM
  'clean bathroom': ['Toilet', 'Sink & Mirror', 'Shower/Tub', 'Mop floor', 'Change towels'],
  'clean toilet': ['Bleach bowl', 'Scrub under rim', 'Wipe seat/lid', 'Wipe flush handle'],
  
  // GENERAL
  'vacuum house': ['Living room', 'Hallway', 'Bedrooms', 'Kitchen', 'Stairs'],
  'mop floors': ['Sweep first', 'Prepare bucket', 'Kitchen', 'Bathroom', 'Hallway'],
  'dusting': ['High shelves', 'TV/Electronics', 'Skirting boards', 'Blinds', 'Picture frames'],
  'windows': ['Wash glass', 'Wipe sills', 'Clean frames'],
  
  // LAUNDRY
  'laundry': ['Separate colors', 'Wash', 'Hang/Dry', 'Fold', 'Put away'],
  'change sheets': ['Strip bed', 'Wash linens', 'Remake bed', 'Fluff pillows'],
  
  // OUTDOORS / GARAGE
  'car wash': ['Wash exterior', 'Clean wheels', 'Vacuum interior', 'Clean windows', 'Clear trash'],
  'mow lawn': ['Clear debris', 'Mow grass', 'Trim edges', 'Sweep paths'],
  'gardening': ['Weed beds', 'Water plants', 'Deadhead flowers', 'Prune hedges'],
  
  // ADMIN / ROUTINE
  'morning routine': ['Make bed', 'Hydrate', 'Brush teeth', 'Check calendar'],
  'night routine': ['Lock doors', 'Start dishwasher', 'Set alarm', 'Put phone away'],
  'pay bills': ['Rent/Mortgage', 'Utilities', 'Credit Card', 'File receipts']
}

// Maps specific objects to generic Room Types for inference.
// e.g. "Clean the sofa" -> Infers "Lounge" even if user didn't type "Lounge".
const OBJECT_TO_ROOM_MAP: Record<string, string[]> = {
  'Kitchen': ['fridge', 'refrigerator', 'oven', 'stove', 'hob', 'dishwasher', 'kettle', 'toaster', 'microwave', 'pantry', 'cutlery', 'crockery', 'sink', 'freezer'],
  'Bathroom': ['toilet', 'loo', 'shower', 'bath', 'tub', 'towel', 'shampoo', 'soap', 'floss', 'toothbrush', 'grout', 'vanity'],
  'Bedroom': ['bed', 'sheet', 'duvet', 'pillow', 'wardrobe', 'closet', 'dresser', 'nightstand', 'mattress'],
  'Lounge': ['sofa', 'couch', 'settee', 'tv', 'television', 'remote', 'rug', 'coffee table', 'cushion', 'fireplace', 'mantel'],
  'Laundry': ['washer', 'dryer', 'iron', 'hamper', 'detergent', 'clothes horse', 'airer'],
  'Garden': ['lawn', 'grass', 'flower', 'weed', 'hose', 'shed', 'patio', 'deck', 'hedge', 'prune'],
  'Garage': ['car', 'bike', 'bicycle', 'tool', 'drill', 'workbench', 'oil', 'tire', 'ladder'],
  'Office': ['desk', 'computer', 'monitor', 'printer', 'paper', 'file', 'laptop', 'bills']
}

// --- 2. HELPER FUNCTIONS ---

// Levenshtein distance for fuzzy matching names
function isFuzzyMatch(input: string, target: string, threshold = 2): boolean {
  const a = input.toLowerCase()
  const b = target.toLowerCase()
  if (a === b) return true
  if (Math.abs(a.length - b.length) > threshold) return false

  const matrix = []
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i] }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1))
      }
    }
  }
  return matrix[b.length][a.length] <= threshold
}

function detectRoom(text: string, rooms: DbRoom[]): { id: number, name: string } | undefined {
  const lowerText = text.toLowerCase()
  
  // 1. Direct Name Match (Highest Priority)
  // "Clean the Kitchen" -> Matches room "Kitchen"
  const directMatch = rooms.find(r => lowerText.includes(r.name.toLowerCase()))
  if (directMatch) return { id: directMatch.id, name: directMatch.name }

  // 2. Contextual Inference via Keywords
  // "Clean the Toilet" -> Infers "Bathroom" -> Matches user's room "Main Bathroom"
  for (const [roomType, keywords] of Object.entries(OBJECT_TO_ROOM_MAP)) {
    if (keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(lowerText))) {
      // Find a room in the user's house that resembles this type
      const targetRoom = rooms.find(r => r.name.toLowerCase().includes(roomType.toLowerCase()))
      // Or find a room that matches one of the defined aliases for this type in previous system
      // (Simplified here to name matching for performance)
      if (targetRoom) return { id: targetRoom.id, name: targetRoom.name }
    }
  }
  return undefined
}

function detectAssignee(
  text: string, 
  members: Pick<DbProfile, 'id' | 'full_name'>[], 
  roomId: number | undefined, 
  rooms: DbRoom[], 
  currentUserId: string
): string | undefined {
  const lowerText = text.toLowerCase()

  // 1. Self Assignment ("I will do...", "My chore")
  if (/\b(my|me|i)\b/i.test(lowerText)) return currentUserId

  // 2. Explicit Name Mention ("For Ben", "Assigned to Alice")
  for (const member of members) {
    if (!member.full_name) continue
    const firstName = member.full_name.split(' ')[0].toLowerCase()
    
    // Strict boundary matching to avoid partial word matches
    if (new RegExp(`\\b${firstName}\\b`, 'i').test(lowerText)) {
      return member.id
    }
  }

  // 3. Possessive Room Inference (Context Aware)
  // If the detected room is "Ben's Bedroom", assign it to Ben automatically.
  if (roomId) {
    const room = rooms.find(r => r.id === roomId)
    if (room) {
      const roomName = room.name.toLowerCase()
      for (const member of members) {
        if (!member.full_name) continue
        const firstName = member.full_name.split(' ')[0].toLowerCase()
        
        // Check for "Ben's" or "Bens" in the room name
        if (roomName.includes(`${firstName}'s`) || roomName.includes(`${firstName}s`)) {
          return member.id
        }
      }
    }
  }

  return undefined
}

// --- 3. MAIN PARSER LOGIC ---

export function parseChoreInput(
  input: string, 
  members: Pick<DbProfile, 'id' | 'full_name'>[], 
  rooms: DbRoom[],
  currentUserId: string 
): ParsedChore {
  let cleanText = input
  const result: ParsedChore = {
    name: '',
    timeOfDay: 'any',
    recurrence: 'none',
    instances: 1,
    subtasks: [],
    isShoppingList: false,
    tags: []
  }

  // A. SHOPPING LIST DETECTION
  // Looks for intent to buy multiple items. 
  // Syntax: "Buy milk, eggs, bread" or "Shopping: milk, bread"
  const shoppingRegex = /^(?:buy|get|purchase|shop for|shopping:?)\s+(.+)/i
  const shoppingMatch = cleanText.match(shoppingRegex)
  
  if (shoppingMatch) {
    result.isShoppingList = true
    result.name = "Shopping Run" // Default title if not specified
    
    // Advanced splitting: handles commas, 'and', newlines, and 'plus'
    result.subtasks = shoppingMatch[1]
      .split(/,| and | \+ |\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
      .map(s => s.charAt(0).toUpperCase() + s.slice(1)) // Capitalize items
    
    result.tags.push('Shopping List')
    
    // Shopping lists rarely have other complex metadata, so we can return early or continue lightly
    return result 
  }

  // B. INLINE EXPLODER (Explicit Subtasks)
  // Allows users to define steps in the sentence.
  // Syntax: "Clean Car: wash, wax, vacuum" or "Party Prep consisting of chips, dip"
  const exploderRegex = /^(.+?)(?::| including | featuring | consisting of | -> )\s*(.+)$/i
  const exploderMatch = cleanText.match(exploderRegex)

  if (exploderMatch) {
    cleanText = exploderMatch[1].trim() // The main title
    const items = exploderMatch[2]
      .split(/,| and |\+/)
      .map(s => s.trim())
      .filter(s => s.length > 0)
    
    if (items.length > 0) {
        result.subtasks = items
        result.tags.push('Custom Plan')
    }
  }

  // C. TIME & INSTANCE PARSING
  
  // 1. Instances ("x3", "3 times")
  const instanceMatch = cleanText.match(/\b(?:x|times?)\s*(\d+)\b/i)
  if (instanceMatch) {
    const count = parseInt(instanceMatch[1])
    if (count > 1 && count <= 20) {
        result.instances = count
        cleanText = cleanText.replace(instanceMatch[0], '')
        result.tags.push('Multi-count')
    }
  }

  // 2. Exact Time ("5pm", "17:00", "at 4:30")
  const timeRegex = /\b((?:1[0-2]|0?[1-9])(?::(\d{2}))?\s*(?:am|pm)|(?:[01]\d|2[0-3]):[0-5]\d)\b/i
  const timeMatch = cleanText.match(timeRegex)
  if (timeMatch) {
    const timeStr = timeMatch[0].toLowerCase()
    let h = 0, m = 0
    
    if (timeStr.includes(':')) {
      const parts = timeStr.replace(/(am|pm)/, '').split(':')
      h = parseInt(parts[0]); m = parseInt(parts[1])
    } else {
      h = parseInt(timeStr.replace(/(am|pm)/, ''))
    }

    if (timeStr.includes('pm') && h < 12) h += 12
    if (timeStr.includes('am') && h === 12) h = 0
    
    result.exactTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`
    
    if (h < 12) result.timeOfDay = 'morning'
    else if (h < 17) result.timeOfDay = 'afternoon'
    else result.timeOfDay = 'evening'

    cleanText = cleanText.replace(timeMatch[0], '').replace(/\bat\b/i, '')
    result.tags.push('Exact Time')
  }

  // D. DATE & RECURRENCE PARSING (Natural Language)

  const lower = cleanText.toLowerCase()
  const today = new Date()
  
  // Relative Days
  if (/\btomorrow\b/i.test(cleanText)) {
    const d = new Date(today); d.setDate(d.getDate() + 1)
    result.dueDate = d.toISOString().split('T')[0]
    cleanText = cleanText.replace(/\btomorrow\b/i, '')
    result.tags.push('Date Set')
  } else if (/\btonight\b/i.test(cleanText)) {
    result.dueDate = today.toISOString().split('T')[0]
    result.timeOfDay = 'evening'
    cleanText = cleanText.replace(/\btonight\b/i, '')
    result.tags.push('Evening')
  } else if (/\btoday\b/i.test(cleanText)) {
    result.dueDate = today.toISOString().split('T')[0]
    cleanText = cleanText.replace(/\btoday\b/i, '')
  }

  // "Next [Day]" (e.g., "Next Friday")
  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const nextDayMatch = cleanText.match(new RegExp(`\\b(next|on)?\\s*(${daysOfWeek.join('|')})`, 'i'))
  
  if (nextDayMatch) {
      const targetDayStr = nextDayMatch[2].toLowerCase()
      const targetIdx = daysOfWeek.indexOf(targetDayStr)
      const currentIdx = today.getDay()
      
      let daysToAdd = targetIdx - currentIdx
      if (daysToAdd <= 0) daysToAdd += 7 // Move to next week if day has passed or is today
      
      const nextDate = new Date(today)
      nextDate.setDate(today.getDate() + daysToAdd)
      result.dueDate = nextDate.toISOString().split('T')[0]
      
      cleanText = cleanText.replace(nextDayMatch[0], '')
      result.tags.push('Date Set')
  }

  // Recurrence Patterns
  // 1. "Every [Day]" -> Weekly
  const everyDayMatch = cleanText.match(new RegExp(`\\bevery\\s+(${daysOfWeek.join('|')})`, 'i'))
  if (everyDayMatch) {
      result.recurrence = 'weekly'
      // Also set the due date to that day
      const targetDayStr = everyDayMatch[1].toLowerCase()
      const targetIdx = daysOfWeek.indexOf(targetDayStr)
      const currentIdx = today.getDay()
      let daysToAdd = targetIdx - currentIdx
      if (daysToAdd < 0) daysToAdd += 7 // If passed, set for next occurance
      const nextDate = new Date(today)
      nextDate.setDate(today.getDate() + daysToAdd)
      result.dueDate = nextDate.toISOString().split('T')[0]

      cleanText = cleanText.replace(everyDayMatch[0], '')
      result.tags.push('Recurring')
  }
  // 2. Standard intervals
  else if (/\bevery\s+day|daily\b/i.test(cleanText)) {
    result.recurrence = 'daily'
    cleanText = cleanText.replace(/\bevery\s+day|daily\b/i, '')
    result.tags.push('Recurring')
  } else if (/\bevery\s+week|weekly\b/i.test(cleanText)) {
    result.recurrence = 'weekly'
    cleanText = cleanText.replace(/\bevery\s+week|weekly\b/i, '')
    result.tags.push('Recurring')
  } else if (/\bevery\s+month|monthly\b/i.test(cleanText)) {
    result.recurrence = 'monthly'
    cleanText = cleanText.replace(/\bevery\s+month|monthly\b/i, '')
    result.tags.push('Recurring')
  }
  // 3. Complex intervals ("Every 2 weeks", "Every 3 days")
  const complexRecurrence = cleanText.match(/\bevery\s+(\d+)\s+(days?|weeks?|months?)/i)
  if (complexRecurrence) {
      const interval = parseInt(complexRecurrence[1])
      const unit = complexRecurrence[2].toLowerCase()
      let freq = 'daily'
      if (unit.startsWith('week')) freq = 'weekly'
      if (unit.startsWith('month')) freq = 'monthly'
      
      result.recurrence = `custom:${freq}:${interval}`
      cleanText = cleanText.replace(complexRecurrence[0], '')
      result.tags.push('Recurring')
  }

  // E. CONTEXTUAL INFERENCE

  // 1. Room Detection
  const detectedRoom = detectRoom(cleanText, rooms)
  if (detectedRoom) {
    result.roomId = detectedRoom.id
    // We do NOT remove the room name from the text because "Clean Kitchen" reads better than "Clean"
    result.tags.push('Room Detected')
  }

  // 2. Smart Assignee
  // (Must pass the detected room ID to allow possessive matching like "Ben's Room")
  result.assignedTo = detectAssignee(cleanText, members, result.roomId, rooms, currentUserId)
  if (result.assignedTo) {
    // Remove pronouns like "my" or "me", but keep names to preserve sentence structure
    cleanText = cleanText.replace(/\b(for|by|my|me)\b/gi, '')
    result.tags.push('Assignee Detected')
  }

  // F. RECIPE EXPANSION (The "Expert System")
  // Only triggers if user hasn't manually defined subtasks via Inline Exploder
  if (result.subtasks.length === 0) {
    const lowerName = cleanText.toLowerCase()
    
    // Iterate through our knowledge base
    for (const [trigger, steps] of Object.entries(CHORE_RECIPES)) {
      // Use fuzzy matching or direct inclusion
      if (lowerName.includes(trigger) || isFuzzyMatch(lowerName, trigger)) {
        result.subtasks = [...steps]
        result.tags.push('Auto-Plan') // "Sparkles" visual feedback
        break
      }
    }
  }

  // G. FINAL CLEANUP
  result.name = cleanText
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .replace(/^(to|for|at|in|on)\s+/i, '') // remove leading prepositions
    .replace(/\s+(at|in|on|for)$/i, '') // remove trailing prepositions
    .trim()
  
  // Capitalize first letter
  if (result.name.length > 0) {
    result.name = result.name.charAt(0).toUpperCase() + result.name.slice(1)
  }

  return result
}