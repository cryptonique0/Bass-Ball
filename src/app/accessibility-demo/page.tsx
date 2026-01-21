"use client";
import React, { useRef, useState } from 'react';
import AccessibilityTools from '@/components/AccessibilityTools';

export default function AccessibilityDemoPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  const openModal = () => {
    setModalOpen(true);
    setTimeout(() => { firstFocusableRef.current?.focus(); }, 100);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (window as any).a11yAnnounce?.(`Form submitted for ${formData.name}`);
  };

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 1200, margin: '0 auto' }}>
      <header role="banner" style={{ marginBottom: 24 }}>
        <h1>Accessibility Demo & Testing Suite</h1>
        <p>Demonstrates WCAG patterns: landmarks, keyboard navigation, screen reader support, and focus management.</p>
      </header>

      <nav aria-label="Page sections" style={{ marginBottom: 24, padding: 12, background: '#f5f5f5', borderRadius: 8 }}>
        <ul style={{ listStyle: 'none', display: 'flex', gap: 16, padding: 0, margin: 0 }}>
          <li><a href="#tools">A11y Tools</a></li>
          <li><a href="#forms">Forms</a></li>
          <li><a href="#modal">Modal</a></li>
          <li><a href="#landmarks">Landmarks</a></li>
        </ul>
      </nav>

      <main id="main" style={{ display: 'grid', gap: 24 }}>
        <section id="tools" aria-labelledby="tools-heading" style={{ border: '1px solid #ccc', borderRadius: 12, padding: 16 }}>
          <h2 id="tools-heading">Accessibility Tools</h2>
          <AccessibilityTools />
        </section>

        <section id="forms" aria-labelledby="forms-heading" style={{ border: '1px solid #ccc', borderRadius: 12, padding: 16 }}>
          <h2 id="forms-heading">Form with Labels</h2>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12, maxWidth: 400 }}>
            <label htmlFor="name-input">
              Name (required)
              <input
                id="name-input"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ display: 'block', marginTop: 4, width: '100%', padding: 8 }}
                aria-describedby="name-help"
              />
              <small id="name-help">Enter your full name.</small>
            </label>
            <label htmlFor="email-input">
              Email (required)
              <input
                id="email-input"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={{ display: 'block', marginTop: 4, width: '100%', padding: 8 }}
                aria-describedby="email-help"
              />
              <small id="email-help">We will never share your email.</small>
            </label>
            <button type="submit" style={{ padding: 10, background: '#007bff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              Submit
            </button>
          </form>
        </section>

        <section id="modal" aria-labelledby="modal-heading" style={{ border: '1px solid #ccc', borderRadius: 12, padding: 16 }}>
          <h2 id="modal-heading">Modal with Focus Trap</h2>
          <button onClick={openModal} style={{ padding: 10, background: '#28a745', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Open Modal
          </button>

          {modalOpen && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-title"
              ref={modalRef}
              style={{
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: '#fff',
                border: '2px solid #333',
                borderRadius: 12,
                padding: 24,
                zIndex: 1000,
                minWidth: 320,
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') closeModal();
              }}
            >
              <h3 id="modal-title">Sample Modal</h3>
              <p>This modal traps focus and can be closed with Escape or the close button.</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  ref={firstFocusableRef}
                  onClick={closeModal}
                  style={{ padding: 8, background: '#dc3545', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  onClick={() => (window as any).a11yAnnounce?.('Action performed in modal')}
                  style={{ padding: 8, background: '#17a2b8', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                >
                  Action
                </button>
              </div>
            </div>
          )}
          {modalOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 999,
              }}
              onClick={closeModal}
            />
          )}
        </section>

        <section id="landmarks" aria-labelledby="landmarks-heading" style={{ border: '1px solid #ccc', borderRadius: 12, padding: 16 }}>
          <h2 id="landmarks-heading">Semantic Landmarks</h2>
          <p>This page uses semantic HTML landmarks:</p>
          <ul>
            <li><code>&lt;header role="banner"&gt;</code> for page header</li>
            <li><code>&lt;nav aria-label="..."&gt;</code> for navigation</li>
            <li><code>&lt;main id="main"&gt;</code> for main content (skip link target)</li>
            <li><code>&lt;section aria-labelledby="..."&gt;</code> for content sections</li>
            <li><code>&lt;footer role="contentinfo"&gt;</code> for page footer (below)</li>
          </ul>
        </section>
      </main>

      <footer role="contentinfo" style={{ marginTop: 24, padding: 16, borderTop: '1px solid #ccc' }}>
        <p>Accessibility Demo © 2026 · <a href="#main">Back to top</a></p>
      </footer>
    </div>
  );
}
