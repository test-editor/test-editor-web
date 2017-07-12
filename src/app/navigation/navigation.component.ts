import { Component, OnInit } from '@angular/core';

import { WorkspaceElement } from './workspace/workspace-element';
import { WorkspaceService } from './workspace/workspace.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.css']
})
export class NavigationComponent implements OnInit {

  workspaceRoot: WorkspaceElement;

  constructor(private workspaceService: WorkspaceService) { }

  ngOnInit() {
    this.workspaceService.listFiles().then(element => this.workspaceRoot = element);
  }

}
