import type { PcbSmtPad } from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawCircle } from "../shapes/circle"
import { drawRect } from "../shapes/rect"
import { drawPill } from "../shapes/pill"
import { drawPolygon } from "../shapes/polygon"
import {
  drawSoldermaskRingForRect,
  drawSoldermaskRingForCircle,
  drawSoldermaskRingForPill,
  drawSoldermaskRingForPolygon,
  offsetPolygonPoints,
} from "./soldermask-margin"

export interface DrawPcbSmtPadParams {
  ctx: CanvasContext
  pad: PcbSmtPad
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

function layerToColor(layer: string, colorMap: PcbColorMap): string {
  return (
    colorMap.copper[layer as keyof typeof colorMap.copper] ??
    colorMap.copper.top
  )
}

function getSoldermaskColor(layer: string, colorMap: PcbColorMap): string {
  return (
    colorMap.soldermaskOverCopper[
      layer as keyof typeof colorMap.soldermaskOverCopper
    ] ?? colorMap.soldermaskOverCopper.top
  )
}

function getBorderRadius(pad: PcbSmtPad, margin = 0): number {
  let r = 0
  if (pad.shape === "rect" || pad.shape === "rotated_rect") {
    r = pad.corner_radius ?? pad.rect_border_radius ?? 0
  }
  return r + margin
}

export function drawPcbSmtPad(params: DrawPcbSmtPadParams): void {
  const { ctx, pad, realToCanvasMat, colorMap } = params

  const color = layerToColor(pad.layer, colorMap)
  const isCoveredWithSoldermask = pad.is_covered_with_solder_mask === true
  const margin = isCoveredWithSoldermask ? 0 : (pad.soldermask_margin ?? 0)

  const soldermaskRingColor = getSoldermaskColor(pad.layer, colorMap)
  const positiveMarginColor = colorMap.substrate
  const soldermaskOverlayColor = getSoldermaskColor(pad.layer, colorMap)

  const hasSoldermask = !isCoveredWithSoldermask && margin !== 0

  let ml = margin
  let mr = margin
  let mt = margin
  let mb = margin
  let hasAnySoldermask = hasSoldermask

  if (
    !isCoveredWithSoldermask &&
    (pad.shape === "rect" || pad.shape === "rotated_rect")
  ) {
    ml = pad.soldermask_margin_left ?? pad.soldermask_margin ?? 0
    mr = pad.soldermask_margin_right ?? pad.soldermask_margin ?? 0
    mt = pad.soldermask_margin_top ?? pad.soldermask_margin ?? 0
    mb = pad.soldermask_margin_bottom ?? pad.soldermask_margin ?? 0
    hasAnySoldermask = ml !== 0 || mr !== 0 || mt !== 0 || mb !== 0
  }

  // Draw the copper pad
  if (pad.shape === "rect") {
    // For positive margins, draw extended mask area first
    if (hasAnySoldermask && (ml > 0 || mr > 0 || mt > 0 || mb > 0)) {
      drawRect({
        ctx,
        center: { x: pad.x + (mr - ml) / 2, y: pad.y + (mt - mb) / 2 },
        width: pad.width + ml + mr,
        height: pad.height + mt + mb,
        fill: positiveMarginColor,
        realToCanvasMat,
        borderRadius: getBorderRadius(pad),
      })
    }

    // Draw the pad on top
    drawRect({
      ctx,
      center: { x: pad.x, y: pad.y },
      width: pad.width,
      height: pad.height,
      fill: color,
      realToCanvasMat,
      borderRadius: getBorderRadius(pad),
    })

    // For negative margins, draw soldermask ring on top of the pad
    if (hasAnySoldermask && (ml < 0 || mr < 0 || mt < 0 || mb < 0)) {
      drawSoldermaskRingForRect(
        ctx,
        { x: pad.x, y: pad.y },
        pad.width,
        pad.height,
        pad.soldermask_margin ?? 0,
        getBorderRadius(pad),
        0,
        realToCanvasMat,
        soldermaskRingColor,
        color,
        { left: ml, right: mr, top: mt, bottom: mb },
      )
    }

    // If covered with soldermask, draw soldermaskOverCopper overlay
    if (isCoveredWithSoldermask) {
      drawRect({
        ctx,
        center: { x: pad.x, y: pad.y },
        width: pad.width,
        height: pad.height,
        fill: soldermaskOverlayColor,
        realToCanvasMat,
        borderRadius: getBorderRadius(pad),
      })
    }
    return
  }

  if (pad.shape === "rotated_rect") {
    const radians = ((pad.ccw_rotation ?? 0) * Math.PI) / 180
    const dxLocal = (mr - ml) / 2
    const dyLocal = (mt - mb) / 2
    const dxGlobal = dxLocal * Math.cos(radians) - dyLocal * Math.sin(radians)
    const dyGlobal = dxLocal * Math.sin(radians) + dyLocal * Math.cos(radians)

    // For positive margins, draw extended mask area first
    if (hasAnySoldermask && (ml > 0 || mr > 0 || mt > 0 || mb > 0)) {
      drawRect({
        ctx,
        center: { x: pad.x + dxGlobal, y: pad.y + dyGlobal },
        width: pad.width + ml + mr,
        height: pad.height + mt + mb,
        fill: positiveMarginColor,
        realToCanvasMat,
        borderRadius: getBorderRadius(pad),
        rotation: pad.ccw_rotation ?? 0,
      })
    }

    // Draw the pad on top
    drawRect({
      ctx,
      center: { x: pad.x, y: pad.y },
      width: pad.width,
      height: pad.height,
      fill: color,
      realToCanvasMat,
      borderRadius: getBorderRadius(pad),
      rotation: pad.ccw_rotation ?? 0,
    })

    // For negative margins, draw soldermask ring on top of the pad
    if (hasAnySoldermask && (ml < 0 || mr < 0 || mt < 0 || mb < 0)) {
      drawSoldermaskRingForRect(
        ctx,
        { x: pad.x, y: pad.y },
        pad.width,
        pad.height,
        pad.soldermask_margin ?? 0,
        getBorderRadius(pad),
        pad.ccw_rotation ?? 0,
        realToCanvasMat,
        soldermaskRingColor,
        color,
        { left: ml, right: mr, top: mt, bottom: mb },
      )
    }

    // If covered with soldermask, draw soldermaskOverCopper overlay
    if (isCoveredWithSoldermask) {
      drawRect({
        ctx,
        center: { x: pad.x, y: pad.y },
        width: pad.width,
        height: pad.height,
        fill: soldermaskOverlayColor,
        realToCanvasMat,
        borderRadius: getBorderRadius(pad),
        rotation: pad.ccw_rotation ?? 0,
      })
    }
    return
  }

  if (pad.shape === "circle") {
    // For positive margins, draw extended mask area first
    if (hasSoldermask && margin > 0) {
      drawCircle({
        ctx,
        center: { x: pad.x, y: pad.y },
        radius: pad.radius + margin,
        fill: positiveMarginColor,
        realToCanvasMat,
      })
    }

    // Draw the pad on top
    drawCircle({
      ctx,
      center: { x: pad.x, y: pad.y },
      radius: pad.radius,
      fill: color,
      realToCanvasMat,
    })

    // For negative margins, draw soldermask ring on top of the pad
    if (hasSoldermask && margin < 0) {
      drawSoldermaskRingForCircle(
        ctx,
        { x: pad.x, y: pad.y },
        pad.radius,
        margin,
        realToCanvasMat,
        soldermaskRingColor,
        color,
      )
    }

    // If covered with soldermask and margin == 0 (treat as 0 positive margin), draw soldermaskOverCopper overlay
    if (isCoveredWithSoldermask && margin === 0) {
      drawCircle({
        ctx,
        center: { x: pad.x, y: pad.y },
        radius: pad.radius,
        fill: soldermaskOverlayColor,
        realToCanvasMat,
      })
    }
    return
  }

  if (pad.shape === "pill") {
    // For positive margins, draw extended mask area first
    if (hasSoldermask && margin > 0) {
      drawPill({
        ctx,
        center: { x: pad.x, y: pad.y },
        width: pad.width + margin * 2,
        height: pad.height + margin * 2,
        fill: positiveMarginColor,
        realToCanvasMat,
      })
    }

    // Draw the pad on top
    drawPill({
      ctx,
      center: { x: pad.x, y: pad.y },
      width: pad.width,
      height: pad.height,
      fill: color,
      realToCanvasMat,
    })

    // For negative margins, draw soldermask ring on top of the pad
    if (hasSoldermask && margin < 0) {
      drawSoldermaskRingForPill(
        ctx,
        { x: pad.x, y: pad.y },
        pad.width,
        pad.height,
        margin,
        0,
        realToCanvasMat,
        soldermaskRingColor,
        color,
      )
    }

    // If covered with soldermask and margin == 0 (treat as 0 positive margin), draw soldermaskOverCopper overlay
    if (isCoveredWithSoldermask && margin === 0) {
      drawPill({
        ctx,
        center: { x: pad.x, y: pad.y },
        width: pad.width,
        height: pad.height,
        fill: soldermaskOverlayColor,
        realToCanvasMat,
      })
    }
    return
  }

  if (pad.shape === "rotated_pill") {
    // For positive margins, draw extended mask area first
    if (hasSoldermask && margin > 0) {
      drawPill({
        ctx,
        center: { x: pad.x, y: pad.y },
        width: pad.width + margin * 2,
        height: pad.height + margin * 2,
        fill: positiveMarginColor,
        realToCanvasMat,
        rotation: pad.ccw_rotation ?? 0,
      })
    }

    // Draw the pad on top
    drawPill({
      ctx,
      center: { x: pad.x, y: pad.y },
      width: pad.width,
      height: pad.height,
      fill: color,
      realToCanvasMat,
      rotation: pad.ccw_rotation ?? 0,
    })

    // For negative margins, draw soldermask ring on top of the pad
    if (hasSoldermask && margin < 0) {
      drawSoldermaskRingForPill(
        ctx,
        { x: pad.x, y: pad.y },
        pad.width,
        pad.height,
        margin,
        pad.ccw_rotation ?? 0,
        realToCanvasMat,
        soldermaskRingColor,
        color,
      )
    }

    // If covered with soldermask and margin == 0 (treat as 0 positive margin), draw soldermaskOverCopper overlay
    if (isCoveredWithSoldermask && margin === 0) {
      drawPill({
        ctx,
        center: { x: pad.x, y: pad.y },
        width: pad.width,
        height: pad.height,
        fill: soldermaskOverlayColor,
        realToCanvasMat,
        rotation: pad.ccw_rotation ?? 0,
      })
    }
    return
  }

  if (pad.shape === "polygon") {
    if (pad.points && pad.points.length >= 3) {
      // For positive margins, draw extended mask area first
      if (hasSoldermask && margin > 0) {
        const expandedPoints = offsetPolygonPoints(pad.points, margin)
        drawPolygon({
          ctx,
          points: expandedPoints,
          fill: positiveMarginColor,
          realToCanvasMat,
        })
      }

      // Draw the copper pad
      drawPolygon({
        ctx,
        points: pad.points,
        fill: color,
        realToCanvasMat,
      })

      // For negative margins, draw soldermask ring on top of the pad
      if (hasSoldermask && margin < 0) {
        drawSoldermaskRingForPolygon(
          ctx,
          pad.points,
          margin,
          realToCanvasMat,
          soldermaskRingColor,
          color,
        )
      }

      // If covered with soldermask and margin == 0 (treat as 0 positive margin), draw soldermaskOverCopper overlay
      if (isCoveredWithSoldermask && margin === 0) {
        drawPolygon({
          ctx,
          points: pad.points,
          fill: soldermaskOverlayColor,
          realToCanvasMat,
        })
      }
    }
    return
  }
}
