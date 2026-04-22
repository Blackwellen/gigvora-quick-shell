import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Image, Video, MapPin, Globe, Users, Clock, Settings } from 'lucide-react';

export default function EventCreatePage() {
  const [format, setFormat] = useState('virtual');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <Plus className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold">Create Event</h1>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[10px]">Save Draft</Button>
          <Button size="sm" className="h-7 text-[10px]">Publish Event</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="Event Details">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-medium block mb-1">Event Title</label>
                <Input placeholder="Enter event title..." className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-[10px] font-medium block mb-1">Description</label>
                <Textarea placeholder="Describe your event..." className="min-h-[120px] text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium block mb-1">Date</label>
                  <Input type="date" className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] font-medium block mb-1">Time</label>
                  <Input type="time" className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium block mb-1">Format</label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virtual">Virtual</SelectItem>
                      <SelectItem value="in-person">In Person</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[10px] font-medium block mb-1">Max Attendees</label>
                  <Input type="number" placeholder="100" className="h-9 text-sm" />
                </div>
              </div>
              {format !== 'virtual' && (
                <div>
                  <label className="text-[10px] font-medium block mb-1">Location</label>
                  <Input placeholder="Enter venue address..." className="h-9 text-sm" />
                </div>
              )}
              <div>
                <label className="text-[10px] font-medium block mb-1">Tags</label>
                <Input placeholder="Add tags separated by commas..." className="h-9 text-sm" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Cover Image">
            <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center cursor-pointer hover:border-accent/30 transition-colors">
              <Image className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-[10px] text-muted-foreground">Drop an image or click to upload</p>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Settings" icon={<Settings className="h-3 w-3 text-muted-foreground" />}>
            <div className="space-y-3 text-[10px]">
              <label className="flex items-center justify-between cursor-pointer">
                <span>Require approval</span>
                <input type="checkbox" className="accent-accent" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>Enable waitlist</span>
                <input type="checkbox" className="accent-accent" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>Allow recording</span>
                <input type="checkbox" defaultChecked className="accent-accent" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>Enable chat</span>
                <input type="checkbox" defaultChecked className="accent-accent" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span>Send reminders</span>
                <input type="checkbox" defaultChecked className="accent-accent" />
              </label>
            </div>
          </SectionCard>

          <SectionCard title="Event Type">
            <div className="space-y-1.5">
              {['Conference', 'Workshop', 'Webinar', 'Meetup', 'Roundtable', 'Networking'].map(t => (
                <label key={t} className="flex items-center gap-2 text-[10px] cursor-pointer p-1.5 rounded-lg hover:bg-accent/5">
                  <input type="radio" name="type" className="accent-accent" />
                  <span>{t}</span>
                </label>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
