export default function ProjectCard({ project }) {
    return (
        <a
            className="project-card"
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
        >
            {project.imageUrl ? (
                <img src={project.imageUrl} alt={project.title} className="project-image" />
            ) : (
                <div className="project-icon">🌐</div>
            )}
            <h3>{project.title}</h3>
            {project.description && <p>{project.description}</p>}
            <span className="project-tag">開啟</span>
        </a>
    );
}
