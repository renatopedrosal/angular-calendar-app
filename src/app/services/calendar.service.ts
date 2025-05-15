// src/app/services/calendar.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../models/task.model';
// A interface Task agora deve ser definida aqui ou em um arquivo compartilhado,
// já que o serviço a utiliza e o componente também.
// Para manter a coesão, vamos defini-la aqui e importá-la no componente.

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private _tasks = new BehaviorSubject<Task[]>([]);
  public tasks$: Observable<Task[]> = this._tasks.asObservable();

  constructor() {
    // Inicialize com alguns dados de exemplo, incluindo os novos campos
    const initialTasks: Task[] = [
      {
        uuid: this.generateUUID(),
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
        title: 'Reunião com Bob',
        description: 'Discutir o projeto X e próximos passos.', // Exemplo de descrição
        startTime: '09:00',
        endTime: '10:00',
        color: this.getRandomColor(),
        assignedUserId: 'emp-1',
        completed: false
      },
      {
        uuid: this.generateUUID(),
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 3),
        title: 'Conferência de Vários Dias',
        description: 'Participar da conferência anual de tecnologia.', // Exemplo de descrição
        startTime: '10:00',
        endTime: '17:00',
        color: this.getRandomColor(),
        assignedUserId: 'emp-2',
        completed: false
      },
       {
        uuid: this.generateUUID(),
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 2),
        endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() - 2),
        title: 'Tarefa Concluída Exemplo',
        description: 'Finalizar relatório mensal.', // Exemplo de descrição
        startTime: '14:00',
        endTime: '15:00',
        color: this.getRandomColor(),
        assignedUserId: 'emp-1',
        completed: true
      },
    ];
    this._tasks.next(initialTasks);
  }

  private get currentTasks(): Task[] {
    return this._tasks.value;
  }

  addTask(task: Task): void {
    const newTasks = [...this.currentTasks, {
        ...task,
        uuid: task.uuid || this.generateUUID(),
        color: task.color || this.getRandomColor(),
        completed: task.completed || false,
        description: task.description || '' // Garante que descrição exista, mesmo vazia
    }];
    this._tasks.next(newTasks);
  }

  updateTask(updatedTask: Task): void {
    const newTasks = this.currentTasks.map(task =>
      task.uuid === updatedTask.uuid ? updatedTask : task
    );
    this._tasks.next(newTasks);
  }

  deleteTask(uuid: string): void {
    const newTasks = this.currentTasks.filter(task => task.uuid !== uuid);
    this._tasks.next(newTasks);
  }

  // Métodos de geração de datas, slots de tempo e utilitários (mantidos sem alteração)

  generateMonthWeeks(date: Date): Date[][] {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const weeks: Date[][] = [];
    let week: Date[] = [];

    const firstDayOfMonth = start.getDay();
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevDate = new Date(start);
      prevDate.setDate(start.getDate() - (firstDayOfMonth - i));
      week.push(prevDate);
    }

    for (let day = 1; day <= end.getDate(); day++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
      week.push(currentDate);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    let dayIndex = 1;
    while (week.length > 0 && week.length < 7) {
      const nextDate = new Date(end);
      nextDate.setDate(end.getDate() + dayIndex++);
      week.push(nextDate);
    }
    if (week.length > 0) {
        weeks.push(week);
    }

     while (weeks.length < 6) {
        const lastDayOfLastWeek = weeks[weeks.length - 1][6];
        week = [];
        for (let i = 1; i <= 7; i++) {
            const nextDate = new Date(lastDayOfLastWeek);
            nextDate.setDate(lastDayOfLastWeek.getDate() + i);
            week.push(nextDate);
        }
        weeks.push(week);
    }
    return weeks;
  }

  generateWeekDaysArray(date: Date): Date[] {
      const startOfWeek = this.getStartOfWeek(date);
      const weekDays: Date[] = [];
      for (let day = 0; day < 7; day++) {
        const weekDate = new Date(startOfWeek);
        weekDate.setDate(startOfWeek.getDate() + day);
        weekDays.push(weekDate);
      }
      return weekDays;
  }

   generateDayArray(date: Date): Date[] {
      return [new Date(date)];
   }


  generateTimeSlots(): string[] {
    const timeSlots: string[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const time = hour < 10 ? `0${hour}:00` : `${hour}:00`;
      timeSlots.push(time);
    }
    return timeSlots;
  }

  getStartOfWeek(date: Date): Date {
    const dt = new Date(date);
    const day = dt.getDay();
    const diff = dt.getDate() - day + (day === 0 ? -6 : 0);
    const startOfWeek = new Date(dt.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  isSameDate(date1: Date, date2: Date): boolean {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
    if (!date || !startDate || !endDate) return false;
    const d = new Date(date);
    const start = new Date(startDate);
    const end = new Date(endDate);

    d.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    return d >= start && d <= end;
  }


  generateUUID(): string {
    let d = new Date().getTime();
    let d2 =
      (typeof performance !== 'undefined' &&
        performance.now &&
        performance.now() * 1000) ||
      0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        let r = Math.random() * 16;
        if (d > 0) {
          r = (d + r) % 16 | 0;
          d = Math.floor(d / 16);
        } else {
          r = (d2 + r) % 16 | 0;
          d2 = Math.floor(d2 / 16);
        }
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      }
    );
  }

  getRandomColor(): string {
    const r = Math.floor(Math.random() * 200) + 56;
    const g = Math.floor(Math.random() * 200) + 56;
    const b = Math.floor(Math.random() * 200) + 56;
    const a = 0.6;
    return `rgba(${r},${g},${b},${a})`;
  }
}