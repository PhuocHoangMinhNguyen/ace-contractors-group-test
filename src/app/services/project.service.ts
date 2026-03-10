import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Project } from '../model/project.model';

const BASE_URL = environment.apiUrl + '/projects/';

@Injectable({ providedIn: 'root' })
export class ProjectService {
    private projects: Project[] = [];
    private projectsUpdated = new BehaviorSubject<Project[]>([]);
    private selectedProjectId = new BehaviorSubject<string | null>(null);

    constructor(private http: HttpClient) {}

    getProjects(): void {
        this.http.get<{ message: string; projects: any[] }>(BASE_URL)
            .pipe(map(res => res.projects.map(p => ({ id: p._id, name: p.name, clientId: p.clientId, status: p.status, createdAt: p.createdAt }))))
            .subscribe({
                next: projects => {
                    this.projects = projects;
                    this.projectsUpdated.next([...this.projects]);
                },
                error: err => console.error('Failed to fetch projects:', err)
            });
    }

    getProjectsListener(): Observable<Project[]> {
        return this.projectsUpdated.asObservable();
    }

    getSelectedProjectId(): Observable<string | null> {
        return this.selectedProjectId.asObservable();
    }

    selectProject(id: string | null): void {
        this.selectedProjectId.next(id);
    }

    createProject(name: string, clientId?: string): void {
        const body: any = { name };
        if (clientId) { body.clientId = clientId; }
        this.http.post<{ message: string; projectId: string }>(BASE_URL, body).subscribe({
            next: res => {
                const newProject: Project = { id: res.projectId, name, status: 'draft' };
                if (clientId) { newProject.clientId = clientId; }
                this.projects = [...this.projects, newProject];
                this.projectsUpdated.next([...this.projects]);
                this.selectedProjectId.next(res.projectId);
            },
            error: err => console.error('Failed to create project:', err)
        });
    }

    updateProjectStatus(projectId: string, status: Project['status']): void {
        this.http.patch(BASE_URL + projectId, { status }).subscribe({
            next: () => {
                const idx = this.projects.findIndex(p => p.id === projectId);
                if (idx !== -1) {
                    this.projects = [...this.projects];
                    this.projects[idx] = { ...this.projects[idx], status };
                    this.projectsUpdated.next([...this.projects]);
                }
            },
            error: err => console.error('Failed to update project status:', err)
        });
    }

    deleteProject(projectId: string): void {
        this.http.delete(BASE_URL + projectId).subscribe({
            next: () => {
                this.projects = this.projects.filter(p => p.id !== projectId);
                this.projectsUpdated.next([...this.projects]);
                if (this.selectedProjectId.value === projectId) {
                    this.selectedProjectId.next(null);
                }
            },
            error: err => console.error('Failed to delete project:', err)
        });
    }
}
