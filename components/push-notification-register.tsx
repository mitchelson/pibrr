"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell, Check } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

function applicationServerKeyMatches(
  subscription: PushSubscription,
  publicKey: string
): boolean {
  try {
    const current = subscription.options?.applicationServerKey
    if (!current) return false
    const expected = urlBase64ToUint8Array(publicKey)
    const actual =
      current instanceof ArrayBuffer
        ? new Uint8Array(current)
        : new Uint8Array(current as ArrayBufferLike)
    if (expected.length !== actual.length) return false
    return expected.every((b, i) => b === actual[i])
  } catch {
    return false
  }
}

export function PushNotificationRegister() {
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      return
    }
    setSupported(true)
    if (!publicKey) return

    let cancelled = false

    ;(async () => {
      try {
        const reg = await navigator.serviceWorker.ready
        const existing = await reg.pushManager.getSubscription()

        if (existing && applicationServerKeyMatches(existing, publicKey)) {
          if (!cancelled) setSubscribed(true)
          return
        }

        if (existing) {
          await existing.unsubscribe().catch(() => {})
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: existing.endpoint }),
          }).catch(() => {})
        }

        // Já tinha permissão: re-inscreve com a chave VAPID atual
        if (Notification.permission === "granted") {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          })
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sub.toJSON()),
          })
          if (!cancelled) setSubscribed(true)
        }
      } catch (e) {
        console.error("Push auto-resubscribe error:", e)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [publicKey])

  if (!supported || subscribed || !publicKey) return null

  const swReady = (): Promise<ServiceWorkerRegistration> =>
    Promise.race([
      navigator.serviceWorker.ready,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("sw-timeout")), 8000)
      ),
    ])

  const subscribe = async () => {
    setLoading(true)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        toast({
          title: "Permissão negada",
          description: "Ative as notificações nas configurações do dispositivo.",
          variant: "destructive",
        })
        return
      }

      const reg = await swReady()
      const previous = await reg.pushManager.getSubscription()
      if (previous) {
        await previous.unsubscribe().catch(() => {})
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      })
      setSubscribed(true)
      toast({ title: "Notificações ativadas" })
    } catch (e: any) {
      console.error("Push subscribe error:", e)
      const description =
        e?.message === "sw-timeout"
          ? "Recarregue a página e tente novamente."
          : "Tente novamente ou verifique as permissões."
      toast({
        title: "Erro ao ativar notificações",
        description,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button size="sm" onClick={subscribe} disabled={loading}>
      {subscribed ? <Check className="mr-2 h-4 w-4" /> : <Bell className="mr-2 h-4 w-4" />}
      {loading ? "Ativando..." : "Ativar notificações"}
    </Button>
  )
}
