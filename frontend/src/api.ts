// Configuración de la API
const API_BASE_URL = 'https://j6du3eoo60.execute-api.us-east-1.amazonaws.com/dev';
const WS_URL = 'wss://f5nub27py5.execute-api.us-east-1.amazonaws.com/dev';

// ==================== CONSTANTES ====================

// Tipos de incidentes
export const INCIDENT_TYPES = {
  INFRASTRUCTURE: 'infrastructure',
  ELECTRIC_FAILURE: 'electric_failure',
  WATER_FAILURE: 'water_failure',
  SECURITY: 'security',
  CLEANING: 'cleaning',
  TECHNOLOGY: 'technology',
  OTHER: 'other'
} as const;

export const INCIDENT_TYPE_LABELS: Record<string, string> = {
  [INCIDENT_TYPES.INFRASTRUCTURE]: 'Infraestructura',
  [INCIDENT_TYPES.ELECTRIC_FAILURE]: 'Falla Eléctrica',
  [INCIDENT_TYPES.WATER_FAILURE]: 'Falla de Agua',
  [INCIDENT_TYPES.SECURITY]: 'Seguridad',
  [INCIDENT_TYPES.CLEANING]: 'Limpieza',
  [INCIDENT_TYPES.TECHNOLOGY]: 'Tecnología',
  [INCIDENT_TYPES.OTHER]: 'Otro'
};

// Niveles de urgencia
export const URGENCY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
} as const;

export const URGENCY_LABELS: Record<string, string> = {
  [URGENCY_LEVELS.LOW]: 'Baja',
  [URGENCY_LEVELS.MEDIUM]: 'Media',
  [URGENCY_LEVELS.HIGH]: 'Alta',
  [URGENCY_LEVELS.CRITICAL]: 'Crítica'
};

// Estados de incidentes
export const INCIDENT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  REJECTED: 'rejected'
} as const;

export const STATUS_LABELS: Record<string, string> = {
  [INCIDENT_STATUS.PENDING]: 'Pendiente',
  [INCIDENT_STATUS.IN_PROGRESS]: 'En Atención',
  [INCIDENT_STATUS.COMPLETED]: 'Resuelto',
  [INCIDENT_STATUS.REJECTED]: 'Rechazado'
};

// Roles de usuario
export const USER_ROLES = {
  STUDENT: 'Estudiante',
  ADMINISTRATIVE: 'Personal administrativo',
  AUTHORITY: 'Autoridad'
} as const;

// Tipos para las respuestas
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: number;
  user?: {
    user_id: string;
    email?: string;
    correo?: string;
    nombre?: string;
    nombres?: string;
    apellidos?: string;
    rol: string;
  };
  user_id?: string;
  correo?: string;
  nombre?: string;
  rol?: string;
}

export interface RegisterRequest {
  nombres: string;        // Nombres del usuario
  apellidos: string;      // Apellidos del usuario
  dni: string;            // DNI/documento de identidad (8 dígitos en Perú)
  correo: string;         // Email institucional
  password: string;       // Contraseña (mínimo 8 caracteres recomendado)
  rol: string;            // "Estudiante" | "Personal administrativo" | "Autoridad"
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface IncidentResponse {
  incident_id: string;
  type: string;           // Tipo de incidente
  floor: number;          // Piso
  ambient: string;        // Ambiente/aula
  description: string;    // Descripción
  urgency: string;        // "low", "medium", "high", "critical"
  status: string;         // "pending", "in_progress", "completed", "rejected"
  created_by: string;     // user_id del creador
  created_at: string;     // ISO timestamp
  updated_at: string;     // ISO timestamp
  history?: Array<{
    action: string;
    by: string;
    at: string;
  }>;
}

export interface CreateIncidentRequest {
  type: string;           // ej: "electric_failure", "infrastructure", "security", etc.
  description: string;    // Descripción del incidente
  floor: number;          // Número de piso (ej: 11)
  ambient: string;        // Ambiente/aula (ej: "S1101")
  urgency: string;        // "low", "medium", "high", "critical"
  created_by: string;     // user_id del estudiante que reporta
}

export interface EditIncidentRequest {
  incident_id: string;
  type?: string;
  description?: string;
  floor?: number;
  ambient?: string;
  urgency?: string;
  admin_user_id?: string;
}

export interface UpdateIncidentStatusRequest {
  incident_id: string;
  new_status: string;
  user_id: string;
}

// Helper para manejar errores
const handleResponse = async <T,>(response: Response): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let errorMessage = 'Error en la solicitud';
    
