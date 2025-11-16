// Tipos de la aplicación

export interface User {
  user_id: string | null;
  nombre: string;
  email: string;
  rol: 'Estudiante' | 'Personal administrativo' | 'Autoridad';
}

export interface RegisterData {
  nombres: string;
  apellidos: string;
  dni: string;
  correo: string;
  password: string;
  rol: 'Estudiante' | 'Personal administrativo' | 'Autoridad';
}

export interface Incident {
  id: string;
  tipo: string;
  urgencia: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  descripcion: string;
  ubicacion: string;
  estado: 'Pendiente' | 'En Atención' | 'Resuelto';
  timestamp: string;
  fecha: string;
  reportadoPor?: string;
}

export interface NewReport {
  tipo: string;
  ubicacion: string;
  descripcion: string;
  urgencia: 'Baja' | 'Media' | 'Alta' | 'Crítica';
}

export interface RegisterPageProps {
  onBack: () => void;
}

export interface DashboardProps {
  user: User;
  onLogout: () => void;
}