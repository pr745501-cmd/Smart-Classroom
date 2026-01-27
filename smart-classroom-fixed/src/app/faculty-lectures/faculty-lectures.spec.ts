import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultyLectures } from './faculty-lectures';

describe('FacultyLectures', () => {
  let component: FacultyLectures;
  let fixture: ComponentFixture<FacultyLectures>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyLectures]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultyLectures);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
