import { BrainCircuit,Code2,FlaskConical,Gamepad2,Grid3X3,Keyboard,Sigma,Sparkles } from "lucide-react"
const icons={sigma:Sigma,keyboard:Keyboard,sparkles:Sparkles,code:Code2,flask:FlaskConical,brain:BrainCircuit,grid:Grid3X3,gamepad:Gamepad2}
export function marketplaceIcon(name:string,className="h-5 w-5"){const Icon=icons[name as keyof typeof icons]??Gamepad2;return <Icon className={className}/>}
