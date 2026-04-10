"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
// IMPORTANTE: Asegúrate de que useRouter y useSearchParams estén aquí:
import { useRouter, useSearchParams } from "next/navigation"; 
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Car,
  Shield,
  ChevronRight,
  Clock,
  ClipboardList,
  User,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import type { UserRole } from "../../types/database";

// ... (Resto de funciones: ROLE_COOKIE, setCookieRol, etc.) ...

function LoginContent() {
  const router = useRouter(); // Ahora sí lo encontrará
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? null;

  // ... (Aquí sigue todo el código de tu formulario que ya tenías)
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-[#00B5FF]" size={32} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
