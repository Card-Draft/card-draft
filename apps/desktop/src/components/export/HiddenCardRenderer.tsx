import { useEffect, useRef, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import type Konva from 'konva'
import { CARD_WIDTH, CARD_HEIGHT } from '@card-draft/template-runtime'
import M15Template from '@card-draft/templates/magic-m15/template'
import type { M15Fields } from '@card-draft/templates/magic-m15/fields'
import { getMergedFieldValues, parseCardFields } from '../../lib/cardFields'
import { getMagicM15AssetsPath } from '../../lib/templateAssets'

interface RenderRequest {
  serializedFields: string
  pixelRatio: number
  resolve: (dataUrl: string) => void
  reject: (error: Error) => void
}

let enqueueRenderRequest:
  | ((request: Omit<RenderRequest, 'resolve' | 'reject'>, resolve: RenderRequest['resolve'], reject: RenderRequest['reject']) => void)
  | null = null
let renderQueue: Promise<unknown> = Promise.resolve()

export function renderCardImageForExport({
  serializedFields,
  pixelRatio,
}: {
  serializedFields: string
  pixelRatio: number
}) {
  const job = renderQueue.catch(() => undefined).then(
    () =>
      new Promise<string>((resolve, reject) => {
        if (!enqueueRenderRequest) {
          reject(new Error('Export renderer not ready'))
          return
        }

        enqueueRenderRequest({ serializedFields, pixelRatio }, resolve, reject)
      }),
  )

  renderQueue = job.catch(() => undefined)
  return job
}

export function HiddenCardRenderer() {
  const stageRef = useRef<Konva.Stage>(null)
  const [request, setRequest] = useState<RenderRequest | null>(null)
  const [assetPending, setAssetPending] = useState(false)

  useEffect(() => {
    enqueueRenderRequest = ({ serializedFields, pixelRatio }, resolve, reject) => {
      setAssetPending(true)
      setRequest({ serializedFields, pixelRatio, resolve, reject })
    }

    return () => {
      enqueueRenderRequest = null
    }
  }, [])

  useEffect(() => {
    if (!request || assetPending) return

    let cancelled = false

    const capture = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return

          const stage = stageRef.current
          if (!stage) {
            request.reject(new Error('Export stage not ready'))
            setRequest(null)
            return
          }

          try {
            request.resolve(stage.toDataURL({ pixelRatio: request.pixelRatio }))
          } catch (error) {
            request.reject(error instanceof Error ? error : new Error(String(error)))
          } finally {
            setRequest(null)
          }
        })
      })
    }

    capture()

    return () => {
      cancelled = true
    }
  }, [assetPending, request])

  if (!request) return null

  const fields = getMergedFieldValues(parseCardFields(request.serializedFields)) as unknown as M15Fields

  return (
    <div className="pointer-events-none fixed -left-[99999px] top-0 opacity-0">
      <Stage ref={stageRef} width={CARD_WIDTH} height={CARD_HEIGHT}>
        <Layer>
          <M15Template
            fields={fields}
            assetsPath={getMagicM15AssetsPath()}
            onAssetStatusChange={(status) => setAssetPending(status.pending)}
          />
        </Layer>
      </Stage>
    </div>
  )
}
