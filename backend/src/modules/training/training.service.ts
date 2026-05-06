export class TrainingService {
  courses: any[] = [];

  addCourse(name: string) {
    this.courses.push({
      id: Date.now(),
      name,
    });
  }

  getCourses() {
    return this.courses;
  }
}



