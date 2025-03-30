'use client';

import { useEffect, useState } from 'react';

// Define the ResultCard component
const ResultCard = ({ title, description, imageUrl }: {
  title: string;
  description: string;
  imageUrl: string;
}) => {
  return (
    <div className="result-card">
      <img src={imageUrl} alt={title} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

// Define the FAQItem component
const FAQItem = ({ question, answer }: {
  question: string;
  answer: string;
}) => {
  return (
    <div className="faq-item">
      <h3>{question}</h3>
      <p>{answer}</p>
    </div>
  );
};

// Define the interfaces
interface VerifiedContent {
  aboutText: string;
  photoUrl: string;
  results: Result[];
  faqs: FAQ[];
}

interface Result {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export default function VerifiedSection() {
  const [content, setContent] = useState<VerifiedContent>({
    aboutText: 'Default about text',
    photoUrl: '/images/default-profile.jpg',
    results: [
      {
        id: '1',
        title: 'Academic Result 1',
        description: 'Description of academic achievement 1',
        imageUrl: '/images/result1.jpg'
      }
    ],
    faqs: [
      {
        id: '1',
        question: 'What is your educational background?',
        answer: 'I have a degree in Computer Science.'
      }
    ]
  });

  useEffect(() => {
    // Check if there's custom verified content in localStorage
    const savedContent = localStorage.getItem('siteVerifiedContent');
    if (savedContent) {
      setContent(JSON.parse(savedContent));
    }
  }, []);

  return (
    <section className="verified-section">
      <div className="about-section">
        <h2>About Me</h2>
        <p>{content.aboutText}</p>
        <img src={content.photoUrl} alt="Profile" />
      </div>
      
      <div className="results-section">
        <h2>Academic Results</h2>
        <div className="results-grid">
          {content.results.map(result => (
            <ResultCard 
              key={result.id}
              title={result.title}
              description={result.description}
              imageUrl={result.imageUrl}
            />
          ))}
        </div>
      </div>
      
      <div className="faqs-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faqs-list">
          {content.faqs.map(faq => (
            <FAQItem 
              key={faq.id}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </div>
      </div>
    </section>
  );
} 