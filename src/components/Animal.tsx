import { useEffect, useState } from "preact/hooks"

const relativePositions = [
  { vals: [-1, -1], animals: ['blue_jay', 'crane', 'crow', 'dove', 'duck', 'parrot', 'penguin', 'pigeon', 'rooster'] },
  { vals: [-1, 0], animals: ['pelican'] },
  { vals: [-1, -2], animals: ['eagle', 'toucan'] },
  { vals: [0, -1], animals: ['owl'] }
]

export function Animal (
  { name, rotation, size, animateIn }:
  { name: string, rotation: number, size: 1 | 2, animateIn?: number }
) {
  const pos = relativePositions.find(p => p.animals.includes(name))
  const [showing, setShowing] = useState(false)

  let transform = `rotate(${rotation * 45}deg)`
  if (pos) transform += ` translate(${pos.vals[0]! * size}px, ${pos.vals[1]! * size}px)`
  if (animateIn) transform += ` scale(${showing ? 1 : 0.8})`

  useEffect(() => {
    if (animateIn) {
      window.setTimeout(() => setShowing(true), animateIn)
    }
  }, [])

  return <img
    src={`/animals/${name}.svg`}
    width={size * 20}
    height={size * 20}
    style={{
      transform,
      opacity: animateIn && !showing ? 0 : 1,
      transition: 'transform 0.3s ease-out 0.1s, opacity 0.2s ease-out'
    }}
  />
}
