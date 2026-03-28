import { Directive, ElementRef, Input, OnChanges } from '@angular/core';

@Directive({
  selector: '[appSetStream]',
  standalone: true
})
export class SetStreamDirective implements OnChanges {
  @Input() stream: MediaStream | undefined;

  constructor(private el: ElementRef<HTMLVideoElement>) {}

  ngOnChanges(): void {
    const video = this.el.nativeElement;
    if (this.stream && video.srcObject !== this.stream) {
      video.srcObject = this.stream;
      video.muted = false;
      video.play().catch(() => {});
    }
  }
}
