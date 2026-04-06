import { Image, Rect } from 'react-konva'
import useImage from 'use-image'

interface ArtBoxProps {
  x: number
  y: number
  width: number
  height: number
  src?: string | null
  /** Crop as 0–1 fractions */
  cropX?: number
  cropY?: number
  cropWidth?: number
  cropHeight?: number
}

export function ArtBox({ x, y, width, height, src, cropX = 0, cropY = 0, cropWidth = 1, cropHeight = 1 }: ArtBoxProps) {
  const [image] = useImage(src ?? '', 'anonymous')

  if (!image) {
    // Placeholder when no art loaded
    return (
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#2a2a2a"
        stroke="#444"
        strokeWidth={1}
        listening={false}
      />
    )
  }

  const srcX = cropX * image.width
  const srcY = cropY * image.height
  const srcW = cropWidth * image.width
  const srcH = cropHeight * image.height

  return (
    <Image
      x={x}
      y={y}
      width={width}
      height={height}
      image={image}
      crop={{ x: srcX, y: srcY, width: srcW, height: srcH }}
      listening={false}
    />
  )
}
