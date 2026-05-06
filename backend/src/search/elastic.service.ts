export class ElasticService {
  index: any[] = [];

  add(doc: any) {
    this.index.push(doc);
  }

  search(keyword: string) {
    return this.index.filter(d => JSON.stringify(d).includes(keyword));
  }
}



