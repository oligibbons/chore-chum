// src/components/Greeting.tsx
'use client'

import { useEffect, useState } from 'react'

type Props = {
  name: string
}

export default function Greeting({ name }: Props) {
  const [greeting, setGreeting] = useState('Hi')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 5) setGreeting('Up late') // Fun edge case for night owls
    else if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  return (
    <h2 className="text-4xl font-heading font-bold text-foreground animate-in fade-in duration-700">
      {greeting}, {name}!
    </h2>
  )
}