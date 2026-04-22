import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MediaViewerService } from './media-viewer.service';
import {
  CreateMediaDto, UpdateMediaDto, CreateGalleryDto, UpdateGalleryDto, AttachDto,
} from './dto';

const ACTOR = 'demo_user';

@Controller('api/v1/media')
export class MediaViewerController {
  constructor(private readonly svc: MediaViewerService) {}

  /* ── Assets ─── */
  @Get('assets') list(@Query() q: any) { return this.svc.list(ACTOR, q); }
  @Get('assets/:id') detail(@Param('id') id: string) { return this.svc.detail(id); }
  @Post('assets') create(@Body() dto: CreateMediaDto) { return this.svc.create(ACTOR, dto); }
  @Patch('assets/:id') update(@Param('id') id: string, @Body() dto: UpdateMediaDto) { return this.svc.update(ACTOR, id, dto); }
  @Post('assets/:id/archive') archive(@Param('id') id: string) { return this.svc.archive(ACTOR, id); }
  @Post('assets/:id/restore') restore(@Param('id') id: string) { return this.svc.restore(ACTOR, id); }
  @Post('assets/:id/retry') retry(@Param('id') id: string) { return this.svc.retryProcessing(ACTOR, id); }

  @Post('assets/:id/view') view(@Param('id') id: string) { return this.svc.view(id); }
  @Post('assets/:id/like') like(@Param('id') id: string) { return this.svc.like(id); }
  @Post('assets/:id/unlike') unlike(@Param('id') id: string) { return this.svc.unlike(id); }

  /* ── Signed URLs ─── */
  @Post('sign/upload') signUpload(@Body() dto: CreateMediaDto) { return this.svc.signUpload(ACTOR, dto); }
  @Get('sign/download/:id') signDownload(@Param('id') id: string) {
    const sig = this.svc.signDownload(id);
    this.svc.download(id);
    return sig;
  }

  /* ── Galleries ─── */
  @Get('galleries') galleries(@Query() q: any) { return this.svc.listGalleries(ACTOR, q); }
  @Get('galleries/:id') galleryDetail(@Param('id') id: string) { return this.svc.getGallery(id); }
  @Get('public/galleries/:slug') publicGallery(@Param('slug') slug: string) { return this.svc.publicGallery(slug); }
  @Post('galleries') createGallery(@Body() dto: CreateGalleryDto) { return this.svc.createGallery(ACTOR, dto); }
  @Patch('galleries/:id') updateGallery(@Param('id') id: string, @Body() dto: UpdateGalleryDto) { return this.svc.updateGallery(ACTOR, id, dto); }
  @Delete('galleries/:id') deleteGallery(@Param('id') id: string) { return this.svc.deleteGallery(ACTOR, id); }

  /* ── Attachments ─── */
  @Get('attachments') attachments(@Query() q: any) { return this.svc.listAttachments(q); }
  @Post('attachments') attach(@Body() dto: AttachDto) { return this.svc.attach(ACTOR, dto); }
  @Delete('attachments/:id') detach(@Param('id') id: string) { return this.svc.detach(ACTOR, id); }
  @Post('attachments/:id/pin') pin(@Param('id') id: string) { return this.svc.setPinned(ACTOR, id, true); }
  @Post('attachments/:id/unpin') unpin(@Param('id') id: string) { return this.svc.setPinned(ACTOR, id, false); }

  /* ── Insights & ML ─── */
  @Get('insights') insights() { return this.svc.insights(ACTOR); }
  @Post('ml/score-quality') scoreQuality(@Body() b: { assetId: string; bitrateKbps?: number }) { return this.svc.scoreQuality(b); }
  @Get('ml/rank-gallery/:id') rankGallery(@Param('id') id: string) { return this.svc.rankGallery(id); }
  @Get('ml/moderation-hint/:id') moderationHint(@Param('id') id: string) { return this.svc.moderationHint(id); }
}
