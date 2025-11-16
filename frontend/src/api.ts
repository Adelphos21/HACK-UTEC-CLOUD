// Configuración de la API
const API_BASE_URL = 'https://79c3srjp89.execute-api.us-east-1.amazonaws.com/dev';

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
  token_type: string;
  expires_in: number;
  user: {
    user_id: string;
    email: string;
    nombre: string;
    apellidos?: string;
    rol: 'Estudiante' | 'Administrativo' | 'Autoridad';
  };
}

export interface RegisterRequest {
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  password: string;
  rol: 'Estudiante' | 'Administrativo' | 'Autoridad';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface IncidentResponse {
  incident_id: string;
  tipo: string;
  urgencia: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  descripcion: string;
  ubicacion: string;
  estado: 'Pendiente' | 'En Atención' | 'Resuelto';
  reportado_por: string;
  created_at: string;
  updated_at: string;
}

export interface CreateIncidentRequest {
  tipo: string;
  ubicacion: string;
  descripcion: string;
  urgencia: 'Baja' | 'Media' | 'Alta' | 'Crítica';
}

export interface UpdateIncidentStatusRequest {
  estado: 'Pendiente' | 'En Atención' | 'Resuelto';
}

// Helper para manejar errores
const handleResponse = async <T,>(response: Response): Promise<ApiResponse<T>> => {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let errorMessage = 'Error en la solicitud';
    
    try {
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
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
      return {
        success: true,
        data: undefined as T
      };
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
      const response = await fetch(`${API_BASE_URL}/usuarios/register`, {
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

  // Login de usuario
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      
      return await handleResponse<LoginResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<ApiResponse<LoginResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/refresh`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      return await handleResponse<LoginResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
};

// ==================== INCIDENTS ENDPOINTS ====================

export const incidentsApi = {
  // Obtener todos los incidentes
  getAll: async (token: string, filters?: {
    estado?: string;
    tipo?: string;
    urgencia?: string;
  }): Promise<ApiResponse<IncidentResponse[]>> => {
    try {
      let url = `${API_BASE_URL}/incidentes`;
      
      // Agregar filtros como query params
      if (filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders(token)
      });
      
      return await handleResponse<IncidentResponse[]>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  },

  // Obtener un incidente por ID
  getById: async (token: string, incidentId: string): Promise<ApiResponse<IncidentResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/incidentes/${incidentId}`, {
        method: 'GET',
        headers: getAuthHeaders(token)
      });
      
      return await handleResponse<IncidentResponse>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  },

  // Crear nuevo incidente
  create: async (token: string, data: CreateIncidentRequest): Promise<ApiResponse<IncidentResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/incidentes`, {
        method: 'POST',
        headers: getAuthHeaders(token),
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

  // Actualizar estado de incidente
  updateStatus: async (
    token: string, 
    incidentId: string, 
    data: UpdateIncidentStatusRequest
  ): Promise<ApiResponse<IncidentResponse>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/incidentes/${incidentId}`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
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

  // Eliminar incidente (solo admin)
  delete: async (token: string, incidentId: string): Promise<ApiResponse<void>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/incidentes/${incidentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(token)
      });
      
      return await handleResponse<void>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  },

  // Obtener historial de un incidente
  getHistory: async (token: string, incidentId: string): Promise<ApiResponse<any[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/incidentes/${incidentId}/historial`, {
        method: 'GET',
        headers: getAuthHeaders(token)
      });
      
      return await handleResponse<any[]>(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
};

// ==================== USERS ENDPOINTS ====================

export const usersApi = {
  // Obtener perfil de usuario actual
  getProfile: async (token: string): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/perfil`, {
        method: 'GET',
        headers: getAuthHeaders(token)
      });
      
      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  },

  // Actualizar perfil
  updateProfile: async (token: string, data: any): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/perfil`, {
        method: 'PUT',
        headers: getAuthHeaders(token),
        body: JSON.stringify(data)
      });
      
      return await handleResponse(response);
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión con el servidor'
      };
    }
  }
};

// Export default con todas las APIs
export default {
  auth: authApi,
  incidents: incidentsApi,
  users: usersApi
};