#!/usr/bin/env node
/**
 * Build the tiny stage-kit GLBs in public/sets/.
 * These files are static assets (not imported by the JS bundle).
 *
 *   node scripts/build-stage-kits.mjs
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '..', 'public', 'sets')

const FACES = [
  { n: [1, 0, 0], verts: [[1, -1, -1], [1, -1, 1], [1, 1, 1], [1, 1, -1]] },
  { n: [-1, 0, 0], verts: [[-1, -1, 1], [-1, -1, -1], [-1, 1, -1], [-1, 1, 1]] },
  { n: [0, 1, 0], verts: [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]] },
  { n: [0, -1, 0], verts: [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]] },
  { n: [0, 0, 1], verts: [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]] },
  { n: [0, 0, -1], verts: [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]] },
]

function addBox(dst, center, size) {
  const [cx, cy, cz] = center
  const [sx, sy, sz] = size
  for (const face of FACES) {
    const start = dst.positions.length / 3
    for (const v of face.verts) {
      dst.positions.push(cx + v[0] * sx * 0.5, cy + v[1] * sy * 0.5, cz + v[2] * sz * 0.5)
      dst.normals.push(face.n[0], face.n[1], face.n[2])
    }
    dst.indices.push(start, start + 1, start + 2, start, start + 2, start + 3)
  }
}

function part(name, color, boxes) {
  const dst = { positions: [], normals: [], indices: [] }
  for (const box of boxes) addBox(dst, box.center, box.size)
  return { name, color, ...dst }
}

function align4(n) {
  return (n + 3) & ~3
}

function encodeGlb(json, bin) {
  let jsonBuf = Buffer.from(JSON.stringify(json))
  const jsonPad = (4 - (jsonBuf.length % 4)) % 4
  if (jsonPad) jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)])

  let binBuf = Buffer.from(bin)
  const binPad = (4 - (binBuf.length % 4)) % 4
  if (binPad) binBuf = Buffer.concat([binBuf, Buffer.alloc(binPad, 0)])

  const total = 12 + 8 + jsonBuf.length + 8 + binBuf.length
  const header = Buffer.alloc(12)
  header.writeUInt32LE(0x46546c67, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(total, 8)

  const jsonHeader = Buffer.alloc(8)
  jsonHeader.writeUInt32LE(jsonBuf.length, 0)
  jsonHeader.writeUInt32LE(0x4e4f534a, 4)

  const binHeader = Buffer.alloc(8)
  binHeader.writeUInt32LE(binBuf.length, 0)
  binHeader.writeUInt32LE(0x004e4942, 4)

  return Buffer.concat([header, jsonHeader, jsonBuf, binHeader, binBuf])
}

function bounds(values, stride) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < values.length; i += stride) {
    for (let k = 0; k < stride; k++) {
      min[k] = Math.min(min[k], values[i + k])
      max[k] = Math.max(max[k], values[i + k])
    }
  }
  return { min, max }
}

function buildGlb(parts) {
  const chunks = []
  let cursor = 0
  const bufferViews = []
  const accessors = []
  const meshes = []
  const materials = []
  const nodes = []

  const pushBytes = (typed, target) => {
    const byteOffset = align4(cursor)
    const pad = byteOffset - cursor
    if (pad) chunks.push(Buffer.alloc(pad))
    const buf = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength)
    chunks.push(buf)
    bufferViews.push({
      buffer: 0,
      byteOffset,
      byteLength: typed.byteLength,
      target,
    })
    cursor = byteOffset + typed.byteLength
    return bufferViews.length - 1
  }

  parts.forEach((meshPart, index) => {
    const positions = Float32Array.from(meshPart.positions)
    const normals = Float32Array.from(meshPart.normals)
    const indices = Uint16Array.from(meshPart.indices)
    const posView = pushBytes(positions, 34962)
    const norView = pushBytes(normals, 34962)
    const idxView = pushBytes(indices, 34963)
    const { min, max } = bounds(meshPart.positions, 3)
    const posAcc = accessors.length
    accessors.push({
      bufferView: posView,
      componentType: 5126,
      count: positions.length / 3,
      type: 'VEC3',
      min,
      max,
    })
    const norAcc = accessors.length
    accessors.push({
      bufferView: norView,
      componentType: 5126,
      count: normals.length / 3,
      type: 'VEC3',
    })
    const idxAcc = accessors.length
    accessors.push({
      bufferView: idxView,
      componentType: 5123,
      count: indices.length,
      type: 'SCALAR',
    })
    materials.push({
      name: meshPart.name,
      doubleSided: true,
      pbrMetallicRoughness: {
        baseColorFactor: meshPart.color,
        metallicFactor: 0.04,
        roughnessFactor: 0.72,
      },
    })
    meshes.push({
      name: meshPart.name,
      primitives: [{
        attributes: { POSITION: posAcc, NORMAL: norAcc },
        indices: idxAcc,
        material: index,
      }],
    })
    nodes.push({ name: meshPart.name, mesh: index })
  })

  const bin = Buffer.concat(chunks)
  const paddedLength = align4(bin.length)
  const json = {
    asset: { version: '2.0', generator: 'jokesters-build-stage-kits' },
    scene: 0,
    scenes: [{ name: 'kit', nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength: paddedLength }],
  }
  const glb = encodeGlb(json, bin)
  if (glb.length > 1024 * 1024) {
    throw new Error(`Kit GLB is ${glb.length} bytes; keep sets under 1 MB`)
  }
  return glb
}

const kits = {
  'talkshow.glb': [
    part('desk', [0.55, 0.32, 0.16, 1], [
      { center: [0, 0.78, 1.2], size: [6.6, 0.1, 1.2] },
    ]),
    part('desk-front', [0.28, 0.15, 0.09, 1], [
      { center: [0, 0.4, 1.72], size: [6.6, 0.74, 0.1] },
    ]),
    part('curtain', [0.45, 0.08, 0.16, 1], [
      { center: [0, 2.7, -2.55], size: [12, 5.2, 0.08] },
    ]),
    part('screen', [0.12, 0.38, 0.62, 1], [
      { center: [0, 3.15, -2.48], size: [3.4, 1.7, 0.05] },
    ]),
  ],
  'news.glb': [
    part('desk', [0.14, 0.22, 0.38, 1], [
      { center: [0, 0.76, 1.25], size: [7.2, 0.1, 1.15] },
      { center: [0, 0.38, 1.74], size: [7.2, 0.72, 0.1] },
    ]),
    part('backdrop', [0.05, 0.16, 0.42, 1], [
      { center: [0, 2.8, -2.6], size: [12, 5.4, 0.08] },
    ]),
    part('monitor', [0.04, 0.07, 0.1, 1], [
      { center: [0, 2.85, -1.55], size: [4.4, 2.1, 0.06] },
    ]),
    part('lower-third', [0.75, 0.12, 0.16, 1], [
      { center: [0, 0.84, 1.78], size: [3.2, 0.08, 0.04] },
    ]),
  ],
  'court.glb': [
    part('bench', [0.36, 0.24, 0.14, 1], [
      { center: [0, 0.28, -1.55], size: [6.2, 0.56, 1.7] },
      { center: [0, 0.85, -0.78], size: [6.0, 0.55, 0.16] },
    ]),
    part('table-left', [0.42, 0.28, 0.16, 1], [
      { center: [-2.15, 0.7, 1.05], size: [2.0, 0.08, 0.9] },
      { center: [-2.15, 0.35, 1.05], size: [1.9, 0.6, 0.08] },
    ]),
    part('table-right', [0.42, 0.28, 0.16, 1], [
      { center: [2.15, 0.7, 1.05], size: [2.0, 0.08, 0.9] },
      { center: [2.15, 0.35, 1.05], size: [1.9, 0.6, 0.08] },
    ]),
    part('wall', [0.32, 0.3, 0.28, 1], [
      { center: [0, 2.8, -2.65], size: [12, 5.4, 0.08] },
    ]),
  ],
}

fs.mkdirSync(outDir, { recursive: true })
for (const [name, parts] of Object.entries(kits)) {
  const glb = buildGlb(parts)
  const file = path.join(outDir, name)
  fs.writeFileSync(file, glb)
  console.log(`${name}: ${glb.length} bytes, ${parts.length} meshes`)
}
