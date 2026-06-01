import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecordsViewerPage } from './records-viewer.page';

describe('RecordsViewerPage', () => {
  let component: RecordsViewerPage;
  let fixture: ComponentFixture<RecordsViewerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(RecordsViewerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
