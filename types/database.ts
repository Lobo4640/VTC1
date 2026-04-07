// ─────────────────────────────────────────────────────────
// TIPOS DE BASE DE DATOS — TaxMad VTC / Supabase
// ─────────────────────────────────────────────────────────

export type UserRole = "admin" | "conductor" | "cliente";

export type ViajeEstado =
  | "pendiente"    // Reservado, esperando conductor
  | "asignado"     // Conductor asignado
  | "en_camino"    // Conductor en ruta al origen
  | "recogido"     // Pasajero a bordo
  | "completado"   // Viaje finalizado con éxito
  | "cancelado"    // Anulado
  | "archivado";   // Archivado por el Admin al final del día

export type TarifaTipo = "Diurna (L-V)" | "Nocturna (L-V)" | "Fin de Semana";

// ─── Tablas ───────────────────────────────────────────────

export interface Perfil {
  id:           string;         // UUID — auth.users.id
  rol:          UserRole;
  nombre:       string;
  telefono?:    string;
  avatar_url?:  string;
  activo:       boolean;
  created_at:   string;
  updated_at:   string;
}

export interface Viaje {
  id:              string;      // UUID
  cliente_id:      string;      // FK → perfiles.id
  conductor_id?:   string;      // FK → perfiles.id
  origen:          string;
  destino:         string;
  fecha_hora:      string;      // ISO datetime
  km:              number;
  duracion_min:    number;
  precio:          number;
  tarifa:          TarifaTipo;
  estado:          ViajeEstado;
  metodo_pago?:    string;
  nota_conductor?: string;      // Incidencias dictadas por el conductor
  nota_admin?:     string;
  created_at:      string;
  updated_at:      string;
}

// ─── Database type (para createClient<Database>) ──────────

export interface Database {
  public: {
    Tables: {
      perfiles: {
        Row:    Perfil;
        Insert: Omit<Perfil, "created_at" | "updated_at">;
        Update: Partial<Omit<Perfil, "id" | "created_at">>;
      };
      viajes: {
        Row:    Viaje;
        Insert: Omit<Viaje, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Viaje, "id" | "created_at">>;
      };
    };
    Views:     Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role:    UserRole;
      viaje_estado: ViajeEstado;
      tarifa_tipo:  TarifaTipo;
    };
  };
}
