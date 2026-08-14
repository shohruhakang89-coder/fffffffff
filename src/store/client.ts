import { isDemo } from "../config/demo"
import { DemoRpcClient } from "../lib/net/demoRpcClient"
import { RpcClient } from "../lib/net/rpcClient"
import { SessionStorage } from "../lib/storage/sessionStorage"

// Demo mode never constructs a real socket client. Its calls stay in memory.
export const sessions = new SessionStorage()
export const rpc = (
  isDemo() ? new DemoRpcClient() : new RpcClient(sessions)
) as unknown as RpcClient
