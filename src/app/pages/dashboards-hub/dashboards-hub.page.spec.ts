import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardsHubPage } from './dashboards-hub.page';

describe('DashboardsHubPage', () => {
  let component: DashboardsHubPage;
  let fixture: ComponentFixture<DashboardsHubPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardsHubPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
