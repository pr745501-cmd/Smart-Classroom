import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FacultyAnnounccements } from './faculty-announccements';

describe('FacultyAnnounccements', () => {
  let component: FacultyAnnounccements;
  let fixture: ComponentFixture<FacultyAnnounccements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FacultyAnnounccements]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FacultyAnnounccements);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
