import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NavigationChannel } from './navigation-channel';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [ ],
  declarations: [ ],
  providers: [
    NavigationChannel
  ]
})
export class NavigationChannelModule { }
