import { create } from "zustand"
import { rpc } from "../../store/client"

type Json = Record<string, unknown>
export type CallPhase = "idle" | "outgoing" | "incoming" | "connecting" | "active"

interface CallStore {
  phase: CallPhase
  peerId: number
  peerName: string
  muted: boolean
  startedAt: number | null
  remoteStream: MediaStream | null
  start: (peerId: number, peerName: string) => Promise<void>
  accept: () => Promise<void>
  reject: () => Promise<void>
  end: () => Promise<void>
  toggleMute: () => void
}

const ICE: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
}

let pc: RTCPeerConnection | null = null
let local: MediaStream | null = null
let pendingOffer: RTCSessionDescriptionInit | null = null

function teardown(): void {
  local?.getTracks().forEach((t) => t.stop())
  pc?.close()
  pc = null
  local = null
  pendingOffer = null
  useCallStore.setState({
    phase: "idle",
    peerId: 0,
    peerName: "",
    muted: false,
    startedAt: null,
    remoteStream: null,
  })
}

async function build(): Promise<RTCPeerConnection> {
  local = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
  const conn = new RTCPeerConnection(ICE)
  local.getTracks().forEach((t) => conn.addTrack(t, local as MediaStream))
  conn.onicecandidate = (e) => {
    const peerId = useCallStore.getState().peerId
    if (e.candidate && peerId > 0)
      void rpc.call("call.signal", {
        target_user_id: peerId,
        signal: { candidate: e.candidate.toJSON() },
      })
  }
  conn.ontrack = (e) => useCallStore.setState({ remoteStream: e.streams[0] ?? null })
  conn.onconnectionstatechange = () => {
    if (conn.connectionState === "failed" || conn.connectionState === "closed") teardown()
  }
  pc = conn
  return conn
}

export const useCallStore = create<CallStore>((set, get) => ({
  phase: "idle",
  peerId: 0,
  peerName: "",
  muted: false,
  startedAt: null,
  remoteStream: null,

  start: async (peerId, peerName) => {
    if (get().phase !== "idle" || peerId <= 0) return
    set({ phase: "outgoing", peerId, peerName })
    const conn = await build()
    const offer = await conn.createOffer()
    await conn.setLocalDescription(offer)
    await rpc.call("call.start", { target_user_id: peerId, offer })
  },

  accept: async () => {
    if (get().phase !== "incoming" || !pendingOffer) return
    set({ phase: "connecting" })
    const conn = await build()
    await conn.setRemoteDescription(new RTCSessionDescription(pendingOffer))
    const answer = await conn.createAnswer()
    await conn.setLocalDescription(answer)
    await rpc.call("call.accept", { target_user_id: get().peerId, answer })
    pendingOffer = null
    set({ phase: "active", startedAt: Date.now() })
  },

  reject: async () => {
    const peerId = get().peerId
    if (peerId > 0) await rpc.call("call.reject", { target_user_id: peerId })
    teardown()
  },

  end: async () => {
    const peerId = get().peerId
    if (peerId > 0) await rpc.call("call.end", { target_user_id: peerId })
    teardown()
  },

  toggleMute: () => {
    const next = !get().muted
    local?.getAudioTracks().forEach((t) => (t.enabled = !next))
    set({ muted: next })
  },
}))

// Global signaling: wire incoming-call events once at module load.
rpc.onEvent((payload: Json) => {
  if (payload["t"] !== "event") return
  const event = payload["event"] as string
  const data = (payload["payload"] as Json) ?? {}
  if (event === "call.incoming") {
    if (useCallStore.getState().phase !== "idle") return
    pendingOffer = (data["offer"] as RTCSessionDescriptionInit) ?? null
    const caller = Number(data["caller_id"] ?? 0)
    useCallStore.setState({ phase: "incoming", peerId: caller, peerName: `User ${caller}` })
  } else if (event === "call.accepted") {
    const answer = data["answer"] as RTCSessionDescriptionInit | undefined
    if (answer && pc)
      void pc
        .setRemoteDescription(new RTCSessionDescription(answer))
        .then(() => useCallStore.setState({ phase: "active", startedAt: Date.now() }))
  } else if (event === "call.signal") {
    const signal = (data["signal"] as Json) ?? {}
    const candidate = signal["candidate"] as RTCIceCandidateInit | undefined
    if (candidate && pc) void pc.addIceCandidate(new RTCIceCandidate(candidate))
  } else if (event === "call.rejected" || event === "call.ended") {
    if (useCallStore.getState().phase !== "idle") teardown()
  }
})
