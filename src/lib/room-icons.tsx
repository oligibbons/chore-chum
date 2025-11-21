import { 
    BedDouble, 
    Utensils, 
    Bath, 
    Sofa, 
    Car, 
    Flower2, 
    Tv, 
    Shirt, 
    Briefcase, 
    Warehouse,
    Home
  } from 'lucide-react'
  
  export function getRoomIcon(roomName: string, className: string = "h-5 w-5") {
    const lower = roomName.toLowerCase()
  
    if (lower.includes('kitchen') || lower.includes('dining') || lower.includes('food')) {
      return <Utensils className={className} />
    }
    if (lower.includes('bed') || lower.includes('sleep') || lower.includes('guest')) {
      return <BedDouble className={className} />
    }
    if (lower.includes('bath') || lower.includes('toilet') || lower.includes('loo') || lower.includes('wash')) {
      return <Bath className={className} />
    }
    if (lower.includes('living') || lower.includes('lounge') || lower.includes('sitting')) {
      return <Sofa className={className} />
    }
    if (lower.includes('garage') || lower.includes('car') || lower.includes('drive')) {
      return <Car className={className} />
    }
    if (lower.includes('garden') || lower.includes('yard') || lower.includes('patio') || lower.includes('outside')) {
      return <Flower2 className={className} />
    }
    if (lower.includes('media') || lower.includes('game') || lower.includes('tv')) {
      return <Tv className={className} />
    }
    if (lower.includes('laundry') || lower.includes('utility')) {
      return <Shirt className={className} />
    }
    if (lower.includes('office') || lower.includes('study') || lower.includes('work')) {
      return <Briefcase className={className} />
    }
    if (lower.includes('shed') || lower.includes('storage') || lower.includes('attic')) {
      return <Warehouse className={className} />
    }
  
    // Default
    return <Home className={className} />
  }