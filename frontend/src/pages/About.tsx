const About = () => {
  return (
    <div className="about-container">
      <section className="about-hero">
        <h1>About MuseMap</h1>
        <p>Learn about our mission to revolutionize music creation with AI</p>
      </section>

      <section className="about-content">
        <div className="about-section">
          <h2>Our Story</h2>
          <p>
            MuseMap was created by a team of music enthusiasts and AI researchers who wanted to make music creation 
            accessible to everyone. We believe that music is a universal language, and everyone should have the tools 
            to express themselves through sound, regardless of their technical skills or musical background.
          </p>
          <p>
            Launched in 2024, our platform combines cutting-edge AI technology with a user-friendly interface to 
            democratize music production and inspire creativity.
          </p>
        </div>

        <div className="about-section">
          <h2>Our Technology</h2>
          <p>
            MuseMap utilizes advanced deep learning models specifically trained on diverse musical 
            datasets. Our AI can understand and generate music in various styles, moods, and genres, 
            with the ability to incorporate specific instruments and follow tempo preferences.
          </p>
          <p>
            We continuously improve our AI models based on user feedback and the latest advancements 
            in machine learning research to provide the best music generation experience possible.
          </p>
        </div>

        <div className="about-section">
          <h2>Our Vision</h2>
          <p>
            We envision a world where AI assists human creativity rather than replacing it. MuseMap aims 
            to be a collaborative tool that helps musicians, content creators, and enthusiasts explore new 
            musical ideas and overcome creative blocks.
          </p>
          <p>
            Our goal is to make MuseMap the go-to platform for instant, high-quality music generation that 
            serves as inspiration for further musical exploration and creation.
          </p>
        </div>
      </section>

      <section className="team-section">
        <h2>Meet the Team</h2>
        <div className="team-grid">
          <div className="team-member">
            <div className="member-photo placeholder-image"></div>
            <h3>Jane Doe</h3>
            <p>Founder & AI Research Lead</p>
          </div>
          <div className="team-member">
            <div className="member-photo placeholder-image"></div>
            <h3>John Smith</h3>
            <p>Chief Technology Officer</p>
          </div>
          <div className="team-member">
            <div className="member-photo placeholder-image"></div>
            <h3>Alex Johnson</h3>
            <p>Music Production Expert</p>
          </div>
          <div className="team-member">
            <div className="member-photo placeholder-image"></div>
            <h3>Sam Williams</h3>
            <p>UI/UX Designer</p>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <h2>Get in Touch</h2>
        <p>Have questions or feedback? We'd love to hear from you!</p>
        <a href="mailto:contact@musemap.com" className="contact-button">
          Contact Us
        </a>
      </section>
    </div>
  );
};

export default About; 