// src/lib/smart-parser.ts

import { DbProfile, DbRoom } from '@/types/database'

type ParsedChore = {
  name: string
  roomId?: number
  assignedTo?: string 
  recurrence?: string 
  dueDate?: string
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'any'
  exactTime?: string
  instances?: number
}

// --- 1. Lightweight Fuzzy Matcher (Levenshtein) ---
function isFuzzyMatch(input: string, target: string, threshold = 2): boolean {
  const a = input.toLowerCase()
  const b = target.toLowerCase()
  
  if (a === b) return true
  if (a.length < 3 || b.length < 3) return false 
  if (Math.abs(a.length - b.length) > threshold) return false

  const matrix = []
  for (let i = 0; i <= b.length; i++) { matrix[i] = [i] }
  for (let j = 0; j <= a.length; j++) { matrix[0][j] = j }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, 
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        )
      }
    }
  }

  return matrix[b.length][a.length] <= threshold
}

// --- 2. Massive Keyword & Alias Map ---
const ROOM_DEFINITIONS: Record<string, { aliases: string[], keywords: string[] }> = {
  'Kitchen': {
    aliases: ['kitchen', 'pantry', 'scullery', 'galley'],
    keywords: [
      'fridge', 'refrigerator', 'dishwasher', 'oven', 'stove', 'hob', 'microwave', 'sink', 'cook', 
      'bake', 'meal', 'prep', 'groceries', 'food', 'toaster', 'kettle', 'coffee', 'blender', 'mixer', 
      'freezer', 'cupboard', 'pantry', 'counter', 'surface', 'wipe', 'mop', 'sweep', 'breakfast', 
      'lunch', 'dinner', 'supper', 'dishes', 'cutlery', 'pots', 'pans', 'bowl', 'plate', 'mug', 'cup',
      'trash', 'bin', 'garbage', 'rubbish', 'recycling', 'compost'
    ]
  },
  'Lounge': {
    aliases: ['lounge', 'living room', 'sitting room', 'front room', 'family room', 'den', 'drawing room'],
    keywords: [
      'sofa', 'couch', 'settee', 'tv', 'television', 'telly', 'remote', 'rug', 'carpet', 'floor', 
      'coffee table', 'cushion', 'throw', 'blanket', 'netflix', 'movie', 'relax', 'fireplace', 'hearth', 
      'mantel', 'curtains', 'blinds', 'vacuum', 'hoover', 'dust', 'bookshelf', 'books', 'magazine', 
      'gaming', 'console', 'xbox', 'playstation', 'switch', 'controller'
    ]
  },
  'Bathroom': {
    aliases: ['bathroom', 'toilet', 'loo', 'restroom', 'powder room', 'en-suite', 'ensuite', 'shower room', 'wc'],
    keywords: [
      'toilet', 'bog', 'flush', 'shower', 'bath', 'tub', 'soak', 'sink', 'basin', 'tap', 'faucet', 
      'mirror', 'towel', 'flannel', 'shampoo', 'soap', 'gel', 'conditioner', 'toothbrush', 'paste', 
      'floss', 'mat', 'tiles', 'grout', 'bleach', 'scrub', 'limescale', 'fan', 'cabinet', 'medicine'
    ]
  },
  'Bedroom': {
    aliases: ['bedroom', 'bed room', 'nursery', 'master', 'guest room', 'dorm'],
    keywords: [
      'bed', 'sheet', 'pillow', 'duvet', 'quilt', 'mattress', 'wardrobe', 'closet', 'clothes', 
      'drawer', 'dresser', 'chest', 'alarm', 'clock', 'sleep', 'nap', 'laundry', 'folding', 'hanger', 
      'bedside', 'lamp', 'teddy', 'toy', 'makeup', 'vanity'
    ]
  },
  'Laundry': {
    aliases: ['laundry', 'utility', 'utility room', 'wash room'],
    keywords: [
      'washer', 'washing machine', 'dryer', 'tumble', 'iron', 'ironing', 'press', 'steam', 'fold', 
      'basket', 'hamper', 'detergent', 'powder', 'softener', 'bleach', 'stain', 'linen', 'clothes horse', 
      'airer', 'peg'
    ]
  },
  'Garden': {
    aliases: ['garden', 'yard', 'backyard', 'front yard', 'patio', 'deck', 'terrace', 'balcony', 'outside', 'outdoors'],
    keywords: [
      'mow', 'lawn', 'grass', 'turf', 'weed', 'water', 'hose', 'sprinkler', 'plant', 'flower', 'bed', 
      'pot', 'rake', 'leaf', 'leaves', 'shed', 'hut', 'bbq', 'barbecue', 'grill', 'furniture', 'bench', 
      'fence', 'gate', 'hedge', 'trim', 'prune', 'branch', 'compost', 'path', 'paver', 'driveway', 'sweep'
    ]
  },
  'Garage': {
    aliases: ['garage', 'carport', 'workshop', 'shed'],
    keywords: [
      'car', 'vehicle', 'bike', 'bicycle', 'cycle', 'tool', 'drill', 'hammer', 'saw', 'ladder', 
      'box', 'storage', 'workbench', 'oil', 'tire', 'tyre', 'pump', 'paint', 'fix', 'repair', 'motor'
    ]
  },
  'Hallway': {
    aliases: ['hallway', 'hall', 'landing', 'entry', 'entrance', 'foyer', 'porch', 'corridor', 'stairs', 'staircase'],
    keywords: [
      'shoe', 'boot', 'coat', 'jacket', 'umbrella', 'key', 'mat', 'rug', 'runner', 'vacuum', 'sweep', 
      'banister', 'rail', 'railing', 'step', 'bulb', 'mail', 'post', 'letter', 'bell', 'door'
    ]
  },
  'Office': {
    aliases: ['office', 'study', 'studio', 'work room', 'library', 'desk'],
    keywords: [
      'desk', 'computer', 'pc', 'mac', 'laptop', 'keyboard', 'mouse', 'monitor', 'screen', 'printer', 
      'ink', 'paper', 'file', 'folder', 'pen', 'pencil', 'meeting', 'zoom', 'work', 'chair', 'shelf', 
      'books', 'shredder', 'bills', 'admin'
    ]
  },
  'Dining': {
    aliases: ['dining room', 'diner', 'eating area'],
    keywords: [
      'table', 'chair', 'placemat', 'coaster', 'napkin', 'cutlery', 'silverware', 'crockery', 'china', 
      'glass', 'wine', 'feast', 'serve', 'host', 'supper'
    ]
  }
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
    recurrence: 'none',
    instances: 1
  }

  const words = remainingText.split(' ')

  // --- 3. Instance Detection (e.g., "x3", "3 times", "3 loads") ---
  const instanceMatch = remainingText.match(/\b(?:x|times?)\s*(\d+)\b/i) || remainingText.match(/\b(\d+)\s*(?:loads|bags|sets|lots)\b/i)
  if (instanceMatch) {
    const count = parseInt(instanceMatch[1])
    if (count > 1 && count <= 20) {
        result.instances = count
        remainingText = remainingText.replace(instanceMatch[0], '')
    }
  }

  // --- 4. Exact Time Detection (e.g., "5pm", "17:00", "at 4:30") ---
  const timeRegex = /\b((?:1[0-2]|0?[1-9])(?::(\d{2}))?\s*(?:am|pm)|(?:[01]\d|2[0-3]):[0-5]\d)\b/i
  const timeMatch = remainingText.match(timeRegex)
  
  if (timeMatch) {
    const timeStr = timeMatch[0].toLowerCase()
    let hours = 0
    let minutes = 0
    
    if (timeStr.includes(':')) {
        const parts = timeStr.replace(/(am|pm)/, '').split(':')
        hours = parseInt(parts[0])
        minutes = parseInt(parts[1])
    } else {
        hours = parseInt(timeStr.replace(/(am|pm)/, ''))
    }

    if (timeStr.includes('pm') && hours < 12) hours += 12
    if (timeStr.includes('am') && hours === 12) hours = 0
    
    result.exactTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    
    if (hours < 12) result.timeOfDay = 'morning'
    else if (hours < 17) result.timeOfDay = 'afternoon'
    else result.timeOfDay = 'evening'

    remainingText = remainingText.replace(timeMatch[0], '').replace(/\bat\b/i, '')
  }

  // --- 5. Assignee Detection ---
  if (/\b(my|me|i)\b/i.test(remainingText)) {
    result.assignedTo = currentUserId
    remainingText = remainingText.replace(/\b(my|me|i)\b/i, '')
  } else {
    for (const member of members) {
      if (!member.full_name) continue
      const firstName = member.full_name.split(' ')[0]
      
      const strictRegex = new RegExp(`\\b(for|by)?\\s*${firstName}\\b`, 'i')
      
      if (strictRegex.test(remainingText)) {
        result.assignedTo = member.id
        remainingText = remainingText.replace(strictRegex, '')
        break
      } 
      
      const foundWord = words.find(w => isFuzzyMatch(w, firstName, 1))
      if (foundWord) {
          result.assignedTo = member.id
          remainingText = remainingText.replace(foundWord, '')
          break
      }
    }
  }

  // --- 6. Advanced Room Detection ---
  // Strategy: 
  // 1. Look for direct room name matches in input.
  // 2. Look for keyword matches that map to a generic Room Type.
  // 3. If Room Type found, find best matching room in user's DB.

  let detectedRoomType: string | null = null

  // A. Direct Match (User typed "Downstairs Hall")
  for (const room of rooms) {
    const regex = new RegExp(`\\b(in|at)?\\s*${room.name}\\b`, 'i')
    if (regex.test(remainingText)) {
      result.roomId = room.id
      remainingText = remainingText.replace(regex, '')
      break
    }
  }

  // B. Keyword Match (User typed "Clean shoes" -> implies Hallway)
  if (!result.roomId) {
    for (const [type, def] of Object.entries(ROOM_DEFINITIONS)) {
        // Check keywords
        const foundKeyword = def.keywords.find(k => new RegExp(`\\b${k}\\b`, 'i').test(remainingText))
        
        if (foundKeyword) {
            detectedRoomType = type
            // NOTE: We usually DO NOT remove the object keyword (e.g. "Clean Fridge")
            // But if the user typed a room alias like "Loo", we might want to match it
            break
        }

        // Check aliases (User typed "Loo")
        const foundAlias = def.aliases.find(a => new RegExp(`\\b(in|at)?\\s*${a}\\b`, 'i').test(remainingText))
        if (foundAlias) {
            detectedRoomType = type
            remainingText = remainingText.replace(new RegExp(`\\b(in|at)?\\s*${foundAlias}\\b`, 'i'), '')
            break
        }
    }
  }

  // C. Resolve Room Type to User's Room List
  if (!result.roomId && detectedRoomType) {
      // 1. Try to find a room that contains the detected type name (e.g. "Kitchen" matches "Main Kitchen")
      const typeNameMatch = rooms.find(r => r.name.toLowerCase().includes(detectedRoomType!.toLowerCase()))
      
      // 2. Try to find a room that contains any alias of the detected type (e.g. "Lounge" matches "Living Room")
      const def = ROOM_DEFINITIONS[detectedRoomType]
      const aliasMatch = rooms.find(r => def.aliases.some(a => r.name.toLowerCase().includes(a.toLowerCase())))

      if (typeNameMatch) result.roomId = typeNameMatch.id
      else if (aliasMatch) result.roomId = aliasMatch.id
  }

  // --- 7. Recurrence & Date ---
  let untilDateStr = ''
  const untilMatch = remainingText.match(/until\s+([A-Za-z]+\s+\d{1,2}|\d{1,2}\/\d{1,2}|\d{4}-\d{2}-\d{2})/i)
  if (untilMatch) {
      const dateStr = untilMatch[1]
      const dateObj = new Date(dateStr)
      if (!isNaN(dateObj.getTime())) {
          if (dateObj < new Date()) dateObj.setFullYear(dateObj.getFullYear() + 1)
          untilDateStr = dateObj.toISOString().split('T')[0]
          remainingText = remainingText.replace(untilMatch[0], '')
      }
  }

  const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const everyDayMatch = remainingText.match(new RegExp(`every\\s+(${daysOfWeek.join('|')})`, 'i'))
  
  if (everyDayMatch) {
      result.recurrence = untilDateStr ? `custom:weekly:1:${untilDateStr}` : 'weekly'
      remainingText = remainingText.replace(everyDayMatch[0], '')
      
      const targetDayIndex = daysOfWeek.indexOf(everyDayMatch[1].toLowerCase())
      const today = new Date()
      let daysToAdd = targetDayIndex - today.getDay()
      if (daysToAdd <= 0) daysToAdd += 7
      const nextDate = new Date()
      nextDate.setDate(today.getDate() + daysToAdd)
      result.dueDate = nextDate.toISOString().split('T')[0]
  }
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

  const today = new Date()
  let targetDate: Date | null = null
  
  if (/\btomorrow\b/i.test(remainingText)) {
    targetDate = new Date()
    targetDate.setDate(today.getDate() + 1)
    remainingText = remainingText.replace(/\btomorrow\b/i, '')
  } 
  else if (/\btonight\b/i.test(remainingText)) {
    result.timeOfDay = 'evening'
    targetDate = new Date()
    remainingText = remainingText.replace(/\btonight\b/i, '')
  }

  if (targetDate) {
    result.dueDate = targetDate.toISOString().split('T')[0]
  }

  // --- 8. Final Cleanup ---
  result.name = remainingText
    .replace(/\s+/g, ' ') 
    .replace(/^(to|for|at|in)\s+/i, '') 
    .replace(/\s+(at|in|on|for)$/i, '')
    .trim()
  
  if (result.name.length > 0) {
    result.name = result.name.charAt(0).toUpperCase() + result.name.slice(1)
  }

  return result
}