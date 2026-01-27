import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentAnnouncements } from './student-announcements';

describe('StudentAnnouncements', () => {
  let component: StudentAnnouncements;
  let fixture: ComponentFixture<StudentAnnouncements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentAnnouncements]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentAnnouncements);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
