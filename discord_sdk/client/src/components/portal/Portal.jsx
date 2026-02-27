import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../utils/api';
import ProjectCard from './ProjectCard';
import logo from '../../assets/Tiger228_code.jpg';

const DEFAULT_PROJECTS = [];

export default function Portal({ userId, onSelectIQ }) {
    const [projects, setProjects] = useState([]);

    useEffect(() => {
        loadProjects();
    }, []);

    async function loadProjects() {
        try {
            const data = await api.getProjects();
            setProjects([...DEFAULT_PROJECTS, ...data]);
        } catch {
            setProjects(DEFAULT_PROJECTS);
        }
    }

    return (
        <div className="portal-container">
            <motion.header
                className="portal-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="portal-title">
                    <img src={logo} alt="TYH Studio" className="title-logo" />
                    TYH Studio
                </h1>
                <p className="portal-subtitle">Projects by Tiger228</p>
            </motion.header>

            <div className="portal-grid">
                {projects.map((project, i) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <ProjectCard project={project} />
                    </motion.div>
                ))}

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: projects.length * 0.1 }}
                >
                    <div className="project-card iq-card" onClick={onSelectIQ}>
                        <div className="project-icon">🧠</div>
                        <h3>IQ 排名系統</h3>
                        <p>每月 IQ 排名投票</p>
                        <span className="project-tag">進入</span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
