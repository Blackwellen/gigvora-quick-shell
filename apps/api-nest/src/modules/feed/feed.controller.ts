import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FeedService } from './feed.service';
import { CommentDto, CreatePostDto, FeedQueryDto, ReactionDto, UpdatePostDto } from './dto';

interface AuthedReq { user: { sub: string } }

/** /api/v1/feed — home feed, publishing, engagement, follows, opportunity cards. */
@UseGuards(AuthGuard('jwt'))
@Controller('api/v1/feed')
export class FeedController {
  constructor(private readonly svc: FeedService) {}

  // home feed
  @Get('home')                       home(@Req() r: AuthedReq, @Query() q: FeedQueryDto)              { return this.svc.homeFeed(r.user.sub, q); }

  // posts (publishing)
  @Post('posts')                     create(@Req() r: AuthedReq, @Body() dto: CreatePostDto)          { return this.svc.createPost(r.user.sub, dto); }
  @Get('posts/:id')                  one(@Param('id') id: string)                                     { return this.svc.getPost(id); }
  @Put('posts/:id')                  update(@Req() r: AuthedReq, @Param('id') id: string, @Body() dto: UpdatePostDto) { return this.svc.updatePost(r.user.sub, id, dto); }
  @Delete('posts/:id')               archive(@Req() r: AuthedReq, @Param('id') id: string)            { return this.svc.archivePost(r.user.sub, id); }
  @Get('authors/:id/timeline')       authorTimeline(@Param('id') id: string, @Query('limit') l?: string) { return this.svc.authorTimeline(id, l ? +l : 20); }

  // engagement
  @Post('posts/:id/reactions')       react(@Req() r: AuthedReq, @Param('id') id: string, @Body() dto: ReactionDto) { return this.svc.react(id, r.user.sub, dto); }
  @Delete('posts/:id/reactions')     unreact(@Req() r: AuthedReq, @Param('id') id: string)            { return this.svc.unreact(id, r.user.sub); }
  @Get('posts/:id/comments')         comments(@Param('id') id: string, @Query('limit') l?: string)    { return this.svc.comments(id, l ? +l : 50); }
  @Post('posts/:id/comments')        comment(@Req() r: AuthedReq, @Param('id') id: string, @Body() dto: CommentDto) { return this.svc.comment(id, r.user.sub, dto); }
  @Post('posts/:id/saves')           save(@Req() r: AuthedReq, @Param('id') id: string)               { return this.svc.toggleSave(r.user.sub, id); }
  @Get('saves')                      listSaves(@Req() r: AuthedReq)                                   { return this.svc.listSaves(r.user.sub); }

  // follows
  @Post('follows/:id')               follow(@Req() r: AuthedReq, @Param('id') id: string)             { return this.svc.follow(r.user.sub, id); }
  @Delete('follows/:id')             unfollow(@Req() r: AuthedReq, @Param('id') id: string)           { return this.svc.unfollow(r.user.sub, id); }
  @Get('follows/:id/check')          checkFollow(@Req() r: AuthedReq, @Param('id') id: string)        { return this.svc.isFollowing(r.user.sub, id).then(following => ({ following })); }

  // opportunity cards (right-rail)
  @Get('opportunity-cards')          cards(@Query('kind') kind?: string, @Query('limit') l?: string)  { return this.svc.opportunityCards(kind, l ? +l : 12); }
}
