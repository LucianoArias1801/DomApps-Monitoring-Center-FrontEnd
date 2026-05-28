import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MonitoringEventsPage } from './monitoring-events.page';

describe('MonitoringEventsPage', () => {
  let component: MonitoringEventsPage;
  let fixture: ComponentFixture<MonitoringEventsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(MonitoringEventsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
