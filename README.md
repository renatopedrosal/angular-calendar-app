# Angular Calendar Application

This is a simple calendar application built using Angular, Angular Material, and Angular CDK. The application allows users to manage tasks through a calendar interface.

![Month View](/screenshots/1.png?raw=true "Month View")
![Week View](/screenshots/2.png?raw=true "Week View")
![Day View](/screenshots/3.png?raw=true "Day View")
![Add Task](/screenshots/4.png?raw=true "Add Task")
![Edit Task](/screenshots/5.png?raw=true "Edit Task")


## Features
- **Add Task Form**: Allows users to add new tasks with date and description.
- **Delete Task**: Provides functionality to delete existing tasks.
- **Move Task**: Implements drag-and-drop functionality using Angular CDK to move tasks between dates.
- **Calendar View**: Renders a monthly, weekly and day calendar view with highlighted dates containing tasks.
- **Form Validation**: Utilizes Angular forms with validators for ensuring data integrity.

## Technologies Used
- **Angular**: Frontend framework for building single-page applications with [Angular CLI](https://github.com/angular/angular-cli) version 18.0.3.
- **Angular Material**: UI component library for Angular applications.
- **Angular CDK**: Provides tools to implement common interaction patterns (like drag-and-drop).

## Usage
- **Adding an Task**: Click on a date to open the add task form, fill in the details, and submit.
- **Deleting an Task**: Click on the delete icon next to an task to remove it.
- **Moving an Task**: Drag an task to another date to reschedule it.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Linting
Linting ensures that the codebase follows consistent coding styles and practices. This project uses ESLint for TypeScript linting with Angular-specific configurations.

```bash
ng lint
```