import type { PCBKeepout } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import { applyToPoint } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawRect } from "../shapes/rect"

export interface DrawPcbKeepoutParams {
  ctx: CanvasContext
  keepout: PCBKeepout
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

export function drawPcbKeepout(params: DrawPcbKeepoutParams): void {
  const { ctx, keepout, realToCanvasMat, colorMap } = params

  // Keepout zones are shown with diagonal red lines pattern and dashed border
  const strokeColor = colorMap.keepout
  const strokeWidth = 0.3 // Thicker stroke for better visibility
  const hatchSpacing = 1.0 // Spacing between diagonal lines

  if (keepout.shape === "rect") {
    const [cx, cy] = applyToPoint(realToCanvasMat, [
      keepout.center.x,
      keepout.center.y,
    ])
    const scaledWidth = keepout.width * Math.abs(realToCanvasMat.a)
    const scaledHeight = keepout.height * Math.abs(realToCanvasMat.a)
    const scaledStrokeWidth = strokeWidth * Math.abs(realToCanvasMat.a)
    const rotation = (keepout as { rotation?: number }).rotation ?? 0

    ctx.save()
    ctx.translate(cx, cy)

    if (rotation !== 0) {
      ctx.rotate(-rotation * (Math.PI / 180))
    }

    // Set up clipping path for the rectangle
    ctx.beginPath()
    ctx.rect(-scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight)
    ctx.clip()

    // Draw diagonal lines pattern at 45 degrees
    const scaledSpacing = hatchSpacing * Math.abs(realToCanvasMat.a)
    const diagonal = Math.sqrt(
      scaledWidth * scaledWidth + scaledHeight * scaledHeight,
    )
    const halfWidth = scaledWidth / 2
    const halfHeight = scaledHeight / 2

    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 0.15 * Math.abs(realToCanvasMat.a)
    ctx.setLineDash([])

    // Draw diagonal lines from top-left to bottom-right
    for (
      let offset = -diagonal;
      offset < diagonal * 2;
      offset += scaledSpacing
    ) {
      ctx.beginPath()
      // Line goes from left edge to right edge (or top to bottom)
      const startX = -halfWidth + offset
      const startY = -halfHeight
      const endX = -halfWidth + offset + diagonal
      const endY = -halfHeight + diagonal

      ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
      ctx.stroke()
    }

    ctx.restore()

    // Draw dashed border
    drawRect({
      ctx,
      center: keepout.center,
      width: keepout.width,
      height: keepout.height,
      fill: undefined,
      stroke: strokeColor,
      strokeWidth,
      realToCanvasMat,
      rotation,
      isStrokeDashed: true,
    })
    return
  }

  if (keepout.shape === "circle") {
    const [cx, cy] = applyToPoint(realToCanvasMat, [
      keepout.center.x,
      keepout.center.y,
    ])
    const scaledRadius = keepout.radius * Math.abs(realToCanvasMat.a)
    const scaledStrokeWidth = strokeWidth * Math.abs(realToCanvasMat.a)
    const scaledSpacing = hatchSpacing * Math.abs(realToCanvasMat.a)

    ctx.save()
    ctx.translate(cx, cy)

    // Set up clipping path for the circle
    ctx.beginPath()
    ctx.arc(0, 0, scaledRadius, 0, Math.PI * 2)
    ctx.clip()

    // Draw diagonal lines pattern at 45 degrees
    const diagonal = scaledRadius * 2

    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 0.15 * Math.abs(realToCanvasMat.a)
    ctx.setLineDash([])

    // Draw diagonal lines from top-left to bottom-right
    for (
      let offset = -diagonal;
      offset < diagonal * 2;
      offset += scaledSpacing
    ) {
      ctx.beginPath()
      ctx.moveTo(offset - diagonal, -diagonal)
      ctx.lineTo(offset + diagonal, diagonal)
      ctx.stroke()
    }

    ctx.restore()

    // Draw dashed border
    ctx.save()
    ctx.setLineDash([scaledStrokeWidth * 3, scaledStrokeWidth * 2])
    ctx.beginPath()
    ctx.arc(cx, cy, scaledRadius, 0, Math.PI * 2)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = scaledStrokeWidth
    ctx.stroke()
    ctx.restore()
    return
  }
}
