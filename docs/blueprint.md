# **App Name**: Nestnic TaskFlow

## Core Features:

- Project Creation: Allow users to create new projects with a unique project ID.
- Task Management: Enable users to add tasks to projects, and move tasks between statuses: 'To Do', 'In Progress', 'Pending', and 'Completed'.
- Collaborator Invitation: Let project owners invite registered users to collaborate on projects using the project ID.
- Role Management: Define access roles within the shared project space (e.g., admin, editor, viewer) and enforce access control per role, so that only designated people are allowed to transition tasks.
- Deadline Notifications: Implement deadline alerts with sound notifications within the app, for approaching and overdue tasks.
- AI Task Suggester: Integrate AI tool that uses natural language processing to suggest relevant subtasks based on the project description and existing tasks, for enhanced workflow efficiency.
- Progress Overview: Visually represent task progress, showing a summary of which tasks are outstanding versus done. Implement display and sorting by due date, assignee, etc.

## Style Guidelines:

- Primary color (Light Mode): HSL-inspired vibrant purple (#A059F5) to represent organization and focus.
- Background color (Light Mode): Light desaturated purple (#F0E9F8) to ensure readability and calm.
- Accent color (Light Mode): HSL-inspired pink (#F5599D) for important actions.
- Primary color (Dark Mode): Jet black background.
- Accent color (Dark Mode): Green accents for focus and contrast.
- Body and headline font: 'Inter', a grotesque-style sans-serif known for a modern, objective, neutral look, suitable for headlines or body text.
- Use clean, minimalist icons to represent different task categories and actions.
- Maintain a clear and intuitive layout with a prominent task board and easy navigation. Implement optional 3D task board using ThreeJS for enhanced visual appeal.
- Incorporate subtle animations (potentially using ThreeJS) to provide visual feedback and enhance user experience, e.g., when transitioning tasks between states.