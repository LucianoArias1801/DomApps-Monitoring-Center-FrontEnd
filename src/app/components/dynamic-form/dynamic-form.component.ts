import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

// 1. Importamos nuestros servicios y modelos
import { DynamicFormsService } from '../../services/dynamic-forms/dynamic-forms';
import { FormField, FormStructureResponse, FormSubmitPayload, FormAnswerPayload } from '../../models/dynamic-forms.model';

// 2. Importamos el Dumb Component que creamos en la Fase 4
import { CustomSelectComponent } from '../custom-select/custom-select.component';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, CustomSelectComponent],
  templateUrl: './dynamic-form.component.html',
  styleUrls: ['./dynamic-form.component.scss']
})
export class DynamicFormComponent implements OnInit {

  // ==========================================================================
  // COMUNICACIÓN CON EL COMPONENTE PADRE
  // ==========================================================================
  
  // Recibe el ID del formulario (Ej: 1 para Auditoría, 2 para Alertas)
  @Input() templateId!: number;

  //Recibe una lista de nombres de campos que no deben dibujarse en pantalla
  @Input() hiddenFields: string[] = [];
  
  // Emite el Payload perfecto y estructurado hacia el padre para que lo guarde
  @Output() formReadyToSubmit = new EventEmitter<FormSubmitPayload>();

  // ==========================================================================
  // ESTADO INTERNO
  // ==========================================================================
  public dynamicFormGroup!: FormGroup; // <-- Esta es la variable real del formulario 
  public formStructure!: FormStructureResponse;
  public isLoading: boolean = true;

  constructor(
    private fb: FormBuilder,
    private dynamicFormsService: DynamicFormsService
  ) {}

  ngOnInit() {
    if (!this.templateId) {
      console.error('❌ DynamicFormComponent requiere un templateId para funcionar');
      return;
    }
    this.loadStructureFromDatabase();
  }

  /**
   * Paso A: Preguntar al backend cómo es el formulario
   */
  private loadStructureFromDatabase() {
    this.isLoading = true;
    this.dynamicFormsService.getFormStructure(this.templateId).subscribe({
      next: (response: FormStructureResponse) => { 
        this.formStructure = response;
        this.buildReactiveForm(response.fields);
        this.isLoading = false;
      },
      error: (err: any) => { 
        console.error('❌ Error al cargar la estructura del formulario', err);
        this.isLoading = false;
      }
    });
  }

  /**
   * Paso B: Construir el FormGroup de Angular basado en las preguntas
   */
  private buildReactiveForm(fields: FormField[]) {
    const groupControls: any = {};

    groupControls['general_comments'] = ['']; 
    
    const nowISO = new Date().toISOString().slice(0, 19).replace('T', ' ');
    groupControls['record_datetime'] = [nowISO, Validators.required];

    fields.forEach(field => {
      const validators = [];
      
      if (field.required) {
        validators.push(Validators.required);
      }

      groupControls[`field_${field.id}`] = ['', validators]; // Los controles se llaman field_ID 
      
      groupControls[`comment_${field.id}`] = [''];
    });

    this.dynamicFormGroup = this.fb.group(groupControls);
    console.log('✅ Formulario Reactivo creado en memoria:', this.dynamicFormGroup.controls);
  }

  /**
   * Paso C: Transformar el formulario de Angular al JSON estricto del Backend (XOR Rule)
   */
  public prepareSubmit() {
    if (this.dynamicFormGroup.invalid) {
      this.dynamicFormGroup.markAllAsTouched();
      return;
    }

    const formValues = this.dynamicFormGroup.value;
    const answersArray: FormAnswerPayload[] = [];

    this.formStructure.fields.forEach(field => {
      const rawValue = formValues[`field_${field.id}`];
      const commentValue = formValues[`comment_${field.id}`];

      if (rawValue !== null && rawValue !== '') {
        const answerPayload: FormAnswerPayload = {
          fieldName: field.fieldName,
          fieldId: field.id, 
          comments: commentValue ? String(commentValue) : undefined
        };

        if (field.type === 'SELECT') {
          answerPayload.option_id = Number(rawValue); 
        } else if (field.type === 'MULTI_SELECT') {
          answerPayload.answer = Array.isArray(rawValue) ? rawValue.map(Number) : [Number(rawValue)];
        } else {
          answerPayload.answer = String(rawValue);
        }

        answersArray.push(answerPayload);
      }
    });

    const finalPayload: FormSubmitPayload = {
      templateID: this.templateId,
      recordDatetime: formValues['record_datetime'],
      comments: formValues['general_comments'] ? String(formValues['general_comments']) : undefined,
      answers: answersArray
    };

    console.log('📦 Payload dinámico generado y listo para enviar:', finalPayload);
    
    this.formReadyToSubmit.emit(finalPayload);
  }

  /**
   * Permite que el selector inyecte los datos directamente al formulario
   */
  public patchFormValues(values: Record<string, any>) {
    if (!this.dynamicFormGroup || !this.formStructure) return; 
    
    // Iteramos sobre las llaves en texto ("ECO", "MATRICULA") que nos manda el selector
    Object.keys(values).forEach(key => {
      // 1. Buscamos en la estructura qué ID le corresponde a esa pregunta
      const targetField = this.formStructure.fields.find(
        f => f.fieldName.toUpperCase().trim() === key.toUpperCase().trim()
      );

      // 2. Si existe la pregunta en este formulario, construimos su nombre real (ej. "field_5")
      if (targetField) {
        const controlName = `field_${targetField.id}`;
        const control = this.dynamicFormGroup.get(controlName); 
        
        // 3. Inyectamos el valor
        if (control) {
          control.patchValue(values[key]);
        }
      }
    });
  }
}