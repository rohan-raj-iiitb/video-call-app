import { Component, OnInit } from '@angular/core';
import { ApiService } from '../api.service';
import { ActivatedRoute } from '@angular/router';

declare var JitsiMeetExternalAPI: any;

@Component({
  selector: 'app-video-call',
  templateUrl: './video-call.component.html',
  styleUrls: ['./video-call.component.css']
})
export class VideoCallComponent implements OnInit {

  code: string | null = null;
  roomName: any;
  isIframeVisible: boolean = false;
  videoCallUrl: string | null = null;
  jitsiApi: any;
  domain = 'jitsiehrc.publicvm.com';
  options = { roomName: 'testvaluewhichgetsoverwridden', jwt: 'testvaluewhichgetsoverwridden' };
  roomCode: string;
  loaderElement: HTMLElement | null = null;

  constructor(
    private generalService: ApiService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Extract the code from the URL query parameter
    this.route.queryParamMap.subscribe(params => {
      this.code = params.get('code');
      console.log('Received code:', this.code);
    });
    document.getElementById('call-ended').classList.add('hidden');
    window.addEventListener('offline', this.handleOffline.bind(this));
    window.addEventListener('online', this.handleOnline.bind(this));
  }

  startCall() {
    document.getElementById('initialContent').classList.add('hidden');
    this.handleJoinCall();
  }

  handleJoinCall(): void {
    this.roomCode = this.code;
    const request = { isMHP: 0, roomShortCode: this.roomCode };
    console.log("options value check 1", this.options);

    this.generalService.videoCallApi(request).subscribe({
      next: (response: any) => {
        console.log('API call successful, response:', response);
        this.videoCallUrl = response.jwtURL;
        this.roomName = response.roomID;
        this.options = { roomName: response.roomID, jwt: response.jwtToken };
        console.log("options value check 2", this.options);
        this.initiateVC();
      },
      error: (error: any) => {
        console.error("API call failed:", error);
      }
    });
    this.generalService.joinCallApi(request).subscribe({
      next: (response: any) => {
        console.log('Join API call', response);
      },
      error: (error: any) => {
        console.error("API call failed:", error);
      }
    });
  }

  initiateVC(): void {
    if (!this.videoCallUrl) {
      console.error("Video call URL is not available");
      return;
    }
    console.log("Initiating video call with URL:", this.videoCallUrl);

    const container = document.getElementById('floating-iframe-container') as HTMLDivElement;

    if (container) {
      container.classList.remove('hidden');

      const jitsiOptions = {
        roomName: this.options.roomName,
        parentNode: container,
        configOverwrite: {},
        interfaceConfigOverwrite: {},
        jwt: this.options.jwt
      };

      this.jitsiApi = new JitsiMeetExternalAPI(this.domain, jitsiOptions);
      console.log("Jitsi API initialized with options:", this.domain, jitsiOptions);

      // Event listeners
      this.jitsiApi.addEventListener('readyToClose', () => this.closeIframe());
      this.jitsiApi.addEventListener('participantLeft', () => this.handleParticipantLeft());
      this.jitsiApi.addEventListener('videoConferenceLeft', () => this.handleConferenceLeft());
      this.jitsiApi.addEventListener('audioMuteStatusChanged', () => this.audioAvailable());
      this.jitsiApi.addEventListener('isAudioAvailable', () => this.audiounAvailable());
      this.jitsiApi.addEventListener('errorOccurred', (error: any) => this.handleError(error));

      this.isIframeVisible = true;
    } else {
      console.error("Failed to find container");
    }
  }

  handleError(error: any): void {
    console.error('An error occurred:', error);
    if (error.code === 'connection.droppedError') {
      console.log('The connection was dropped.');
    } else if (error.code === 'connection.passwordRequired') {
      console.log('Password required to join the room.');
    } else if (error.code === 'not.allowed') {
      console.log('Permissions issue, user not allowed to join.');
    }
    // Additional error handling logic can be added here
  }

  handleParticipantLeft(): void {
    console.log("Participant left the meeting.");
    this.closeIframe();
  }

  audioAvailable(): void {
    console.log("Audio is available");
  }

  audiounAvailable(): void {
    console.log("Audio is not available");
  }

  handleConferenceLeft(): void {
    console.log("Conference ended.");
    this.closeIframe();
  }

  closeIframe(): void {
    if (this.jitsiApi) {
      this.jitsiApi.dispose();
    }
    const container = document.getElementById('floating-iframe-container') as HTMLDivElement;

    if (container) {
      container.classList.add('hidden');
      this.isIframeVisible = false;
    }
    const request = { isMHP: 0, roomShortCode: this.roomCode };
    this.generalService.exitCallApi(request).subscribe({
      next: (response: any) => {
        console.log('Exit API call', response);
      },
      error: (error: any) => {
        console.error("API call failed:", error);
      }
    });
    document.getElementById('call-ended').classList.remove('hidden');
  }

  handleOffline(): void {
    console.log("Network connection lost. Showing loader...");
    this.showLoader();
    this.jitsiApi.executeCommand('hangup');
  }

  handleOnline(): void {
    console.log("Network connection restored. Rejoining meeting...");
    this.hideLoader();
    this.rejoinMeeting();
  }

  showLoader(): void {
    if (!this.loaderElement) {
      this.loaderElement = document.createElement('div');
      this.loaderElement.id = 'jitsi-loader';
      this.loaderElement.style.position = 'absolute';
      this.loaderElement.style.top = '50%';
      this.loaderElement.style.left = '50%';
      this.loaderElement.style.transform = 'translate(-50%, -50%)';
      this.loaderElement.style.zIndex = '1000';
      this.loaderElement.innerText = 'Reconnecting...';
      document.getElementById('call-ended').classList.add('hidden');
      document.getElementById('video-call-container').appendChild(this.loaderElement);
    }
  }

  hideLoader(): void {
    if (this.loaderElement) {
      this.loaderElement.remove();
      this.loaderElement = null;
    }
  }

  rejoinMeeting(): void {
    if (this.jitsiApi) {
      this.jitsiApi.dispose(); // Dispose of the previous instance
    }

    // Reinitialize the Jitsi API with the same options
    this.initiateVC();
  }
}
