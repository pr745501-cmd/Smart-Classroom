import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostListener, Output, ViewEncapsulation } from '@angular/core';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-emoji-picker',
  standalone: true,
  imports: [PickerComponent],
  templateUrl: './emoji-picker.component.html',
  styleUrls: ['./emoji-picker.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class EmojiPickerComponent {
  @Output() emojiSelected = new EventEmitter<string>();
  @Output() closeRequest = new EventEmitter<void>();

  onSelect(event: any): void {
    this.emojiSelected.emit(event.emoji.native);
    this.cdr.detectChanges();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.contains(event.target)) {
      this.closeRequest.emit();
    }
  }

  constructor(private el: ElementRef, private cdr: ChangeDetectorRef) {}
}
