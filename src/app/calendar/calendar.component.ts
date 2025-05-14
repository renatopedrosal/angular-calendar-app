import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AppointmentDialogComponent, AppointmentDialogData } from '../appointment-dialog/appointment-dialog.component';

// Defina a interface Appointment aqui ou importe-a se estiver em um arquivo separado
interface Appointment {
  uuid?: string;
  startDate: Date; // Alterado de 'date'
  endDate: Date;   // Nova propriedade para a data de término
  title: string;
  startTime: string;
  endTime: string;
  color?: string;
}

export enum CalendarView {
  Month = 'month',
  Week = 'week',
  Day = 'day',
}

export interface LayoutEvent {
  appointment: Appointment;
  layoutTrack: number;         // A faixa vertical (0, 1, 2...)
  startDayIndexInWeek: number; // 0 (Sun) a 6 (Sat) - início do segmento nesta semana
  endDayIndexInWeek: number;   // 0 (Sun) a 6 (Sat) - fim do segmento nesta semana
  isContinuation: boolean;     // Se o evento começou antes desta semana
  continuesBeyond: boolean;    // Se o evento continua após esta semana
  originalStartDate: Date;     // Para referência ao início real do evento
  originalEndDate: Date;       // Para referência ao fim real do evento
}

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent {
  viewDate: Date = new Date();
  selectedDate: Date | null = null;
  selectedStartTime: string | undefined;
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthDays: Date[] = [];
  appointments: Appointment[] = [
    // Seus dados de exemplo de eventos (lembre-se de usar startDate e endDate)
    // Exemplo:
    {
      uuid: '00000000-0000-0000-0000-000000000001',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
      title: 'Meeting with Bob',
      startTime: '09:00',
      endTime: '10:00',
      color: 'lightblue'
    },
    {
      uuid: '00000000-0000-0000-0000-0000000Multi',
      startDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1),
      endDate: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 3),
      title: 'Multi-day Conference',
      startTime: '10:00',
      endTime: '17:00',
      color: 'lightgreen'
    },
     // Adicione mais exemplos conforme necessário, seguindo o formato de startDate e endDate
     // Certifique-se de que todos os seus exemplos de 'appointments' iniciais
     // foram atualizados para usar 'startDate' e 'endDate'.
  ];
  currentView: CalendarView = CalendarView.Month;
  timeSlots: string[] = [];
  weeks: Date[][] = [];

  public CalendarView = CalendarView;

  constructor(public dialog: MatDialog) {
    this.appointments.forEach((appointment) => {
      if (!appointment.color) { // Adiciona cor apenas se não existir
        appointment.color = this.getRandomColor();
      }
    });
    this.generateView(this.currentView, this.viewDate);
    this.generateTimeSlots();
  }

  generateView(view: CalendarView, date: Date) {
    switch (view) {
      case CalendarView.Month:
        this.generateMonthView(date);
        break;
      case CalendarView.Week:
        this.generateWeekView(date);
        break;
      case CalendarView.Day:
        this.generateDayView(date);
        break;
      default:
        this.generateMonthView(date);
    }
  }

  generateMonthView(date: Date) {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    this.weeks = [];
    // this.monthDays = []; // monthDays é preenchido em generateWeekView e generateDayView,
                           // para a visão mensal, os dias estão dentro de this.weeks
    let currentMonthDays: Date[] = []; // Usado para popular this.monthDays para a lógica de isCurrentMonth

    let week: Date[] = [];

    // Dias do mês anterior para preencher a primeira semana
    const firstDayOfMonth = start.getDay();
    for (let i = 0; i < firstDayOfMonth; i++) {
      const prevDate = new Date(start);
      prevDate.setDate(start.getDate() - (firstDayOfMonth - i));
      week.push(prevDate);
      currentMonthDays.push(prevDate);
    }

    // Dias do mês atual
    for (let day = 1; day <= end.getDate(); day++) {
      const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
      week.push(currentDate);
      currentMonthDays.push(currentDate);
      if (week.length === 7) {
        this.weeks.push(week);
        week = [];
      }
    }

    // Dias do próximo mês para preencher a última semana
    let dayIndex = 1;
    while (week.length > 0 && week.length < 7) {
      const nextDate = new Date(end);
      nextDate.setDate(end.getDate() + dayIndex++);
      week.push(nextDate);
      currentMonthDays.push(nextDate);
    }
    if (week.length > 0) { // Garante que a última semana seja adicionada se não estiver completa
        this.weeks.push(week);
    }


    // Garante que haja 6 semanas para uma altura consistente do calendário
     while (this.weeks.length < 6) {
        const lastDayOfLastWeek = this.weeks[this.weeks.length - 1][6];
        week = [];
        for (let i = 1; i <= 7; i++) {
            const nextDate = new Date(lastDayOfLastWeek);
            nextDate.setDate(lastDayOfLastWeek.getDate() + i);
            week.push(nextDate);
            currentMonthDays.push(nextDate);
        }
        this.weeks.push(week);
    }
    this.monthDays = currentMonthDays; // Para isCurrentMonth funcionar corretamente
  }


  generateWeekView(date: Date) {
    const startOfWeek = this.getStartOfWeek(date); // Corrigido para usar getStartOfWeek
    this.monthDays = [];

    for (let day = 0; day < 7; day++) {
      const weekDate = new Date(startOfWeek);
      weekDate.setDate(startOfWeek.getDate() + day);
      this.monthDays.push(weekDate);
    }
  }

  generateDayView(date: Date) {
    this.monthDays = [new Date(date)]; // Garante que é uma nova instância
  }

  generateTimeSlots() {
    this.timeSlots = []; // Limpa os slots antes de gerar
    for (let hour = 0; hour < 24; hour++) { // Alterado para < 24 para não ter 24:00
      const time = hour < 10 ? `0${hour}:00` : `${hour}:00`;
      this.timeSlots.push(time);
    }
  }

  switchToView(view: CalendarView) {
    this.currentView = view;
    this.generateView(this.currentView, this.viewDate);
  }

  // Renomeado de startOfWeek para getStartOfWeek para clareza
  getStartOfWeek(date: Date): Date {
    const dt = new Date(date); // Cria uma nova instância para não modificar a original
    const day = dt.getDay();
    const diff = dt.getDate() - day + (day === 0 ? -6 : 0); // Ajustado para domingo ser o primeiro dia da semana
    return new Date(dt.setDate(diff));
  }

  previous() {
    if (this.currentView === CalendarView.Month) {
      this.viewDate = new Date(
        this.viewDate.getFullYear(),
        this.viewDate.getMonth() - 1,
        1 // Define para o primeiro dia do mês anterior
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
        1 // Define para o primeiro dia do próximo mês
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

  isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  isSelected(date: Date): boolean {
    if (!this.selectedDate) {
      return false;
    }
    return (
      date.getDate() === this.selectedDate.getDate() &&
      date.getMonth() === this.selectedDate.getMonth() &&
      date.getFullYear() === this.selectedDate.getFullYear()
    );
  }

  isSameDate(date1: Date, date2: Date): boolean {
    if (!date1 || !date2) return false;
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
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


  selectDate(date?: Date, startTime?: string) {
    this.selectedDate = date ? new Date(date) : new Date(); // Cria nova instância
    this.selectedStartTime = startTime;
    this.openDialog();
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

  addAppointment(
    startDate: Date,
    endDate: Date,
    title: string,
    startTime: string,
    endTime: string
  ) {
    this.appointments.push({
      uuid: this.generateUUID(),
      startDate,
      endDate,
      title,
      startTime,
      endTime,
      color: this.getRandomColor(),
    });
    // Opcional: forçar a re-renderização ou atualização da view se necessário
    // this.generateView(this.currentView, this.viewDate);
  }

  deleteAppointment(appointment: Appointment, event: Event) {
    event.stopPropagation();
    const index = this.appointments.findIndex(app => app.uuid === appointment.uuid);
    if (index > -1) {
      this.appointments.splice(index, 1);
       // Opcional: forçar a re-renderização ou atualização da view se necessário
       // this.generateView(this.currentView, this.viewDate);
    }
  }

  openDialog(): void {
  const now = new Date();
  const selectedDateForDialog = this.selectedDate ? new Date(this.selectedDate) : new Date();
  let initialStartTime: string;
  let initialEndTime: string;

  if (this.selectedStartTime) { // Veio de um clique em slot de tempo (week/day view)
    initialStartTime = this.selectedStartTime; // selectedStartTime já deve estar em "HH:mm"
    const [startHourStr, startMinuteStr] = this.selectedStartTime.split(':');
    let startHour = parseInt(startHourStr, 10);

    let endHour = startHour + 1;
    if (endHour > 23) { // Se a hora final passar de 23
        endHour = 23; // Limita a 23
        initialEndTime = `23:59`; // E o minuto a 59 para o último slot possível
    } else {
        initialEndTime = `${endHour.toString().padStart(2, '0')}:${startMinuteStr}`;
    }

  } else { // Botão "Add Appointment" ou clique na célula do mês
    // Define um horário padrão ou a hora atual arredondada
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes(); // Usar minutos atuais

    initialStartTime = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

    let endHour = currentHour + 1;
    if (endHour > 23) {
        endHour = 23;
        initialEndTime = `23:59`;
    } else {
        initialEndTime = `${endHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
    }
  }

  const dialogRef = this.dialog.open(AppointmentDialogComponent, {
    width: '550px', // Aumentei um pouco para os campos lado a lado
    panelClass: 'dialog-container',
    data: {
      startDate: selectedDateForDialog,
      endDate: new Date(selectedDateForDialog), // Por padrão, mesmo dia
      title: '',
      startTime: initialStartTime, // Deve ser "HH:mm"
      endTime: initialEndTime,   // Deve ser "HH:mm"
      uuid: null,
    } as AppointmentDialogData,
  });

  dialogRef.afterClosed().subscribe((result?: AppointmentDialogData) => {
    if (result && !result.remove) {
      // Os valores de result.startTime e result.endTime virão como "HH:mm"
      this.addAppointment(
        result.startDate,
        result.endDate,
        result.title,
        result.startTime,
        result.endTime
      );
    }
  });
}


  drop(event: CdkDragDrop<Appointment[]>, newCellDate: Date, slot?: string) {
    const movedAppointment = event.item.data as Appointment;

    // Calcula a duração do evento em milissegundos
    const originalStartDate = new Date(movedAppointment.startDate);
    const originalEndDate = new Date(movedAppointment.endDate);
    const duration = originalEndDate.getTime() - originalStartDate.getTime();

    // A nova data de início é a data da célula onde o evento foi solto
    let newStartDate = new Date(newCellDate);

    if (slot && (this.currentView === CalendarView.Week || this.currentView === CalendarView.Day)) {
        // Se houver um slot (visão de semana/dia), ajusta a hora de início
        const [hours, minutes] = slot.split(':').map(Number);
        newStartDate.setHours(hours, minutes, 0, 0);
        movedAppointment.startTime = slot;

        // Para eventos de um único dia, o endTime pode ser ajustado com base no startTime
        // Se for um evento de múltiplos dias, o startTime do primeiro dia é atualizado.
        // A duração do evento (em dias) é mantida.
        if (this.isSameDate(originalStartDate, originalEndDate)) {
            // Se era um evento de um único dia, calcula o novo endTime com base na duração original em horas/minutos
            const originalStartTimeParts = movedAppointment.startTime.split(':').map(Number);
            const originalEndTimeParts = movedAppointment.endTime.split(':').map(Number);

            const startDateTime = new Date(0);
            startDateTime.setHours(originalStartTimeParts[0], originalStartTimeParts[1]);
            const endDateTime = new Date(0);
            endDateTime.setHours(originalEndTimeParts[0], originalEndTimeParts[1]);
            const timeDuration = endDateTime.getTime() - startDateTime.getTime();

            const newEndDateTime = new Date(newStartDate.getTime() + timeDuration);
            movedAppointment.endTime = `${newEndDateTime.getHours().toString().padStart(2, '0')}:${newEndDateTime.getMinutes().toString().padStart(2, '0')}`;
        }

    } else {
        // Para a visão mensal, ou se não houver slot, a hora de início permanece a original do evento
        const [startHours, startMinutes] = movedAppointment.startTime.split(':').map(Number);
        newStartDate.setHours(startHours, startMinutes, 0, 0);
    }

    movedAppointment.startDate = newStartDate;
    movedAppointment.endDate = new Date(newStartDate.getTime() + duration);

    // Força a atualização da view se necessário, ou confia na detecção de mudanças do Angular
    // this.generateView(this.currentView, this.viewDate);
  }


  viewToday(): void {
    this.viewDate = new Date();
    this.generateView(this.currentView, this.viewDate);
  }

  isCurrentMonth(date: Date): boolean {
    if(!date) return false;
    return (
      date.getMonth() === this.viewDate.getMonth() &&
      date.getFullYear() === this.viewDate.getFullYear()
    );
  }

  getAppointmentsForDateTime(date: Date, timeSlot: string): Appointment[] {
    if (!date || !timeSlot) return [];
    const slotTimeValue = parseInt(timeSlot.replace(':', ''), 10); // ex: "09:00" -> 900

    return this.appointments.filter(appointment => {
      if (!appointment.startDate || !appointment.endDate || !appointment.startTime || !appointment.endTime) return false;

      const eventStartFullDate = new Date(appointment.startDate);
      const [startHours, startMinutes] = appointment.startTime.split(':').map(Number);
      eventStartFullDate.setHours(startHours, startMinutes, 0, 0);

      const eventEndFullDate = new Date(appointment.endDate);
      const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);
      eventEndFullDate.setHours(endHours, endMinutes, 0, 0);

      const slotDateTime = new Date(date);
      const [slotH, slotM] = timeSlot.split(':').map(Number);
      slotDateTime.setHours(slotH, slotM, 0, 0);

      // Caso 1: Evento de um único dia
      if (this.isSameDate(appointment.startDate, appointment.endDate)) {
        if (this.isSameDate(date, appointment.startDate)) {
          const appointmentStartTimeValue = parseInt(appointment.startTime.replace(':', ''), 10);
          const appointmentEndTimeValue = parseInt(appointment.endTime.replace(':', ''), 10);
          // O evento está no slot se o slotTime estiver entre [startTime, endTime)
          return slotTimeValue >= appointmentStartTimeValue && slotTimeValue < appointmentEndTimeValue;
        }
        return false;
      }
      // Caso 2: Evento de múltiplos dias
      else {
        const slotDateOnly = new Date(date);
        slotDateOnly.setHours(0,0,0,0);
        const eventStartDateOnly = new Date(appointment.startDate);
        eventStartDateOnly.setHours(0,0,0,0);
        const eventEndDateOnly = new Date(appointment.endDate);
        eventEndDateOnly.setHours(0,0,0,0);

        // Se o slot está no dia de início do evento
        if (this.isSameDate(slotDateOnly, eventStartDateOnly)) {
          const appointmentStartTimeValue = parseInt(appointment.startTime.replace(':', ''), 10);
          return slotTimeValue >= appointmentStartTimeValue;
        }
        // Se o slot está no dia de término do evento
        else if (this.isSameDate(slotDateOnly, eventEndDateOnly)) {
          const appointmentEndTimeValue = parseInt(appointment.endTime.replace(':', ''), 10);
          return slotTimeValue < appointmentEndTimeValue;
        }
        // Se o slot está em um dia intermediário
        else if (slotDateOnly > eventStartDateOnly && slotDateOnly < eventEndDateOnly) {
          return true; // Ocupa o dia todo
        }
        return false;
      }
    });
  }


  getRandomColor(): string {
    const r = Math.floor(Math.random() * 200) + 56; // Evita cores muito escuras
    const g = Math.floor(Math.random() * 200) + 56;
    const b = Math.floor(Math.random() * 200) + 56;
    const a = 0.6; // Aumenta um pouco a opacidade para melhor visibilidade
    return `rgba(${r},${g},${b},${a})`;
  }

  editAppointment(appointmentToEdit: Appointment, event: Event) {
    event.stopPropagation(); // Impede que o click na célula seja acionado
    event.preventDefault();

    // Cria uma cópia profunda do objeto para evitar modificações diretas no original antes de salvar
    const appointmentData = JSON.parse(JSON.stringify(appointmentToEdit));
    // Converte as strings de data de volta para objetos Date
    appointmentData.startDate = new Date(appointmentData.startDate);
    appointmentData.endDate = new Date(appointmentData.endDate);


    const dialogRef = this.dialog.open(AppointmentDialogComponent, {
      width: '500px',
      panelClass: 'dialog-container',
      data: appointmentData, // Passa a cópia
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const index = this.appointments.findIndex(
          (app) => app.uuid === result.uuid
        );
        if (index > -1) {
          if (result.remove) {
            this.appointments.splice(index, 1);
          } else {
            // Atualiza o evento existente com os novos dados
            this.appointments[index] = {
                ...this.appointments[index], // Mantém propriedades não editáveis como a cor
                ...result,
                startDate: new Date(result.startDate), // Garante que são objetos Date
                endDate: new Date(result.endDate)
            };
          }
          // Opcional: forçar a re-renderização ou atualização da view se necessário
          // this.generateView(this.currentView, this.viewDate);
        }
      }
    });
  }
}
