"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
// ... (todos tus otros imports de lucide-react y supabase) ...

// 1. Cambia el nombre de tu función principal de LoginPage a LoginContent
function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams(); // <--- Esto es lo que causaba el error
  const redirectTo = searchParams.get("redirect") ?? null;
  
  // ... (Pega AQUÍ todo el resto de tu lógica actual: useState, useEffect, handleLogin, el return del HTML, etc.) ...
}

// 2. Crea el nuevo export principal que envuelve todo en Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
