import { expect, test } from "bun:test"
import { createCanvas } from "@napi-rs/canvas"
import type {
  AnyCircuitElement,
  PcbComponent,
  PcbSmtPad,
  PcbPlatedHole,
} from "circuit-json"
import { CircuitToCanvasDrawer } from "../../lib/drawer"

test("draw component with smt pads and plated holes", async () => {
  const canvas = createCanvas(200, 200)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 200, 200)

  const component: PcbComponent = {
    type: "pcb_component",
    pcb_component_id: "component1",
    center: { x: 100, y: 100 },
    width: 80,
    height: 60,
    layer: "top",
    rotation: 0,
    source_component_id: "component1",
    obstructs_within_bounds: false,
  }

  const smtPad1: PcbSmtPad & { pcb_component_id?: string } = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad1",
    pcb_component_id: "component1",
    shape: "rect",
    x: 70,
    y: 100,
    width: 15,
    height: 8,
    layer: "top",
  }

  const smtPad2: PcbSmtPad & { pcb_component_id?: string } = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad2",
    pcb_component_id: "component1",
    shape: "circle",
    x: 130,
    y: 100,
    radius: 6,
    layer: "top",
  }

  const platedHole: PcbPlatedHole & { pcb_component_id?: string } = {
    type: "pcb_plated_hole",
    pcb_plated_hole_id: "hole1",
    pcb_component_id: "component1",
    shape: "circle",
    x: 100,
    y: 80,
    outer_diameter: 20,
    hole_diameter: 10,
    layers: ["top", "bottom"],
  }

  const elements: AnyCircuitElement[] = [
    component,
    smtPad1,
    smtPad2,
    platedHole,
  ]

  drawer.drawElements(elements)

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
  )
})

test("draw component with only smt pads", async () => {
  const canvas = createCanvas(200, 200)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 200, 200)

  const component: PcbComponent = {
    type: "pcb_component",
    pcb_component_id: "component2",
    center: { x: 100, y: 100 },
    width: 60,
    height: 40,
    layer: "top",
    rotation: 0,
    source_component_id: "component2",
    obstructs_within_bounds: false,
  }

  const smtPad1: PcbSmtPad & { pcb_component_id?: string } = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad3",
    pcb_component_id: "component2",
    shape: "rect",
    x: 80,
    y: 100,
    width: 12,
    height: 6,
    layer: "top",
  }

  const smtPad2: PcbSmtPad & { pcb_component_id?: string } = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad4",
    pcb_component_id: "component2",
    shape: "rect",
    x: 120,
    y: 100,
    width: 12,
    height: 6,
    layer: "top",
  }

  const elements: AnyCircuitElement[] = [component, smtPad1, smtPad2]

  drawer.drawElements(elements)

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "component-with-smt-pads-only",
  )
})

test("draw component with only plated holes", async () => {
  const canvas = createCanvas(200, 200)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 200, 200)

  const component: PcbComponent = {
    type: "pcb_component",
    pcb_component_id: "component3",
    center: { x: 100, y: 100 },
    width: 50,
    height: 50,
    layer: "top",
    rotation: 0,
    source_component_id: "component3",
    obstructs_within_bounds: false,
  }

  const platedHole1: PcbPlatedHole & { pcb_component_id?: string } = {
    type: "pcb_plated_hole",
    pcb_plated_hole_id: "hole2",
    pcb_component_id: "component3",
    shape: "pill",
    x: 85,
    y: 100,
    outer_width: 18,
    outer_height: 12,
    hole_width: 12,
    hole_height: 6,
    layers: ["top", "bottom"],
    ccw_rotation: 0,
  }

  const platedHole2: PcbPlatedHole & { pcb_component_id?: string } = {
    type: "pcb_plated_hole",
    pcb_plated_hole_id: "hole3",
    pcb_component_id: "component3",
    shape: "pill",
    x: 115,
    y: 100,
    outer_width: 18,
    outer_height: 12,
    hole_width: 12,
    hole_height: 6,
    layers: ["top", "bottom"],
    ccw_rotation: 0,
  }

  const elements: AnyCircuitElement[] = [component, platedHole1, platedHole2]

  drawer.drawElements(elements)

  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "component-with-plated-holes-only",
  )
})

test("draw component pads are not drawn separately", async () => {
  const canvas = createCanvas(200, 200)
  const ctx = canvas.getContext("2d")
  const drawer = new CircuitToCanvasDrawer(ctx)

  ctx.fillStyle = "#1a1a1a"
  ctx.fillRect(0, 0, 200, 200)

  const component: PcbComponent = {
    type: "pcb_component",
    pcb_component_id: "component4",
    center: { x: 100, y: 100 },
    width: 40,
    height: 40,
    layer: "top",
    rotation: 0,
    source_component_id: "component4",
    obstructs_within_bounds: false,
  }

  const smtPad: PcbSmtPad & { pcb_component_id?: string } = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad5",
    pcb_component_id: "component4",
    shape: "rect",
    x: 100,
    y: 100,
    width: 10,
    height: 10,
    layer: "top",
  }

  // Also add a pad without component_id to ensure it still gets drawn
  const standalonePad: PcbSmtPad = {
    type: "pcb_smtpad",
    pcb_smtpad_id: "pad6",
    shape: "rect",
    x: 150,
    y: 100,
    width: 10,
    height: 10,
    layer: "top",
  }

  const elements: AnyCircuitElement[] = [component, smtPad, standalonePad]

  drawer.drawElements(elements)

  // The component pad should be drawn once (via component), and standalone pad should be drawn once
  // This test verifies pads with pcb_component_id are not double-drawn
  await expect(canvas.toBuffer("image/png")).toMatchPngSnapshot(
    import.meta.path,
    "component-pads-not-drawn-separately",
  )
})
