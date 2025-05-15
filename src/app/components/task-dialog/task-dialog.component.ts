import { CdkTextareaAutosize } from '@angular/cdk/text-field'; // Importar CdkTextareaAutosize
import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox'; // Importar MatCheckboxModule
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TaskDialogData } from '../../models/task-dialogs-data.model';
import { UserGroup } from '../calendar/calendar.component';

@Component({
  selector: 'app-task-dialog',
  templateUrl: './task-dialog.component.html',
  styleUrls: ['./task-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatSelectModule,
    MatCheckboxModule, // Adicionar MatCheckboxModule
    CdkTextareaAutosize // Adicionar CdkTextareaAutosize
  ],
})
export class TaskDialogComponent {
  taskForm: FormGroup;
  isManager: boolean;
  isUserAndEditing: boolean; // Flag para controlar desabilitação de campos
  currentUser: { id: string; role: 'manager' | 'user' };
  users: UserGroup[];

  // Regex para validar o formato HH:mm
  private timePattern = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

  constructor(
    public dialogRef: MatDialogRef<TaskDialogComponent, TaskDialogData | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: TaskDialogData,
    private formBuilder: FormBuilder
  ) {
    this.currentUser = data.currentUser;
    this.isManager = this.currentUser.role === 'manager';
    // Um funcionário editando é quando não é gestor E o dialog tem um UUID (tarefa existente)
    this.isUserAndEditing = !this.isManager && !!this.data.uuid;
    this.users = data.users || []; // Inicializa a lista de funcionários

    this.taskForm = this.formBuilder.group(
      {
        title: [this.data.title || '', Validators.required],
        description: [this.data.description || ''], // Adicionar campo de descrição
        startDate: [this.data.startDate ? new Date(this.data.startDate) : new Date(), Validators.required],
        endDate: [this.data.endDate ? new Date(this.data.endDate) : new Date(), Validators.required],
        startTime: [
          this.data.startTime || '',
          [Validators.required, Validators.pattern(this.timePattern)],
        ],
        endTime: [
          this.data.endTime || '',
          [Validators.required, Validators.pattern(this.timePattern)],
        ],
        assignedUserId: [this.data.assignedUserId || (this.isUserAndEditing ? this.currentUser.id : ''), this.isManager ? Validators.required : []], // Validação apenas para gestor
        completed: [this.data.completed || false], // Adicionar campo de concluído
      },
      { validators: [this.dateRangeValidator, this.dateTimeRangeValidator] }
    );

    // Desabilitar campos para funcionário visualizando/editando uma tarefa existente
    if (this.isUserAndEditing) {
        this.taskForm.get('title')?.disable();
        this.taskForm.get('description')?.disable();
        this.taskForm.get('startDate')?.disable();
        this.taskForm.get('endDate')?.disable();
        this.taskForm.get('startTime')?.disable();
        this.taskForm.get('endTime')?.disable();
        this.taskForm.get('assignedUserId')?.disable();

        // Apenas o campo 'completed' pode ser habilitado para o funcionário alterar
         if (this.data.assignedUserId === this.currentUser.id) {
             this.taskForm.get('completed')?.enable();
         } else {
              this.taskForm.get('completed')?.disable(); // Se não for a tarefa dele, desabilita também
         }

    } else if (!this.isManager && !this.data.uuid) {
         // Funcionário adicionando tarefa (não permitido pelas regras, mas para completude)
         // Todos os campos deveriam estar desabilitados ou o botão de adicionar não deveria aparecer.
         // O CalendarComponent já restringe a adição para gestores, então este caso é menos crítico.
         this.taskForm.disable(); // Desabilita todo o formulário se for funcionário tentando adicionar
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSaveClick(): void {
    if (this.taskForm.valid) {
      const formValue = this.taskForm.getRawValue(); // Use getRawValue para obter valores de campos desabilitados
      const resultData: TaskDialogData = {
        title: formValue.title,
        description: formValue.description, // Incluir descrição
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        startTime: formValue.startTime,
        endTime: formValue.endTime,
        uuid: this.data.uuid,
        color: this.data.color,
        assignedUserId: formValue.assignedUserId, // Incluir o funcionário atribuído
        completed: formValue.completed, // Incluir status de concluído
        currentUser: this.currentUser, // Passa o currentUser de volta (pode ser útil no subscribe)
        users: this.users // Passa a lista de funcionários de volta
      };

       // Se for funcionário editando (apenas pode alterar completed),
       // garante que apenas o status de completed seja enviado,
       // a menos que outros campos estejam habilitados (o que não é o caso aqui).
       if (this.isUserAndEditing && this.data.uuid) {
            const completedStatus = this.taskForm.get('completed')?.value;
            // Cria um objeto com apenas o uuid e o novo status de completed
            const userUpdate: any = { uuid: this.data.uuid, completed: completedStatus };
            // Opcional: se o funcionário PUDER editar outros campos (regras diferentes), não faça este filtro.
            // Neste cenário, apenas completed é editável, então enviamos só ele.
             this.dialogRef.close(userUpdate as TaskDialogData);

       } else {
           // Gestor ou Adicionando nova tarefa
           this.dialogRef.close(resultData);
       }

    } else {
      this.taskForm.markAllAsTouched();
    }
  }

  onDeleteClick(): void {
     // Apenas gestores podem excluir
     if (this.isManager) {
        this.dialogRef.close({ ...this.data, remove: true });
     }
  }

  dateRangeValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      if (start > end) {
        return { dateRangeInvalid: true };
      }
    }
    return null;
  };

  dateTimeRangeValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const startDateVal = control.get('startDate')?.value;
    const endDateVal = control.get('endDate')?.value;
    const startTimeVal = control.get('startTime')?.value;
    const endTimeVal = control.get('endTime')?.value;

    if (!startDateVal || !endDateVal || !startTimeVal || !endTimeVal ||
        control.get('startTime')?.invalid || control.get('endTime')?.invalid) {
      return null;
    }

    const startDate = new Date(startDateVal);
    const [startHours, startMinutes] = startTimeVal.split(':').map(Number);
    startDate.setHours(startHours, startMinutes, 0, 0);

    const endDate = new Date(endDateVal);
    const [endHours, endMinutes] = endTimeVal.split(':').map(Number);
    endDate.setHours(endHours, endMinutes, 0, 0);

    if (startDate >= endDate) {
      return { timeRangeInvalidForSameDate: true };
    }

    return null;
  };

   // Retorna o nome do funcionário dado o ID (usado para exibir o funcionário atribuído no modo de visualização)
  getUserName(userId: string): string {
      const user = this.users
        .flatMap(group => group.user) // Assuming UserGroup has an 'users' array
        .find(emp => emp.id === userId);
      return user ? user.name : 'Desconhecido';
  }
}