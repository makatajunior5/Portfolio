import { useEffect, useState } from "react";
import "./App.css";
import AdminDashboard from "./AdminDashboard";
import "./AdminDashboard.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function Section({ title, id, delay = 0, children }) {
  return (
    <section className="section reveal" id={id} style={{ "--delay": `${delay}ms` }}>
      <div className="section-header">
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function App() {
  const isAdmin = window.location.pathname.startsWith("/admin");

  const [portfolio, setPortfolio] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAdmin) return;

    const loadPortfolio = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/portfolio`);
        if (!response.ok) {
          throw new Error("Impossible de charger le portfolio.");
        }
        const data = await response.json();
        setPortfolio(data);
      } catch {
        setError(
          "Le backend n'est pas accessible. Lance l'API avec: npm run dev dans /backend."
        );
      }
    };

    loadPortfolio();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) return;

    const animatedElements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    animatedElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [portfolio, isAdmin]);

  if (isAdmin) {
    return <AdminDashboard />;
  }

  if (error) {
    return <main className="container error-state">{error}</main>;
  }

  if (!portfolio) {
    return <main className="container loading-state">Chargement du portfolio...</main>;
  }

  const { basics, skills, projects, experience, education, certifications, languages, softSkills, interests } =
    portfolio;

  return (
    <main className="container">
      <header className="hero reveal is-visible">
        <div className="hero-content">
          <p className="badge">Portfolio DevOps</p>
          <h1>{basics.name}</h1>
          <p className="role">{basics.role}</p>
          <p className="summary">{basics.tagline}</p>
          <p className="summary">{basics.summary}</p>
          <div className="contact">
            <span>{basics.location}</span>
            <a href={`mailto:${basics.email}`}>{basics.email}</a>
            <span>{basics.phone}</span>
            <a href={basics.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </div>
        </div>
        <div className="hero-panel">
          <p className="panel-title">En bref</p>
          <ul>
            <li>{skills.length}+ domaines techniques</li>
            <li>{projects.length} projets orientes production</li>
            <li>{experience.length} experiences professionnelles</li>
          </ul>
          <p className="availability">{basics.availability}</p>
        </div>
      </header>

      <nav className="quick-nav reveal is-visible">
        <a href="#competences">Competences</a>
        <a href="#projets">Projets</a>
        <a href="#experience">Experience</a>
        <a href="#formation">Formation</a>
        <a href="#profil">Profil</a>
        <a href="/admin">Admin</a>
      </nav>

      <Section title="Competences Techniques" id="competences" delay={60}>
        <div className="skills-grid">
          {skills.map((group) => (
            <article key={group.category} className="card">
              <h3>{group.category}</h3>
              <ul className="chips-list">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Projets DevOps" id="projets" delay={120}>
        <div className="grid">
          {projects.map((project) => (
            <article key={project.title} className="card">
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              {project.link && (
                <a className="project-link" href={project.link} target="_blank" rel="noreferrer">
                  Voir le projet
                </a>
              )}
              <ul>
                {project.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Experience Professionnelle" id="experience" delay={180}>
        <div className="timeline">
          {experience.map((job) => (
            <article key={`${job.company}-${job.period}`} className="card">
              <h3>
                {job.role} - {job.company}
              </h3>
              <p className="period">{job.period}</p>
              <ul>
                {job.achievements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Formation" id="formation" delay={240}>
        <div className="grid">
          {education.map((item) => (
            <article key={`${item.school}-${item.period}`} className="card">
              <h3>{item.degree}</h3>
              <p>{item.school}</p>
              <p className="period">{item.period}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Certifications, Langues et Qualites" id="profil" delay={300}>
        <div className="grid triple">
          <article className="card">
            <h3>Certifications</h3>
            <ul>
              {certifications.map((certification) => (
                <li key={certification}>{certification}</li>
              ))}
            </ul>
          </article>
          <article className="card">
            <h3>Langues</h3>
            <ul>
              {languages.map((language) => (
                <li key={language}>{language}</li>
              ))}
            </ul>
          </article>
          <article className="card">
            <h3>Soft Skills</h3>
            <ul>
              {softSkills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </article>
        </div>
      </Section>

      <Section title="Centres d'interet" delay={360}>
        <ul className="chips">
          {interests.map((interest) => (
            <li key={interest}>{interest}</li>
          ))}
        </ul>
      </Section>

      <footer className="footer reveal" style={{ "--delay": "420ms" }}>
        <p>Disponible pour une alternance DevOps - Contact rapide par email ou GitHub.</p>
      </footer>
    </main>
  );
}

export default App;
