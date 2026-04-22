import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';

/**
 * Cross-domain calendar / meeting-provider adapter.
 *
 * Used by Domains 13 (agency consultations), 15 (events) and any future
 * domain that needs to issue, reschedule, or cancel a meeting link with
 * timezone-safe propagation. Provider clients are pluggable; the default
 * "internal" provider stamps a deterministic deep-link so the rest of the
 * stack remains testable when no external credential is configured.
 *
 * See mem://tech/no-domain-code-in-supabase: the adapter lives in the
 * codebase, not in Supabase Edge Functions.
 */
@Module({
  providers: [CalendarService],
  exports:   [CalendarService],
})
export class CalendarModule {}
