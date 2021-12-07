import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ProjectScheduleData } from './project-schedule-data';

@Injectable({
  providedIn: 'root'
})
export class ProjectScheduleService {

  constructor(private httpClient: HttpClient) { }

  getProjectSchedule(): Observable<ProjectScheduleData[]> {
    return this.httpClient.get<any[]>(
      'https://api.json-generator.com/templates/tA6qe81gwwyf/data?access_token=tkctfgez603ctnvcj245l452d1ntfc3kbhydtx3k'
    ).pipe(map((value) => {
      const response: ProjectScheduleData[]
        = value.map((item) => {
          return {
            id: item.id,
            start: new Date(item.start),
            end: new Date(item.end),
            type: item.type
          }
        })
      return response;
    }));
  }
}
