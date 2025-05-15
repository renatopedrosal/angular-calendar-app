export interface Task {
  uuid?: string;
  startDate: Date;
  endDate: Date;
  title: string;
  description?: string; // Novo campo opcional
  startTime: string;
  endTime: string;
  color?: string;
  assignedUserId?: string;
  completed?: boolean;
}