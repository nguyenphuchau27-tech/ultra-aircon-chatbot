import { Injectable } from '@nestjs/common';

@Injectable()
export class TechnicianNetworkService {
  posts = [];

  createPost(techId: number, content: string) {
    const post = {
      techId,
      content,
      likes: 0,
      created: Date.now(),
    };

    this.posts.push(post);

    return post;
  }

  like(index: number) {
    this.posts[index].likes++;

    return this.posts[index];
  }
}



