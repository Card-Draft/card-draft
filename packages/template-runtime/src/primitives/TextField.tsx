import { Text } from 'react-konva'
import type { TextConfig } from 'konva/lib/shapes/Text'

interface TextFieldProps {
  x: number
  y: number
  width: number
  height?: number
  text: string
  fontSize?: number
  fontFamily?: string
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bold italic'
  align?: 'left' | 'center' | 'right'
  fill?: string
  letterSpacing?: number
  wrap?: 'word' | 'char' | 'none'
}

export function TextField({
  x,
  y,
  width,
  height,
  text,
  fontSize = 16,
  fontFamily = 'Geist Sans',
  fontStyle = 'normal',
  align = 'left',
  fill = '#1a1a1a',
  letterSpacing = 0,
  wrap = 'word',
}: TextFieldProps) {
  const textProps: TextConfig = {
    x,
    y,
    width,
    text,
    fontSize,
    fontFamily,
    fontStyle,
    align,
    fill,
    letterSpacing,
    wrap,
    listening: false,
  }

  if (height !== undefined) {
    textProps.height = height
  }

  return (
    <Text {...textProps} />
  )
}
