import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectScheduleComponent } from './project-schedule.component';

describe('ProjectScheduleComponent', () => {
  let component: ProjectScheduleComponent;
  let fixture: ComponentFixture<ProjectScheduleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectScheduleComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
