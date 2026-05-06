import React from "react";

export type FooterSection = {
  id: "how" | "sources" | "limitations" | "privacy" | "about" | "feedback";
  title: string;
  body: React.ReactNode;
};

export const FOOTER_SECTIONS: FooterSection[] = [
  {
    id: "how",
    title: "How It Works",
    body: React.createElement(
      "p",
      null,
      "This tool conducts a structured psychological assessment through natural conversation. As you answer questions, the model privately evaluates your responses across eight validated cognitive and psychological metrics. Each question is drawn from a curated bank grounded in peer-reviewed psychometric research and is selected adaptively based on your previous answers. At the end of the conversation, a second AI model independently reviews the assessment for consistency and accuracy before your results are generated. Your profile reflects patterns in how you think, manage yourself, and relate to challenge — not a clinical diagnosis or a fixed verdict."
    ),
  },
  {
    id: "sources",
    title: "Sources",
    body: React.createElement(
      React.Fragment,
      null,
      React.createElement(
        "p",
        null,
        "The following peer-reviewed frameworks and instruments informed the design of this assessment:"
      ),
      React.createElement(
        "ul",
        { className: "sources-list" },
        React.createElement(
          "li",
          null,
          "Bandura, A. (1977). Self-efficacy: Toward a unifying theory of behavioral change. ",
          React.createElement("em", null, "Psychological Review"),
          ", 84(2), 191–215."
        ),
        React.createElement(
          "li",
          null,
          "Barkley, R.A. (1997). Behavioral inhibition, sustained attention, and executive functions. ",
          React.createElement("em", null, "Psychological Bulletin"),
          ", 121(1), 65–94."
        ),
        React.createElement(
          "li",
          null,
          "Beck, A.T., Epstein, N., Brown, G., & Steer, R.A. (1988). An inventory for measuring clinical anxiety. ",
          React.createElement("em", null, "Journal of Consulting and Clinical Psychology"),
          ", 56(6), 893–897."
        ),
        React.createElement(
          "li",
          null,
          "Derryberry, D. & Reed, M.A. (2002). Anxiety-related attentional biases and their regulation by attentional control. ",
          React.createElement("em", null, "Journal of Abnormal Psychology"),
          ", 111(2), 225–236."
        ),
        React.createElement(
          "li",
          null,
          "Dweck, C.S. (2006). ",
          React.createElement("em", null, "Mindset: The New Psychology of Success"),
          ". Random House."
        ),
        React.createElement(
          "li",
          null,
          "Dweck, C.S. & Leggett, E.L. (1988). A social-cognitive approach to motivation and personality. ",
          React.createElement("em", null, "Psychological Review"),
          ", 95(2), 256–273."
        ),
        React.createElement(
          "li",
          null,
          "Flavell, J.H. (1979). Metacognition and cognitive monitoring. ",
          React.createElement("em", null, "American Psychologist"),
          ", 34(10), 906–911."
        ),
        React.createElement(
          "li",
          null,
          "Gratz, K.L. & Roemer, L. (2004). Multidimensional assessment of emotion regulation and dysregulation. ",
          React.createElement("em", null, "Journal of Psychopathology and Behavioral Assessment"),
          ", 26(1), 41–54."
        ),
        React.createElement(
          "li",
          null,
          "Gross, J.J. (1998). The emerging field of emotion regulation. ",
          React.createElement("em", null, "Review of General Psychology"),
          ", 2(3), 271–299."
        ),
        React.createElement(
          "li",
          null,
          "Miyake, A. et al. (2000). The unity and diversity of executive functions. ",
          React.createElement("em", null, "Cognitive Psychology"),
          ", 41(1), 49–100."
        ),
        React.createElement(
          "li",
          null,
          "Pearlin, L.I. & Schooler, C. (1978). The structure of coping. ",
          React.createElement("em", null, "Journal of Health and Social Behavior"),
          ", 19(1), 2–21."
        ),
        React.createElement(
          "li",
          null,
          "Pintrich, P.R. & De Groot, E.V. (1990). Motivational and self-regulated learning components of classroom academic performance. ",
          React.createElement("em", null, "Journal of Educational Psychology"),
          ", 82(1), 33–40."
        ),
        React.createElement(
          "li",
          null,
          "Posner, M.I. & Petersen, S.E. (1990). The attention system of the human brain. ",
          React.createElement("em", null, "Annual Review of Neuroscience"),
          ", 13(1), 25–42."
        ),
        React.createElement(
          "li",
          null,
          "Rotter, J.B. (1966). Generalized expectancies for internal versus external control of reinforcement. ",
          React.createElement("em", null, "Psychological Monographs"),
          ", 80(1), 1–28."
        ),
        React.createElement(
          "li",
          null,
          "Schraw, G. & Dennison, R.S. (1994). Assessing metacognitive awareness. ",
          React.createElement("em", null, "Contemporary Educational Psychology"),
          ", 19(4), 460–475."
        ),
        React.createElement(
          "li",
          null,
          "Spielberger, C.D., Gorsuch, R.L., & Lushene, R.E. (1970). ",
          React.createElement("em", null, "Manual for the State-Trait Anxiety Inventory"),
          ". Consulting Psychologists Press."
        )
      )
    ),
  },
  {
    id: "limitations",
    title: "Limitations",
    body: React.createElement(
      "p",
      null,
      "This assessment is designed for self-reflection and educational purposes only. It is not a clinical psychological evaluation and should not be interpreted as a diagnosis or a substitute for professional mental health support. Results are generated by an AI model based on self-reported responses and are subject to the limitations of both language models and self-report methodology. Scores represent patterns observed in a single conversation and may not fully capture the complexity of your cognitive and psychological profile."
    ),
  },
  {
    id: "privacy",
    title: "Privacy",
    body: React.createElement(
      "p",
      null,
      "This tool does not store, log, or share your conversation or results. Everything happens in your browser — when you close this tab, all data is gone. No account is required and no personally identifiable information is collected. Your responses are sent to Anthropic's API solely for the purpose of generating your assessment and are subject to Anthropic's privacy policy."
    ),
  },
  {
    id: "about",
    title: "About",
    body: React.createElement(
      "p",
      null,
      "Know Thyself is a research project exploring how artificial intelligence can be used to assess cognitive and psychological patterns through adaptive conversation. It was developed as part of an undergraduate senior project and is intended as a proof of concept rather than a production mental health tool. If you have feedback on your experience or the accuracy of your results, please use the link below."
    ),
  },
  {
    id: "feedback",
    title: "Feedback",
    body: React.createElement(
      React.Fragment,
      null,
      React.createElement(
        "p",
        null,
        "Did your results feel accurate? Was there anything that felt off or missing? Your feedback helps improve the assessment."
      ),
      React.createElement(
        "p",
        null,
        "Share your feedback → ",
        React.createElement(
          "a",
          {
            href: "https://docs.google.com/forms/d/e/1FAIpQLSfieemLKiDxwl4kKB34ZqghdinBFdFWYgwhNNZrCBepIegpHg/viewform?usp=header",
            className: "feedback-link",
            target: "_blank",
            rel: "noopener noreferrer",
          },
          "Google Form"
        )
      )
    ),
  },
];
