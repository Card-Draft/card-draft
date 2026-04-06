import { Group, Rect, Text } from 'react-konva'

interface PtBoxProps {
  x: number
  y: number
  power: string
  toughness: string
  background?: string
  textColor?: string
}

export function PtBox({
  x,
  y,
  power,
  toughness,
  background = 'rgba(255,255,255,0.9)',
  textColor = '#111111',
}: PtBoxProps) {
  const text = `${power}/${toughness}`
  const boxW = 52
  const boxH = 24

  return (
    <Group x={x} y={y} listening={false}>
      <Rect width={boxW} height={boxH} fill={background} cornerRadius={2} />
      <Text
        width={boxW}
        height={boxH}
        text={text}
        fontSize={14}
        fontFamily="Geist Sans"
        fontStyle="bold"
        align="center"
        verticalAlign="middle"
        fill={textColor}
      />
    </Group>
  )
}
