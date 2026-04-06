import { Group, Rect, Text } from 'react-konva'

interface PtBoxProps {
  x: number
  y: number
  power: string
  toughness: string
  background?: string
  textColor?: string
  stroke?: string
}

export function PtBox({
  x,
  y,
  power,
  toughness,
  background = 'rgba(255,255,255,0.9)',
  textColor = '#111111',
  stroke = 'rgba(0,0,0,0.45)',
}: PtBoxProps) {
  const text = `${power}/${toughness}`
  const boxW = 74
  const boxH = 40

  return (
    <Group x={x} y={y} listening={false}>
      <Rect width={boxW} height={boxH} fill={background} stroke={stroke} strokeWidth={2} cornerRadius={10} />
      <Text
        width={boxW}
        height={boxH}
        text={text}
        fontSize={24}
        fontFamily="Georgia"
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        fill={textColor}
      />
    </Group>
  )
}
