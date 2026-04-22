import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PodcastsService } from './podcasts.service';
import {
  CreateShowDto, UpdateShowDto, CreateEpisodeDto, UpdateEpisodeDto,
  CreateAlbumDto, UpdateAlbumDto, PurchaseDto, RecordingStartDto, RecordingFinishDto,
} from './dto';

const ACTOR = 'demo_user';

@Controller('api/v1/podcasts')
export class PodcastsController {
  constructor(private readonly svc: PodcastsService) {}

  /* Discovery & shows */
  @Get('discover') discover(@Query() q: any) { return this.svc.rankDiscovery(ACTOR, q); }
  @Get('shows') listShows(@Query() q: any) { return this.svc.listShows(ACTOR, q); }
  @Get('shows/:id') showDetail(@Param('id') id: string) { return this.svc.showDetail(id); }
  @Post('shows') createShow(@Body() dto: CreateShowDto) { return this.svc.createShow(ACTOR, dto); }
  @Patch('shows/:id') updateShow(@Param('id') id: string, @Body() dto: UpdateShowDto) { return this.svc.updateShow(ACTOR, id, dto); }
  @Post('shows/:id/publish') publishShow(@Param('id') id: string) { return this.svc.transitionShow(ACTOR, id, 'active'); }
  @Post('shows/:id/pause') pauseShow(@Param('id') id: string) { return this.svc.transitionShow(ACTOR, id, 'paused'); }
  @Post('shows/:id/archive') archiveShow(@Param('id') id: string) { return this.svc.transitionShow(ACTOR, id, 'archived'); }

  /* Episodes */
  @Get('episodes') listEpisodes(@Query() q: any) { return this.svc.listEpisodes(ACTOR, q); }
  @Get('episodes/:id') episodeDetail(@Param('id') id: string) { return this.svc.episodeDetail(id); }
  @Post('episodes') createEpisode(@Body() dto: CreateEpisodeDto) { return this.svc.createEpisode(ACTOR, dto); }
  @Patch('episodes/:id') updateEpisode(@Param('id') id: string, @Body() dto: UpdateEpisodeDto) { return this.svc.updateEpisode(ACTOR, id, dto); }
  @Post('episodes/:id/publish') publishEp(@Param('id') id: string) { return this.svc.transitionEpisode(ACTOR, id, 'active'); }
  @Post('episodes/:id/pause') pauseEp(@Param('id') id: string) { return this.svc.transitionEpisode(ACTOR, id, 'paused'); }
  @Post('episodes/:id/archive') archiveEp(@Param('id') id: string) { return this.svc.transitionEpisode(ACTOR, id, 'archived'); }
  @Post('episodes/:id/play') play(@Param('id') id: string) { return this.svc.play(id, ACTOR); }
  @Post('episodes/:id/like') like(@Param('id') id: string) { return this.svc.like(id); }
  @Post('episodes/:id/unlike') unlike(@Param('id') id: string) { return this.svc.unlike(id); }
  @Post('episodes/:id/comment') comment(@Param('id') id: string) { return this.svc.comment(id); }

  /* Signed URLs */
  @Post('sign/upload') signUpload(@Body() b: { filename: string; mimeType: string; sizeBytes: number }) { return this.svc.signUpload(ACTOR, b); }
  @Get('sign/download/:episodeId') signDownload(@Param('episodeId') id: string) { return this.svc.signDownload(id); }

  /* Albums */
  @Get('albums') listAlbums(@Query() q: any) { return this.svc.listAlbums(ACTOR, q); }
  @Get('albums/:id') getAlbum(@Param('id') id: string) { return this.svc.getAlbum(id); }
  @Post('albums') createAlbum(@Body() dto: CreateAlbumDto) { return this.svc.createAlbum(ACTOR, dto); }
  @Patch('albums/:id') updateAlbum(@Param('id') id: string, @Body() dto: UpdateAlbumDto) { return this.svc.updateAlbum(ACTOR, id, dto); }
  @Delete('albums/:id') deleteAlbum(@Param('id') id: string) { return this.svc.deleteAlbum(ACTOR, id); }

  /* Library, subs, queue */
  @Get('library') library() { return this.svc.library(ACTOR); }
  @Post('library/subscribe/:showId') subscribe(@Param('showId') id: string) { return this.svc.subscribe(ACTOR, id); }
  @Post('library/unsubscribe/:showId') unsubscribe(@Param('showId') id: string) { return this.svc.unsubscribe(ACTOR, id); }
  @Post('library/favourite/:showId') favourite(@Param('showId') id: string) { return this.svc.favourite(ACTOR, id); }
  @Get('queue') queue() { return this.svc.queue(ACTOR); }
  @Post('queue/:episodeId') enqueue(@Param('episodeId') id: string) { return this.svc.enqueue(ACTOR, id); }
  @Delete('queue/:queueItemId') dequeue(@Param('queueItemId') id: string) { return this.svc.dequeue(ACTOR, id); }
  @Post('queue/reorder') reorder(@Body() b: { ids: string[] }) { return this.svc.reorderQueue(ACTOR, b.ids ?? []); }

  /* Recordings */
  @Get('recordings') recordings() { return this.svc.listRecordings(ACTOR); }
  @Post('recordings/start') startRec(@Body() dto: RecordingStartDto) { return this.svc.startRecording(ACTOR, dto); }
  @Post('recordings/:id/finish') finishRec(@Param('id') id: string, @Body() dto: RecordingFinishDto) { return this.svc.finishRecording(ACTOR, id, dto); }

  /* Purchases — multi-step checkout backend */
  @Get('purchases') purchases() { return this.svc.listPurchases(ACTOR); }
  @Post('purchases') createPurchase(@Body() dto: PurchaseDto) { return this.svc.createPurchase(ACTOR, dto); }
  @Post('purchases/:id/confirm') confirmPurchase(@Param('id') id: string, @Body() b: { providerRef?: string } = {}) { return this.svc.confirmPurchase(ACTOR, id, b.providerRef); }
  @Post('purchases/:id/refund') refundPurchase(@Param('id') id: string) { return this.svc.refundPurchase(ACTOR, id); }

  /* ML + Analytics */
  @Get('insights') insights() { return this.svc.insights(ACTOR); }
  @Get('ml/recommend-next') recommend() { return this.svc.recommendNext(ACTOR); }
}
