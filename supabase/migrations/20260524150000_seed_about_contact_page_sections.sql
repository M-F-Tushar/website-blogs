-- Seed About + Contact page templates so admins can edit chrome copy from a
-- single hidden template row per page. Mirrors blog/academic/recommendation
-- listing templates. is_visible=false so they don't render in the public
-- section list; consumed via getDetailTemplateSection().

with about_page as (
  select id from public.pages where page_key = 'about'
), contact_page as (
  select id from public.pages where page_key = 'contact'
)
insert into public.page_sections (
  page_id,
  section_key,
  section_type,
  heading,
  subheading,
  body_markdown,
  sort_order,
  is_visible,
  featured,
  settings_json
)
values
  (
    (select id from about_page),
    'about-template',
    'template',
    'About page template',
    'Editable chrome copy for the public /about page.',
    '',
    910,
    false,
    false,
    '{
      "heroEyebrow": "About Me",
      "heroGreeting": "Hi, I''m",
      "taglineFallback": "AI & ML Enthusiast • Aspiring AI Agent Developer • LLM Explorer • Lifelong Learner",
      "focusCardEyebrow": "Current Focus",
      "focusCardTitle": "What I am actively deepening",
      "focusCardDescription": "The public work clusters around a few themes that I want to study seriously and connect across projects.",
      "platformCardEyebrow": "Platform Logic",
      "platformCardTitle": "One record, several layers",
      "platformCardDescription": "Writing, academic notes, and recommendations all feed the same long-horizon technical identity.",
      "summaryWritingLabel": "Writing",
      "summaryAcademicLabel": "Academic",
      "summaryCurationLabel": "Curation",
      "summaryWritingUnit": "published notes",
      "summaryAcademicUnit": "tracked records",
      "summaryCurationUnit": "recommendations",
      "signalArticlesLabel": "Articles Written",
      "signalWordsLabel": "Total Words",
      "signalYearsLabel": "Years Active",
      "signalTopicsLabel": "Topics Covered",
      "storyHeading": "My Story",
      "storyFallback": "I am building this platform as a public record of learning, experimentation, and long-term technical growth.",
      "timelineEyebrow": "Journey Timeline",
      "timelineHeadingFallback": "The phases shaping the work",
      "timelineDescriptionFallback": "A visual map of how the direction is forming, deepening, and turning into a more legible body of work.",
      "portraitInitialsEyebrow": "Identity signal",
      "portraitInitialsCaption": "Student builder, research-minded, and documenting the path in public."
    }'::jsonb
  ),
  (
    (select id from contact_page),
    'contact-template',
    'template',
    'Contact page template',
    'Editable chrome copy for the public /contact page and form.',
    '',
    910,
    false,
    false,
    '{
      "heroEyebrow": "Get in touch",
      "heroTitleLead": "Let''s",
      "heroTitleAccent": "Connect",
      "heroDescriptionFallback": "I''m always open to discussing new projects, creative ideas, or opportunities to be part of an amazing team.",
      "railLabel": "Best messages include",
      "railLine1": "Context, current stage, and the kind of collaboration you have in mind.",
      "railLine2": "AI, ML, LLM systems, research, and technical writing fit best.",
      "availabilityTitle": "Currently Available",
      "availabilityDescription": "I usually respond within 24-48 hours during business days. For urgent matters, mention \"URGENT\" in the subject line.",
      "formSectionHeading": "Send a Message",
      "formEyebrowFallback": "Direct form",
      "formTitleFallback": "Start the conversation",
      "formDescriptionFallback": "Tell me about your project, research interest, or the kind of conversation you want to have.",
      "formBadgeFallback": "Thoughtful replies over volume",
      "formNameLabel": "Your Name",
      "formNamePlaceholder": "John Doe",
      "formEmailLabel": "Email Address",
      "formEmailPlaceholder": "john@example.com",
      "formSubjectLabel": "Subject",
      "formSubjectPlaceholder": "Project inquiry",
      "formMessageLabel": "Message",
      "formMessagePlaceholder": "Tell me about your project or inquiry...",
      "formRequiredMarker": "*",
      "formSubmitLabel": "Send Message",
      "formSubmittingLabel": "Sending...",
      "formCaptchaPrompt": "Complete the bot protection check before sending your message.",
      "formCaptchaRequired": "Bot protection is required for public submissions.",
      "formCaptchaMissingError": "Complete the bot protection check before sending your message.",
      "formMisconfiguredError": "This form is temporarily unavailable because bot protection is not configured correctly.",
      "formGenericError": "Something went wrong while sending the message.",
      "formSuccessFallback": "Message sent successfully.",
      "socialSectionHeading": "Connect Elsewhere",
      "detailCardFallbackDescription": "Update this card from the admin contact page.",
      "fallbackEmailEyebrow": "Email",
      "fallbackEmailDescription": "Best for professional inquiries.",
      "fallbackLocationEyebrow": "Location",
      "fallbackLocationDescription": "Available for thoughtful remote collaboration.",
      "fallbackGithubEyebrow": "GitHub",
      "fallbackGithubTitle": "GitHub",
      "fallbackGithubDescription": "Check out my open-source work.",
      "fallbackLinkedinEyebrow": "LinkedIn",
      "fallbackLinkedinTitle": "LinkedIn",
      "fallbackLinkedinDescription": "Connect professionally.",
      "faqSectionHeading": "Frequently Asked Questions",
      "fallbackFaqs": [
        {
          "question": "What''s the best way to reach you?",
          "answer": "Email or the contact form both work well. If the message is specific and thoughtful, I can usually respond faster."
        },
        {
          "question": "Do you offer consulting services?",
          "answer": "I''m most open to collaborations, research discussions, and technically meaningful projects rather than generic consulting requests."
        },
        {
          "question": "Can you help with my project?",
          "answer": "If the project aligns with AI, ML, LLM systems, learning infrastructure, or technical writing, send context and I''ll tell you honestly whether it''s a fit."
        },
        {
          "question": "How can I collaborate with you?",
          "answer": "The best outreach explains the problem, the current stage, and what kind of collaboration you have in mind."
        }
      ]
    }'::jsonb
  )
on conflict (page_id, section_key) do update
set section_type = excluded.section_type,
    heading = excluded.heading,
    subheading = excluded.subheading,
    body_markdown = excluded.body_markdown,
    sort_order = excluded.sort_order,
    is_visible = excluded.is_visible,
    featured = excluded.featured,
    settings_json = excluded.settings_json;
