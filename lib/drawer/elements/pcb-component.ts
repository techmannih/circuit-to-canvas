import type {
  PcbComponent,
  AnyCircuitElement,
  PcbSmtPad,
  PcbPlatedHole,
} from "circuit-json"
import type { Matrix } from "transformation-matrix"
import type { PcbColorMap, CanvasContext } from "../types"
import { drawPcbSmtPad } from "./pcb-smtpad"
import { drawPcbPlatedHole } from "./pcb-plated-hole"

export interface DrawPcbComponentParams {
  ctx: CanvasContext
  component: PcbComponent
  allElements: AnyCircuitElement[]
  realToCanvasMat: Matrix
  colorMap: PcbColorMap
}

export function drawPcbComponent(params: DrawPcbComponentParams): void {
  const { ctx, component, allElements, realToCanvasMat, colorMap } = params

  // Find all pads associated with this component
  const componentPads = allElements.filter((el) => {
    if (el.type === "pcb_smtpad") {
      const pad = el as PcbSmtPad & { pcb_component_id?: string }
      return pad.pcb_component_id === component.pcb_component_id
    }
    if (el.type === "pcb_plated_hole") {
      const hole = el as PcbPlatedHole & { pcb_component_id?: string }
      return hole.pcb_component_id === component.pcb_component_id
    }
    return false
  })

  // Draw all pads associated with this component
  for (const pad of componentPads) {
    if (pad.type === "pcb_smtpad") {
      drawPcbSmtPad({
        ctx,
        pad: pad as PcbSmtPad,
        realToCanvasMat,
        colorMap,
      })
    } else if (pad.type === "pcb_plated_hole") {
      drawPcbPlatedHole({
        ctx,
        hole: pad as PcbPlatedHole,
        realToCanvasMat,
        colorMap,
      })
    }
  }
}
