declare module 'react-konva' {
  import type { ComponentType } from 'react'

  type KonvaComponentProps = Record<string, unknown>

  export const Group: ComponentType<KonvaComponentProps>
  export const Stage: ComponentType<KonvaComponentProps>
  export const Layer: ComponentType<KonvaComponentProps>
  export const Rect: ComponentType<KonvaComponentProps>
  export const Circle: ComponentType<KonvaComponentProps>
  export const Image: ComponentType<KonvaComponentProps>
  export const Text: ComponentType<KonvaComponentProps>
}
