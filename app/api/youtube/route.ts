import { NextRequest, NextResponse } from "next/server"
import { maybeProxyGestao } from "@/lib/gestao-bff"


const CHANNEL_ID = "UCIbxja1EbdUKBsB9xizP4GA"
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`

export const revalidate = 3600 // cache 1h

export async function GET(request: NextRequest) {
  const __gestaoBff = await maybeProxyGestao(request)
  if (__gestaoBff) return __gestaoBff
  try {
    const res = await fetch(RSS_URL, { next: { revalidate: 3600 } })
    const xml = await res.text()

    const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => {
      const entry = m[1]
      const id = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] ?? ""
      const title = entry.match(/<title>(.*?)<\/title>/)?.[1] ?? ""
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] ?? ""
      return {
        id,
        title,
        published,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        url: `https://www.youtube.com/watch?v=${id}`,
      }
    })

    return NextResponse.json(videos.slice(0, 6))
  } catch {
    return NextResponse.json([], { status: 500 })
  }
}
