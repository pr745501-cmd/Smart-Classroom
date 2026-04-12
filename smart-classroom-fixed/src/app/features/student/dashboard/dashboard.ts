import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LiveClassService } from '../../../core/services/live-class.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit, OnDestroy {

  user: { name: string; email: string; role: string; course: string; profilePic?: string; year?: string; semester?: number; avatarUrl?: string } = {
    name: '', email: '', role: '', course: '', profilePic: ''
  };

  // Common female names for gender detection
  private femaleNames = ['riya','priya','nikita','neha','pooja','anjali','kavya','shreya','divya','ananya','isha','nisha','meera','sonal','komal','swati','deepa','rekha','sunita','geeta','lata','usha','asha','maya','sita','radha','puja','ritu','mona','tina','nina','rina','seema','reena','veena','leena','heena','meena','teena','sheena','preeti','preety','preety','jyoti','jyotsna','pallavi','madhuri','manisha','namita','namrata','smita','sunita','savita','kavita','lalita','mamta','shweta','shwetha','sweta','sweta','amrita','amruta','archana','archita','aruna','arushi','avni','bhavna','charu','chhaya','deepika','disha','esha','garima','gayatri','harsha','hemal','hema','himani','indira','ishita','jhanvi','juhi','kalpana','kamla','kanchan','karuna','khushi','kirti','kriti','kritika','kumari','laxmi','madhavi','malini','mansi','manya','megha','minal','mitali','monika','mukta','nalini','nandini','nandita','nidhi','nisha','nita','nitu','parvati','payal','pinki','poonam','prachi','pragati','pragya','pratibha','pratima','prerna','priyanka','rachna','radha','radhika','rajni','rakhi','rani','rashmi','renu','rima','ritu','rohini','rupal','rupali','sadhana','sagarika','sakshi','saloni','sandhya','sangita','sanjana','sapna','sarita','sarla','shalini','shanti','sharda','shikha','shilpa','shobha','shraddha','shruti','shubha','shweta','simran','sneha','sonam','sonia','sonu','subha','sudha','sujata','sukanya','sulekha','sumita','sunanda','supriya','surbhi','sushma','swapna','tanvi','taruna','trupti','tulsi','urvashi','vandana','varsha','vasudha','vidya','vimla','vinita','vipula','vrinda','yamini','yashoda','zara','zoya'];

  getAvatarUrl(name: string): string {
    const firstName = (name || '').split(' ')[0].toLowerCase().trim();
    const isFemale = this.femaleNames.includes(firstName);
    if (isFemale) {
      return 'https://cdn-icons-png.flaticon.com/512/6997/6997662.png';
    }
    return 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
  }

  stats = { subjects: 0, pending: 0, attendance: 0 };
  statsLoading = true;
  loading = true;

  activeMeeting: any = null;
  showMeetingBanner = false;

  constructor(
    private router: Router,
    private cd: ChangeDetectorRef,
    private live: LiveClassService,
    private dashboardService: DashboardService,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) { this.router.navigate(['/login']); return; }

    const parsed = JSON.parse(storedUser);
    this.user.name     = parsed.name;
    this.user.email    = parsed.email || 'N/A';
    this.user.role     = parsed.role;
    this.user.course   = parsed.course || 'BCA';
    this.user.profilePic = parsed.profilePic || '';
    this.user.year     = parsed.year;
    this.user.semester = parsed.semester;

    this.loading = false;
    this.cd.detectChanges();

    // Fetch real stats from backend
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.statsLoading = false;
        this.cd.detectChanges();
      },
      error: () => {
        this.statsLoading = false;
        this.cd.detectChanges();
      }
    });

    // Check for active meeting on load
    this.live.getLiveClass().subscribe({
      next: (res: any) => {
        if (res && res.isLive) {
          this.activeMeeting = res;
          this.showMeetingBanner = true;
          this.cd.detectChanges();
        }
      },
      error: () => {}
    });

    // Real-time meeting notifications via Socket.io
    this.socketService.onMeetingStarted((data: any) => {
      this.activeMeeting = data;
      this.showMeetingBanner = true;
      const audio = new Audio('notify.mp3');
      audio.play().catch(() => {});
      this.cd.detectChanges();
    });

    this.socketService.onMeetingEnded(() => {
      this.activeMeeting = null;
      this.showMeetingBanner = false;
      this.cd.detectChanges();
    });
  }

  ngOnDestroy() {
    this.socketService.offEvent('meetingStarted');
    this.socketService.offEvent('meetingEnded');
  }

  dismissBanner() {
    this.showMeetingBanner = false;
  }

  joinMeeting() {
    this.router.navigate(['/student/live']);
  }

  logout() { localStorage.clear(); this.router.navigate(['/login']); }

  goToLectures()      { this.router.navigate(['/lectures']); }
  goToAssignments()   { this.router.navigate(['/student/assignments']); }
  goToAnnouncements() { this.router.navigate(['/student/announcements']); }
  goToAttendance()    { this.router.navigate(['/student/attendance']); }
  goToLive()          { this.router.navigate(['/student/live']); }
  goToMessages()      { this.router.navigate(['/dm']); }
}
