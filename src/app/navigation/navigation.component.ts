import { Component, OnInit } from '@angular/core';

import { WorkspaceElement } from './workspace/workspace-element';
import { WorkspaceService } from './workspace/workspace.service';
import { NavigationServiceComponent } from '../navigation-service/navigation-service.component';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {

  workspaceRoot: WorkspaceElement;

  constructor(private workspaceService: WorkspaceService, private navigationService: NavigationServiceComponent) { }

  ngOnInit() {
    this.workspaceService.listFiles().then(element => {
      this.workspaceRoot = element;
      this.navigationService.emit("loaded files"); });
  }

}
