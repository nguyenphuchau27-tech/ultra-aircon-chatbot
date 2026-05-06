import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewsService {
  private reviews = [];

  addReview(data: any) {
    this.reviews.push(data);

    return {
      success: true,
    };
  }

  getReviews() {
    return this.reviews;
  }
}



