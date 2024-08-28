import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = 'http://172.16.128.118:8090/rooms/getroomdetails';
  // private apiUrl = 'http://172.16.128.118:8090/rooms/getroomdetails';
  private getapiUrl = 'http://172.16.128.118:8090/rooms/hello';
  private joinCallURL = 'http://172.16.128.118:8090/rooms/joinroom';
  private exitCallURL = 'http://172.16.128.118:8090/rooms/exitroom';




  constructor(private httpClient: HttpClient) { }

  
  videoCallApi(request:any){
    return this.httpClient.post<any>(this.apiUrl, request);
  }
  joinCallApi(request:any){
    return this.httpClient.post<any>(this.joinCallURL, request);
  }
  exitCallApi(request:any){
    return this.httpClient.post<any>(this.exitCallURL, request);
  }
  getConfigData() {
    return this.httpClient.get<any>(this.getapiUrl);
  }
}
