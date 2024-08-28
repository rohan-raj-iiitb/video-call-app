import { Component } from '@angular/core';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Patient video call app';
  postData: string = '';

  constructor(private apiService: ApiService) { }

  onSubmit() {
    this.apiService.videoCallApi({ data: this.postData }).subscribe(response => {
      console.log('POST response:', response);
    });
  }
}
