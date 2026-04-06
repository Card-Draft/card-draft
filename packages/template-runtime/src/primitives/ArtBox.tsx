import React from 'react'
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
  onImageStatusChange?: (status: { src: string | null; loaded: boolean; error: string | null }) => void
}

export function ArtBox({
  x,
  y,
  width,
  height,
  src,
  cropX = 0,
  cropY = 0,
  cropWidth = 1,
  cropHeight = 1,
  onImageStatusChange,
}: ArtBoxProps) {
  const crossOrigin = src?.startsWith('file://') ? undefined : 'anonymous'
  const [image, status] = useImage(src ?? '', crossOrigin)

  React.useEffect(() => {
    if (!onImageStatusChange) return

    if (!src) {
      onImageStatusChange({ src: null, loaded: false, error: null })
      return
    }

    if (status === 'loaded' && image) {
      onImageStatusChange({ src, loaded: true, error: null })
      return
    }

    if (status === 'failed') {
      onImageStatusChange({
        src,
        loaded: false,
        error: `Failed to load image: ${src}`,
      })
      return
    }

    onImageStatusChange({ src, loaded: false, error: null })
  }, [image, onImageStatusChange, src, status])

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
