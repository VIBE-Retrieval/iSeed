"use client"

import React from "react"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Pencil,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
} from "lucide-react"

interface DrawingCanvasProps {
  onSave: (imageData: string) => void
  onCancel?: () => void
  width?: number
  height?: number
  title?: string
}

export function DrawingCanvas({ onSave, onCancel, width = 500, height = 400, title }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<"pencil" | "eraser">("pencil")
  const [brushSize, setBrushSize] = useState(2)
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const lastPosRef = useRef({ x: 0, y: 0 })

  // Initialize canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Save initial state
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    setHistory([imageData])
    setHistoryIndex(0)
  }, [])

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(imageData)

    // Limit history to 50 items
    if (newHistory.length > 50) {
      newHistory.shift()
    }

    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const getPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const pos = getPosition(e)
    lastPosRef.current = pos
    setIsDrawing(true)

    // Draw a dot for single click
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2)
    ctx.fillStyle = tool === "eraser" ? "#FFFFFF" : "#000000"
    ctx.fill()
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    e.preventDefault()

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const pos = getPosition(e)

    ctx.beginPath()
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : "#000000"
    ctx.lineWidth = brushSize
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()

    lastPosRef.current = pos
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveToHistory()
    }
  }

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.putImageData(history[newIndex], 0, 0)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)

      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      ctx.putImageData(history[newIndex], 0, 0)
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#FFFFFF"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    saveToHistory()
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL("image/png")
    onSave(imageData)
  }

  const downloadImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = "drawing.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  return (
    <div className="flex gap-6">
      {/* Left Panel - Controls */}
      <div className="flex flex-col gap-2 w-40">
        {title && (
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
        )}

        <Button
          variant={tool === "pencil" ? "default" : "outline"}
          onClick={() => setTool("pencil")}
          className="w-full justify-start"
        >
          <Pencil className="h-4 w-4 mr-2" />
          연필
        </Button>

        <Button
          variant={tool === "eraser" ? "default" : "outline"}
          onClick={() => setTool("eraser")}
          className="w-full justify-start"
        >
          <Eraser className="h-4 w-4 mr-2" />
          지우개
        </Button>

        <Button
          variant="outline"
          onClick={undo}
          disabled={historyIndex <= 0}
          className="w-full justify-start"
        >
          <Undo2 className="h-4 w-4 mr-2" />
          되돌리기
        </Button>

        <Button
          variant="outline"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          className="w-full justify-start"
        >
          <Redo2 className="h-4 w-4 mr-2" />
          다시실행
        </Button>

        <Button
          variant="outline"
          onClick={clearCanvas}
          className="w-full justify-start mb-auto"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          전체지우기
        </Button>

        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full"
          >
            취소
          </Button>
        )}

        <Button onClick={handleSave} className="w-full">
          저장하기
        </Button>
      </div>

      {/* Right Panel - Canvas */}
      <div className="border rounded-xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="touch-none"
          style={{ cursor: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'28\' height=\'28\' viewBox=\'0 0 28 28\'><path d=\'M0 28 L6 22 L9 25 L3 28 Z\' fill=\'%23000\'/><path d=\'M6 22 L22 6 L25 9 L9 25 Z\' fill=\'%23333\'/><path d=\'M22 6 L24 4 L26 6 L25 9 Z\' fill=\'%23666\'/></svg>") 0 28, auto' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  )
}
