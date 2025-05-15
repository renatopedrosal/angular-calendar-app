import { UserGroup } from "../components/calendar/calendar.component";

export interface TaskDialogData {
  uuid: string | null;
  startDate: Date;
  endDate: Date;
  title: string;
  description?: string; // Novo campo opcional para descrição
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  color?: string;    // Opcional
  remove?: boolean;  // Para a operação de delete
  assignedUserId?: string; // ID do funcionário atribuído
  completed?: boolean; // Novo campo para status de conclusão
  currentUser: { id: string; role: 'manager' | 'user' }; // Informação do usuário logado
  users: UserGroup[]; // Lista de funcionários
}