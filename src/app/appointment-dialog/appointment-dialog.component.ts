import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule, // Necessário se você usar ngModel em algum lugar, mas com ReactiveForms, geralmente não.
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

// Defina a interface AppointmentData aqui para corresponder aos dados recebidos e enviados
export interface AppointmentDialogData {
  uuid: string | null;
  startDate: Date;
  endDate: Date;
  title: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  color?: string;    // Opcional, pois pode ser definido no calendar.component
  remove?: boolean;  // Para a operação de delete
}

@Component({
  selector: 'app-appointment-dialog',
  templateUrl: './appointment-dialog.component.html',
  styleUrls: ['./appointment-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // Pode ser removido se não estiver usando template-driven forms em nenhum lugar deste componente
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
  ],
})
export class AppointmentDialogComponent {
  appointmentForm: FormGroup;

  // Regex para validar o formato HH:mm
  private timePattern = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;

  constructor(
    public dialogRef: MatDialogRef<AppointmentDialogComponent, AppointmentDialogData | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: AppointmentDialogData,
    private formBuilder: FormBuilder
  ) {
    this.appointmentForm = this.formBuilder.group(
      {
        title: [this.data.title || '', Validators.required],
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
      },
      { validators: [this.dateRangeValidator, this.dateTimeRangeValidator] } // Adicionado novo validador combinado
    );
  }

  onNoClick(): void {
    this.dialogRef.close(); // Sem passar dados ou undefined
  }

  onSaveClick(): void {
    if (this.appointmentForm.valid) {
      const formValue = this.appointmentForm.value;
      const resultData: AppointmentDialogData = {
        title: formValue.title,
        startDate: formValue.startDate,
        endDate: formValue.endDate,
        startTime: formValue.startTime,
        endTime: formValue.endTime,
        uuid: this.data.uuid, // Mantém o UUID se estiver editando
        // color não é gerenciado aqui, mas no calendar component ao adicionar/editar
      };
      this.dialogRef.close(resultData);
    } else {
      // Marcar campos como tocados para exibir erros, se necessário
      this.appointmentForm.markAllAsTouched();
    }
  }

  onDeleteClick(): void {
    this.dialogRef.close({ ...this.data, remove: true }); // Passa os dados originais com a flag de remoção
  }

  // Validador para o intervalo de datas (endDate >= startDate)
  dateRangeValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0); // Compara apenas as datas
      end.setHours(0, 0, 0, 0);

      if (start > end) {
        return { dateRangeInvalid: true };
      }
    }
    return null;
  };

  // Validador combinado para data/hora
  dateTimeRangeValidator: ValidatorFn = (
    control: AbstractControl
  ): ValidationErrors | null => {
    const startDateVal = control.get('startDate')?.value;
    const endDateVal = control.get('endDate')?.value;
    const startTimeVal = control.get('startTime')?.value;
    const endTimeVal = control.get('endTime')?.value;

    // Verifica se todos os campos de data e hora estão preenchidos e válidos individualmente
    if (!startDateVal || !endDateVal || !startTimeVal || !endTimeVal ||
        control.get('startTime')?.invalid || control.get('endTime')?.invalid) {
      return null; // Deixa as validações de pattern e required individuais cuidarem disso
    }

    const startDate = new Date(startDateVal);
    const [startHours, startMinutes] = startTimeVal.split(':').map(Number);
    startDate.setHours(startHours, startMinutes, 0, 0);

    const endDate = new Date(endDateVal);
    const [endHours, endMinutes] = endTimeVal.split(':').map(Number);
    endDate.setHours(endHours, endMinutes, 0, 0);

    if (startDate >= endDate) {
      // Se a data/hora de início for maior ou igual à data/hora de término
      return { timeRangeInvalidForSameDate: true }; // Usar uma chave de erro mais genérica ou específica
    }

    return null;
  };
}