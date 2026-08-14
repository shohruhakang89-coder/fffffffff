import { Loader2 } from "lucide-react"
import React, { useState, useEffect, type ReactNode } from "react"
import { LiquidMetalButton } from "./LiquidMetalButton"

export type KeyraButtonKind = "primary" | "ghost" | "danger" | "liquid" | "metal" | "shader"
export type MetalColorVariant = "default" | "primary" | "success" | "error" | "gold" | "bronze"

interface KeyraButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  onClick?: () => void
  kind?: KeyraButtonKind
  metalColor?: MetalColorVariant
  loading?: boolean
  icon?: ReactNode
  expand?: boolean
}

export function KeyraButton({ 
  label, 
  onClick, 
  kind = "primary", 
  metalColor = "primary",
  loading = false, 
  icon, 
  expand = true, 
  type = "button",
  className = "",
  disabled: propDisabled,
  ...props 
}: KeyraButtonProps) {
  const disabled = loading || propDisabled || (!onClick && type !== "submit")
  
  if (kind === "metal") {
    return <MetalButton 
      label={label} 
      icon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      onClick={onClick}
      disabled={disabled}
      type={type}
      expand={expand}
      variant={metalColor}
      className={className}
      {...props}
    />
  }

  if (kind === "shader") {
    return <LiquidMetalButton
      label={label}
      onClick={onClick}
    />
  }

  if (kind === "liquid" || kind === "primary") {
    return (
      <button
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={[
          "liquid-glass-btn group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-[14px]",
          "text-[13px] font-bold outline-none transition-all duration-300",
          "focus-visible:ring-[3px] focus-visible:ring-accent/50 focus-visible:border-accent",
          expand ? "w-full" : "px-6",
          disabled ? "pointer-events-none opacity-50" : "",
          "text-accent",
          className
        ].join(" ")}
        {...props}
      >
        {/* Base glass layer with iOS specular rim */}
        <div className="absolute inset-0 rounded-[14px] bg-gradient-to-b from-white/60 via-white/20 to-white/10 dark:from-white/10 dark:via-white/5 dark:to-white/[0.02]" />
        
        {/* Frosted glass backdrop */}
        <div className="absolute inset-0 rounded-[14px] backdrop-blur-xl saturate-[1.8] dark:saturate-[1.4]" />
        
        {/* Specular highlight - top edge reflection */}
        <div className="absolute inset-x-0 top-0 h-[1px] rounded-full bg-gradient-to-r from-transparent via-white/80 to-transparent dark:via-white/30" />
        <div className="absolute inset-x-2 top-[1px] h-[0.5px] rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/15" />
        
        {/* Inner shadow for depth */}
        <div className="absolute inset-0 rounded-[14px] shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.9),inset_0_-1px_1px_0_rgba(0,0,0,0.05),inset_1px_0_1px_0_rgba(255,255,255,0.4),inset_-1px_0_1px_0_rgba(255,255,255,0.4)] dark:shadow-[inset_0_1px_1px_0_rgba(255,255,255,0.12),inset_0_-1px_1px_0_rgba(0,0,0,0.3),inset_1px_0_1px_0_rgba(255,255,255,0.06),inset_-1px_0_1px_0_rgba(255,255,255,0.06)]" />
        
        {/* Outer glow shadow */}
        <div className="absolute inset-0 rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2),0_4px_16px_rgba(0,0,0,0.15)]" />
        
        {/* Subtle border */}
        <div className="absolute inset-0 rounded-[14px] border border-white/40 dark:border-white/[0.08]" />
        
        {/* Hover effect - brightening */}
        <div className="absolute inset-0 rounded-[14px] bg-white/0 transition-all duration-300 group-hover:bg-white/10 dark:group-hover:bg-white/[0.03]" />
        
        {/* Press effect - slight depression */}
        <div className="absolute inset-0 rounded-[14px] bg-black/0 transition-all duration-150 group-active:bg-black/[0.03] dark:group-active:bg-black/20" />
        
        {/* Refraction lens overlay */}
        <div className="absolute inset-0 rounded-[14px] opacity-30 dark:opacity-20" style={{ backdropFilter: 'url("#lensFilter")' }} />
        
        {/* Content */}
        <div className="pointer-events-none z-10 flex items-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{icon}<span>{label}</span></>}
        </div>
      </button>
    )
  }

  // Fallback for ghost / danger
  const classes = kind === "danger"
      ? "border border-danger/10 bg-danger/10 text-danger hover:bg-danger/20"
      : "border border-white/90 dark:border-white/10 bg-surface/70 text-ink shadow-sm hover:bg-surface/90"
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={[
        "pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] px-4 py-2.5",
        "text-[13px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        expand ? "w-full" : "",
        classes,
        disabled ? "cursor-not-allowed opacity-50" : "",
        className
      ].join(" ")}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{icon}<span>{label}</span></>}
    </button>
  )
}

