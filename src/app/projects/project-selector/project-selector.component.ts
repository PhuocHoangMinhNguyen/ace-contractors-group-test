import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ProjectService } from '../../services/project.service';
import { BodyService } from '../../services/body.service';
import { Project } from '../../model/project.model';
import { environment } from '../../../environments/environment';

@Component({
    standalone: false,
    selector: 'app-project-selector',
    templateUrl: './project-selector.component.html',
    styleUrls: ['./project-selector.component.css']
})
export class ProjectSelectorComponent implements OnInit, OnDestroy {
    projects: Project[] = [];
    selectedProjectId: string | null = null;
    newProjectName: string = '';
    showCreateForm: boolean = false;

    statusColors: Record<Project['status'], string> = {
        draft: '#9e9e9e',
        sent: '#2196f3',
        approved: '#4caf50',
        paid: '#8bc34a'
    };

    statusIcons: Record<Project['status'], string> = {
        draft: 'edit_note',
        sent: 'send',
        approved: 'check_circle',
        paid: 'paid'
    };

    private sub: Subscription;
    private selectedSub: Subscription;

    constructor(
        private projectService: ProjectService,
        private bodyService: BodyService
    ) {}

    ngOnInit() {
        this.projectService.getProjects();
        this.sub = this.projectService.getProjectsListener().subscribe(projects => {
            this.projects = projects;
        });
        this.selectedSub = this.projectService.getSelectedProjectId().subscribe(id => {
            this.selectedProjectId = id;
            // Reload lines whenever selected project changes
            this.bodyService.getLines(id ? { projectId: id } : undefined);
        });
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
        this.selectedSub?.unsubscribe();
    }

    onProjectChange(id: string | null) {
        this.projectService.selectProject(id);
    }

    onCreateProject() {
        if (this.newProjectName.trim()) {
            this.projectService.createProject(this.newProjectName.trim());
            this.newProjectName = '';
            this.showCreateForm = false;
        }
    }

    onDeleteProject(project: Project, event: Event) {
        event.stopPropagation();
        if (confirm(`Delete project "${project.name}" and all its lines?`)) {
            this.projectService.deleteProject(project.id);
        }
    }

    getStatusLabel(status: Project['status']): string {
        return { draft: 'Draft', sent: 'Sent', approved: 'Approved', paid: 'Paid' }[status];
    }

    onUpdateStatus(project: Project, status: Project['status'], event: Event) {
        event.stopPropagation();
        this.projectService.updateProjectStatus(project.id, status);
    }

    downloadPdf(project: Project, event: Event) {
        event.stopPropagation();
        window.open(environment.apiUrl + '/projects/' + project.id + '/invoice.pdf', '_blank');
    }
}
