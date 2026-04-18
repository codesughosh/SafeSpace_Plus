"use client"
import { useEffect, useRef, useState } from "react"

interface Props {
  onEmotionDetected: (emotion: string) => void
}

export default function EmotionCamera({ onEmotionDetected }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [emotion, setEmotion] = useState("neutral")

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      })
      .catch(() => {
        console.error("Camera access denied")
      })

    // TEMP FAKE EMOTION (replace later with AI)
    const interval = setInterval(() => {
      const emotions = ["happy", "sad", "neutral", "angry", "stressed"]
      const random = emotions[Math.floor(Math.random() * emotions.length)]

      setEmotion(random)
      onEmotionDetected(random)
    }, 5000)

    return () => clearInterval(interval)
  }, [onEmotionDetected])

  return (
    <div className="bg-card border border-white/10 rounded-xl p-3">
      <video
        ref={videoRef}
        autoPlay
        muted
        className="rounded-lg w-full h-40 object-cover"
      />
      <p className="text-xs mt-2 text-center text-muted">
        Detected: <span className="text-primary font-medium">{emotion}</span>
      </p>
    </div>
  )
}