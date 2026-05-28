import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuditoryEventsPage } from './auditory-events.page';

describe('AuditoryEventsPage', () => {
  let component: AuditoryEventsPage;
  let fixture: ComponentFixture<AuditoryEventsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AuditoryEventsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
