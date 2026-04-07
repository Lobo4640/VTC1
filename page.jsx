"use client";
/**
 * app/inicio/page.jsx — Pantalla de selección de rol
 * Tres accesos: Cliente → /reservar | Conductor → /conductor | Admin → /admin/login
 */

import Link from "next/link";
import { useState } from "react";

const ROLES = [
  {
    href:    "/reservar",
    ico:     "📱",
    titulo:  "Soy Cliente",
    desc:    "Calcula tu precio y reserva un VTC ahora mismo.",
    badge:   "Precio cerrado",
    color:   "#00B5FF",
    gradient:"linear-gradient(135deg,rgba(0,181,255,.15),rgba(0,181,255,.05))",
    border:  "rgba(0,181,255,.25)",
    hover:   "rgba(0,181,255,.3)",
  },
  {
    href:    "/conductor",
    ico:     "🚗",
    titulo:  "Soy Conductor",
    desc:    "Accede con tu PIN para gestionar tus servicios.",
    badge:   "PIN seguro",
    color:   "#7A5FFF",
    gradient:"linear-gradient(135deg,rgba(122,95,255,.15),rgba(122,95,255,.05))",
    border:  "rgba(122,95,255,.25)",
    hover:   "rgba(122,95,255,.3)",
  },
  {
    href:    "/admin/login",
    ico:     "🛡️",
    titulo:  "Soy Administrador",
    desc:    "Panel de control, estadísticas y liquidación mensual.",
    badge:   "Email + contraseña",
    color:   "#22c78b",
    gradient:"linear-gradient(135deg,rgba(34,199,139,.15),rgba(34,199,139,.05))",
    border:  "rgba(34,199,139,.25)",
    hover:   "rgba(34,199,139,.3)",
  },
];

export default function InicioPage() {
  const [hovered, setHovered] = useState(null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Glow de fondo */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] opacity-15 pointer-events-none"
        style={{ background: "radial-gradient(ellipse, #00B5FF 0%, transparent 70%)" }}
      />

      {/* Logo */}
      <div className="mb-10 text-center slide-up">
        <div className="text-[36px] font-black text-white tracking-tight mb-1">
          <span style={{ color: "#00B5FF" }}>VTC</span> Madrid
        </div>
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold"
          style={{
            background: "rgba(0,181,255,.1)",
            border:     "1px solid rgba(0,181,255,.25)",
            color:      "#00B5FF",
          }}
        >
          ⚡ Viajes inmediatos disponibles
        </div>
        <p className="text-brand-muted text-[13px] mt-3 max-w-xs mx-auto leading-relaxed">
          Plataforma de gestión VTC Madrid 2026.<br />Selecciona tu perfil para continuar.
        </p>
      </div>

      {/* Cards de rol */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        {ROLES.map((r, i) => (
          <Link key={r.href} href={r.href} className="no-underline">
            <div
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className="relative rounded-2xl p-5 cursor-pointer transition-all duration-300 slide-up"
              style={{
                animationDelay:  `${i * 0.07}s`,
                background:      r.gradient,
                border:          `1.5px solid ${hovered === i ? r.hover : r.border}`,
                transform:       hovered === i ? "translateY(-3px)" : "none",
                boxShadow:       hovered === i
                  ? `0 12px 40px ${r.color}22`
                  : "0 2px 12px rgba(0,0,0,.2)",
              }}
            >
              <div className="flex items-center gap-4">
                {/* Icono */}
                <div
                  className="text-[32px] w-14 h-14 rounded-xl flex items-center justify-center shrink-0 float"
                  style={{
                    background: `${r.color}18`,
                    border:     `1px solid ${r.color}30`,
                  }}
                >
                  {r.ico}
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[15px] font-black text-white">{r.titulo}</span>
                    <span
                      className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: `${r.color}20`,
                        color:       r.color,
                        border:     `1px solid ${r.color}30`,
                      }}
                    >
                      {r.badge}
                    </span>
                  </div>
                  <p className="text-[12px] text-brand-muted leading-snug">{r.desc}</p>
                </div>

                {/* Flecha */}
                <div
                  className="text-[18px] shrink-0 transition-transform duration-300"
                  style={{
                    color:     r.color,
                    transform: hovered === i ? "translateX(4px)" : "none",
                  }}
                >
                  →
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer mínimo */}
      <p className="mt-12 text-[10px] text-brand-muted text-center leading-6">
        RD 1076/2017 · Ord. FOM/36/2008 · Precio cerrado Art. 7 RD 1057/2015<br />
        <span style={{ color: "#00B5FF" }}>⚡</span> Precontratación inmediata — 0 min de espera
      </p>
    </div>
  );
}
