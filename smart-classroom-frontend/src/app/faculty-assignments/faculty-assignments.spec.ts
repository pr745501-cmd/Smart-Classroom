import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultyAssignments } from './faculty-assignments';

describe('FacultyAssignments', () => {
  let component: FacultyAssignments;
  let fixture: ComponentFixture<FacultyAssignments>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyAssignments]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultyAssignments);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
