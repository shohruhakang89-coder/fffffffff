import { create } from "zustand"
import type { LinkState } from "../lib/net/linkState"
import { rpc } from "./client"

interface LinkStore {
  state: LinkState
  pinMismatch: boolean
}

// Mirrors the encrypted link lifecycle into React, driving the badge.
export const useLinkStore = create<LinkStore>(() => ({
  state: rpc.state,
  pinMismatch: rpc.pinMismatch,
}))

rpc.onState((state) => {
  useLinkStore.setState({ state, pinMismatch: rpc.pinMismatch })
})
