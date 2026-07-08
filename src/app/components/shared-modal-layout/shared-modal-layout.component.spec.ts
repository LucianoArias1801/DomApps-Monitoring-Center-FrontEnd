import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SharedModalLayoutComponent } from './shared-modal-layout.component';

describe('SharedModalLayoutComponent', () => {
  let component: SharedModalLayoutComponent;
  let fixture: ComponentFixture<SharedModalLayoutComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [SharedModalLayoutComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SharedModalLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
