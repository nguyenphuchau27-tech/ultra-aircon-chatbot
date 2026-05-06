import { Controller, Post, Body, Get } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  private readonly service: ReviewsService;

  constructor(service: ReviewsService) {
    this.service = service;
  }

  @Post()
  add(@Body() body: any) {
    return this.service.addReview(body);
  }

  @Get()
  all() {
    return this.service.getReviews();
  }
}



