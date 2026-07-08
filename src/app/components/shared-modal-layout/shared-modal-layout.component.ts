import { Component, Input, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { closeCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-shared-modal-layout',
  templateUrl: './shared-modal-layout.component.html',
  styleUrls: ['./shared-modal-layout.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
  // ✨ LA MAGIA: Apagamos la encapsulación para que el componente se auto-estire
  encapsulation: ViewEncapsulation.None 
})
export class SharedModalLayoutComponent {
  @Input() title: string = 'Modal';
  @Input() subtitle?: string;
  @Input() showFooter: boolean = true;

  constructor(private modalCtrl: ModalController) {
    addIcons({ closeCircleOutline });
  }

  public close() {
    this.modalCtrl.dismiss();
  }
}