    try {
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorData.body || errorMessage;
      } else {
        errorMessage = await response.text();
      }
    } catch (e) {
      // Si no se puede parsear, usar mensaje por defecto
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }

  try {
    if (contentType?.includes('application/json')) {
      const data = await response.json();
      return {
        success: true,
        data: data as T
      };
    } else {
      const text = await response.text();
      try {
        const data = JSON.parse(text);
        return {
          success: true,
          data: data as T
        };
      } catch {
        return {
          success: true,
          data: text as T
        };
      }
    }
  } catch (e) {
    return {
      success: false,
      error: 'Error al procesar la respuesta'
    };
  }
};

// Helper para obtener headers con autenticación
const getAuthHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// ==================== AUTH ENDPOINTS ====================

export const authApi = {
  // Registro de usuario
  register: async (data: RegisterRequest): Promise<ApiResponse<any>> => {
    try {
      console.log('Registrando usuario:', data); // Debug
      
      const response = await fetch(`${API_BASE_URL}/users/register`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      return await handleResponse(response);
    } catch (error) {
      console.error('Error en register:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  },

  // Login de usuario
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    try {
      console.log('Intentando login con:', data.email); // Debug
      
      // Transformar "email" a "correo" para que coincida con el backend
      const requestBody = {
        correo: data.email,
        password: data.password
      };
      
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestBody)
      });
      
      return await handleResponse<LoginResponse>(response);
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
};

// ==================== INCIDENTS ENDPOINTS ====================

export const incidentsApi = {
  // Crear nuevo incidente
  create: async (data: CreateIncidentRequest): Promise<ApiResponse<IncidentResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/create`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      return await handleResponse<IncidentResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  },

  // Editar incidente
  edit: async (data: EditIncidentRequest): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/edit`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  },

  // Actualizar estado de incidente
  updateStatus: async (data: UpdateIncidentStatusRequest): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/update-status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  },

  // Buscar incidentes por estudiante
  getByStudent: async (studentId: string): Promise<ApiResponse<IncidentResponse[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/by-student?student_id=${encodeURIComponent(studentId)}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      return await handleResponse<IncidentResponse[]>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  },

  // Buscar incidentes por piso
  getByFloor: async (floor: number): Promise<ApiResponse<IncidentResponse[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/by-floor?floor=${floor}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      return await handleResponse<IncidentResponse[]>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  },

  // Buscar incidentes por urgencia
  getByUrgency: async (urgency: string): Promise<ApiResponse<IncidentResponse[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/by-urgency?urgency=${encodeURIComponent(urgency)}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      return await handleResponse<IncidentResponse[]>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
};

// ==================== WEBSOCKET ====================

export const websocketApi = {
  // Crear conexión WebSocket
  connect: (userId: string, rol: string, token?: string): WebSocket => {
    let url = `${WS_URL}?user_id=${encodeURIComponent(userId)}&rol=${encodeURIComponent(rol)}`;
    
    if (token) {
      url += `&token=${encodeURIComponent(token)}`;
    }
    
    return new WebSocket(url);
  },

  // Helper para configurar listeners
  setupListeners: (
    ws: WebSocket,
    onMessage: (data: any) => void,
    onError?: (error: Event) => void,
    onClose?: (event: CloseEvent) => void
  ) => {
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (e) {
        console.error('Error parseando mensaje WebSocket:', e);
      }
    };

    if (onError) {
      ws.onerror = onError;
    }

    if (onClose) {
      ws.onclose = onClose;
    }
  }
};

// Export default con todas las APIs
export default {
  auth: authApi,
  incidents: incidentsApi,
  websocket: websocketApi,
  WS_URL,
  API_BASE_URL
};