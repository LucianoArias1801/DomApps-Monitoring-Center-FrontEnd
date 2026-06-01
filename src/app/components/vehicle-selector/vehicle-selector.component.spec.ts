import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VehicleSelectorComponent } from './vehicle-selector.component';

describe('VehicleSelectorComponent', () => {
  let component: VehicleSelectorComponent;
  let fixture: ComponentFixture<VehicleSelectorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [VehicleSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(VehicleSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
