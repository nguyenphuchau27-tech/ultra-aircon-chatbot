import { Injectable } from '@nestjs/common';

@Injectable()
export class AcademyService {
  courses = [
    { name: 'AC Repair Basic', hours: 10 },
    { name: 'Inverter AC Advanced', hours: 20 },
  ];

  getCourses() {
    return this.courses;
  }
}



