// src/app/calendar/calendar.component.ts

import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup } from '@angular/cdk/drag-drop'; // Importar todos do cdk/drag-drop
import { CommonModule } from '@angular/common'; // Importar CommonModule
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Importar FormsModule
import { MatButtonModule } from '@angular/material/button'; // Importar MatButtonModule
import { MatButtonToggleModule } from '@angular/material/button-toggle'; // Importar MatButtonToggleModule
import { MatCheckboxModule } from '@angular/material/checkbox'; // Importar MatCheckboxModule (ainda necessário para o dialog)
import { MatDatepickerModule } from '@angular/material/datepicker'; // Importar MatDatepickerModule
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field'; // Importar MatFormFieldModule
import { MatIconModule } from '@angular/material/icon'; // Importar MatIconModule
import { MatInputModule } from '@angular/material/input'; // Importar MatInputModule
import { MatSelectModule } from '@angular/material/select'; // Importar MatSelectModule
import { Subscription } from 'rxjs';
import { CalendarView } from '../../enums/calendar-view.enum';
import { TaskDialogData } from '../../models/task-dialogs-data.model';
import { Task } from '../../models/task.model';
import { CalendarService } from '../../services/calendar.service';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';

// Interface simples para representar um usuário (substituir pela sua estrutura real)
interface UserSystem {
  id: string;
  role: 'manager' | 'user';
}

// Interface simples para representar um funcionário (substituir pela sua estrutura real)
interface User {
  id: string;
  name: string;
}

export interface UserGroup {
  disabled?: boolean;
  name: string;
  user: User[];
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
   standalone: true,
   imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    CdkDropList, CdkDrag, CdkDropListGroup,
    MatCheckboxModule, // Manter import para o dialog
    MatSelectModule,
    FormsModule
   ],
})
export class CalendarComponent implements OnInit, OnDestroy {
  viewDate: Date = new Date();
  selectedDate: Date | null = null;
  selectedStartTime: string | undefined;
  weekDays: string[] = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  monthDays: Date[] = [];
  weeks: Date[][] = [];
  timeSlots: string[] = [];
  tasks: Task[] = [];
  filteredTasks: Task[] = [];

  private tasksSubscription: Subscription = new Subscription();

  public CalendarView = CalendarView;
  currentView: CalendarView = CalendarView.Month;

  // Simulação de usuário logado (substituir pela lógica real de autenticação)
  // currentUser: User = { id: 'emp-1', role: 'user' }; // Altere para 'manager' para testar como gestor
  currentUser: UserSystem = { id: 'mng-1', role: 'manager' }; // Altere para 'manager' para testar como gestor
  isManager: boolean = this.currentUser.role === 'manager';

  // Simulação de lista de funcionários (substituir por dados reais)
  usersGroups: UserGroup[] = [
    {
      name: 'Funcionários', 
      user: [
        { id: 'emp-1', name: 'Funcionário A' },
        { id: 'emp-2', name: 'Funcionário B' },
        { id: 'emp-3', name: 'Funcionário C' },
      ]
    },
    {
      name: 'Inquilinos',
      disabled: true,
      user: [
        { id: 'emp-4', name: 'Inquilino A' },
        { id: 'emp-5', name: 'Inquilino B' },
        { id: 'emp-6', name: 'Inquilino C' },
      ]
    }
  ];

  // Filtro de funcionário para a visualização do gestor
  filterUserId: string = ''; // '' para todos os funcionários

  constructor(
    public dialog: MatDialog,
    private calendarService: CalendarService
  ) {}

  ngOnInit(): void {
    this.tasksSubscription = this.calendarService.tasks$.subscribe(
      (tasks) => {
        this.tasks = tasks;
        this.applyFilter();
        this.generateView(this.currentView, this.viewDate);
      }
    );
    this.generateView(this.currentView, this.viewDate);
    this.timeSlots = this.calendarService.generateTimeSlots();
  }

  ngOnDestroy(): void {
    if (this.tasksSubscription) {
      this.tasksSubscription.unsubscribe();
    }
  }

  applyFilter(): void {
    if (this.isManager) {
      if (this.filterUserId) {
        this.filteredTasks = this.tasks.filter(task => task.assignedUserId === this.filterUserId);
      } else {
        this.filteredTasks = [...this.tasks]; // Mostra todas as tarefas para o gestor sem filtro
      }
    } else {
      // Funcionário vê apenas suas tarefas
      this.filteredTasks = this.tasks.filter(task => task.assignedUserId === this.currentUser.id);
    }
  }

  generateView(view: CalendarView, date: Date) {
    switch (view) {
      case CalendarView.Month:
        this.weeks = this.calendarService.generateMonthWeeks(date);
        this.monthDays = this.weeks.flat();
        break;
      case CalendarView.Week:
        this.monthDays = this.calendarService.generateWeekDaysArray(date);
        this.weeks = [];
        break;
      case CalendarView.Day:
        this.monthDays = this.calendarService.generateDayArray(date);
        this.weeks = [];
        break;
      default:
        this.weeks = this.calendarService.generateMonthWeeks(date);
        this.monthDays = this.weeks.flat();
    }
  }

