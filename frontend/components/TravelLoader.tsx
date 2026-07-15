import React from "react";
import { Plane, Loader2 } from "lucide-react";

interface TravelLoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
}

export default function TravelLoader({
  text = "Loading journey details...",
  size = "md",
}: TravelLoaderProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      {/* Animated plane with flight path */}
      <style>{`
        @keyframes planeMove {
          0% {
            transform: translateX(-100px) translateY(0px) rotate(-30deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translateX(0px) translateY(-30px);
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateX(100px) translateY(0px) rotate(30deg);
            opacity: 0;
          }
        }

        @keyframes dashMove {
          0% {
            stroke-dashoffset: 200;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }

        @keyframes globeRotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes pulseGlow {
          0%, 100% {
            opacity: 1;
            filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.3));
          }
          50% {
            opacity: 0.7;
            filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.5));
          }
        }

        .travel-plane-container {
          position: relative;
          width: 200px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .travel-plane {
          position: absolute;
          animation: planeMove 2.5s ease-in-out infinite;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
        }

        .travel-path {
          position: absolute;
          width: 100%;
          height: 2px;
          top: 50%;
          left: 0;
        }

        .travel-path svg {
          width: 100%;
          height: 100%;
          stroke-dasharray: 200;
          animation: dashMove 2.5s ease-in-out infinite;
        }

        .travel-loader-text {
          font-size: 13px;
          color: hsl(var(--muted-foreground));
          font-weight: 500;
          text-align: center;
          animation: pulseGlow 2s ease-in-out infinite;
        }

        .travel-dots {
          display: inline-block;
        }

        .travel-dots::after {
          content: '';
          animation: dotAnimation 1s infinite;
        }

        @keyframes dotAnimation {
          0%, 20% { content: ''; }
          40% { content: '.'; }
          60% { content: '..'; }
          80%, 100% { content: '...'; }
        }
      `}</style>

      <div className="travel-plane-container">
        <div className="travel-path">
          <svg viewBox="0 0 200 20" preserveAspectRatio="none">
            <path
              d="M 10 10 Q 50 -10 100 10 T 200 10"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              className="opacity-30"
            />
          </svg>
        </div>
        <div className="travel-plane">
          <Plane className={`${sizeClasses[size]} text-blue-500 stroke-[1.5]`} />
        </div>
      </div>

      <div className="text-center">
        <p className="travel-loader-text">
          {text}
          <span className="travel-dots" />
        </p>
        <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
          <div className="flex gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse"></span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "0.2s" }}></span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "0.4s" }}></span>
          </div>
        </div>
      </div>
    </div>
  );
}
