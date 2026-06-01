// ==========================================================================
// MODELOS PARA EL SISTEMA DE FORMULARIOS DINÁMICOS (PATRÓN EAV - ACTUALIZADO V2)
// ==========================================================================

/**
 * Representa una plantilla de formulario en la base de datos (ej. Monitoreo, Auditorías).
 * Mapea la tabla: format_templates
 */
export interface FormTemplate {
  id: number;
  name: string;
  description: string;
}

/**
 * Estructura relacional para las opciones de preguntas de tipo SELECT o MULTI_SELECT.
 * Según los cambios críticos del backend, las opciones ya no viajan como textos planos,
 * sino como un objeto con identificador único.
 */
export interface FormFieldOption {
  id: number;
  text: string;
}

/**
 * Representa la estructura de una pregunta/campo generada por el backend.
 * Adaptado para soportar el formato relacional estricto de opciones y el tipo NUMBER.
 */
export interface FormField {
  id: number;
  order: number;
  fieldName: string;
  type: 'TEXT' | 'DATETIME' | 'SELECT' | 'MULTI_SELECT' | 'NUMBER'; // Incluido tipo NUMBER
  required: boolean;
  options: FormFieldOption[] | null; // Cambiado de string[] a FormFieldOption[] por regla relacional
}

/**
 * Representa el esqueleto del JSON que te devuelve el endpoint GET /forms/:id/structure
 */
export interface FormStructureResponse {
  templateName: string;
  fields: FormField[];
}

/**
 * Representa una fila individual en la tabla maestra del frontend.
 * Mapea de forma dinámica la combinación EAV para renderizar las celdas sin hardcodear.
 */
export interface FormRecord {
  recordId: number;
  recordDatetime: string;
  // Diccionario dinámico donde la llave es el nombre de la pregunta y el valor es la respuesta
  answers: Record<string, string>; 
}

/**
 * Representa la estructura exacta del Payload exigida por el endpoint POST /api/forms/submit
 * Cumple con las reglas del motor relacional estricto del Backend.
 */
export interface FormSubmitPayload {
  templateID: number;
  recordDatetime: string;
  comments?: string; // Comentario general opcional de toda la cabecera del formulario
  answers: FormAnswerPayload[];
}

/**
 * Representa una respuesta individual por campo siguiendo la regla de exclusión mutua (XOR).
 */
export interface FormAnswerPayload {
  fieldId?: number;          // Exigido estrictamente para el PUT (Actualizar)
  fieldName?: string;        // Exigido estrictamente para el POST (Guardar)
  answer?: string | number[];// Texto plano, número o arreglo de IDs numéricos
  option_id?: number;        // ID de la opción seleccionada si es SELECT
  comments?: string;         // Notas u observaciones por campo individual
}