  switchToView(view: CalendarView) {
    this.currentView = view;
    this.generateView(this.currentView, this.viewDate);
  }

  previous() {
    if (this.currentView === CalendarView.Month) {
      this.viewDate = new Date(
        this.viewDate.getFullYear(),
        this.viewDate.getMonth() - 1,
        1
      );
    } else if (this.currentView === CalendarView.Week) {
      this.viewDate = new Date(
        this.viewDate.setDate(this.viewDate.getDate() - 7)
      );
    } else { // CalendarView.Day
      this.viewDate = new Date(
        this.viewDate.setDate(this.viewDate.getDate() - 1)
      );
    }
    this.generateView(this.currentView, this.viewDate);
  }

  next() {
    if (this.currentView === CalendarView.Month) {
      this.viewDate = new Date(
        this.viewDate.getFullYear(),
        this.viewDate.getMonth() + 1,
        1
      );
    } else if (this.currentView === CalendarView.Week) {
      this.viewDate = new Date(
        this.viewDate.setDate(this.viewDate.getDate() + 7)
      );
    } else { // CalendarView.Day
      this.viewDate = new Date(
        this.viewDate.setDate(this.viewDate.getDate() + 1)
      );
    }
    this.generateView(this.currentView, this.viewDate);
  }

  viewToday(): void {
    this.viewDate = new Date();
    this.generateView(this.currentView, this.viewDate);
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

   isCurrentMonth(date: Date): boolean {
    if(!date) return false;
    return (
      date.getMonth() === this.viewDate.getMonth() &&
      date.getFullYear() === this.viewDate.getFullYear()
    );
  }

  isSameDate(date1: Date, date2: Date): boolean {
      return this.calendarService.isSameDate(date1, date2);
  }

  isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
      return this.calendarService.isDateInRange(date, startDate, endDate);
  }

  // Esta função agora é primariamente para Adicionar tarefa (apenas gestor)
  selectDate(date?: Date, startTime?: string) {
    // Apenas gestores podem adicionar tarefas clicando nas células ou no botão
    if (!this.isManager && !date) { // Se não é gestor E clicou no botão "Adicionar Tarefa"
        return;
    }
     if (!this.isManager && date) { // Se é funcionário e clicou na célula, não faz nada aqui, a interação é pelo clique na tarefa existente
         return;
     }


    this.selectedDate = date ? new Date(date) : new Date();
    this.selectedStartTime = startTime;
    this.openDialog(); // Abre o dialog para adicionar nova tarefa
  }