function GlassFilter() {
  return (
    <svg className="hidden">
      <defs>
        <filter id="container-glass" x="0%" y="0%" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.05" numOctaves="1" seed="1" result="turbulence" />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap in="SourceGraphic" in2="blurredNoise" scale="70" xChannelSelector="R" yChannelSelector="B" result="displaced" />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  )
}

// --- Metal Button Implementation ---

const colorVariants: Record<MetalColorVariant, { outer: string; inner: string; button: string; textColor: string; textShadow: string }> = {
  default: {
    outer: "bg-gradient-to-b from-[#000] to-[#A0A0A0]",
    inner: "bg-gradient-to-b from-[#FAFAFA] via-[#3E3E3E] to-[#E5E5E5]",
    button: "bg-gradient-to-b from-[#B9B9B9] to-[#969696]",
    textColor: "text-white",
    textShadow: "[text-shadow:_0_-1px_0_rgb(80_80_80_/_100%)]",
  },
  primary: {
    outer: "bg-gradient-to-b from-[#000] to-[#A0A0A0]",
    inner: "bg-gradient-to-b from-blue-600 via-blue-800 to-blue-400",
    button: "bg-gradient-to-b from-blue-500 to-blue-500/40",
    textColor: "text-white",
    textShadow: "[text-shadow:_0_-1px_0_rgb(30_58_138_/_100%)]",
  },
  success: {
    outer: "bg-gradient-to-b from-[#005A43] to-[#7CCB9B]",
    inner: "bg-gradient-to-b from-[#E5F8F0] via-[#00352F] to-[#D1F0E6]",
    button: "bg-gradient-to-b from-[#9ADBC8] to-[#3E8F7C]",
    textColor: "text-[#FFF7F0]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(6_78_59_/_100%)]",
  },
  error: {
    outer: "bg-gradient-to-b from-[#5A0000] to-[#FFAEB0]",
    inner: "bg-gradient-to-b from-[#FFDEDE] via-[#680002] to-[#FFE9E9]",
    button: "bg-gradient-to-b from-[#F08D8F] to-[#A45253]",
    textColor: "text-[#FFF7F0]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(146_64_14_/_100%)]",
  },
  gold: {
    outer: "bg-gradient-to-b from-[#917100] to-[#EAD98F]",
    inner: "bg-gradient-to-b from-[#FFFDDD] via-[#856807] to-[#FFF1B3]",
    button: "bg-gradient-to-b from-[#FFEBA1] to-[#9B873F]",
    textColor: "text-[#FFFDE5]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(178_140_2_/_100%)]",
  },
  bronze: {
    outer: "bg-gradient-to-b from-[#864813] to-[#E9B486]",
    inner: "bg-gradient-to-b from-[#EDC5A1] via-[#5F2D01] to-[#FFDEC1]",
    button: "bg-gradient-to-b from-[#FFE3C9] to-[#A36F3D]",
    textColor: "text-[#FFF7F0]",
    textShadow: "[text-shadow:_0_-1px_0_rgb(124_45_18_/_100%)]",
  },
}

function metalButtonVariants(variant: MetalColorVariant = "default", isPressed: boolean, isHovered: boolean, isTouchDevice: boolean) {
  const colors = colorVariants[variant]
  const transitionStyle = "all 250ms cubic-bezier(0.1, 0.4, 0.2, 1)"
  return {
    wrapper: `relative inline-flex transform-gpu rounded-[14px] p-[1.25px] will-change-transform ${colors.outer}`,
    wrapperStyle: {
      transform: isPressed ? "translateY(2.5px) scale(0.99)" : "translateY(0) scale(1)",
      boxShadow: isPressed ? "0 1px 2px rgba(0, 0, 0, 0.15)" : isHovered && !isTouchDevice ? "0 4px 12px rgba(0, 0, 0, 0.12)" : "0 3px 8px rgba(0, 0, 0, 0.08)",
      transition: transitionStyle,
      transformOrigin: "center center",
    },
    inner: `absolute inset-[1px] transform-gpu rounded-[13px] will-change-transform ${colors.inner}`,
    innerStyle: {
      transition: transitionStyle,
      transformOrigin: "center center",
      filter: isHovered && !isPressed && !isTouchDevice ? "brightness(1.05)" : "none",
    },
    button: `relative z-10 m-[1px] inline-flex min-h-11 transform-gpu cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-[12px] px-6 py-2 text-[13px] font-bold will-change-transform outline-none ${colors.button} ${colors.textColor} ${colors.textShadow}`,
    buttonStyle: {
      transform: isPressed ? "scale(0.97)" : "scale(1)",
      transition: transitionStyle,
      transformOrigin: "center center",
      filter: isHovered && !isPressed && !isTouchDevice ? "brightness(1.02)" : "none",
    },
  }
}

function ShineEffect({ isPressed }: { isPressed: boolean }) {
  return (
    <div className={`pointer-events-none absolute inset-0 z-20 overflow-hidden transition-opacity duration-300 ${isPressed ? "opacity-20" : "opacity-0"}`}>
      <div className="absolute inset-0 rounded-[12px] bg-gradient-to-r from-transparent via-neutral-100 to-transparent" />
    </div>
  )
}

function MetalButton({ 
  label, 
  icon, 
  disabled, 
  onClick, 
  variant = "default", 
  expand = true,
  className = "",
  ...props 
}: any) {
  const [isPressed, setIsPressed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)

  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0)
  }, [])

  const variants = metalButtonVariants(variant, isPressed, isHovered, isTouchDevice)

  return (
    <div className={`${variants.wrapper} ${expand ? "w-full" : ""} ${className}`} style={variants.wrapperStyle}>
      <div className={variants.inner} style={variants.innerStyle}></div>
      <button
        className={`${variants.button} ${expand ? "w-full" : ""}`}
        style={variants.buttonStyle}
        disabled={disabled}
        onClick={onClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => { setIsPressed(false); setIsHovered(false) }}
        onMouseEnter={() => { if (!isTouchDevice) setIsHovered(true) }}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onTouchCancel={() => setIsPressed(false)}
        {...props}
      >
        <ShineEffect isPressed={isPressed} />
        {icon}
        <span>{label}</span>
        {isHovered && !isPressed && !isTouchDevice && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t rounded-[12px] from-transparent to-white/5" />
        )}
      </button>
    </div>
  )
}
