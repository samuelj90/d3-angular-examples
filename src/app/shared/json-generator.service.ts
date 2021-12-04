import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable()
export class JsonGeneratorService {
  constructor(private http: HttpClient) {}

  getProjectSchedule() {
    return this.http.get(
      'https://api.json-generator.com/templates/tA6qe81gwwyf/data?access_token=tkctfgez603ctnvcj245l452d1ntfc3kbhydtx3k'
    );
  }
}