  // Abre o dialog. Pode ser para adicionar (sem taskData) ou editar/visualizar (com taskData)
  openDialog(taskData?: TaskDialogData): void {
    const now = new Date();
    const selectedDateForDialog = this.selectedDate ? new Date(this.selectedDate) : new Date();
    let initialStartTime: string;
    let initialEndTime: string;

    if (this.selectedStartTime) {
      initialStartTime = this.selectedStartTime;
      const [startHourStr, startMinuteStr] = this.selectedStartTime.split(':');
      let startHour = parseInt(startHourStr, 10);

      let endHour = startHour + 1;
      if (endHour > 23) {
          endHour = 23;
          initialEndTime = `23:59`;
      } else {
          initialEndTime = `${endHour.toString().padStart(2, '0')}:${startMinuteStr}`;
      }

    } else {
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();

      initialStartTime = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

      let endHour = currentHour + 1;
      if (endHour > 23) {
          endHour = 23;
          initialEndTime = `23:59`;
      } else {
          initialEndTime = `${endHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
      }
    }

    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '550px',
      panelClass: 'dialog-container',
      data: taskData ? { // Se taskData foi passado (editando/visualizando)
           ...taskData,
           currentUser: this.currentUser, // Passa o usuário logado para o dialog
           users: this.usersGroups // Passa a lista de funcionários
        } as TaskDialogData
        : { // Se taskData NÃO foi passado (adicionando nova tarefa)
        startDate: selectedDateForDialog,
        endDate: new Date(selectedDateForDialog),
        title: '',
        description: '', // Valor inicial para descrição
        startTime: initialStartTime,
        endTime: initialEndTime,
        uuid: null,
        assignedUserId: this.isManager ? '' : this.currentUser.id, // Pré-seleciona o funcionário logado se for funcionário (embora adicionar seja só para gestor)
        completed: false, // Valor inicial para concluído
        currentUser: this.currentUser, // Passa o usuário logado
        users: this.usersGroups // Passa a lista de funcionários
      } as TaskDialogData,
    });

    dialogRef.afterClosed().subscribe((result?: TaskDialogData) => {
      if (result) {
        if (result.remove && result.uuid) {
            this.calendarService.deleteTask(result.uuid);
        } else if (!result.uuid) {
          // Adicionar novo agendamento (apenas gestor chega aqui)
          this.calendarService.addTask({
            startDate: result.startDate,
            endDate: result.endDate,
            title: result.title,
            description: result.description, // Salva a descrição
            startTime: result.startTime,
            endTime: result.endTime,
            assignedUserId: result.assignedUserId, // Salva o funcionário atribuído
            completed: result.completed || false, // Salva o status de concluído
            // A cor será adicionada pelo serviço
          });
        } else {
           // Atualizar agendamento existente (gestor ou funcionário alterando 'completed')
           // O dialog envia apenas o necessário para atualização (UUID e completed para funcionário, tudo para gestor)
           this.calendarService.updateTask({
                // uuid: result.uuid,
                ...this.tasks.find(t => t.uuid === result.uuid), // Recupera os dados originais
                ...result // Sobrescreve com os dados do dialog (completed para funcionário, tudo para gestor)
           } as Task);
        }
      }
    });
  }

  drop(event: CdkDragDrop<Task[]>, newCellDate: Date, slot?: string) {
     // Apenas gestores podem arrastar tarefas
    if (!this.isManager) {
        return;
    }

    const movedTask = { ...event.item.data } as Task;

    const originalStartDate = new Date(movedTask.startDate);
    const originalEndDate = new Date(movedTask.endDate);
    const duration = originalEndDate.getTime() - originalStartDate.getTime();

    let newStartDate = new Date(newCellDate);

    if (slot && (this.currentView === CalendarView.Week || this.currentView === CalendarView.Day)) {
        const [hours, minutes] = slot.split(':').map(Number);
        newStartDate.setHours(hours, minutes, 0, 0);
        movedTask.startTime = slot;

         if (this.calendarService.isSameDate(originalStartDate, originalEndDate)) {
            const originalStartTimeParts = movedTask.startTime.split(':').map(Number);
            const originalEndTimeParts = movedTask.endTime.split(':').map(Number);

            const startDateTime = new Date(0);
            startDateTime.setHours(originalStartTimeParts[0], originalStartTimeParts[1]);
            const endDateTime = new Date(0);
            endDateTime.setHours(originalEndTimeParts[0], originalEndTimeParts[1]);
            const timeDuration = endDateTime.getTime() - startDateTime.getTime();

            const newEndDateTime = new Date(newStartDate.getTime() + timeDuration);
            movedTask.endTime = `${newEndDateTime.getHours().toString().padStart(2, '0')}:${newEndDateTime.getMinutes().toString().padStart(2, '0')}`;
        }

    } else {
        const [startHours, startMinutes] = movedTask.startTime.split(':').map(Number);
        newStartDate.setHours(startHours, startMinutes, 0, 0);
    }

    movedTask.startDate = newStartDate;
    movedTask.endDate = new Date(newStartDate.getTime() + duration);

    if (movedTask.uuid) {
         this.calendarService.updateTask(movedTask);
    }
  }

  // Função chamada ao clicar em uma tarefa existente
  editTask(taskToEdit: Task, event: Event) {
    event.stopPropagation();
    event.preventDefault();

    const taskData = JSON.parse(JSON.stringify(taskToEdit));
    taskData.startDate = new Date(taskData.startDate);
    taskData.endDate = new Date(taskData.endDate);

     // Passa os dados da tarefa, usuário logado e lista de funcionários para o dialog
    this.openDialog({
        ...taskData,
        currentUser: this.currentUser,
        users: this.usersGroups
    } as TaskDialogData);
  }


  // Retorna as tarefas para uma data específica na visão mensal
  getTasksForDate(date: Date, tasksList: Task[]): Task[] {
      if (!date || !tasksList) return [];
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      return tasksList.filter(task => {
          if (!task.startDate || !task.endDate) return false;
          const taskStart = new Date(task.startDate);
          const taskEnd = new Date(task.endDate);

          return taskEnd >= dayStart && taskStart <= dayEnd;
      });
  }


  getTasksForDateTime(date: Date, timeSlot: string, tasksList: Task[]): Task[] {
    if (!date || !timeSlot || !tasksList) return [];
    const slotTimeValue = parseInt(timeSlot.replace(':', ''), 10);

    return tasksList.filter(task => {
      if (!task.startDate || !task.endDate || !task.startTime || !task.endTime) return false;

      const eventStartFullDate = new Date(task.startDate);
      const [startHours, startMinutes] = task.startTime.split(':').map(Number);
      eventStartFullDate.setHours(startHours, startMinutes, 0, 0);

      const eventEndFullDate = new Date(task.endDate);
      const [endHours, endMinutes] = task.endTime.split(':').map(Number);
      eventEndFullDate.setHours(endHours, endMinutes, 0, 0);


      const slotDateTime = new Date(date);
      const [slotH, slotM] = timeSlot.split(':').map(Number);
      slotDateTime.setHours(slotH, slotM, 0, 0);

      return slotDateTime >= eventStartFullDate && slotDateTime < eventEndFullDate;
    });
  }

  // Retorna o nome do funcionário dado o ID (usar para exibir na visualização do gestor e no dialog)
  getUserName(userId: string): string {
      const user = this.usersGroups
        .flatMap(empGroup => empGroup.user)
        .find(emp => emp.id === userId);
      return user ? user.name : 'Desconhecido';
  }
}