// Placeholder stub modules — concrete entities/controllers land per-domain in next pass.
import { Controller, Get, Module } from '@nestjs/common';

const make = (path: string) => {
  @Controller(path)
  class C { @Get() list() { return { items: [], path }; } }
  @Module({ controllers: [C] })
  class M {}
  return M;
};

export const UsersModule         = make('users');
export const ProfilesModule      = make('profiles');
export const JobsModule          = make('jobs');
export const ProjectsModule      = make('projects');
export const GigsModule          = make('gigs');
export const ServicesModule      = make('services');
export const OrdersModule        = make('orders');
export const BillingModule       = make('billing');
export const NotificationsModule = make('notifications');
export const MessagingModule     = make('messaging');
export const MediaModule         = make('media');
export const AdminModule         = make('admin');
