import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MatButtonToggle,
  MatButtonToggleGroup,
} from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule, Routes } from '@angular/router';
import { TaskDialogComponent } from '../task-dialog/task-dialog.component';
import { CalendarComponent } from './calendar.component';

const routes: Routes = [{ path: '', component: CalendarComponent }];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    MatButtonModule,
    MatButtonToggleGroup,
    MatButtonToggle,
    MatIconModule,
    DragDropModule,
    TaskDialogComponent,
    RouterModule.forChild(routes),
  ],
})
export class CalendarModule {}
